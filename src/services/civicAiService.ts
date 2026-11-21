import {CATEGORY_MAP} from '../constants/civicDomain';
import type {
  CivicIssue,
  ComplaintAIAnalysis,
  IssueCategoryId,
  SafetySeverity,
} from '../types/civic';

export interface AnalyzeComplaintRequest {
  description: string;
  selectedCategory: IssueCategoryId;
  locality: string;
  imageDataUrl?: string;
  existingIssues: CivicIssue[];
}

export interface AnalyzeComplaintResponse {
  analysis: ComplaintAIAnalysis;
  usedLiveGemini: boolean;
  serverUnavailableReason?: string;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function findDuplicateCandidate(
  description: string,
  category: IssueCategoryId,
  locality: string,
  existingIssues: CivicIssue[]
): {candidate?: CivicIssue; score: number; reason: string} {
  const inputTokens = tokenize(description);
  let bestIssue: CivicIssue | undefined;
  let bestScore = 0;

  for (const issue of existingIssues) {
    if (issue.status === 'resolution_confirmed') continue;
    let score = 0;
    if (issue.category === category) score += 0.35;
    if (issue.hierarchy.locality === locality) score += 0.25;
    const textSim = jaccardSimilarity(
      inputTokens,
      tokenize(`${issue.title} ${issue.description}`)
    );
    score += textSim * 0.4;

    if (score > bestScore) {
      bestScore = score;
      bestIssue = issue;
    }
  }

  if (bestIssue && bestScore >= 0.48) {
    return {
      candidate: bestIssue,
      score: Math.min(0.95, Number(bestScore.toFixed(2))),
      reason: `Matches existing open ${CATEGORY_MAP[bestIssue.category].shortLabel} report in ${bestIssue.hierarchy.locality} (${Math.round(bestScore * 100)}% combined location, category, and text match).`,
    };
  }

  return {score: 0, reason: ''};
}

/**
 * Clearly-labelled rule-based demonstration fallback used ONLY when Gemini API
 * is unavailable or unconfigured on the server. Never claims to be live Gemini output.
 */
export function runSampleDemonstrationTriage(
  request: AnalyzeComplaintRequest
): ComplaintAIAnalysis {
  const text = request.description.toLowerCase();
  const duplicate = findDuplicateCandidate(
    request.description,
    request.selectedCategory,
    request.locality,
    request.existingIssues
  );

  let suggestedCategory: IssueCategoryId = request.selectedCategory;
  let safetySeverity: SafetySeverity = 'medium';
  let severityReason =
    'Standard municipal issue evaluated under demonstration triage rules; 72-hour baseline SLA applies.';
  const assignedDepartments = new Set<string>([
    CATEGORY_MAP[request.selectedCategory].defaultDepartment,
  ]);
  let confidence = 0.84;

  const hasElectricKeywords =
    /wire|electric|shock|spark|live|transformer|cable|pole/.test(text);
  const hasWaterKeywords =
    /water|puddle|flood|rain|leak|pipe|drain|sewage|overflow/.test(text);
  const hasRoadKeywords =
    /pothole|road|crater|asphalt|tarmac|bus|traffic|accident/.test(text);
  const hasTreeKeywords = /tree|branch|fallen|blocked|uprooted/.test(text);
  const hasGarbageKeywords = /garbage|waste|trash|dump|bin|smell/.test(text);
  const hasLightKeywords = /streetlight|lamp|dark|light/.test(text);

  if (hasElectricKeywords && hasWaterKeywords) {
    suggestedCategory = 'electricity';
    safetySeverity = 'critical';
    severityReason =
      'Critical safety hazard: exposed electrical infrastructure combined with water/puddle keywords triggers immediate electrocution-risk prioritization independent of upvotes.';
    assignedDepartments.clear();
    assignedDepartments.add('Electrical Department');
    assignedDepartments.add('Drainage Department');
    confidence = 0.94;
  } else if (
    request.selectedCategory === 'electricity' ||
    /spark|live wire|open box|short circuit/.test(text)
  ) {
    suggestedCategory = 'electricity';
    safetySeverity = 'critical';
    severityReason =
      'Exposed or sparking electrical equipment poses high public safety risk and bypasses routine queue waits.';
    assignedDepartments.clear();
    assignedDepartments.add('Electrical Department');
    confidence = 0.91;
  } else if (hasTreeKeywords && /block|road|wire|traffic/.test(text)) {
    suggestedCategory = 'fallen_trees_obstructions';
    safetySeverity = 'high';
    severityReason =
      'Roadway obstruction by fallen tree or heavy limbs disrupts emergency and commuter movement.';
    assignedDepartments.add('Horticulture/Tree Management');
    if (hasElectricKeywords) assignedDepartments.add('Electrical Department');
    confidence = 0.89;
  } else if (hasRoadKeywords || request.selectedCategory === 'potholes_roads') {
    suggestedCategory = 'potholes_roads';
    safetySeverity = /deep|large|highway|bus|accident|huge/.test(text)
      ? 'high'
      : 'medium';
    severityReason =
      safetySeverity === 'high'
        ? 'High severity road surface damage reported in active traffic zone.'
        : 'Moderate road surface defect queued for Road Maintenance repair.';
  } else if (hasWaterKeywords && !hasGarbageKeywords) {
    if (request.selectedCategory === 'drainage' || /drain|sewage|clog|manhole/.test(text)) {
      suggestedCategory = 'drainage';
      safetySeverity = /open manhole|flood|overflow/.test(text) ? 'high' : 'medium';
      severityReason =
        'Drainage blockage or manhole hazard prioritized to prevent street waterlogging.';
      assignedDepartments.add('Drainage Department');
    } else {
      suggestedCategory = 'water_issues';
      safetySeverity = /burst|main|flood|contamination/.test(text) ? 'high' : 'medium';
      severityReason = 'Water pipeline leakage flagged for Water Supply inspection.';
      assignedDepartments.add('Water Supply');
    }
  } else if (hasGarbageKeywords || request.selectedCategory === 'garbage_dumps') {
    suggestedCategory = 'garbage_dumps';
    safetySeverity = /hospital|school|burning|toxic|rotting/.test(text) ? 'high' : 'medium';
    severityReason = 'Sanitation accumulation routed to Ward Sanitation Unit.';
  } else if (hasLightKeywords || request.selectedCategory === 'defective_streetlights') {
    suggestedCategory = 'defective_streetlights';
    safetySeverity = /tilted|leaning|fallen|dark junction/.test(text) ? 'high' : 'medium';
    severityReason = 'Night corridor illumination defect routed to Street Lighting & Electrical.';
  } else {
    safetySeverity = 'low';
    severityReason =
      'Routine civic issue with low immediate physical safety risk; low confidence flagged for human review.';
    confidence = 0.64;
  }

  if (request.description.trim().length < 22) {
    confidence = Math.min(confidence, 0.65);
  }

  const departments = Array.from(assignedDepartments);

  return {
    source: 'demonstration_sample',
    modelOrRule: 'Sample Demonstration Triage (Local Rules — Not Gemini)',
    suggestedCategory,
    safetySeverity,
    confidence,
    needsHumanReview: confidence < 0.72,
    classificationExplanation: `Sample demonstration rules matched "${CATEGORY_MAP[suggestedCategory].label}" and assigned ${departments.join(' + ')}.`,
    severityReason,
    assignedDepartments: departments,
    crossDepartmentRouting: departments.length > 1,
    duplicateCandidateId: duplicate.candidate?.id,
    duplicateScore: duplicate.score || undefined,
    duplicateReason: duplicate.reason || undefined,
  };
}

export async function analyzeComplaintWithServer(
  request: AnalyzeComplaintRequest
): Promise<AnalyzeComplaintResponse> {
  const candidates = request.existingIssues
    .filter((i) => i.status !== 'resolution_confirmed')
    .slice(0, 6)
    .map((i) => ({
      id: i.id,
      category: i.category,
      title: i.title,
      description: i.description,
      approximateArea: i.approximateArea,
      status: i.status,
      distanceMeters: Math.round(i.mapPosition.distanceKmFromCenter * 1000),
    }));

  try {
    const res = await fetch('/api/ai/analyze-complaint', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        description: request.description,
        selectedCategory: request.selectedCategory,
        locality: request.locality,
        imageDataUrl: request.imageDataUrl,
        existingCandidates: candidates,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const reason =
        errorData?.message ||
        `Server AI endpoint unavailable (HTTP ${res.status}).`;
      return {
        analysis: runSampleDemonstrationTriage(request),
        usedLiveGemini: false,
        serverUnavailableReason: reason,
      };
    }

    const data = await res.json();
    const raw = data.analysis ?? {};

    const validCategories = new Set<IssueCategoryId>([
      'potholes_roads',
      'garbage_dumps',
      'drainage',
      'electricity',
      'water_issues',
      'defective_streetlights',
      'fallen_trees_obstructions',
      'other_civic',
    ]);
    const validSeverities = new Set<SafetySeverity>([
      'low',
      'medium',
      'high',
      'critical',
    ]);

    const suggestedCategory: IssueCategoryId = validCategories.has(raw.suggestedCategory)
      ? raw.suggestedCategory
      : request.selectedCategory;
    const safetySeverity: SafetySeverity = validSeverities.has(raw.safetySeverity)
      ? raw.safetySeverity
      : 'medium';

    const assignedDepartments =
      Array.isArray(raw.assignedDepartments) && raw.assignedDepartments.length > 0
        ? raw.assignedDepartments.map(String)
        : [CATEGORY_MAP[suggestedCategory].defaultDepartment];

    const duplicateFallback = findDuplicateCandidate(
      request.description,
      suggestedCategory,
      request.locality,
      request.existingIssues
    );

    const analysis: ComplaintAIAnalysis = {
      source: 'gemini',
      modelOrRule: `Google Gemini (${data.model || 'gemini-4-hydrogen'})`,
      suggestedCategory,
      safetySeverity,
      confidence:
        typeof raw.confidence === 'number'
          ? Math.max(0, Math.min(1, raw.confidence))
          : 0.85,
      needsHumanReview: Boolean(raw.needsHumanReview),
      classificationExplanation:
        String(raw.classificationExplanation || '').trim() ||
        `Classified under ${CATEGORY_MAP[suggestedCategory].label}.`,
      severityReason:
        String(raw.severityReason || '').trim() ||
        'Assessed for civic safety hazard.',
      assignedDepartments,
      crossDepartmentRouting:
        Boolean(raw.crossDepartmentRouting) || assignedDepartments.length > 1,
      duplicateCandidateId:
        raw.duplicateCandidateId || duplicateFallback.candidate?.id,
      duplicateScore:
        typeof raw.duplicateScore === 'number' && raw.duplicateScore > 0
          ? raw.duplicateScore
          : duplicateFallback.score || undefined,
      duplicateReason:
        raw.duplicateReason || duplicateFallback.reason || undefined,
    };

    return {
      analysis,
      usedLiveGemini: true,
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : 'Network error reaching backend AI proxy.';
    return {
      analysis: runSampleDemonstrationTriage(request),
      usedLiveGemini: false,
      serverUnavailableReason: message,
    };
  }
}
