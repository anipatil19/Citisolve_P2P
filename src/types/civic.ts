export type UserRole = 'citizen' | 'government_official';

export type SupportedLanguageCode =
  | 'en'
  | 'hi'
  | 'kn'
  | 'mr'
  | 'ta'
  | 'te'
  | 'bn';

export type IssueCategoryId =
  | 'potholes_roads'
  | 'garbage_dumps'
  | 'drainage'
  | 'electricity'
  | 'water_issues'
  | 'defective_streetlights'
  | 'fallen_trees_obstructions'
  | 'other_civic';

export type SafetySeverity = 'low' | 'medium' | 'high' | 'critical';

export type ComplaintLifecycleStage =
  | 'submitted'
  | 'ai_analysed'
  | 'assigned'
  | 'received_by_department'
  | 'under_process'
  | 'resolved_awaiting_confirmation'
  | 'resolution_confirmed';

export type EscalationState =
  | 'none'
  | 'escalation_initiated'
  | 'transmitted'
  | 'received'
  | 'escalation_acknowledged';

export type OfficialRoleLevel =
  | 'ward_officer'
  | 'department_officer'
  | 'municipal_admin';

export interface OfficialUser {
  id: string;
  name: string;
  employeeId: string;
  officialEmail: string;
  roleLevel: OfficialRoleLevel;
  designation: string;
  municipality: string;
  department: string;
  authorizedWards: string[];
  phone: string;
  isDemoAccount: boolean;
}

export interface OfficialStaffMember {
  id: string;
  name: string;
  employeeId: string;
  designation: string;
  department: string;
  ward: string;
  municipality: string;
  activeLoad: number;
}

export interface OfficialInternalRemark {
  id: string;
  authorName: string;
  authorDesignation: string;
  note: string;
  createdAt: string;
}

export interface OfficialAIOverride {
  id: string;
  field: 'category' | 'severity';
  previousValue: string;
  newValue: string;
  reason: string;
  officialName: string;
  employeeId: string;
  timestamp: string;
}

export interface AssignmentHistoryEntry {
  id: string;
  departments: string[];
  staffName?: string;
  note: string;
  assignedBy: string;
  timestamp: string;
}

export interface OfficialAuditEntry {
  id: string;
  complaintId?: string;
  action: string;
  details: string;
  officialName: string;
  employeeId: string;
  timestamp: string;
}

export interface OfficialNotificationItem {
  id: string;
  type:
    | 'new_complaint'
    | 'critical_issue'
    | 'assignment'
    | 'approaching_deadline'
    | 'overdue'
    | 'reassignment'
    | 'citizen_feedback'
    | 'escalation';
  title: string;
  message: string;
  complaintId?: string;
  ward: string;
  createdAt: string;
  read: boolean;
}

export type RewardMilestoneTier = 'bronze' | 'silver' | 'gold';

export type AgeEligibilityOption = 'adult_18_plus' | 'minor_with_guardian';

export type LocationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'demo_manual'
  | 'prompt';

export type PrivacyDisplayPreference =
  | 'full_name'
  | 'initials'
  | 'ward_resident_alias';

export interface AdministrativeHierarchy {
  locality: string;
  ward: string;
  municipality: string;
  district: string;
  state: string;
  country: string;
}

export interface CitizenUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  preferredLanguage: SupportedLanguageCode;
  ageEligibility: AgeEligibilityOption;
  guardianName?: string;
  guardianConsentConfirmed?: boolean;
  hierarchy: AdministrativeHierarchy;
  locationPermission: LocationPermissionStatus;
  locationSourceLabel: string;
  liveCoordinates?: {
    lat: number;
    lng: number;
    accuracyMeters?: number;
    updatedAt: string;
  };
  cameraPermission?: 'prompt' | 'granted' | 'denied' | 'unavailable';
  privacyDisplayPreference: PrivacyDisplayPreference;
  avatarUrl?: string;
  notificationsEnabled: boolean;
  smsUpdatesEnabled: boolean;
  createdAt: string;
  isDemoAccount: boolean;
}

