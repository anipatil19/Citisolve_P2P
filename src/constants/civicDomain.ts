import type {
  IssueCategoryDefinition,
  IssueCategoryId,
  LifecycleStageDefinition,
  RewardMilestoneTier,
  SafetySeverity,
  SupportedLanguageCode,
} from '../types/civic';

export const ISSUE_CATEGORIES: IssueCategoryDefinition[] = [
  {
    id: 'potholes_roads',
    label: 'Potholes and damaged roads',
    shortLabel: 'Potholes & Roads',
    description: 'Deep potholes, sunken manholes, broken tarmac edges, or damaged pedestrian crossings.',
    defaultDepartment: 'Road Maintenance',
    safetyNote: 'Evaluated for two-wheeler skids, collision risk, and pedestrian trip hazards.',
  },
  {
    id: 'garbage_dumps',
    label: 'Garbage dumps',
    shortLabel: 'Garbage Dumps',
    description: 'Overflowing community bins, uncollected waste piles, or illegal street dumping.',
    defaultDepartment: 'Sanitation',
    safetyNote: 'Evaluated for vector-borne health hazards, blocked footpaths, and fire risk.',
  },
  {
    id: 'drainage',
    label: 'Drainage',
    shortLabel: 'Drainage',
    description: 'Clogged stormwater grates, overflowing sewage drains, or severe street waterlogging.',
    defaultDepartment: 'Drainage Department',
    safetyNote: 'Evaluated for flooding, stagnant water contamination, and structural erosion.',
  },
  {
    id: 'electricity',
    label: 'Electricity',
    shortLabel: 'Electricity',
    description: 'Exposed junction boxes, hanging live wires, sparking transformers, or downed cables.',
    defaultDepartment: 'Electrical Department',
    safetyNote: 'Immediately prioritized as Critical when live wires appear near standing water.',
  },
  {
    id: 'water_issues',
    label: 'Water issues',
    shortLabel: 'Water Issues',
    description: 'Burst municipal water pipes, valve leaks, supply contamination, or wasted potable water.',
    defaultDepartment: 'Water Supply',
    safetyNote: 'Evaluated for water loss, road undermining, and drinking water safety.',
  },
  {
    id: 'defective_streetlights',
    label: 'Defective streetlights',
    shortLabel: 'Streetlights',
    description: 'Non-functional corridor lamps, flickering poles, or tilted streetlight fixtures.',
    defaultDepartment: 'Street Lighting & Electrical',
    safetyNote: 'Evaluated for night-time pedestrian safety and dark intersection risk.',
  },
  {
    id: 'fallen_trees_obstructions',
    label: 'Fallen trees and road obstructions',
    shortLabel: 'Fallen Trees',
    description: 'Storm-felled trees, heavy broken limbs, or debris obstructing municipal roads.',
    defaultDepartment: 'Horticulture/Tree Management',
    safetyNote: 'Evaluated for blocked emergency corridors and entangled overhead lines.',
  },
  {
    id: 'other_civic',
    label: 'Other civic issues',
    shortLabel: 'Other Civic',
    description: 'Damaged public benches, missing road signage, broken footpaths, or civic maintenance.',
    defaultDepartment: 'Municipal General Triage',
    safetyNote: 'Routed by AI classification with human review fallback on low confidence.',
  },
];

export const CATEGORY_MAP: Record<IssueCategoryId, IssueCategoryDefinition> =
  ISSUE_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat.id] = cat;
      return acc;
    },
    {} as Record<IssueCategoryId, IssueCategoryDefinition>
  );

export const COMPLAINT_LIFECYCLE_STAGES: LifecycleStageDefinition[] = [
  {
    id: 'submitted',
    stepNumber: 1,
    label: 'Submitted',
    shortLabel: 'Submitted',
    description: 'Captured via live camera with timestamp, location metadata, and citizen review.',
  },
  {
    id: 'ai_analysed',
    stepNumber: 2,
    label: 'AI Analysed',
    shortLabel: 'AI Analysed',
    description: 'Categorized, checked for nearby duplicates, and assessed for safety severity.',
  },
  {
    id: 'assigned',
    stepNumber: 3,
    label: 'Assigned',
    shortLabel: 'Assigned',
    description: 'Routed to primary and any cross-department municipal queues.',
  },
  {
    id: 'received_by_department',
    stepNumber: 4,
    label: 'Received by Department',
    shortLabel: 'Dept Received',
    description: 'Acknowledged by the responsible municipal ward engineering unit.',
  },
  {
    id: 'under_process',
    stepNumber: 5,
    label: 'Under Process',
    shortLabel: 'In Process',
    description: 'Field inspection or active repair work is underway.',
  },
  {
    id: 'resolved_awaiting_confirmation',
    stepNumber: 6,
    label: 'Resolved Awaiting Confirmation',
    shortLabel: 'Awaiting Confirm',
    description: 'Department logged completion; awaiting citizen verification.',
  },
  {
    id: 'resolution_confirmed',
    stepNumber: 7,
    label: 'Resolution Confirmed',
    shortLabel: 'Confirmed',
    description: 'Verified closure recorded in personal and community ward history.',
  },
];

export const SEVERITY_CONFIG: Record<
  SafetySeverity,
  {
    label: string;
    slaHours: number;
    slaText: string;
    colorHex: string;
    badgeBg: string;
    badgeText: string;
    borderClass: string;
    markerBg: string;
  }
