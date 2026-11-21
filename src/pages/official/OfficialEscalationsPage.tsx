import React, {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Settings2,
  ShieldAlert,
} from 'lucide-react';
import {
  ResolutionStatusLabel,
  SeverityLabel,
} from '../../components/common/SeverityAndStatus';
import {DEFAULT_SLA_BY_SEVERITY} from '../../constants/civicDomain';
import {useCitiSolve} from '../../context/CitiSolveContext';
import type {EscalationState, SafetySeverity} from '../../types/civic';
import {
  getEscalationDisplayLabel,
  getIssueDueAt,
  isIssueApproachingDeadline,
  isIssueClosed,
  isIssueOverdue,
  sortIssuesBySafetyAndSla,
} from '../../utils/officialHelpers';

const ESCALATION_FLOW: Array<{
  state: EscalationState;
  label: string;
}> = [
  {state: 'escalation_initiated', label: 'Initiated'},
  {state: 'transmitted', label: 'Transmitted'},
  {state: 'received', label: 'Receipt Confirmed'},
  {state: 'escalation_acknowledged', label: 'Authority Acknowledged'},
];

export const OfficialEscalationsPage: React.FC = () => {
  const {
    officialJurisdictionIssues,
    slaConfig,
    updateOfficialSlaConfig,
    advanceOfficialEscalation,
  } = useCitiSolve();

  const [draftSla, setDraftSla] = useState<Record<SafetySeverity, number>>({...slaConfig});
  const [authorityDraft, setAuthorityDraft] = useState<Record<string, string>>({});
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const attentionIssues = useMemo(() => {
    const filtered = officialJurisdictionIssues.filter(
      (issue) =>
        issue.escalation.state !== 'none' ||
        isIssueOverdue(issue, slaConfig) ||
        isIssueApproachingDeadline(issue, slaConfig) ||
        (issue.safetySeverity === 'critical' && !isIssueClosed(issue))
    );
    return sortIssuesBySafetyAndSla(filtered, slaConfig);
  }, [officialJurisdictionIssues, slaConfig]);

  const overdueCount = officialJurisdictionIssues.filter((i) =>
    isIssueOverdue(i, slaConfig)
  ).length;
  const approachingCount = officialJurisdictionIssues.filter((i) =>
    isIssueApproachingDeadline(i, slaConfig)
  ).length;
  const escalatedCount = officialJurisdictionIssues.filter(
    (i) => i.escalation.state !== 'none' && !isIssueClosed(i)
  ).length;

  const handleSaveSla = (e: React.FormEvent) => {
    e.preventDefault();
    updateOfficialSlaConfig({
      critical: Math.max(1, Number(draftSla.critical) || DEFAULT_SLA_BY_SEVERITY.critical),
      high: Math.max(1, Number(draftSla.high) || DEFAULT_SLA_BY_SEVERITY.high),
      medium: Math.max(1, Number(draftSla.medium) || DEFAULT_SLA_BY_SEVERITY.medium),
      low: Math.max(1, Number(draftSla.low) || DEFAULT_SLA_BY_SEVERITY.low),
    });
    setFeedback('Configurable SLA thresholds updated and logged to audit history.');
  };

  const handleAdvance = (
    issueId: string,
    nextState: EscalationState,
    defaultAuthority?: string
  ) => {
    const res = advanceOfficialEscalation(
      issueId,
      nextState,
      authorityDraft[issueId] || defaultAuthority || 'Zonal Municipal Commissioner',
      noteDraft[issueId] || undefined
    );
    if (res.ok) {
      setFeedback(`Escalation state updated for ${issueId}.`);
    } else if (res.error) {
      setFeedback(res.error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-[#0F172A]">
          Escalation Management &amp; SLA Controls
        </h1>
        <p className="text-xs text-slate-600">
          Monitor overdue &amp; approaching SLA deadlines, configure severity targets, and track explicit 4-state escalation verification without assuming unconfirmed receipt.
        </p>
      </div>

      {feedback && (
        <div
          role="status"
          className="rounded-md border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs font-medium text-[#0F766E]"
        >
          {feedback}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-red-200 bg-red-50/70 p-4">
          <p className="text-[11px] font-semibold uppercase text-red-700">
            Overdue SLA
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-red-800">{overdueCount}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-[11px] font-semibold uppercase text-amber-800">
            Approaching Deadline
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-amber-900">
            {approachingCount}
          </p>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50/70 p-4">
          <p className="text-[11px] font-semibold uppercase text-orange-800">
            Active Escalations
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-orange-900">
            {escalatedCount}
          </p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase text-slate-500">
            Attention Queue
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-[#0F172A]">
            {attentionIssues.length}
          </p>
        </div>
      </div>

      {/* Configurable SLA Form */}
      <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-[#0F766E]" />
            <h2 className="font-display text-base font-bold text-[#0F172A]">
              Configurable SLA Deadlines (Hours by Severity)
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraftSla({...DEFAULT_SLA_BY_SEVERITY});
              updateOfficialSlaConfig({...DEFAULT_SLA_BY_SEVERITY});
              setFeedback('SLA targets reset to municipal defaults.');
            }}
            className="text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer"
          >
            Reset to Defaults
          </button>
        </div>

        <form onSubmit={handleSaveSla} className="grid gap-3 sm:grid-cols-5 items-end">
          {(['critical', 'high', 'medium', 'low'] as SafetySeverity[]).map((sev) => (
            <div key={sev}>
              <label
                htmlFor={`sla-${sev}`}
                className="block text-[11px] font-semibold uppercase text-slate-600 mb-1"
              >
                {sev} (hours)
              </label>
              <input
                id={`sla-${sev}`}
                type="number"
                min={1}
                max={720}
                value={draftSla[sev]}
                onChange={(e) =>
                  setDraftSla((prev) => ({
                    ...prev,
                    [sev]: Number(e.target.value),
                  }))
                }
                className="min-h-9 w-full rounded-md border border-[#E2E8F0] px-3 font-mono text-xs"
              />
            </div>
          ))}
          <button
            type="submit"
            className="min-h-9 rounded-md bg-[#0F766E] px-4 text-xs font-semibold text-white hover:bg-[#115E59] cursor-pointer"
          >
            Apply SLA Rules
          </button>
        </form>
      </section>

      {/* Escalation Queue */}
      <section className="space-y-3">
        <h2 className="font-display text-base font-bold text-[#0F172A]">
          Escalated, Overdue &amp; Critical SLA Queue
        </h2>

        {attentionIssues.length === 0 ? (
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 text-xs text-slate-500">
            No overdue or escalated complaints currently in your jurisdiction.
          </div>
        ) : (
          attentionIssues.map((issue) => {
            const overdue = isIssueOverdue(issue, slaConfig);
            const approaching = isIssueApproachingDeadline(issue, slaConfig);
            const dueAt = getIssueDueAt(issue, slaConfig);
            const escState = issue.escalation.state;
            const currentIdx = ESCALATION_FLOW.findIndex((s) => s.state === escState);

            return (
              <div
                key={issue.id}
                className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0F766E]">
                        {issue.id}
                      </span>
                      <SeverityLabel severity={issue.safetySeverity} />
                      <ResolutionStatusLabel status={issue.status} />
                      {overdue && (
                        <span className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
                          <AlertTriangle className="h-3 w-3" />
                          OVERDUE
                        </span>
                      )}
                      {!overdue && approaching && (
                        <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                          <Clock className="h-3 w-3" />
                          APPROACHING SLA
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-sm font-bold text-[#0F172A]">
                      {issue.title}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {issue.approximateArea} · {issue.assignedDepartments.join(' + ')} ·{' '}
                      <span className="font-mono">
                        Due {dueAt.toLocaleString('en-IN')}
                      </span>
                    </p>
                  </div>

                  <Link
                    to={`/official/complaints/${issue.id}`}
                    className="inline-flex min-h-9 items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0F766E] hover:bg-slate-100"
                  >
                    <span>Open Dossier</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* 4-State Escalation Verification Track */}
                <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F172A]">
                      <ShieldAlert className="h-4 w-4 text-[#0F766E]" />
                      Escalation Status: {getEscalationDisplayLabel(escState)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Receiving Authority:{' '}
                      <strong>
                        {issue.escalation.nextAuthorityLevel ??
                          'Higher Municipal Escalation Desk'}
                      </strong>
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-4">
                    {ESCALATION_FLOW.map((step, idx) => {
                      const reached = currentIdx >= idx;
                      const ts =
                        step.state === 'escalation_initiated'
                          ? issue.escalation.initiatedAt
                          : step.state === 'transmitted'
                            ? issue.escalation.transmittedAt
                            : step.state === 'received'
                              ? issue.escalation.receivedAt
                              : issue.escalation.acknowledgedAt;

                      return (
                        <div
                          key={step.state}
                          className={`rounded border px-2.5 py-2 text-[11px] ${
                            reached
                              ? 'border-[#0F766E]/40 bg-teal-50/70 text-[#0F172A]'
                              : 'border-[#E2E8F0] bg-white text-slate-400'
                          }`}
                        >
                          <p className="font-bold">{step.label}</p>
                          <p className="font-mono mt-0.5">
                            {ts ? new Date(ts).toLocaleString('en-IN') : 'Pending confirmation'}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {issue.escalation.reason && (
                    <p className="text-xs text-slate-600">
                      Reason: {issue.escalation.reason}
                    </p>
                  )}

                  {/* Explicit Transition Controls */}
                  {escState !== 'escalation_acknowledged' && (
                    <div className="grid gap-2 pt-1 sm:grid-cols-3">
                      <input
                        type="text"
                        value={authorityDraft[issue.id] ?? ''}
                        onChange={(e) =>
                          setAuthorityDraft((prev) => ({
                            ...prev,
                            [issue.id]: e.target.value,
                          }))
                        }
                        placeholder={
                          issue.escalation.nextAuthorityLevel ??
                          'Receiving authority (e.g., Zonal Commissioner)'
                        }
                        className="min-h-8 rounded border border-[#E2E8F0] bg-white px-2.5 text-xs"
                      />
                      <input
                        type="text"
                        value={noteDraft[issue.id] ?? ''}
                        onChange={(e) =>
                          setNoteDraft((prev) => ({
                            ...prev,
                            [issue.id]: e.target.value,
                          }))
                        }
                        placeholder="Escalation log note (optional)..."
                        className="min-h-8 rounded border border-[#E2E8F0] bg-white px-2.5 text-xs"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {escState === 'none' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleAdvance(
                                issue.id,
                                'escalation_initiated',
                                issue.escalation.nextAuthorityLevel
                              )
                            }
                            className="min-h-8 flex-1 rounded bg-[#0F766E] px-3 text-xs font-semibold text-white hover:bg-[#115E59] cursor-pointer"
                          >
                            Initiate Escalation
                          </button>
                        )}
                        {escState === 'escalation_initiated' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleAdvance(
                                issue.id,
                                'transmitted',
                                issue.escalation.nextAuthorityLevel
                              )
                            }
                            className="min-h-8 flex-1 rounded bg-[#0F766E] px-3 text-xs font-semibold text-white hover:bg-[#115E59] cursor-pointer"
                          >
                            Mark Transmitted
                          </button>
                        )}
                        {escState === 'transmitted' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleAdvance(
                                issue.id,
                                'received',
                                issue.escalation.nextAuthorityLevel
                              )
                            }
                            className="min-h-8 flex-1 rounded bg-[#0F766E] px-3 text-xs font-semibold text-white hover:bg-[#115E59] cursor-pointer"
                          >
                            Confirm Receipt
                          </button>
                        )}
                        {escState === 'received' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleAdvance(
                                issue.id,
                                'escalation_acknowledged',
                                issue.escalation.nextAuthorityLevel
                              )
                            }
                            className="min-h-8 flex-1 rounded bg-[#0F766E] px-3 text-xs font-semibold text-white hover:bg-[#115E59] cursor-pointer"
                          >
                            Mark Authority Acknowledged
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
