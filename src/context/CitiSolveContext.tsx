import React, {createContext, useContext, useEffect, useState} from 'react';
import {
  CATEGORY_MAP,
  DEFAULT_SLA_BY_SEVERITY,
  DEMO_LOCALITIES,
  REWARD_RULES,
  SEVERITY_CONFIG,
} from '../constants/civicDomain';
import {
  DEMO_LEADERBOARD,
  INITIAL_DEMO_ISSUES,
  INITIAL_DEMO_NOTIFICATIONS,
  INITIAL_DEMO_REWARDS,
  INITIAL_DEMO_USER,
} from '../data/demoData';
import {
  DEMO_OFFICIAL_ACCOUNTS,
  INITIAL_OFFICIAL_AUDIT_LOG,
  INITIAL_OFFICIAL_NOTIFICATIONS,
} from '../data/officialDemoData';
import type {
  AdministrativeHierarchy,
  AgeEligibilityOption,
  CitizenUser,
  CivicIssue,
  ComplaintAIAnalysis,
  EscalationState,
  IssueCategoryId,
  LeaderboardEntry,
  LocationPermissionStatus,
  NotificationItem,
  OfficialAuditEntry,
  OfficialNotificationItem,
  OfficialUser,
  PrivacyDisplayPreference,
  RewardTransaction,
  SafetySeverity,
  SupportedLanguageCode,
} from '../types/civic';
import {isIssueInOfficialJurisdiction} from '../utils/officialHelpers';

const STORAGE_KEY = 'citisolve_demo_state_v1';
const SESSION_SUBMITTED_KEY = 'citisolve_session_submitted_v1';

interface PersistedState {
  appLanguage: SupportedLanguageCode;
  currentUser: CitizenUser | null;
  currentOfficial: OfficialUser | null;
  issues: CivicIssue[];
  rewards: RewardTransaction[];
  notifications: NotificationItem[];
  officialNotifications: OfficialNotificationItem[];
  officialAuditLog: OfficialAuditEntry[];
  slaConfig: Record<SafetySeverity, number>;
}

export interface RegisterCitizenInput {
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
  liveCoordinates?: CitizenUser['liveCoordinates'];
  cameraPermission?: CitizenUser['cameraPermission'];
}

export interface SubmitComplaintInput {
  category: IssueCategoryId;
  title: string;
  description: string;
  photoUrl: string;
  photoCapturedLive: boolean;
  approximateArea: string;
  hierarchy: AdministrativeHierarchy;
  accuracyMeters?: number;
  isDemoLocation: boolean;
  aiAnalysis: ComplaintAIAnalysis;
}

interface CitiSolveContextValue {
  appLanguage: SupportedLanguageCode;
  setAppLanguage: (lang: SupportedLanguageCode) => void;
  currentUser: CitizenUser | null;
  currentOfficial: OfficialUser | null;
  issues: CivicIssue[];
  officialJurisdictionIssues: CivicIssue[];
  sessionSubmittedIds: string[];
  sessionSubmittedIssues: CivicIssue[];
  rewards: RewardTransaction[];
  notifications: NotificationItem[];
  officialNotifications: OfficialNotificationItem[];
  unreadOfficialNotificationsCount: number;
  officialAuditLog: OfficialAuditEntry[];
  slaConfig: Record<SafetySeverity, number>;
  leaderboard: LeaderboardEntry[];
  totalAwardedPoints: number;
  totalPendingPoints: number;
  unreadNotificationsCount: number;
  loginAsDemoCitizen: (provider?: 'standard' | 'google') => void;
  loginWithCredentials: (identifier: string) => {ok: boolean; error?: string};
  loginWithOfficialCredentials: (
    identifier: string,
    password: string,
    preferredRole?: 'municipal_admin' | 'ward_officer'
  ) => {ok: boolean; official?: OfficialUser; error?: string};
  registerCitizen: (input: RegisterCitizenInput) => CitizenUser;
  logout: () => void;
  logoutOfficial: () => void;
  deleteAccount: () => void;
  updateProfile: (updates: Partial<CitizenUser>) => void;
  toggleUpvote: (issueId: string) => {
    action: 'added' | 'removed' | 'unauthenticated';
    pointsAwarded: number;
  };
  submitNewComplaint: (input: SubmitComplaintInput) => {
    issue: CivicIssue;
    pointsEarned: number;
  };
  confirmComplaintResolution: (issueId: string) => void;
  disputeComplaintResolution: (issueId: string, reason: string) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  resetDemoWorkspace: () => void;
  requestLiveLocationAccess: () => Promise<{ok: boolean; message: string}>;
  requestCameraAccess: () => Promise<{ok: boolean; message: string}>;
  // Official portal actions
  verifyOrRejectOfficialComplaint: (
    issueId: string,
    decision: 'verified' | 'rejected',
    reason: string
  ) => {ok: boolean; error?: string};
  overrideOfficialComplaintAI: (
    issueId: string,
    params: {
      category?: IssueCategoryId;
      severity?: SafetySeverity;
      reason: string;
    }
  ) => {ok: boolean; error?: string};
  assignOfficialDepartmentsAndStaff: (
    issueId: string,
    params: {
      departments: string[];
      staffId?: string;
      staffName?: string;
      note: string;
    }
  ) => {ok: boolean; error?: string};
  setOfficialTargetDate: (
    issueId: string,
    targetDate: string
  ) => {ok: boolean; error?: string};
  addOfficialInternalRemark: (
    issueId: string,
    note: string
  ) => {ok: boolean; error?: string};
  updateOfficialComplaintProgress: (
    issueId: string,
    nextStage: 'received_by_department' | 'under_process',
    note: string
  ) => {ok: boolean; error?: string};
  resolveOfficialComplaint: (
    issueId: string,
    params: {resolutionNote: string; evidencePhotoUrl?: string}
  ) => {ok: boolean; error?: string};
  advanceOfficialEscalation: (
    issueId: string,
    nextState: EscalationState,
    authorityLevel?: string,
    note?: string
  ) => {ok: boolean; error?: string};
  updateOfficialSlaConfig: (nextConfig: Record<SafetySeverity, number>) => void;
  markOfficialNotificationRead: (notificationId: string) => void;
  markAllOfficialNotificationsRead: () => void;
}

