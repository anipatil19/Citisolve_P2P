import {DEFAULT_SLA_BY_SEVERITY} from '../constants/civicDomain';
import type {CivicIssue, OfficialUser, SafetySeverity} from '../types/civic';

const SEVERITY_RANK: Record<SafetySeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function isIssueClosed(issue: CivicIssue): boolean {
  return (
    issue.status === 'resolved_awaiting_confirmation' ||
    issue.status === 'resolution_confirmed'
  );
}

export function getEffectiveSlaHours(
  issue: CivicIssue,
  slaConfig?: Record<SafetySeverity, number>
): number {
  return slaConfig?.[issue.safetySeverity] ?? issue.slaTargetHours ?? DEFAULT_SLA_BY_SEVERITY[issue.safetySeverity];
}

export function getIssueDueAt(
  issue: CivicIssue,
  slaConfig?: Record<SafetySeverity, number>
): Date {
  if (issue.targetResolutionDate) {
    const parsed = new Date(`${issue.targetResolutionDate}T23:59:59`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  const slaHours = getEffectiveSlaHours(issue, slaConfig);
  return new Date(new Date(issue.createdAt).getTime() + slaHours * 60 * 60 * 1000);
}

export function isIssueOverdue(
  issue: CivicIssue,
  slaConfig?: Record<SafetySeverity, number>,
  nowMs: number = Date.now()
): boolean {
  if (isIssueClosed(issue)) return false;
  return nowMs > getIssueDueAt(issue, slaConfig).getTime();
}

export function isIssueApproachingDeadline(
  issue: CivicIssue,
  slaConfig?: Record<SafetySeverity, number>,
  nowMs: number = Date.now()
): boolean {
  if (isIssueClosed(issue)) return false;
  const remainingMs = getIssueDueAt(issue, slaConfig).getTime() - nowMs;
  const thresholdMs = issue.safetySeverity === 'critical' ? 2 * 3600 * 1000 : 12 * 3600 * 1000;
  return remainingMs > 0 && remainingMs <= thresholdMs;
}

export function getComplaintAgeLabel(createdAt: string): string {
  const diffMs = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) {
    const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${mins}m`;
  }
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

export function sortIssuesBySafetyAndSla(
  items: CivicIssue[],
  slaConfig?: Record<SafetySeverity, number>
): CivicIssue[] {
  const nowMs = Date.now();
  return [...items].sort((a, b) => {
    const aClosed = isIssueClosed(a) ? 1 : 0;
    const bClosed = isIssueClosed(b) ? 1 : 0;
    if (aClosed !== bClosed) return aClosed - bClosed;

    const sevDiff = SEVERITY_RANK[b.safetySeverity] - SEVERITY_RANK[a.safetySeverity];
    if (sevDiff !== 0) return sevDiff;

    const aOverdue = isIssueOverdue(a, slaConfig, nowMs) ? 1 : 0;
    const bOverdue = isIssueOverdue(b, slaConfig, nowMs) ? 1 : 0;
    if (aOverdue !== bOverdue) return bOverdue - aOverdue;

    const dueDiff =
      getIssueDueAt(a, slaConfig).getTime() - getIssueDueAt(b, slaConfig).getTime();
    if (dueDiff !== 0) return dueDiff;

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function isIssueInOfficialJurisdiction(
  issue: CivicIssue,
  official: OfficialUser | null
): boolean {
  if (!official) return false;
  if (issue.hierarchy.municipality !== official.municipality) return false;
  if (!official.authorizedWards.includes(issue.hierarchy.ward)) return false;

  if (official.roleLevel === 'department_officer') {
    const dept = official.department.toLowerCase();
    return issue.assignedDepartments.some((assigned) => {
      const lower = assigned.toLowerCase();
      if (lower === dept) return true;
      if (dept.includes('electrical') && lower.includes('electrical')) return true;
      return false;
    });
  }

  return true;
}

export function getEscalationDisplayLabel(state: CivicIssue['escalation']['state']): string {
  switch (state) {
    case 'escalation_initiated':
      return 'Initiated';
    case 'transmitted':
      return 'Transmitted';
    case 'received':
      return 'Receipt Confirmed';
    case 'escalation_acknowledged':
      return 'Acknowledged by Authority';
    default:
      return 'Not Escalated';
  }
}
