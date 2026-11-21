import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {GoogleGenAI, Type} from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

interface ExistingCandidateInput {
  id: string;
  category: string;
  title: string;
  description: string;
  approximateArea: string;
  status: string;
  distanceMeters?: number;
}

interface AnalyzeComplaintPayload {
  description?: string;
  selectedCategory?: string;
  locality?: string;
  imageDataUrl?: string;
  existingCandidates?: ExistingCandidateInput[];
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({limit: '6mb'}));

  app.get('/api/health', (_req, res) => {
    const geminiConfigured = Boolean(getGeminiClient());
    res.json({
      status: 'ok',
      geminiConfigured,
      databaseMode: 'demonstration_local_persistence',
      plannedDatabase: 'mysql',
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/official/verify-access', (req, res) => {
    const decodeHeader = (val: unknown): string => {
      const raw = String(val ?? '').trim();
      if (!raw) return '';
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    };

    const role = decodeHeader(req.headers['x-citisolve-role']);
    const municipality = decodeHeader(req.headers['x-citisolve-municipality']);
    const authorizedWardsHeader = decodeHeader(req.headers['x-citisolve-wards']);

    let authorizedWards: string[] = [];
    if (authorizedWardsHeader.startsWith('[')) {
      try {
        const parsed = JSON.parse(authorizedWardsHeader);
        if (Array.isArray(parsed)) {
          authorizedWards = parsed.map((w) => String(w).trim()).filter(Boolean);
        }
      } catch {
        authorizedWards = [];
      }
    } else if (authorizedWardsHeader) {
      authorizedWards = authorizedWardsHeader
        .split('|')
        .map((w) => w.trim())
        .filter(Boolean);
    }

    if (role !== 'government_official') {
      res.status(403).json({
        allowed: false,
        authorized: false,
        error: 'ROLE_FORBIDDEN',
        message: 'Government Official role is required to access municipal operations.',
      });
      return;
    }

    const body = (req.body ?? {}) as {
      targetWard?: string;
      targetMunicipality?: string;
      ward?: string;
      municipality?: string;
    };
    const requestedWard = body.targetWard ?? body.ward;
    const requestedMunicipality = body.targetMunicipality ?? body.municipality;

    if (
      requestedMunicipality &&
      municipality &&
      requestedMunicipality !== municipality
    ) {
      res.status(403).json({
        allowed: false,
        authorized: false,
        error: 'JURISDICTION_FORBIDDEN',
        message: 'Requested complaint lies outside your authorized municipality.',
      });
      return;
    }

    if (
      requestedWard &&
      authorizedWards.length > 0 &&
      !authorizedWards.includes(requestedWard)
    ) {
      res.status(403).json({
        allowed: false,
        authorized: false,
        error: 'WARD_FORBIDDEN',
        message: 'Requested complaint lies outside your authorized ward jurisdiction.',
      });
      return;
    }

    res.json({
      allowed: true,
      authorized: true,
      mode: 'demonstration_role_guard',
      municipality,
      authorizedWards,
    });
  });

  app.post('/api/ai/analyze-complaint', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_NOT_CONFIGURED',
        message:
          'GEMINI_API_KEY is not configured in server secrets. Use the clearly labelled Sample Demonstration Triage option instead.',
      });
      return;
    }

    const body = req.body as AnalyzeComplaintPayload;
    const description = (body.description ?? '').trim();
    const selectedCategory = (body.selectedCategory ?? '').trim();
    const locality = (body.locality ?? 'Municipal Ward').trim();
    const candidates = Array.isArray(body.existingCandidates) ? body.existingCandidates : [];

    if (!description || !selectedCategory) {
      res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Complaint description and selected category are required for analysis.',
      });
      return;
    }

    try {
      const candidateText =
        candidates.length > 0
          ? candidates
              .slice(0, 6)
              .map(
                (c) =>
                  `- ID: ${c.id} | Category: ${c.category} | Status: ${c.status} | Area: ${c.approximateArea} | DistanceMeters: ${c.distanceMeters ?? 'unknown'} | Title: ${c.title} | Description: ${c.description}`
              )
              .join('\n')
          : 'None within nearby radius.';

      const promptText = [
        `Citizen selected category ID: ${selectedCategory}`,
        `Approximate ward/locality: ${locality}`,
        `Citizen description: "${description}"`,
        '',
        'Nearby open/active existing complaints in this ward (for duplicate assessment only; do NOT auto-merge uncertain matches):',
        candidateText,
        '',
        'Return a JSON object assessing:',
        '1. suggestedCategory (one of: potholes_roads, garbage_dumps, drainage, electricity, water_issues, defective_streetlights, fallen_trees_obstructions, other_civic)',
        '2. safetySeverity (one of: low, medium, high, critical). Treat exposed electrical wires near water, live shock hazards, open deep manholes, or fully blocked emergency arterial roads as critical regardless of popularity.',
        '3. severityReason (concise 1-2 sentence explanation of physical safety risk).',
        '4. assignedDepartments (array of 1-3 Indian municipal department names, supporting cross-department routing when relevant, e.g., Electrical Department + Drainage Department).',
        '5. crossDepartmentRouting (boolean).',
        '6. confidence (number between 0 and 1).',
        '7. needsHumanReview (boolean; true when confidence < 0.72 or evidence is ambiguous).',
        '8. classificationExplanation (plain-language reasoning for department routing and category).',
        '9. duplicateCandidateId (string ID from the candidate list ONLY if strongly likely to be the exact same physical incident, otherwise empty string).',
        '10. duplicateScore (number 0 to 1 indicating similarity).',
        '11. duplicateReason (short explanation if duplicateCandidateId is non-empty, otherwise empty string).',
      ].join('\n');

      const parts: Array<
        | {text: string}
        | {inlineData: {mimeType: string; data: string}}
      > = [];

      if (body.imageDataUrl && body.imageDataUrl.startsWith('data:image/')) {
        const commaIndex = body.imageDataUrl.indexOf(',');
        const header = body.imageDataUrl.slice(5, commaIndex);
        const mimeType = header.split(';')[0] || 'image/jpeg';
        const base64Data = body.imageDataUrl.slice(commaIndex + 1);
        if (base64Data) {
          parts.push({
            inlineData: {
              mimeType,
              data: base64Data,
            },
          });
        }
      }

      parts.push({text: promptText});

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {parts},
        config: {
          systemInstruction:
            'You are a civic safety triage and municipal routing assistant for Indian Urban Local Bodies. Keep safety severity completely independent of community popularity. Never fabricate certainty when evidence is unclear.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedCategory: {type: Type.STRING},
              safetySeverity: {type: Type.STRING},
              severityReason: {type: Type.STRING},
              assignedDepartments: {
                type: Type.ARRAY,
                items: {type: Type.STRING},
              },
              crossDepartmentRouting: {type: Type.BOOLEAN},
              confidence: {type: Type.NUMBER},
              needsHumanReview: {type: Type.BOOLEAN},
              classificationExplanation: {type: Type.STRING},
              duplicateCandidateId: {type: Type.STRING},
              duplicateScore: {type: Type.NUMBER},
              duplicateReason: {type: Type.STRING},
            },
            required: [
              'suggestedCategory',
              'safetySeverity',
              'severityReason',
              'assignedDepartments',
              'crossDepartmentRouting',
              'confidence',
              'needsHumanReview',
              'classificationExplanation',
              'duplicateCandidateId',
              'duplicateScore',
              'duplicateReason',
            ],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({
          error: 'EMPTY_AI_RESPONSE',
          message: 'Gemini returned an empty response. Please retry or use Sample Demonstration Triage.',
        });
        return;
      }

      const parsed = JSON.parse(rawText);
      res.json({
        source: 'gemini',
        model: 'gemini-4-hydrogen',
        analysis: parsed,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected Gemini API error';
      res.status(502).json({
        error: 'GEMINI_REQUEST_FAILED',
        message,
      });
    }
  });

  if (!isProduction) {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CitiSOLVE server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start CitiSOLVE server:', error);
  process.exit(1);
});
