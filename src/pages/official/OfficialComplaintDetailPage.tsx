import React, {useEffect, useMemo, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  ShieldAlert,
  Upload,
  XCircle,
} from 'lucide-react';
import {CivicImage} from '../../components/common/CivicImage';
import {
  ResolutionStatusLabel,
  SeverityLabel,
} from '../../components/common/SeverityAndStatus';
import {SolvedSuccessModal} from '../../components/official/SolvedSuccessModal';
import {
  CATEGORY_MAP,
  ISSUE_CATEGORIES,
} from '../../constants/civicDomain';
import {useCitiSolve} from '../../context/CitiSolveContext';
import type {IssueCategoryId, SafetySeverity} from '../../types/civic';
import {getIssueDueAt, isIssueOverdue} from '../../utils/officialHelpers';

export const OfficialComplaintDetailPage: React.FC = () => {
  const {id} = useParams<{id: string}>();
  const navigate = useNavigate();
  const {
    currentOfficial,
    officialJurisdictionIssues,
    slaConfig,
    verifyOrRejectOfficialComplaint,
    overrideOfficialComplaintAI,
    setOfficialTargetDate,
    addOfficialInternalRemark,
    updateOfficialComplaintProgress,
    resolveOfficialComplaint,
  } = useCitiSolve();

  const issue = officialJurisdictionIssues.find((i) => i.id === id);

  const [actionMessage, setActionMessage] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  // Action states
  const [verifyReason, setVerifyReason] = useState('');
  const [overrideCategory, setOverrideCategory] = useState<IssueCategoryId>(
    issue?.category ?? 'potholes_roads'
  );
  const [overrideSeverity, setOverrideSeverity] = useState<SafetySeverity>(
    issue?.safetySeverity ?? 'medium'
  );
  const [overrideReason, setOverrideReason] = useState('');

  const [targetDate, setTargetDate] = useState(
    issue?.targetResolutionDate ?? ''
  );
  const [internalRemarkText, setInternalRemarkText] = useState('');
  const [progressNote, setProgressNote] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [evidencePhotoUrl, setEvidencePhotoUrl] = useState<string>('');
  const [solvedModalOpen, setSolvedModalOpen] = useState(false);

  useEffect(() => {
    setActionMessage(null);
    setVerifyReason('');
    setOverrideCategory(issue?.category ?? 'potholes_roads');
    setOverrideSeverity(issue?.safetySeverity ?? 'medium');
    setOverrideReason('');
    setTargetDate(issue?.targetResolutionDate ?? '');
    setInternalRemarkText('');
    setProgressNote('');
    setResolutionNote('');
    setEvidencePhotoUrl('');
    setSolvedModalOpen(false);
  }, [issue?.id]);

  const potentialDuplicates = useMemo(() => {
    if (!issue) return [];
    return officialJurisdictionIssues.filter(
      (other) =>
        other.id !== issue.id &&
        (other.category === issue.category ||
          other.id === issue.aiAnalysis.duplicateCandidateId)
    );
  }, [issue, officialJurisdictionIssues]);

  if (!issue || !currentOfficial) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-8 text-center">
        <h1 className="font-display text-lg font-bold text-[#0F172A]">
          Complaint Unavailable in Your Jurisdiction
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          Complaint <span className="font-mono">{id}</span> was not found or lies outside your authorized municipal ward/department scope.
        </p>
        <Link
          to="/official/complaints"
          className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-md bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#115E59]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Complaint Management</span>
        </Link>
      </div>
    );
  }

  const notifyResult = (res: {ok: boolean; error?: string}, okText: string) => {
    if (!res.ok) {
      setActionMessage({type: 'err', text: res.error ?? 'Action failed.'});
    } else {
      setActionMessage({type: 'ok', text: okText});
    }
  };

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEvidencePhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const dueDate = getIssueDueAt(issue, slaConfig);
  const overdue = isIssueOverdue(issue, slaConfig);
  const isWardOfficer = currentOfficial.roleLevel === 'ward_officer';
  const backPath = isWardOfficer ? '/official/ward-track' : '/official/complaints';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={backPath}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0F172A]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>
            {isWardOfficer ? 'Back to Ward Track' : 'Back to Complaint Management'}
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-slate-500">
          <span>ID: {issue.id}</span>
          <span>·</span>
          <span>Submitted {new Date(issue.createdAt).toLocaleString('en-IN')}</span>
          <span>·</span>
          <span className={overdue ? 'font-bold text-red-700' : ''}>
            SLA Due: {dueDate.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {actionMessage && (
        <div
          role="status"
          className={`rounded-md border px-4 py-2.5 text-xs font-medium ${
            actionMessage.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {issue.citizenDispute && (
        <div className="rounded-lg border border-orange-300 bg-orange-50 p-4 text-xs text-orange-950 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-orange-700" />
            <span>Citizen Disputed Previous Resolution — Returned for Review</span>
          </p>
          <p>Disputed by {issue.citizenDispute.disputedByAlias}: &ldquo;{issue.citizenDispute.reason}&rdquo;</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Complete Complaint Inspection */}
        <div className="space-y-5 lg:col-span-7">
          <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
            <CivicImage
              src={issue.photoUrl}
              alt={issue.title}
              className="h-64 w-full object-cover sm:h-80"
            />
            <div className="p-5 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityLabel severity={issue.safetySeverity} />
                <ResolutionStatusLabel status={issue.status} />
                {issue.officialVerification && (
                  <span className="rounded border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 text-xs font-semibold text-slate-700">
                    Verification: {issue.officialVerification.state.toUpperCase()}
                  </span>
                )}
              </div>

              <h1 className="font-display text-xl font-bold text-[#0F172A]">
                {issue.title}
              </h1>

              <p className="text-sm leading-relaxed text-slate-700">
                {issue.description}
              </p>

              <div className="grid gap-2 border-t border-[#E2E8F0] pt-3 text-xs text-slate-600 sm:grid-cols-2">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#0F766E]" />
                  {issue.approximateArea}, {issue.hierarchy.ward}
                </span>
                <span>
                  Community Upvotes:{' '}
                  <strong className="font-mono text-[#0F172A]">
                    {issue.upvotedByUserIds.length}
                  </strong>
                </span>
                <span>
                  Assigned Dept:{' '}
                  <strong className="text-[#0F172A]">
                    {issue.assignedDepartments.join(' + ') || 'Unassigned'}
                  </strong>
                </span>
                <span>
                  Assigned Staff:{' '}
                  <strong className="text-[#0F172A]">
                    {issue.assignedStaffName ?? 'Unassigned'}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* AI Assessment & Override History */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                AI Analysis &amp; Audit Overrides
              </h2>
              <span className="font-mono text-xs text-slate-500">
                Confidence: {Math.round(issue.aiAnalysis.confidence * 100)}%
              </span>
            </div>

            <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs space-y-1.5">
              <p>
                <strong>AI Suggested Category:</strong>{' '}
                {CATEGORY_MAP[issue.aiAnalysis.suggestedCategory].label} ·{' '}
                <strong>Model/Rule:</strong> {issue.aiAnalysis.modelOrRule}
              </p>
              <p className="text-slate-700">
                <strong>AI Explanation:</strong>{' '}
                {issue.aiAnalysis.classificationExplanation}
              </p>
              <p className="text-slate-700">
                <strong>Severity Rationale:</strong> {issue.severityReason}
              </p>
            </div>

            {issue.aiOverrideHistory && issue.aiOverrideHistory.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#0F172A]">
                  Recorded Official Overrides
                </p>
                {issue.aiOverrideHistory.map((ovr) => (
                  <div
                    key={ovr.id}
                    className="rounded border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-slate-800"
                  >
                    <p className="font-semibold">
                      {ovr.field.toUpperCase()}: {ovr.previousValue} &rarr;{' '}
                      {ovr.newValue}
                    </p>
                    <p>Reason: {ovr.reason}</p>
                    <p className="text-[11px] text-slate-500">
                      By {ovr.officialName} ({ovr.employeeId}) ·{' '}
                      {new Date(ovr.timestamp).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Potential Duplicate Complaints */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-2.5">
            <h2 className="font-display text-base font-bold text-[#0F172A]">
              Potential Duplicate Complaints in Ward ({potentialDuplicates.length})
            </h2>
            {potentialDuplicates.length === 0 ? (
              <p className="text-xs text-slate-500">
                No overlapping complaints detected in this ward.
              </p>
            ) : (
              <div className="space-y-2">
                {potentialDuplicates.map((dup) => (
                  <Link
                    key={dup.id}
                    to={`/official/complaints/${dup.id}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-[#E2E8F0] p-2.5 text-xs hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <span className="font-mono font-semibold text-[#0F766E]">
                        {dup.id}
                      </span>{' '}
                      <span className="font-medium text-[#0F172A]">
                        {dup.title}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {dup.approximateArea} · {dup.upvotedByUserIds.length} upvotes
                      </p>
                    </div>
                    <ResolutionStatusLabel status={dup.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Assignment & Reassignment History */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-2.5">
            <h2 className="font-display text-base font-bold text-[#0F172A]">
              Department &amp; Staff Assignment History
            </h2>
            {!issue.assignmentHistory || issue.assignmentHistory.length === 0 ? (
              <p className="text-xs text-slate-500">
                Initial routing: {issue.assignedDepartments.join(' + ') || 'Unassigned'}
                {issue.assignedStaffName ? ` · Staff: ${issue.assignedStaffName}` : ''}.
              </p>
            ) : (
              <div className="space-y-2">
                {issue.assignmentHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 text-xs"
                  >
                    <p className="font-semibold text-[#0F172A]">
                      {entry.departments.join(' + ')}
                      {entry.staffName ? ` · Staff: ${entry.staffName}` : ''}
                    </p>
                    <p className="text-slate-600">{entry.note}</p>
                    <p className="mt-1 font-mono text-[11px] text-slate-400">
                      {entry.assignedBy} · {new Date(entry.timestamp).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Private Internal Remarks (Hidden from Citizen Views) */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-[#0F172A] flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-[#0F766E]" />
                <span>Internal Official Remarks (Private)</span>
              </h2>
              <span className="text-[11px] text-slate-500">
                Never visible to citizens
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={internalRemarkText}
                onChange={(e) => setInternalRemarkText(e.target.value)}
                placeholder="Add confidential field inspection or engineering note..."
                className="min-h-10 flex-1 rounded-md border border-[#E2E8F0] px-3 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  const res = addOfficialInternalRemark(
                    issue.id,
                    internalRemarkText
                  );
                  if (res.ok) setInternalRemarkText('');
                  notifyResult(res, 'Internal remark recorded.');
                }}
                className="min-h-10 rounded-md bg-[#0F766E] px-3.5 text-xs font-semibold text-white hover:bg-[#115E59] cursor-pointer"
              >
                Save Remark
              </button>
            </div>

            <div className="space-y-2">
              {(issue.internalRemarks ?? []).length === 0 ? (
                <p className="text-xs text-slate-500">No internal remarks yet.</p>
              ) : (
                issue.internalRemarks?.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 text-xs"
                  >
                    <p className="text-[#0F172A]">{r.note}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {r.authorName} ({r.authorDesignation}) ·{' '}
                      {new Date(r.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-[#0F172A]">
              Status Timeline &amp; Resolution Evidence
            </h2>
            {issue.resolutionEvidence && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs space-y-2">
                <p className="font-semibold text-emerald-900">
                  Resolution Evidence Submitted by {issue.resolutionEvidence.resolvedBy}
                </p>
                <p className="text-emerald-800">{issue.resolutionEvidence.note}</p>
                {issue.resolutionEvidence.photoUrl && (
                  <img
                    src={issue.resolutionEvidence.photoUrl}
                    alt="After-work resolution evidence"
                    className="h-36 w-full max-w-xs rounded object-cover border border-emerald-200"
                  />
                )}
              </div>
            )}
            <ol className="space-y-2.5">
              {issue.timeline.map((ev, idx) => (
                <li
                  key={`${ev.stage}_${idx}`}
                  className="flex items-start gap-2.5 border-b border-[#E2E8F0] pb-2 last:border-b-0 text-xs"
                >
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0F766E]" />
                  <div>
                    <p className="font-semibold text-[#0F172A]">
                      {ev.stage.replace(/_/g, ' ').toUpperCase()}
                    </p>
                    <p className="text-slate-600">{ev.note}</p>
                    <p className="font-mono text-[11px] text-slate-400">
                      {new Date(ev.timestamp).toLocaleString('en-IN')}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right: Official Action Controls */}
        <aside className="space-y-4 lg:col-span-5">
          {/* 1. Verify / Reject */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 space-y-3">
            <h2 className="font-display text-sm font-bold text-[#0F172A]">
              1. Verify or Reject Complaint
            </h2>
            <input
              type="text"
              value={verifyReason}
              onChange={(e) => setVerifyReason(e.target.value)}
              placeholder="Verification note or mandatory rejection reason..."
              className="min-h-9 w-full rounded-md border border-[#E2E8F0] px-3 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  notifyResult(
                    verifyOrRejectOfficialComplaint(
                      issue.id,
                      'verified',
                      verifyReason
                    ),
                    'Complaint verified.'
                  )
                }
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-[#0F766E] px-3 text-xs font-semibold text-white hover:bg-[#115E59] cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Verify</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  notifyResult(
                    verifyOrRejectOfficialComplaint(
                      issue.id,
                      'rejected',
                      verifyReason
                    ),
                    'Complaint rejected with audit reason.'
                  )
                }
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100 cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Reject</span>
              </button>
            </div>
          </div>

          {/* 2. Correct Category / Severity (AI Override Audit) */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 space-y-3">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-[#0F766E]" />
              <h2 className="font-display text-sm font-bold text-[#0F172A]">
                2. Correct Category / Severity (AI Override)
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                aria-label="Override category"
                value={overrideCategory}
                onChange={(e) =>
                  setOverrideCategory(e.target.value as IssueCategoryId)
                }
                className="min-h-9 rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs"
              >
                {ISSUE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.shortLabel}
                  </option>
                ))}
              </select>
              <select
                aria-label="Override severity"
                value={overrideSeverity}
                onChange={(e) =>
                  setOverrideSeverity(e.target.value as SafetySeverity)
                }
                className="min-h-9 rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <input
              type="text"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Mandatory override reason (recorded in audit log)..."
              className="min-h-9 w-full rounded-md border border-[#E2E8F0] px-3 text-xs"
            />
            <button
              type="button"
              onClick={() => {
                const res = overrideOfficialComplaintAI(issue.id, {
                  category: overrideCategory,
                  severity: overrideSeverity,
                  reason: overrideReason,
                });
                if (res.ok) setOverrideReason('');
                notifyResult(res, 'AI override recorded in audit trail.');
              }}
              className="min-h-9 w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0F172A] hover:bg-slate-100 cursor-pointer"
            >
              Save Official Override
            </button>
          </div>

          {/* 3. Auto-Assigned Department & Target Resolution Date */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 space-y-3">
            <h2 className="font-display text-sm font-bold text-[#0F172A]">
              3. Auto-Assigned Department &amp; Target Date
            </h2>

            <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs space-y-1">
              <p className="text-slate-500">Auto-Routed Municipal Department(s)</p>
              <p className="font-bold text-[#0F766E]">
                {issue.assignedDepartments.join(' + ')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
              <input
                type="date"
                aria-label="Target resolution date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="min-h-9 flex-1 rounded-md border border-[#E2E8F0] px-2.5 text-xs"
              />
              <button
                type="button"
                onClick={() =>
                  notifyResult(
                    setOfficialTargetDate(issue.id, targetDate),
                    'Target resolution date updated.'
                  )
                }
                className="min-h-9 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0F172A] hover:bg-slate-100 cursor-pointer"
              >
                Set Date
              </button>
            </div>
          </div>

          {/* 4. Update Progress & Resolution Evidence */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 space-y-3">
            <h2 className="font-display text-sm font-bold text-[#0F172A]">
              4. Progress &amp; Resolution Workflow
            </h2>

            <input
              type="text"
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
              placeholder="Public field update note..."
              className="min-h-9 w-full rounded-md border border-[#E2E8F0] px-3 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const res = updateOfficialComplaintProgress(
                    issue.id,
                    'received_by_department',
                    progressNote
                  );
                  if (res.ok) setProgressNote('');
                  notifyResult(res, 'Marked Received by Department.');
                }}
                className="min-h-9 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 text-xs font-semibold text-[#0F172A] hover:bg-slate-100 cursor-pointer"
              >
                Mark Dept Received
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = updateOfficialComplaintProgress(
                    issue.id,
                    'under_process',
                    progressNote
                  );
                  if (res.ok) setProgressNote('');
                  notifyResult(res, 'Status moved to Under Process.');
                }}
                className="min-h-9 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 text-xs font-semibold text-[#0F172A] hover:bg-slate-100 cursor-pointer"
              >
                Mark Under Process
              </button>
            </div>

            <div className="border-t border-[#E2E8F0] pt-3 space-y-2.5">
              <p className="text-xs font-semibold text-[#0F172A]">
                Complete Work (Moves to Awaiting Citizen Confirmation)
              </p>
              <textarea
                rows={2}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Mandatory resolution summary (e.g., Replaced damaged junction box cover and insulated cables)..."
                className="w-full rounded-md border border-[#E2E8F0] p-2.5 text-xs"
              />

              <label className="flex items-center gap-2 rounded-md border border-dashed border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-100">
                <Upload className="h-4 w-4 text-[#0F766E]" />
                <span>
                  {evidencePhotoUrl
                    ? 'After-work evidence attached'
                    : 'Upload after-work resolution photo (Optional)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEvidenceUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  const res = resolveOfficialComplaint(issue.id, {
                    resolutionNote,
                    evidencePhotoUrl: evidencePhotoUrl || undefined,
                  });
                  if (res.ok) {
                    setResolutionNote('');
                    setEvidencePhotoUrl('');
                    if (isWardOfficer) {
                      setSolvedModalOpen(true);
                    }
                  }
                  notifyResult(
                    res,
                    'Marked Solved — Now visible on Citizen and Municipal Officer dashboards.'
                  );
                }}
                className="min-h-10 w-full rounded-md bg-[#0F9D58] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B8043] cursor-pointer"
              >
                Mark as Solved
              </button>
            </div>
          </div>
        </aside>
      </div>

      <SolvedSuccessModal
        open={solvedModalOpen}
        complaintId={issue.id}
        title={issue.title}
        departments={issue.assignedDepartments}
        onClose={() => setSolvedModalOpen(false)}
        onViewSolved={() => {
          setSolvedModalOpen(false);
          navigate('/official/ward-solved');
        }}
      />
    </div>
  );
};