> = {
  critical: {
    label: 'Critical',
    slaHours: 6,
    slaText: '6h emergency safety target',
    colorHex: '#DC2626',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-700',
    borderClass: 'border-red-200',
    markerBg: 'bg-red-600',
  },
  high: {
    label: 'High',
    slaHours: 24,
    slaText: '24h priority target',
    colorHex: '#EA580C',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
    borderClass: 'border-orange-200',
    markerBg: 'bg-orange-600',
  },
  medium: {
    label: 'Medium',
    slaHours: 72,
    slaText: '72h (3-day municipal baseline)',
    colorHex: '#D97706',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    borderClass: 'border-amber-200',
    markerBg: 'bg-amber-600',
  },
  low: {
    label: 'Low',
    slaHours: 120,
    slaText: '120h (5-day routine target)',
    colorHex: '#16A34A',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    borderClass: 'border-emerald-200',
    markerBg: 'bg-emerald-600',
  },
};

export const SUPPORTED_LANGUAGES: Array<{
  code: SupportedLanguageCode;
  name: string;
  nativeLabel: string;
  speechLocale: string;
  sampleVoiceTranscript: string;
}> = [
  {
    code: 'en',
    name: 'English',
    nativeLabel: 'English',
    speechLocale: 'en-IN',
    sampleVoiceTranscript:
      'Deep pothole near the bus shelter on 12th Main Road causing two-wheelers to swerve sharply.',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeLabel: 'हिन्दी',
    speechLocale: 'hi-IN',
    sampleVoiceTranscript:
      'मुख्य सड़क के किनारे नाली जाम हो गई है और गंदा पानी फुटपाथ पर बह रहा है।',
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeLabel: 'ಕನ್ನಡ',
    speechLocale: 'kn-IN',
    sampleVoiceTranscript:
      '12ನೇ ಮುಖ್ಯ ರಸ್ತೆಯ ಬಸ್ ನಿಲ್ದಾಣದ ಹತ್ತಿರ ದೊಡ್ಡ ಗುಂಡಿ ಬಿದ್ದಿದ್ದು ದ್ವಿಚಕ್ರ ವಾಹನಗಳಿಗೆ ಅಪಾಯವಾಗಿದೆ.',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeLabel: 'मराठी',
    speechLocale: 'mr-IN',
    sampleVoiceTranscript:
      'रस्त्याच्या कोपऱ्यावर कचऱ्याचे ढीग साचले आहेत आणि दुर्गंधी पसरली आहे.',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeLabel: 'தமிழ்',
    speechLocale: 'ta-IN',
    sampleVoiceTranscript:
      'தெருவிளக்கு கம்பம் சாய்ந்து எரியாமல் உள்ளது, இரவில் நடமாட சிரமமாக இருக்கிறது.',
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeLabel: 'తెలుగు',
    speechLocale: 'te-IN',
    sampleVoiceTranscript:
      'రోడ్డు పక్కన నీటి పైపు లీక్ అవుతుండటంతో మంచినీరు వృథా అవుతోంది.',
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeLabel: 'বাংলা',
    speechLocale: 'bn-IN',
    sampleVoiceTranscript:
      'ফুটপাতের পাশে বৈদ্যুতিক বাক্স খোলা অবস্থায় আছে এবং নিচে জল জমে আছে।',
  },
];

export const REWARD_MILESTONES: Array<{
  tier: RewardMilestoneTier;
  pointsRequired: number;
  title: string;
  certificateNote: string;
}> = [
  {
    tier: 'bronze',
    pointsRequired: 50,
    title: 'Bronze Civic Contributor',
    certificateNote: 'Platform Recognition Certificate for consistent neighborhood reporting.',
  },
  {
    tier: 'silver',
    pointsRequired: 75,
    title: 'Silver Ward Steward',
    certificateNote: 'Platform Recognition Certificate for active ward verification & participation.',
  },
  {
    tier: 'gold',
    pointsRequired: 100,
    title: 'Gold Community Champion',
    certificateNote:
      'Platform Recognition Certificate & Civic Service Nomination Eligibility (subject to authorized municipal programme rules).',
  },
];

export const REWARD_RULES = {
  VERIFIED_REPORT_POINTS: 5,
  UPVOTE_PARTICIPATION_POINTS: 2,
  RESOLUTION_CONFIRMATION_POINTS: 10,
} as const;

export const DEMO_LOCALITIES = [
  {
    locality: 'Indiranagar 12th Main',
    ward: 'Ward 80 — Hoysala Nagar',
    municipality: 'BBMP Bengaluru East',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    country: 'India',
  },
  {
    locality: 'Domlur 2nd Stage',
    ward: 'Ward 112 — Domlur',
    municipality: 'BBMP Bengaluru East',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    country: 'India',
  },
  {
    locality: 'Koramangala 4th Block',
    ward: 'Ward 151 — Koramangala',
    municipality: 'BBMP Bengaluru South',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    country: 'India',
  },
  {
    locality: 'Jayanagar 3rd Block',
    ward: 'Ward 170 — Jayanagar',
    municipality: 'BBMP Bengaluru South',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    country: 'India',
  },
];

export const MUNICIPAL_DEPARTMENTS: string[] = [
  'Road Maintenance',
  'Sanitation',
  'Drainage Department',
  'Water Supply',
  'Electrical Department',
  'Street Lighting & Electrical',
  'Horticulture/Tree Management',
  'Municipal General Triage',
];

export const DEFAULT_SLA_BY_SEVERITY: Record<SafetySeverity, number> = {
  critical: 6,
  high: 24,
  medium: 72,
  low: 120,
};

