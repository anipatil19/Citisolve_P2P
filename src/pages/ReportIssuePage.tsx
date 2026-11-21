import React, {useEffect, useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Mic,
  MicOff,
  RefreshCw,
  ShieldAlert,
  ThumbsUp,
} from 'lucide-react';
import {CategoryIcon} from '../components/common/CategoryIcon';
import {CivicImage} from '../components/common/CivicImage';
import {
  ResolutionStatusLabel,
  SeverityLabel,
} from '../components/common/SeverityAndStatus';
import {
  CATEGORY_MAP,
  DEMO_LOCALITIES,
  ISSUE_CATEGORIES,
  SUPPORTED_LANGUAGES,
} from '../constants/civicDomain';
import {useCitiSolve} from '../context/CitiSolveContext';
import {DEMO_ISSUE_IMAGES} from '../data/demoData';
import {analyzeComplaintWithServer} from '../services/civicAiService';
import type {
  CivicIssue,
  ComplaintAIAnalysis,
  IssueCategoryId,
  SupportedLanguageCode,
} from '../types/civic';

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: {results: ArrayLike<ArrayLike<{transcript: string}>>}) => void) | null;
  onerror: ((event: {error: string}) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const SAMPLE_CAMERA_BY_CATEGORY: Record<IssueCategoryId, string> = {
  potholes_roads: DEMO_ISSUE_IMAGES.pothole,
  garbage_dumps: DEMO_ISSUE_IMAGES.garbage,
  drainage: DEMO_ISSUE_IMAGES.drain,
  electricity: DEMO_ISSUE_IMAGES.wireWater,
  water_issues: DEMO_ISSUE_IMAGES.waterLeak,
  defective_streetlights: DEMO_ISSUE_IMAGES.streetlight,
  fallen_trees_obstructions: DEMO_ISSUE_IMAGES.fallenTree,
  other_civic: DEMO_ISSUE_IMAGES.pothole,
};

export const ReportIssuePage: React.FC = () => {
  const {currentUser, issues, submitNewComplaint, toggleUpvote} = useCitiSolve();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedCategory, setSelectedCategory] =
    useState<IssueCategoryId>('potholes_roads');

  // Step 2: Live in-app camera capture only (never gallery upload)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<
    'idle' | 'requesting' | 'streaming' | 'captured' | 'error'
  >('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string>('');
  const [photoCapturedLive, setPhotoCapturedLive] = useState<boolean>(false);

  // Step 3: Geolocation
  const [locState, setLocState] = useState<'idle' | 'locating' | 'captured' | 'error'>(() =>
    currentUser?.locationPermission === 'granted' && currentUser.liveCoordinates
      ? 'captured'
      : 'idle'
  );
  const [locError, setLocError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
    capturedAt: string;
    isDemo: boolean;
  } | null>(() =>
    currentUser?.locationPermission === 'granted' && currentUser.liveCoordinates
      ? {
          lat: currentUser.liveCoordinates.lat,
          lng: currentUser.liveCoordinates.lng,
          accuracy: currentUser.liveCoordinates.accuracyMeters,
          capturedAt: currentUser.liveCoordinates.updatedAt,
          isDemo: false,
        }
      : null
  );
  const [manualLocalityIdx, setManualLocalityIdx] = useState<number>(0);
  const [approximateArea, setApproximateArea] = useState<string>(
    currentUser?.hierarchy.locality
      ? `Near ${currentUser.hierarchy.locality}`
      : 'Near 12th Main Road, Ward 80'
  );

  // Step 4: Description + Multilingual Voice
  const [language, setLanguage] = useState<SupportedLanguageCode>(
    currentUser?.preferredLanguage ?? 'en'
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const [transcriptVerified, setTranscriptVerified] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Step 5: AI Triage & Duplicate Check
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<ComplaintAIAnalysis | null>(null);
  const [aiStatusNote, setAiStatusNote] = useState<string | null>(null);
  const [duplicateOverridden, setDuplicateOverridden] = useState(false);
  const [submittedConfirmation, setSubmittedConfirmation] = useState<{
    issue: CivicIssue;
    pointsEarned: number;
  } | null>(null);
  const [duplicateUpvotedId, setDuplicateUpvotedId] = useState<string | null>(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
      recognitionRef.current?.stop();
    };
  }, []);

  const startLiveCamera = async () => {
    setCameraError(null);
    setCameraState('requesting');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('error');
      setCameraError(
        'This browser does not expose live camera access. Gallery uploads are disabled by policy to preserve live evidence integrity.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: 'environment'},
        audio: false,
      });
      streamRef.current = stream;
      setCameraState('streaming');
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch (err) {
      setCameraState('error');
      const msg =
        err instanceof Error
          ? err.message
          : 'Camera permission was denied or no camera device was found.';
      setCameraError(
        `${msg} Gallery uploads are intentionally disabled. Please enable camera permissions or test with a demonstration camera preview frame.`
      );
    }
  };

  const captureFromVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhotoUrl(dataUrl);
    setPhotoCapturedLive(true);
    setCameraState('captured');
    stopCameraStream();
  };

  const usePreviewCameraFrame = () => {
    setCapturedPhotoUrl(SAMPLE_CAMERA_BY_CATEGORY[selectedCategory]);
    setPhotoCapturedLive(false);
    setCameraState('captured');
    setCameraError(null);
  };

  const handleRetake = () => {
    setCapturedPhotoUrl('');
    setPhotoCapturedLive(false);
    startLiveCamera();
  };

  const requestGeolocation = () => {
    setLocError(null);
    if (!('geolocation' in navigator)) {
      setLocState('error');
      setLocError('Browser geolocation is unavailable.');
      return;
    }

    setLocState('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4)),
          accuracy: Math.round(pos.coords.accuracy),
          capturedAt: new Date().toISOString(),
          isDemo: false,
        });
        setLocState('captured');
      },
      (err) => {
        setLocState('error');
        setLocError(
          `${err.message || 'Location permission denied.'} Select an approximate demonstration ward area below to continue.`
        );
      },
      {enableHighAccuracy: true, timeout: 7000}
    );
  };

  const confirmManualWardLocation = () => {
    const area = DEMO_LOCALITIES[manualLocalityIdx];
    setCoords({
      lat: 12.9716,
      lng: 77.6412,
      accuracy: 45,
      capturedAt: new Date().toISOString(),
      isDemo: true,
    });
    setApproximateArea(`Near ${area.locality}, ${area.ward}`);
    setLocState('captured');
    setLocError(null);
  };

  const startVoiceInput = () => {
    setVoiceMessage(null);
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    const langCfg =
      SUPPORTED_LANGUAGES.find((l) => l.code === language) ??
      SUPPORTED_LANGUAGES[0];

    if (!SpeechRec) {
      setVoiceMessage(
        `Live browser speech recognition is unavailable here. You may insert a sample ${langCfg.name} voice transcript below and edit it directly.`
      );
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = langCfg.speechLocale;
      rec.interimResults = false;
      rec.continuous = false;
      rec.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript ?? '';
        if (transcript) {
          setDescription((prev) =>
            prev ? `${prev.trim()} ${transcript}` : transcript
          );
          setTranscriptVerified(false);
          setVoiceMessage(
            `Captured ${langCfg.name} voice draft. Please review and edit the text before proceeding.`
          );
        }
      };
      rec.onerror = (ev) => {
        setListening(false);
        setVoiceMessage(`Voice capture stopped (${ev.error}). You can edit or type manually.`);
      };
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
      setVoiceMessage('Could not start microphone speech recognition.');
    }
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const insertSampleVoiceTranscript = () => {
    const langCfg =
      SUPPORTED_LANGUAGES.find((l) => l.code === language) ??
      SUPPORTED_LANGUAGES[0];
    setDescription(langCfg.sampleVoiceTranscript);
    if (!title.trim()) {
      setTitle(`${CATEGORY_MAP[selectedCategory].shortLabel} reported via voice`);
    }
    setTranscriptVerified(false);
    setVoiceMessage(
      `Inserted sample ${langCfg.name} transcript. Please review and edit before continuing.`
    );
  };

  const runAnalysisForReview = async () => {
    setStep(5);
    setAnalyzing(true);
    setAiResult(null);
    setDuplicateOverridden(false);
    setAiStatusNote(null);

    const chosenArea = DEMO_LOCALITIES[manualLocalityIdx];
    const response = await analyzeComplaintWithServer({
      description,
      selectedCategory,
      locality: chosenArea.locality,
      imageDataUrl: capturedPhotoUrl.startsWith('data:image/')
        ? capturedPhotoUrl
        : undefined,
      existingIssues: issues,
    });

    setAnalyzing(false);
    setAiResult(response.analysis);
    if (!response.usedLiveGemini) {
      setAiStatusNote(
        response.serverUnavailableReason
          ? `Demonstration Sample Analysis Used (${response.serverUnavailableReason})`
          : 'Demonstration Sample Analysis Used — not live Gemini API output.'
      );
    }
  };

  const matchedDuplicateIssue = aiResult?.duplicateCandidateId
    ? issues.find((i) => i.id === aiResult.duplicateCandidateId)
    : undefined;

  const handleUpvoteDuplicate = (existingId: string) => {
    toggleUpvote(existingId);
    setDuplicateUpvotedId(existingId);
  };

  const handleFinalSubmit = () => {
    if (!aiResult) return;
    const chosenArea = DEMO_LOCALITIES[manualLocalityIdx];
    const result = submitNewComplaint({
      category: aiResult.suggestedCategory || selectedCategory,
      title:
        title.trim() ||
        `${CATEGORY_MAP[selectedCategory].shortLabel} near ${approximateArea}`,
      description,
      photoUrl: capturedPhotoUrl || SAMPLE_CAMERA_BY_CATEGORY[selectedCategory],
      photoCapturedLive,
      approximateArea,
      hierarchy: currentUser?.hierarchy ?? chosenArea,
      accuracyMeters: coords?.accuracy,
      isDemoLocation: coords?.isDemo ?? true,
      aiAnalysis: aiResult,
    });
    setSubmittedConfirmation(result);
  };

  if (submittedConfirmation) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="h-6 w-6" />
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Complaint Submitted Successfully
          </h1>
        </div>

        <p className="mt-2 text-sm text-slate-600">
          Your report is now live in your <strong className="font-semibold text-slate-800">Submitted Reports</strong> list, Status Tracker, Community History, and Citizen Home Map.
        </p>

        <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">Submitted Complaint ID</p>
            <p className="mt-0.5 font-mono text-base font-bold text-slate-900">
              {submittedConfirmation.issue.id}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Demonstration Reward Update</p>
            <p className="mt-0.5 font-mono text-base font-bold text-indigo-600">
              +{submittedConfirmation.pointsEarned} points earned!
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Safety Severity</p>
            <div className="mt-1">
              <SeverityLabel severity={submittedConfirmation.issue.safetySeverity} />
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500">Routed Department(s)</p>
            <p className="mt-1 text-xs font-semibold text-slate-800">
              {submittedConfirmation.issue.assignedDepartments.join(' + ')}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <Link
            to={`/status?track=${submittedConfirmation.issue.id}`}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Track Report Status
          </Link>
          <Link
            to={`/issues/${submittedConfirmation.issue.id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            View Issue Dossier
          </Link>
          <Link
            to="/home"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Back to Home Map
          </Link>
        </div>
      </div>
    );
  }

  if (duplicateUpvotedId) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex items-center gap-2 text-indigo-600">
          <ThumbsUp className="h-6 w-6" />
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Existing Issue Upvoted Instead of Creating Duplicate
          </h1>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Thank you for confirming this matches{' '}
          <span className="font-mono font-semibold text-slate-900">
            {duplicateUpvotedId}
          </span>
          . Consolidating community support keeps ward queues focused.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/issues/${duplicateUpvotedId}`}
            className="inline-flex min-h-11 items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            View Supported Complaint
          </Link>
          <Link
            to="/home"
            className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Return to Map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Report a Civic Issue
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Step {step} of 5 · Guided capture with live camera, location verification, and AI triage
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-indigo-600 tabular-nums">
            {Math.round((step / 5) * 100)}% Complete
          </span>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-2">
          {[
            '1. Category',
            '2. Live Camera',
            '3. Location',
            '4. Description',
            '5. AI & Submit',
          ].map((label, idx) => {
            const num = idx + 1;
            const active = step === num;
            const done = step > num;
            return (
              <div
                key={label}
                className={`rounded-md border px-2 py-2 text-center text-xs font-medium ${
                  active
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : done
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}
              >
                <span className="truncate block">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Step 1: Select Civic Issue Category
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {ISSUE_CATEGORIES.map((cat) => {
                const selected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors cursor-pointer ${
                      selected
                        ? 'border-indigo-600 bg-indigo-50/70'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`mt-0.5 rounded-md p-2 ${
                        selected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <CategoryIcon category={cat.id} className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {cat.label}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer"
              >
                <span>Continue to Live Camera</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900">
                  Step 2: Capture Live Photograph Evidence
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Live in-app camera capture only—gallery file uploads are intentionally excluded in the citizen reporting flow.
                </p>
              </div>
            </div>

            {cameraError && (
              <div
                role="alert"
                className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
              >
                {cameraError}
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
              {cameraState === 'streaming' ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-72 w-full object-cover sm:h-80"
                />
              ) : cameraState === 'captured' && capturedPhotoUrl ? (
                <div className="relative bg-slate-100">
                  <CivicImage
                    src={capturedPhotoUrl}
                    alt="Captured issue evidence preview"
                    className="h-72 w-full object-cover sm:h-80"
                  />
                  <div className="border-t border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">
                    {photoCapturedLive
                      ? 'Captured via live in-app camera'
                      : 'Preview Demonstration Frame (Camera unavailable on current device)'}
                  </div>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center text-slate-200">
                  <Camera className="h-8 w-8 text-indigo-400" />
                  <p className="max-w-md text-sm">
                    Allow camera access to photograph the issue directly on site.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {cameraState === 'streaming' ? (
                <button
                  type="button"
                  onClick={captureFromVideo}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                  <span>Capture Photo</span>
                </button>
              ) : cameraState === 'captured' ? (
                <button
                  type="button"
                  onClick={handleRetake}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Retake Photograph</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startLiveCamera}
                  disabled={cameraState === 'requesting'}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                  <span>
                    {cameraState === 'requesting'
                      ? 'Requesting Camera...'
                      : 'Open Live Camera'}
                  </span>
                </button>
              )}

              {(cameraState === 'error' || cameraState === 'idle') && (
                <button
                  type="button"
                  onClick={usePreviewCameraFrame}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Use Demonstration Camera Frame (No Webcam Fallback)
                </button>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setStep(1);
                }}
                className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={!capturedPhotoUrl}
                onClick={() => {
                  stopCameraStream();
                  setStep(3);
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
              >
                <span>Continue to Location</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Step 3: Capture &amp; Confirm Location
            </h2>
            <p className="text-xs leading-relaxed text-slate-600">
              Your coordinates, timestamp, and location accuracy help route the issue to the correct municipal ward. GPS coordinates are assistive metadata and are never claimed to be tamper-proof.
            </p>

            {locError && (
              <div
                role="alert"
                className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
              >
                {locError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-800">
                  Option A: Browser GPS Detection
                </p>
                <button
                  type="button"
                  onClick={requestGeolocation}
                  disabled={locState === 'locating'}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                >
                  {locState === 'locating' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  <span>
                    {locState === 'captured' && !coords?.isDemo
                      ? 'Retry GPS Capture'
                      : 'Capture GPS Location'}
                  </span>
                </button>

                {coords && !coords.isDemo && (
                  <div className="rounded border border-emerald-200 bg-emerald-50 p-3 font-mono text-xs text-emerald-900 tabular-nums">
                    Lat: {coords.lat} · Lng: {coords.lng}
                    <br />
                    Accuracy: ±{coords.accuracy ?? 'N/A'}m
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <label
                  htmlFor="step3-ward"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Option B: Demonstration Ward Selection
                </label>
                <select
                  id="step3-ward"
                  value={manualLocalityIdx}
                  onChange={(e) => setManualLocalityIdx(Number(e.target.value))}
                  className="block min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                >
                  {DEMO_LOCALITIES.map((loc, idx) => (
                    <option key={loc.ward} value={idx}>
                      {loc.locality} — {loc.ward}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={confirmManualWardLocation}
                  className="inline-flex min-h-10 items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  Use Selected Demonstration Ward
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="approx-area-input"
                className="block text-xs font-medium text-slate-700"
              >
                Public Landmark / Approximate Street Description (Avoid exact house numbers)
              </label>
              <input
                id="approx-area-input"
                type="text"
                value={approximateArea}
                onChange={(e) => setApproximateArea(e.target.value)}
                placeholder="e.g., Near 12th Main Bus Shelter, Ward 80"
                className="mt-1 block min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={!coords || approximateArea.trim().length < 4}
                onClick={() => setStep(4)}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
              >
                <span>Continue to Description</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Step 4: Describe the Issue (Text or Regional Voice Input)
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="issue-title"
                  className="block text-xs font-medium text-slate-700"
                >
                  Short Issue Headline
                </label>
                <input
                  id="issue-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`e.g., ${CATEGORY_MAP[selectedCategory].shortLabel} near ${approximateArea}`}
                  className="mt-1 block min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="voice-lang"
                  className="block text-xs font-medium text-slate-700"
                >
                  Voice Input Preferred Language
                </label>
                <select
                  id="voice-lang"
                  value={language}
                  onChange={(e) =>
                    setLanguage(e.target.value as SupportedLanguageCode)
                  }
                  className="mt-1 block min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.nativeLabel})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {listening ? (
                <button
                  type="button"
                  onClick={stopVoiceInput}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
                >
                  <MicOff className="h-4 w-4" />
                  <span>Stop Recording</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startVoiceInput}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-indigo-600 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 cursor-pointer"
                >
                  <Mic className="h-4 w-4" />
                  <span>Speak in Preferred Language</span>
                </button>
              )}

              <button
                type="button"
                onClick={insertSampleVoiceTranscript}
                className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Insert Sample Regional Voice Transcript
              </button>
            </div>

            {voiceMessage && (
              <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                {voiceMessage}
              </p>
            )}

            <div>
              <label
                htmlFor="issue-description"
                className="block text-xs font-medium text-slate-700"
              >
                Editable Complaint Description (Review &amp; correct any speech-to-text output)
              </label>
              <textarea
                id="issue-description"
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setTranscriptVerified(false);
                }}
                placeholder="Describe visible hazards (e.g., exposed wire over puddle, deep pothole near bus stop, blocked drain)..."
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <label className="flex items-start gap-2.5 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={transcriptVerified}
                onChange={(e) => setTranscriptVerified(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I have reviewed and verified the written/converted description above before AI analysis and submission.
              </span>
            </label>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={description.trim().length < 10 || !transcriptVerified}
                onClick={runAnalysisForReview}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
              >
                <span>Analyze &amp; Review Submission</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Step 5: AI Triage, Duplicate Check &amp; Final Review
            </h2>

            {analyzing ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-slate-50 py-12">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <p className="text-sm font-medium text-slate-700">
                  Running safety severity assessment, department routing &amp; duplicate check...
                </p>
              </div>
            ) : (
              aiResult && (
                <div className="space-y-5">
                  {aiStatusNote && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900">
                      {aiStatusNote}
                    </div>
                  )}

                  {matchedDuplicateIssue && !duplicateOverridden && (
                    <div className="rounded-lg border border-orange-200 bg-orange-50/70 p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-700" />
                        <div>
                          <h3 className="font-display text-sm font-semibold text-slate-900">
                            Potential Duplicate Complaint Detected ({Math.round((aiResult.duplicateScore ?? 0.6) * 100)}% match)
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-700">
                            {aiResult.duplicateReason} Uncertain complaints are never automatically merged. Is this the same issue?
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-3">
                        <CivicImage
                          src={matchedDuplicateIssue.photoUrl}
                          alt={matchedDuplicateIssue.title}
                          className="h-28 w-full rounded object-cover"
                        />
                        <div className="space-y-1.5 sm:col-span-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-slate-700">
                              {matchedDuplicateIssue.id}
                            </span>
                            <ResolutionStatusLabel status={matchedDuplicateIssue.status} />
                          </div>
                          <p className="text-sm font-semibold text-slate-900">
                            {matchedDuplicateIssue.title}
                          </p>
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {matchedDuplicateIssue.description}
                          </p>
                          <p className="font-mono text-xs text-slate-500 tabular-nums">
                            {matchedDuplicateIssue.upvotedByUserIds.length} upvotes ·{' '}
                            {matchedDuplicateIssue.approximateArea}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleUpvoteDuplicate(matchedDuplicateIssue.id)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>Yes, Upvote Existing Complaint Instead</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuplicateOverridden(true)}
                          className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 cursor-pointer"
                        >
                          No, This Is a Different Issue — Continue Reporting
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-500">
                        Analysis Source
                      </p>
                      <p className="text-xs font-semibold text-slate-900">
                        {aiResult.modelOrRule}
                      </p>
                      <p className="text-xs text-slate-600">
                        {aiResult.classificationExplanation}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <SeverityLabel
                          severity={aiResult.safetySeverity ?? 'medium'}
                        />
                        {aiResult.needsHumanReview && (
                          <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Human Review Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700">{aiResult.severityReason}</p>
                      <p className="text-xs text-slate-600">
                        <strong className="font-semibold text-slate-900">
                          Routed Department(s):
                        </strong>{' '}
                        {aiResult.assignedDepartments.join(' + ')}
                        {aiResult.crossDepartmentRouting && ' (Cross-department)'}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
                    <CivicImage
                      src={capturedPhotoUrl}
                      alt="Submission preview"
                      className="h-36 w-full rounded object-cover"
                    />
                    <div className="space-y-1.5 sm:col-span-2">
                      <p className="text-xs font-medium text-indigo-600">
                        {CATEGORY_MAP[aiResult.suggestedCategory].label}
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {title.trim() ||
                          `${CATEGORY_MAP[selectedCategory].shortLabel} near ${approximateArea}`}
                      </p>
                      <p className="text-xs text-slate-600">{description}</p>
                      <p className="text-xs text-slate-500">
                        Area: {approximateArea}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Back &amp; Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFinalSubmit}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Submit Civic Report</span>
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