const CitiSolveContext = createContext<CitiSolveContextValue | null>(null);

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (parsed && Array.isArray(parsed.issues)) {
        return {
          appLanguage:
            parsed.appLanguage ?? parsed.currentUser?.preferredLanguage ?? 'en',
          currentUser: parsed.currentUser ?? null,
          currentOfficial: parsed.currentOfficial ?? null,
          issues: parsed.issues,
          rewards: Array.isArray(parsed.rewards)
            ? parsed.rewards
            : INITIAL_DEMO_REWARDS,
          notifications: Array.isArray(parsed.notifications)
            ? parsed.notifications
            : INITIAL_DEMO_NOTIFICATIONS,
          officialNotifications: Array.isArray(parsed.officialNotifications)
            ? parsed.officialNotifications
            : INITIAL_OFFICIAL_NOTIFICATIONS,
          officialAuditLog: Array.isArray(parsed.officialAuditLog)
            ? parsed.officialAuditLog
            : INITIAL_OFFICIAL_AUDIT_LOG,
          slaConfig: parsed.slaConfig ?? {...DEFAULT_SLA_BY_SEVERITY},
        };
      }
    }
  } catch {
    // Fallback cleanly to initial demonstration seed
  }
  return {
    appLanguage: 'en',
    currentUser: null,
    currentOfficial: null,
    issues: INITIAL_DEMO_ISSUES,
    rewards: INITIAL_DEMO_REWARDS,
    notifications: INITIAL_DEMO_NOTIFICATIONS,
    officialNotifications: INITIAL_OFFICIAL_NOTIFICATIONS,
    officialAuditLog: INITIAL_OFFICIAL_AUDIT_LOG,
    slaConfig: {...DEFAULT_SLA_BY_SEVERITY},
  };
}

export function formatCitizenPublicAlias(
  name: string,
  pref: PrivacyDisplayPreference
): string {
  if (pref === 'ward_resident_alias') {
    return 'Ward Citizen Contributor';
  }
  if (pref === 'initials') {
    const parts = name.trim().split(/\s+/);
    return parts.map((p) => `${p.charAt(0).toUpperCase()}.`).join(' ');
  }
  return name;
}

function loadSessionSubmittedIds(): string[] {
  try {
    const raw = sessionStorage.getItem(SESSION_SUBMITTED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((id): id is string => typeof id === 'string');
      }
    }
  } catch {
    // Ignore storage read issues safely
  }
  return [];
}