export interface ComplaintTimelineEvent {
  stage: ComplaintLifecycleStage;
  timestamp: string;
  note: string;
  isDemoEvent: boolean;
}

export interface ComplaintAIAnalysis {
  source: 'gemini' | 'demonstration_sample';
  modelOrRule: string;
  suggestedCategory: IssueCategoryId;
  safetySeverity?: SafetySeverity;
  confidence: number;
  needsHumanReview: boolean;
  classificationExplanation: string;
  severityReason: string;
  assignedDepartments: string[];
  crossDepartmentRouting: boolean;
  duplicateCandidateId?: string;
  duplicateScore?: number;
  duplicateReason?: string;
}

export interface ComplaintEscalation {
  state: EscalationState;
  escalationLevel?: string;
  nextAuthorityLevel?: string;
  initiatedAt?: string;
  transmittedAt?: string;
  receivedAt?: string;
  acknowledgedAt?: string;
  reason?: string;
}

export interface CivicIssue {
  id: string;
  category: IssueCategoryId;
  title: string;
  description: string;
  photoUrl: string;
  photoCapturedLive: boolean;
  reporterId: string;
  reporterAlias: string;
  approximateArea: string;
  hierarchy: AdministrativeHierarchy;
  /** Publicly fuzzed/snapped coordinates on the demonstration ward grid (0-100 scale) and approximate distance */
  mapPosition: {
    x: number;
    y: number;
    distanceKmFromCenter: number;
    approxLat: number;
    approxLng: number;
  };
  captureMeta: {
    capturedAt: string;
    accuracyMeters?: number;
    isDemoLocation: boolean;
  };
  safetySeverity: SafetySeverity;
  severityReason: string;
  assignedDepartments: string[];
  crossDepartmentRouting: boolean;
  aiAnalysis: ComplaintAIAnalysis;
  status: ComplaintLifecycleStage;
  timeline: ComplaintTimelineEvent[];
  slaTargetHours: number;
  escalation: ComplaintEscalation;
  upvotedByUserIds: string[];
  createdAt: string;
  isDemoData: boolean;
  officialVerification?: {
    state: 'pending' | 'verified' | 'rejected';
    reason?: string;
    verifiedBy?: string;
    verifiedAt?: string;
  };
  assignedStaffId?: string;
  assignedStaffName?: string;
  targetResolutionDate?: string;
  internalRemarks?: OfficialInternalRemark[];
  aiOverrideHistory?: OfficialAIOverride[];
  assignmentHistory?: AssignmentHistoryEntry[];
  resolutionEvidence?: {
    note: string;
    photoUrl?: string;
    resolvedBy: string;
    resolvedAt: string;
  };
  citizenDispute?: {
    reason: string;
    disputedAt: string;
    disputedByAlias: string;
  };
}

export interface RewardTransaction {
  id: string;
  userId: string;
  complaintId?: string;
  actionType: 'verified_report' | 'upvote_participation' | 'resolution_bonus';
  points: number;
  status: 'pending' | 'awarded';
  description: string;
  createdAt: string;
  uniqueKey: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  linkTo?: string;
}

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  ward: string;
  municipality: string;
  district: string;
  points: number;
  resolvedCount: number;
  avatarUrl?: string;
  isCurrentUser?: boolean;
}

export type GeographyLevel =
  | 'locality'
  | 'ward'
  | 'municipality'
  | 'district'
  | 'state'
  | 'country';

export interface CommunityHistoryNode {
  id: string;
  level: GeographyLevel;
  name: string;
  parentName?: string;
  reportedCount: number;
  pendingCount: number;
  resolvedCount: number;
  criticalCount: number;
  topCategories: Array<{category: IssueCategoryId; count: number}>;
  monthlyTrendLabel: string;
}

export interface IssueCategoryDefinition {
  id: IssueCategoryId;
  label: string;
  shortLabel: string;
  description: string;
  defaultDepartment: string;
  safetyNote: string;
}

export interface LifecycleStageDefinition {
  id: ComplaintLifecycleStage;
  stepNumber: number;
  label: string;
  shortLabel: string;
  description: string;
}