export const CitiSolveProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [state, setState] = useState<PersistedState>(() => loadInitialState());
  const [sessionSubmittedIds, setSessionSubmittedIds] = useState<string[]>(() =>
    loadSessionSubmittedIds()
  );

  useEffect(() => {
    document.documentElement.lang = state.appLanguage;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota issues safely
    }
  }, [state]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        SESSION_SUBMITTED_KEY,
        JSON.stringify(sessionSubmittedIds)
      );
    } catch {
      // Ignore sessionStorage errors safely
    }
  }, [sessionSubmittedIds]);

  const currentUser = state.currentUser;
  const currentOfficial = state.currentOfficial;

  const sessionSubmittedIssues = React.useMemo(
    () => state.issues.filter((i) => sessionSubmittedIds.includes(i.id)),
    [state.issues, sessionSubmittedIds]
  );

  const officialJurisdictionIssues = React.useMemo(
    () =>
      currentOfficial
        ? state.issues.filter((issue) =>
            isIssueInOfficialJurisdiction(issue, currentOfficial)
          )
        : [],
    [state.issues, currentOfficial]
  );

  const unreadOfficialNotificationsCount = React.useMemo(() => {
    if (!currentOfficial) return 0;
    return state.officialNotifications.filter(
      (n) => !n.read && currentOfficial.authorizedWards.includes(n.ward)
    ).length;
  }, [state.officialNotifications, currentOfficial]);

  const userRewards = state.rewards.filter(
    (r) => currentUser && r.userId === currentUser.id
  );
  const totalAwardedPoints = userRewards
    .filter((r) => r.status === 'awarded')
    .reduce((sum, r) => sum + r.points, 0);
  const totalPendingPoints = userRewards
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + r.points, 0);

  const unreadNotificationsCount = state.notifications.filter((n) => !n.read).length;

  const leaderboard: LeaderboardEntry[] = React.useMemo(() => {
    const base = [...DEMO_LEADERBOARD];
    if (currentUser) {
      const resolvedCount = state.issues.filter(
        (i) =>
          i.reporterId === currentUser.id && i.status === 'resolution_confirmed'
      ).length;
      base.push({
        id: currentUser.id,
        displayName: formatCitizenPublicAlias(
          currentUser.name,
          currentUser.privacyDisplayPreference
        ),
        ward: currentUser.hierarchy.ward,
        municipality: currentUser.hierarchy.municipality,
        district: currentUser.hierarchy.district,
        points: totalAwardedPoints,
        resolvedCount,
        avatarUrl: currentUser.avatarUrl,
        isCurrentUser: true,
      });
    }
    return base.sort((a, b) => b.points - a.points);
  }, [currentUser, state.issues, totalAwardedPoints]);

  const loginAsDemoCitizen = (provider: 'standard' | 'google' = 'standard') => {
    setState((prev) => ({
      ...prev,
      currentOfficial: null,
      currentUser: {
        ...INITIAL_DEMO_USER,
        preferredLanguage: prev.appLanguage,
        locationSourceLabel:
          provider === 'google'
            ? 'Google Sign-In Demo · Indiranagar Ward 80'
            : INITIAL_DEMO_USER.locationSourceLabel,
      },
      rewards: prev.rewards.length > 0 ? prev.rewards : INITIAL_DEMO_REWARDS,
    }));
  };

  const loginWithCredentials = (
    identifier: string
  ): {ok: boolean; error?: string} => {
    const clean = identifier.trim();
    if (clean.length < 4) {
      return {
        ok: false,
        error: 'Enter your registered phone number or email address.',
      };
    }
    setState((prev) => ({
      ...prev,
      currentOfficial: null,
      currentUser: {
        ...INITIAL_DEMO_USER,
        preferredLanguage: prev.appLanguage,
        email: clean.includes('@') ? clean : INITIAL_DEMO_USER.email,
        phone: clean.includes('@') ? INITIAL_DEMO_USER.phone : clean,
      },
    }));
    return {ok: true};
  };

  const loginWithOfficialCredentials = (
    identifier: string,
    password: string,
    preferredRole?: 'municipal_admin' | 'ward_officer'
  ): {ok: boolean; official?: OfficialUser; error?: string} => {
    const cleanId = identifier.trim().toLowerCase();
    if (cleanId.length < 3) {
      return {
        ok: false,
        error: 'Enter your official municipal email or employee ID.',
      };
    }
    if (password.trim().length < 4) {
      return {
        ok: false,
        error: 'Enter your official portal password (minimum 4 characters for demo).',
      };
    }

    const fallbackAccount =
      preferredRole === 'ward_officer'
        ? DEMO_OFFICIAL_ACCOUNTS[1]
        : DEMO_OFFICIAL_ACCOUNTS[0];

    const matchedById = DEMO_OFFICIAL_ACCOUNTS.find(
      (acc) =>
        acc.employeeId.toLowerCase() === cleanId ||
        acc.officialEmail.toLowerCase() === cleanId
    );

    const matched =
      matchedById ?? {
        ...fallbackAccount,
        officialEmail: cleanId.includes('@')
          ? cleanId
          : fallbackAccount.officialEmail,
        employeeId: !cleanId.includes('@')
          ? identifier.trim().toUpperCase()
          : fallbackAccount.employeeId,
      };

    setState((prev) => ({
      ...prev,
      currentUser: null,
      currentOfficial: matched,
    }));
    return {ok: true, official: matched};
  };

  const registerCitizen = (input: RegisterCitizenInput): CitizenUser => {
    const newUser: CitizenUser = {
      id: `cit_${Date.now()}`,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email.trim() || 'citizen@demo.citisolve.in',
      preferredLanguage: input.preferredLanguage,
      ageEligibility: input.ageEligibility,
      guardianName: input.guardianName?.trim(),
      guardianConsentConfirmed: input.guardianConsentConfirmed,
      hierarchy: input.hierarchy || DEMO_LOCALITIES[0],
      locationPermission: input.locationPermission,
      locationSourceLabel: input.locationSourceLabel,
      liveCoordinates: input.liveCoordinates,
      cameraPermission: input.cameraPermission ?? 'prompt',
      privacyDisplayPreference: 'full_name',
      notificationsEnabled: true,
      smsUpdatesEnabled: true,
      createdAt: new Date().toISOString(),
      isDemoAccount: true,
    };

    setState((prev) => ({
      ...prev,
      appLanguage: input.preferredLanguage,
      currentOfficial: null,
      currentUser: newUser,
      notifications: [
        {
          id: `notif_welcome_${Date.now()}`,
          title: `Welcome to CitiSOLVE, ${newUser.name}`,
          message: `Your citizen demonstration account is active for ${newUser.hierarchy.ward}.`,
          createdAt: new Date().toISOString(),
          read: false,
          linkTo: '/home',
        },
        ...prev.notifications,
      ],
    }));

    return newUser;
  };

  const logout = () => {
    setSessionSubmittedIds([]);
    setState((prev) => ({
      ...prev,
      currentUser: null,
    }));
  };

  const logoutOfficial = () => {
    setState((prev) => ({
      ...prev,
      currentOfficial: null,
    }));
  };

  const deleteAccount = () => {
    setSessionSubmittedIds([]);
    setState((prev) => ({
      ...prev,
      currentUser: null,
      rewards: prev.currentUser
        ? prev.rewards.filter((r) => r.userId !== prev.currentUser?.id)
        : prev.rewards,
    }));
  };

  const setAppLanguage = (lang: SupportedLanguageCode) => {
    setState((prev) => ({
      ...prev,
      appLanguage: lang,
      currentUser: prev.currentUser
        ? {...prev.currentUser, preferredLanguage: lang}
        : null,
    }));
  };

  const updateProfile = (updates: Partial<CitizenUser>) => {
    setState((prev) => {
      if (!prev.currentUser) return prev;
      const updatedUser: CitizenUser = {...prev.currentUser, ...updates};
      const updatedAlias = formatCitizenPublicAlias(
        updatedUser.name,
        updatedUser.privacyDisplayPreference
      );
      return {
        ...prev,
        appLanguage: updates.preferredLanguage ?? prev.appLanguage,
        currentUser: updatedUser,
        issues: prev.issues.map((issue) =>
          issue.reporterId === updatedUser.id
            ? {...issue, reporterAlias: updatedAlias}
            : issue
        ),
      };
    });
  };

  const toggleUpvote = (issueId: string) => {
    if (!currentUser) {
      return {action: 'unauthenticated' as const, pointsAwarded: 0};
    }
    let resultAction: 'added' | 'removed' = 'added';
    let pointsAwarded = 0;

    setState((prev) => {
      const userId = prev.currentUser?.id;
      if (!userId) return prev;

      const nextIssues = prev.issues.map((issue) => {
        if (issue.id !== issueId) return issue;
        const alreadyVoted = issue.upvotedByUserIds.includes(userId);
        if (alreadyVoted) {
          resultAction = 'removed';
          return {
            ...issue,
            upvotedByUserIds: issue.upvotedByUserIds.filter((id) => id !== userId),
          };
        }
        resultAction = 'added';
        return {
          ...issue,
          upvotedByUserIds: [...issue.upvotedByUserIds, userId],
        };
      });

      const uniqueKey = `upvote:${userId}:${issueId}`;
      const rewardExists = prev.rewards.some((r) => r.uniqueKey === uniqueKey);
      let nextRewards = prev.rewards;

      if (resultAction === 'added' && !rewardExists) {
        pointsAwarded = REWARD_RULES.UPVOTE_PARTICIPATION_POINTS;
        nextRewards = [
          {
            id: `rew_${Date.now()}`,
            userId,
            complaintId: issueId,
            actionType: 'upvote_participation',
            points: pointsAwarded,
            status: 'awarded',
            description: `Community support upvote (${issueId})`,
            createdAt: new Date().toISOString(),
            uniqueKey,
          },
          ...prev.rewards,
        ];
      }

      return {
        ...prev,
        issues: nextIssues,
        rewards: nextRewards,
      };
    });

    return {action: resultAction, pointsAwarded};
  };

  const submitNewComplaint = (input: SubmitComplaintInput) => {
    const user = currentUser ?? INITIAL_DEMO_USER;
    const now = new Date();
    const randomCode = Math.floor(1050 + Math.random() * 8900);
    const id = `CS-BLR-2026-${randomCode}`;
    const severity = input.aiAnalysis.safetySeverity || 'medium';
    const slaTargetHours =
      state.slaConfig[severity] ?? SEVERITY_CONFIG[severity].slaHours;
    const primaryDept = CATEGORY_MAP[input.category].defaultDepartment;
    const assignedDepts = Array.from(
      new Set([primaryDept, ...input.aiAnalysis.assignedDepartments.filter(Boolean)])
    );

    const newIssue: CivicIssue = {
      id,
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      photoUrl: input.photoUrl,
      photoCapturedLive: input.photoCapturedLive,
      reporterId: user.id,
      reporterAlias: formatCitizenPublicAlias(
        user.name,
        user.privacyDisplayPreference
      ),
      approximateArea: input.approximateArea,
      hierarchy: input.hierarchy,
      mapPosition: {
        x: Math.round(28 + Math.random() * 44),
        y: Math.round(28 + Math.random() * 44),
        distanceKmFromCenter: Number((0.3 + Math.random() * 2.4).toFixed(1)),
        approxLat: Number((12.968 + (Math.random() - 0.5) * 0.015).toFixed(4)),
        approxLng: Number((77.638 + (Math.random() - 0.5) * 0.015).toFixed(4)),
      },
      captureMeta: {
        capturedAt: now.toISOString(),
        accuracyMeters: input.accuracyMeters,
        isDemoLocation: input.isDemoLocation,
      },
      safetySeverity: severity,
      severityReason: input.aiAnalysis.severityReason,
      assignedDepartments: assignedDepts,
      crossDepartmentRouting: assignedDepts.length > 1,
      aiAnalysis: input.aiAnalysis,
      status: 'assigned',
      timeline: [
        {
          stage: 'submitted',
          timestamp: now.toISOString(),
          note: 'Submitted via CitiSOLVE guided citizen reporting flow.',
          isDemoEvent: true,
        },
        {
          stage: 'ai_analysed',
          timestamp: new Date(now.getTime() + 1000).toISOString(),
          note: `${input.aiAnalysis.modelOrRule}: ${SEVERITY_CONFIG[severity].label} severity.`,
          isDemoEvent: input.aiAnalysis.source !== 'gemini',
        },
        {
          stage: 'assigned',
          timestamp: new Date(now.getTime() + 2000).toISOString(),
          note: `Auto-assigned to ${assignedDepts.join(' & ')} (${SEVERITY_CONFIG[severity].slaText}).`,
          isDemoEvent: true,
        },
      ],
      slaTargetHours,
      escalation:
        severity === 'critical'
          ? {
              state: 'escalation_initiated',
              escalationLevel: 'Level 1 — Emergency Safety Fast-Track',
              nextAuthorityLevel: 'Emergency Ward Safety Engineer',
              initiatedAt: new Date(now.getTime() + 3000).toISOString(),
              reason:
                'Critical safety hazard fast-tracked immediately; awaiting department acknowledgement.',
            }
          : {state: 'none'},
      upvotedByUserIds: [user.id],
      createdAt: now.toISOString(),
      isDemoData: false,
      officialVerification: {state: 'pending'},
    };

    const pointsEarned = REWARD_RULES.VERIFIED_REPORT_POINTS;
    const rewardTx: RewardTransaction = {
      id: `rew_${Date.now()}`,
      userId: user.id,
      complaintId: id,
      actionType: 'verified_report',
      points: pointsEarned,
      status: 'awarded',
      description: `Verified civic report submission (${id})`,
      createdAt: now.toISOString(),
      uniqueKey: `report:${user.id}:${id}`,
    };

    const notif: NotificationItem = {
      id: `notif_${Date.now()}`,
      title: `Complaint ${id} submitted`,
      message: `Routed to ${assignedDepts.join(' + ')} · +${pointsEarned} demonstration points awarded.`,
      createdAt: now.toISOString(),
      read: false,
      linkTo: `/status?track=${id}`,
    };

    const officialNotif: OfficialNotificationItem = {
      id: `off_notif_${Date.now()}`,
      type: severity === 'critical' ? 'critical_issue' : 'new_complaint',
      title:
        severity === 'critical'
          ? `Critical Citizen Hazard: ${id}`
          : `New Citizen Complaint: ${id}`,
      message: `${newIssue.title} (${newIssue.approximateArea}) routed to ${assignedDepts.join(' + ')}.`,
      complaintId: id,
      ward: newIssue.hierarchy.ward,
      createdAt: now.toISOString(),
      read: false,
    };

    setSessionSubmittedIds((prev) => [id, ...prev.filter((item) => item !== id)]);
    setState((prev) => ({
      ...prev,
      currentUser: prev.currentUser ?? user,
      issues: [newIssue, ...prev.issues],
      rewards: [rewardTx, ...prev.rewards],
      notifications: [notif, ...prev.notifications],
      officialNotifications: [officialNotif, ...prev.officialNotifications],
    }));

    return {issue: newIssue, pointsEarned};
  };

  const confirmComplaintResolution = (issueId: string) => {
    setState((prev) => {
      const userId = prev.currentUser?.id;
      if (!userId) return prev;
      const now = new Date().toISOString();
      let targetWard = DEMO_LOCALITIES[0].ward;

      const nextIssues = prev.issues.map((issue) => {
        if (issue.id !== issueId) return issue;
        if (issue.status !== 'resolved_awaiting_confirmation') return issue;
        targetWard = issue.hierarchy.ward;
        return {
          ...issue,
          status: 'resolution_confirmed' as const,
          timeline: [
            ...issue.timeline,
            {
              stage: 'resolution_confirmed' as const,
              timestamp: now,
              note: 'Citizen verified and confirmed resolution.',
              isDemoEvent: false,
            },
          ],
        };
      });

      const pendingKey = `resolve_pending:${userId}:${issueId}`;
      const awardedKey = `resolve:${userId}:${issueId}`;
      const hasAwarded = prev.rewards.some((r) => r.uniqueKey === awardedKey);

      let nextRewards = prev.rewards.map((r) =>
        r.uniqueKey === pendingKey
          ? {
              ...r,
              status: 'awarded' as const,
              description: `Confirmed resolution milestone bonus (${issueId})`,
              createdAt: now,
              uniqueKey: awardedKey,
            }
          : r
      );

      if (
        !hasAwarded &&
        !prev.rewards.some((r) => r.uniqueKey === pendingKey)
      ) {
        nextRewards = [
          {
            id: `rew_conf_${Date.now()}`,
            userId,
            complaintId: issueId,
            actionType: 'resolution_bonus',
            points: REWARD_RULES.RESOLUTION_CONFIRMATION_POINTS,
            status: 'awarded',
            description: `Confirmed resolution milestone bonus (${issueId})`,
            createdAt: now,
            uniqueKey: awardedKey,
          },
          ...nextRewards,
        ];
      }

      return {
        ...prev,
        issues: nextIssues,
        rewards: nextRewards,
        notifications: [
          {
            id: `notif_conf_${Date.now()}`,
            title: `Resolution confirmed: ${issueId}`,
            message: `Thank you for confirming closure. +${REWARD_RULES.RESOLUTION_CONFIRMATION_POINTS} bonus points credited.`,
            createdAt: now,
            read: false,
            linkTo: `/issues/${issueId}`,
          },
          ...prev.notifications,
        ],
        officialNotifications: [
          {
            id: `off_notif_conf_${Date.now()}`,
            type: 'citizen_feedback',
            title: `Citizen Confirmed Closure: ${issueId}`,
            message: `Reporter confirmed resolution for ${issueId}. Ticket closed.`,
            complaintId: issueId,
            ward: targetWard,
            createdAt: now,
            read: false,
          },
          ...prev.officialNotifications,
        ],
      };
    });
  };

  const disputeComplaintResolution = (issueId: string, reason: string) => {
    const cleanReason = reason.trim();
    if (!cleanReason) return;
    setState((prev) => {
      const user = prev.currentUser;
      if (!user) return prev;
      const now = new Date().toISOString();
      let targetWard = DEMO_LOCALITIES[0].ward;

      const nextIssues = prev.issues.map((issue) => {
        if (issue.id !== issueId) return issue;
        if (issue.status !== 'resolved_awaiting_confirmation') return issue;
        targetWard = issue.hierarchy.ward;
        return {
          ...issue,
          status: 'under_process' as const,
          citizenDispute: {
            reason: cleanReason,
            disputedAt: now,
            disputedByAlias: formatCitizenPublicAlias(
              user.name,
              user.privacyDisplayPreference
            ),
          },
          timeline: [
            ...issue.timeline,
            {
              stage: 'under_process' as const,
              timestamp: now,
              note: `Citizen disputed resolution and returned for review: "${cleanReason}"`,
              isDemoEvent: false,
            },
          ],
        };
      });

      return {
        ...prev,
        issues: nextIssues,
        notifications: [
          {
            id: `notif_disp_${Date.now()}`,
            title: `Resolution disputed: ${issueId}`,
            message: 'Complaint returned to Under Process for official re-inspection.',
            createdAt: now,
            read: false,
            linkTo: `/issues/${issueId}`,
          },
          ...prev.notifications,
        ],
        officialNotifications: [
          {
            id: `off_notif_disp_${Date.now()}`,
            type: 'citizen_feedback',
            title: `Citizen Disputed Resolution: ${issueId}`,
            message: `Returned for official review: "${cleanReason}"`,
            complaintId: issueId,
            ward: targetWard,
            createdAt: now,
            read: false,
          },
          ...prev.officialNotifications,
        ],
      };
    });
  };

  // --- Official Portal Actions (Enforces Role & Jurisdiction + Records Audit Trail) ---
  const validateOfficialAccess = (
    issueId: string
  ): {ok: boolean; official?: OfficialUser; issue?: CivicIssue; error?: string} => {
    if (!currentOfficial) {
      return {ok: false, error: 'Official authentication required.'};
    }
    const issue = state.issues.find((i) => i.id === issueId);
    if (!issue) {
      return {ok: false, error: 'Complaint not found.'};
    }
    if (!isIssueInOfficialJurisdiction(issue, currentOfficial)) {
      return {
        ok: false,
        error: 'Access denied: Complaint is outside your authorized municipal jurisdiction.',
      };
    }
    return {ok: true, official: currentOfficial, issue};
  };

  const verifyOrRejectOfficialComplaint = (
    issueId: string,
    decision: 'verified' | 'rejected',
    reason: string
  ) => {
    const check = validateOfficialAccess(issueId);
    if (!check.ok || !check.official) return {ok: false, error: check.error};
    if (decision === 'rejected' && reason.trim().length < 5) {
      return {ok: false, error: 'Mandatory reason is required when rejecting a complaint.'};
    }
    const official = check.official;
    const now = new Date().toISOString();
    const audit: OfficialAuditEntry = {
      id: `aud_${Date.now()}`,
      complaintId: issueId,
      action: decision === 'verified' ? 'COMPLAINT_VERIFIED' : 'COMPLAINT_REJECTED',
      details:
        decision === 'verified'
          ? `Verified complaint validity${reason.trim() ? `: ${reason.trim()}` : '.'}`
          : `Rejected complaint: ${reason.trim()}`,
      officialName: official.name,
      employeeId: official.employeeId,
      timestamp: now,
    };

    setState((prev) => ({
      ...prev,
      issues: prev.issues.map((issue) =>
        issue.id === issueId
          ? {
              ...issue,
              officialVerification: {
                state: decision,
                reason: reason.trim() || undefined,
                verifiedBy: `${official.name} (${official.employeeId})`,
                verifiedAt: now,
              },
              timeline: [
                ...issue.timeline,
                {
                  stage: issue.status,
                  timestamp: now,
                  note:
                    decision === 'verified'
                      ? `Complaint verified by ${official.designation}.`
                      : `Complaint rejected by ${official.designation}: ${reason.trim()}`,
                  isDemoEvent: false,
                },
              ],
            }
          : issue
      ),
      officialAuditLog: [audit, ...prev.officialAuditLog],
    }));
    return {ok: true};
  };

  const overrideOfficialComplaintAI = (
    issueId: string,
    params: {category?: IssueCategoryId; severity?: SafetySeverity; reason: string}
  ) => {
    const check = validateOfficialAccess(issueId);
    if (!check.ok || !check.official || !check.issue) {
      return {ok: false, error: check.error};
    }
    if (params.reason.trim().length < 5) {
      return {ok: false, error: 'Please provide an override reason (minimum 5 characters).'};
    }
    const official = check.official;
    const prevIssue = check.issue;
    const now = new Date().toISOString();
    const overrides: NonNullable<CivicIssue['aiOverrideHistory']> = [];

    if (params.category && params.category !== prevIssue.category) {
      overrides.push({
        id: `ovr_cat_${Date.now()}`,
        field: 'category',
        previousValue: prevIssue.category,
        newValue: params.category,
        reason: params.reason.trim(),
        officialName: official.name,
        employeeId: official.employeeId,
        timestamp: now,
      });
    }
    if (params.severity && params.severity !== prevIssue.safetySeverity) {
      overrides.push({
        id: `ovr_sev_${Date.now() + 1}`,
        field: 'severity',
        previousValue: prevIssue.safetySeverity,
        newValue: params.severity,
        reason: params.reason.trim(),
        officialName: official.name,
        employeeId: official.employeeId,
        timestamp: now,
      });
    }

    if (overrides.length === 0) {
      return {ok: false, error: 'Select a different category or severity to record an override.'};
    }

    const nextSeverity = params.severity ?? prevIssue.safetySeverity;
    const nextCategory = params.category ?? prevIssue.category;
    const nextSla = state.slaConfig[nextSeverity] ?? SEVERITY_CONFIG[nextSeverity].slaHours;

    const audit: OfficialAuditEntry = {
      id: `aud_${Date.now()}`,
      complaintId: issueId,
      action: 'AI_TRIAGE_OVERRIDE',
      details: overrides
        .map((o) => `${o.field}: ${o.previousValue} -> ${o.newValue} (${o.reason})`)
        .join(' | '),
      officialName: official.name,
      employeeId: official.employeeId,
      timestamp: now,
    };

    setState((prev) => ({
      ...prev,
      issues: prev.issues.map((issue) =>
        issue.id === issueId
          ? {
              ...issue,
              category: nextCategory,
              safetySeverity: nextSeverity,
              slaTargetHours: nextSla,
              aiOverrideHistory: [...overrides, ...(issue.aiOverrideHistory ?? [])],
              timeline: [
                ...issue.timeline,
                {
                  stage: issue.status,
                  timestamp: now,
                  note: `Official AI triage override by ${official.name} (${official.employeeId}): ${params.reason.trim()}`,
                  isDemoEvent: false,
                },
              ],
            }
          : issue
      ),
      officialAuditLog: [audit, ...prev.officialAuditLog],
    }));
    return {ok: true};
  };

  const assignOfficialDepartmentsAndStaff = (
    issueId: string,
    params: {departments: string[]; staffId?: string; staffName?: string; note: string}
  ) => {
    const check = validateOfficialAccess(issueId);
    if (!check.ok || !check.official || !check.issue) {
      return {ok: false, error: check.error};
    }
    if (params.departments.length === 0) {
      return {ok: false, error: 'Select at least one municipal department.'};
    }
    const official = check.official;
    const prevIssue = check.issue;
    const now = new Date().toISOString();
    const isReassignment = prevIssue.assignedDepartments.length > 0;
    const nextStatus =
      prevIssue.status === 'submitted' || prevIssue.status === 'ai_analysed'
        ? ('assigned' as const)
        : prevIssue.status;

    const historyEntry = {
      id: `asg_${Date.now()}`,
      departments: params.departments,
      staffName: params.staffName,
      note:
        params.note.trim() ||
        `Assigned to ${params.departments.join(' + ')}${params.staffName ? ` (${params.staffName})` : ''}`,
      assignedBy: `${official.name} (${official.employeeId})`,
      timestamp: now,
    };

    const audit: OfficialAuditEntry = {
      id: `aud_${Date.now()}`,
      complaintId: issueId,
      action: isReassignment ? 'DEPARTMENT_REASSIGNED' : 'DEPARTMENT_ASSIGNED',
      details: historyEntry.note,
      officialName: official.name,
      employeeId: official.employeeId,
      timestamp: now,
    };

    const offNotif: OfficialNotificationItem = {
      id: `off_notif_asg_${Date.now()}`,
      type: isReassignment ? 'reassignment' : 'assignment',
      title: `${isReassignment ? 'Reassigned' : 'Assigned'}: ${issueId}`,
      message: historyEntry.note,
      complaintId: issueId,
      ward: prevIssue.hierarchy.ward,
      createdAt: now,
      read: false,
    };

    setState((prev) => ({
      ...prev,
      issues: prev.issues.map((issue) =>
        issue.id === issueId
          ? {
              ...issue,
              status: nextStatus,
              assignedDepartments: params.departments,
              crossDepartmentRouting: params.departments.length > 1,
              assignedStaffId: params.staffId ?? issue.assignedStaffId,
              assignedStaffName: params.staffName ?? issue.assignedStaffName,
              assignmentHistory: [historyEntry, ...(issue.assignmentHistory ?? [])],
              timeline: [
                ...issue.timeline,
                {
                  stage: nextStatus,
                  timestamp: now,
                  note: historyEntry.note,
                  isDemoEvent: false,
                },
              ],
            }
          : issue
      ),
      officialAuditLog: [audit, ...prev.officialAuditLog],
      officialNotifications: [offNotif, ...prev.officialNotifications],
    }));
    return {ok: true};
  };

  const setOfficialTargetDate = (issueId: string, targetDate: string) => {
    const check = validateOfficialAccess(issueId);
    if (!check.ok || !check.official) return {ok: false, error: check.error};
    if (!targetDate) return {ok: false, error: 'Select a target resolution date.'};
    const official = check.official;
    const now = new Date().toISOString();

    setState((prev) => ({
      ...prev,
      issues: prev.issues.map((issue) =>
        issue.id === issueId ? {...issue, targetResolutionDate: targetDate} : issue
      ),
      officialAuditLog: [
        {
          id: `aud_${Date.now()}`,
          complaintId: issueId,
          action: 'TARGET_DATE_UPDATED',
          details: `Target resolution date set to ${targetDate}.`,
          officialName: official.name,
          employeeId: official.employeeId,
          timestamp: now,
        },
        ...prev.officialAuditLog,
      ],
    }));
    return {ok: true};
  };

  const addOfficialInternalRemark = (issueId: string, note: string) => {
    const check = validateOfficialAccess(issueId);
    if (!check.ok || !check.official) return {ok: false, error: check.error};
    if (note.trim().length < 3) {
      return {ok: false, error: 'Enter an internal remark.'};
    }
    const official = check.official;
    const now = new Date().toISOString();
    const remark = {
      id: `rem_${Date.now()}`,
      authorName: official.name,
      authorDesignation: official.designation,
      note: note.trim(),
      createdAt: now,
    };

    setState((prev) => ({
      ...prev,
      issues: prev.issues.map((issue) =>
        issue.id === issueId
          ? {...issue, internalRemarks: [remark, ...(issue.internalRemarks ?? [])]}
          : issue
      ),
      officialAuditLog: [
        {
          id: `aud_${Date.now()}`,
          complaintId: issueId,
          action: 'INTERNAL_REMARK_ADDED',
          details: 'Added private internal official remark (hidden from citizen view).',
          officialName: official.name,
          employeeId: official.employeeId,
          timestamp: now,
        },
        ...prev.officialAuditLog,
      ],
    }));
    return {ok: true};
  };

  const updateOfficialComplaintProgress = (
    issueId: string,
    nextStage: 'received_by_department' | 'under_process',
    note: string
  ) => {
    const check = validateOfficialAccess(issueId);
    if (!check.ok || !check.official) return {ok: false, error: check.error};
    const official = check.official;
    const now = new Date().toISOString();
    const stageNote =
      note.trim() ||
      (nextStage === 'received_by_department'
        ? `Acknowledged by ${official.designation}.`
        : `Field repair work started by ${official.designation}.`);

    setState((prev) => ({
      ...prev,
      issues: prev.issues.map((issue) =>
        issue.id === issueId
          ? {
              ...issue,
              status: nextStage,
              timeline: [
                ...issue.timeline,
                {
                  stage: nextStage,
                  timestamp: now,
                  note: stageNote,
                  isDemoEvent: false,
                },
              ],
            }
          : issue
      ),
      notifications: [
        {
          id: `notif_prog_${Date.now()}`,
          title: `Status updated: ${issueId}`,
          message: stageNote,
          createdAt: now,
          read: false,
          linkTo: `/issues/${issueId}`,
        },
        ...prev.notifications,
      ],
      officialAuditLog: [
        {
          id: `aud_${Date.now()}`,
          complaintId: issueId,
          action: 'STATUS_UPDATED',
          details: `${nextStage}: ${stageNote}`,
          officialName: official.name,
          employeeId: official.employeeId,
          timestamp: now,
        },
        ...prev.officialAuditLog,
      ],
    }));
    return {ok: true};
  };

  const resolveOfficialComplaint = (
    issueId: string,
    params: {resolutionNote: string; evidencePhotoUrl?: string}
  ) => {
    const check = validateOfficialAccess(issueId);
    if (!check.ok || !check.official || !check.issue) {
      return {ok: false, error: check.error};
    }
    if (params.resolutionNote.trim().length < 8) {
      return {
        ok: false,
        error: 'A detailed resolution note (minimum 8 characters) is required before marking resolved.',
      };
    }
    const official = check.official;
    const prevIssue = check.issue;
    const now = new Date().toISOString();

    setState((prev) => ({
      ...prev,
      issues: prev.issues.map((issue) =>
        issue.id === issueId
          ? {
              ...issue,
              status: 'resolved_awaiting_confirmation' as const,
              citizenDispute: undefined,
              resolutionEvidence: {
                note: params.resolutionNote.trim(),
                photoUrl: params.evidencePhotoUrl,
                resolvedBy: `${official.name} (${official.employeeId})`,
                resolvedAt: now,
              },
              timeline: [
                ...issue.timeline,
                {
                  stage: 'resolved_awaiting_confirmation' as const,
                  timestamp: now,
                  note: `Marked solved by ${official.designation}: ${params.resolutionNote.trim()}`,
                  isDemoEvent: false,
                },
              ],
            }
          : issue
      ),
      notifications: [
        {
          id: `notif_res_${Date.now()}`,
          title: `Issue Solved: ${issueId}`,
          message: `${official.designation} marked ${issueId} as solved. View details or confirm closure.`,
          createdAt: now,
          read: false,
          linkTo: `/issues/${issueId}`,
        },
        ...prev.notifications,
      ],
      officialNotifications: [
        {
          id: `off_notif_res_${Date.now()}`,
          type: 'citizen_feedback',
          title: `Solved by ${official.roleLevel === 'ward_officer' ? 'Ward Officer' : 'Municipal Officer'}: ${issueId}`,
          message: `${prevIssue.title} marked solved (${params.resolutionNote.trim()}).`,
          complaintId: issueId,
          ward: prevIssue.hierarchy.ward,
          createdAt: now,
          read: false,
        },
        ...prev.officialNotifications,
      ],
      officialAuditLog: [
        {
          id: `aud_${Date.now()}`,
          complaintId: issueId,
          action: 'MARKED_SOLVED',
          details: params.resolutionNote.trim(),
          officialName: official.name,
          employeeId: official.employeeId,
          timestamp: now,
        },
        ...prev.officialAuditLog,
      ],
    }));
    return {ok: true};
  };

  const advanceOfficialEscalation = (
    issueId: string,
    nextState: EscalationState,
    authorityLevel?: string,
    note?: string
  ) => {
    const check = validateOfficialAccess(issueId);
    if (!check.ok || !check.official || !check.issue) {
      return {ok: false, error: check.error};
    }
    const official = check.official;
    const prevIssue = check.issue;
    const now = new Date().toISOString();

    setState((prev) => ({
      ...prev,
      issues: prev.issues.map((issue) => {
        if (issue.id !== issueId) return issue;
        const esc = {...issue.escalation, state: nextState};
        if (authorityLevel) esc.nextAuthorityLevel = authorityLevel;
        if (note) esc.reason = note;
        if (nextState === 'escalation_initiated' && !esc.initiatedAt) {
          esc.initiatedAt = now;
        }
        if (nextState === 'transmitted') {
          esc.initiatedAt = esc.initiatedAt ?? now;
          esc.transmittedAt = now;
        }
        if (nextState === 'received') {
          esc.initiatedAt = esc.initiatedAt ?? now;
          esc.transmittedAt = esc.transmittedAt ?? now;
          esc.receivedAt = now;
        }
        if (nextState === 'escalation_acknowledged') {
          esc.initiatedAt = esc.initiatedAt ?? now;
          esc.transmittedAt = esc.transmittedAt ?? now;
          esc.receivedAt = esc.receivedAt ?? now;
          esc.acknowledgedAt = now;
        }
        return {...issue, escalation: esc};
      }),
      officialNotifications: [
        {
          id: `off_notif_esc_${Date.now()}`,
          type: 'escalation',
          title: `Escalation ${nextState.replace('escalation_', '')}: ${issueId}`,
          message:
            note ||
            `Escalation status updated to ${nextState} by ${official.name}.`,
          complaintId: issueId,
          ward: prevIssue.hierarchy.ward,
          createdAt: now,
          read: false,
        },
        ...prev.officialNotifications,
      ],
      officialAuditLog: [
        {
          id: `aud_${Date.now()}`,
          complaintId: issueId,
          action: 'ESCALATION_UPDATED',
          details: `Escalation transitioned to ${nextState}${authorityLevel ? ` (${authorityLevel})` : ''}.`,
          officialName: official.name,
          employeeId: official.employeeId,
          timestamp: now,
        },
        ...prev.officialAuditLog,
      ],
    }));
    return {ok: true};
  };

  const updateOfficialSlaConfig = (nextConfig: Record<SafetySeverity, number>) => {
    setState((prev) => ({
      ...prev,
      slaConfig: nextConfig,
      officialAuditLog: prev.currentOfficial
        ? [
            {
              id: `aud_${Date.now()}`,
              action: 'SLA_CONFIG_UPDATED',
              details: `Configured SLA hours — Critical: ${nextConfig.critical}h, High: ${nextConfig.high}h, Medium: ${nextConfig.medium}h, Low: ${nextConfig.low}h`,
              officialName: prev.currentOfficial.name,
              employeeId: prev.currentOfficial.employeeId,
              timestamp: new Date().toISOString(),
            },
            ...prev.officialAuditLog,
          ]
        : prev.officialAuditLog,
    }));
  };

  const markOfficialNotificationRead = (notificationId: string) => {
    setState((prev) => ({
      ...prev,
      officialNotifications: prev.officialNotifications.map((n) =>
        n.id === notificationId ? {...n, read: true} : n
      ),
    }));
  };

  const markAllOfficialNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      officialNotifications: prev.officialNotifications.map((n) => ({
        ...n,
        read: true,
      })),
    }));
  };

  const markNotificationRead = (notificationId: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === notificationId ? {...n, read: true} : n
      ),
    }));
  };

  const markAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({...n, read: true})),
    }));
  };

  const resetDemoWorkspace = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_SUBMITTED_KEY);
    setSessionSubmittedIds([]);
    setState((prev) => ({
      appLanguage: prev.appLanguage,
      currentUser: {
        ...INITIAL_DEMO_USER,
        preferredLanguage: prev.appLanguage,
      },
      currentOfficial: null,
      issues: INITIAL_DEMO_ISSUES,
      rewards: INITIAL_DEMO_REWARDS,
      notifications: INITIAL_DEMO_NOTIFICATIONS,
      officialNotifications: INITIAL_OFFICIAL_NOTIFICATIONS,
      officialAuditLog: INITIAL_OFFICIAL_AUDIT_LOG,
      slaConfig: {...DEFAULT_SLA_BY_SEVERITY},
    }));
  };

  const requestLiveLocationAccess = (): Promise<{
    ok: boolean;
    message: string;
  }> => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        updateProfile({
          locationPermission: 'demo_manual',
          locationSourceLabel:
            'Geolocation unavailable — using Bengaluru Ward 80 demo center',
        });
        resolve({
          ok: false,
          message: 'Geolocation is unsupported in this browser.',
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(5));
          const lng = Number(pos.coords.longitude.toFixed(5));
          const accuracy = Math.round(pos.coords.accuracy);
          updateProfile({
            locationPermission: 'granted',
            locationSourceLabel: `Live GPS Enabled (±${accuracy}m)`,
            liveCoordinates: {
              lat,
              lng,
              accuracyMeters: accuracy,
              updatedAt: new Date().toISOString(),
            },
          });
          resolve({
            ok: true,
            message: `Live location enabled (±${accuracy}m). Nearby pins updated around your coordinates.`,
          });
        },
        (err) => {
          updateProfile({
            locationPermission: 'denied',
            locationSourceLabel:
              'Location permission denied — showing Bengaluru Ward 80 demo pins',
          });
          resolve({
            ok: false,
            message:
              err.message ||
              'Location permission was denied. Showing demonstration Bengaluru pins.',
          });
        },
        {enableHighAccuracy: true, timeout: 8000}
      );
    });
  };

  const requestCameraAccess = async (): Promise<{
    ok: boolean;
    message: string;
  }> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      updateProfile({cameraPermission: 'unavailable'});
      return {
        ok: false,
        message: 'Camera hardware API is unavailable in this browser.',
      };
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: 'environment'},
        audio: false,
      });
      stream.getTracks().forEach((t) => t.stop());
      updateProfile({cameraPermission: 'granted'});
      return {
        ok: true,
        message: 'Camera permission enabled for live evidence capture.',
      };
    } catch (err) {
      updateProfile({cameraPermission: 'denied'});
      return {
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : 'Camera permission was denied.',
      };
    }
  };

  return (
    <CitiSolveContext.Provider
      value={{
        appLanguage: state.appLanguage,
        setAppLanguage,
        currentUser,
        currentOfficial,
        issues: state.issues,
        officialJurisdictionIssues,
        sessionSubmittedIds,
        sessionSubmittedIssues,
        rewards: state.rewards,
        notifications: state.notifications,
        officialNotifications: state.officialNotifications,
        unreadOfficialNotificationsCount,
        officialAuditLog: state.officialAuditLog,
        slaConfig: state.slaConfig,
        leaderboard,
        totalAwardedPoints,
        totalPendingPoints,
        unreadNotificationsCount,
        loginAsDemoCitizen,
        loginWithCredentials,
        loginWithOfficialCredentials,
        registerCitizen,
        logout,
        logoutOfficial,
        deleteAccount,
        updateProfile,
        toggleUpvote,
        submitNewComplaint,
        confirmComplaintResolution,
        disputeComplaintResolution,
        markNotificationRead,
        markAllNotificationsRead,
        resetDemoWorkspace,
        requestLiveLocationAccess,
        requestCameraAccess,
        verifyOrRejectOfficialComplaint,
        overrideOfficialComplaintAI,
        assignOfficialDepartmentsAndStaff,
        setOfficialTargetDate,
        addOfficialInternalRemark,
        updateOfficialComplaintProgress,
        resolveOfficialComplaint,
        advanceOfficialEscalation,
        updateOfficialSlaConfig,
        markOfficialNotificationRead,
        markAllOfficialNotificationsRead,
      }}
    >
      {children}
    </CitiSolveContext.Provider>
  );
};

export function useCitiSolve(): CitiSolveContextValue {
  const ctx = useContext(CitiSolveContext);
  if (!ctx) {
    throw new Error('useCitiSolve must be used inside CitiSolveProvider');
  }
  return ctx;
}
