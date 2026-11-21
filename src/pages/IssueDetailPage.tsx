import React, {useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
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
  COMPLAINT_LIFECYCLE_STAGES,
  SEVERITY_CONFIG,
} from '../constants/civicDomain';
import {useCitiSolve} from '../context/CitiSolveContext';

export const IssueDetailPage: React.FC = () => {
  const {id} = useParams<{id: string}>();
  const {
    currentUser,
    issues,
    toggleUpvote,
    confirmComplaintResolution,
    disputeComplaintResolution,
  } = useCitiSolve();

  const [feedback, setFeedback] = useState<string | null>(null);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeError, setDisputeError] = useState<string | null>(null);

  const issue = issues.find((i) => i.id === id);

  if (!issue) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-8 text-center">
        <h1 className="font-display text-xl font-bold text-slate-900">
          Complaint Not Found
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          The complaint ID <span className="font-mono">{id}</span> could not be found in your current demonstration session.
        </p>
        <Link
          to="/home"
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Home Map</span>
        </Link>
      </div>
    );
  }

  const hasVoted = currentUser
    ? issue.upvotedByUserIds.includes(currentUser.id)
    : false;
  const currentStageIdx = COMPLAINT_LIFECYCLE_STAGES.findIndex(
    (s) => s.id === issue.status
  );

  const handleUpvote = () => {
    const res = toggleUpvote(issue.id);
    if (res.action === 'added') {
      setFeedback(
        res.pointsAwarded > 0
          ? `Support vote added (+${res.pointsAwarded} participation points). Safety severity remains unchanged.`
          : 'Support vote recorded. One active vote allowed per account.'
      );
    } else if (res.action === 'removed') {
      setFeedback('Support vote removed.');
    }
    window.setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/home"
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Citizen Map</span>
        </Link>
        <span className="font-mono text-xs text-slate-500">
          Dossier ID: {issue.id} · Reported {new Date(issue.createdAt).toLocaleDateString('en-IN')}
        </span>
      </div>

      {feedback && (
        <div
          role="status"
          className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-medium text-indigo-800"
        >
          {feedback}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <CivicImage
              src={issue.photoUrl}
              alt={issue.title}
              className="h-72 w-full object-cover sm:h-96"
            />
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityLabel severity={issue.safetySeverity} />
                <ResolutionStatusLabel status={issue.status} />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CategoryIcon category={issue.category} className="h-4 w-4 text-indigo-600" />
                <span>{CATEGORY_MAP[issue.category].label}</span>
                <span aria-hidden="true">·</span>
                <span>Reported by {issue.reporterAlias}</span>
              </div>

              <h1 className="font-display text-2xl font-bold text-slate-900">
                {issue.title}
              </h1>

              <p className="text-sm leading-relaxed text-slate-700">
                {issue.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {issue.approximateArea}, {issue.hierarchy.ward}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  {issue.assignedDepartments.join(' + ')}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              AI Triage &amp; Safety Explanation
            </h2>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
              <p className="font-semibold text-slate-800">
                Source: {issue.aiAnalysis.modelOrRule}
              </p>
              <p className="text-slate-700">
                <strong>Safety Severity Reasoning:</strong> {issue.severityReason}
              </p>
              <p className="text-slate-700">
                <strong>Routing Explanation:</strong>{' '}
                {issue.aiAnalysis.classificationExplanation}
              </p>
              <p className="text-slate-500">
                Confidence:{' '}
                <span className="font-mono tabular-nums">
                  {Math.round(issue.aiAnalysis.confidence * 100)}%
                </span>{' '}
                {issue.aiAnalysis.needsHumanReview
                  ? '· Flagged for human verification'
                  : '· Standard confidence'}
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-6 lg:col-span-5">
          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Community Support (Separate from Safety)
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  One active upvote per account. Upvotes measure community impact and never downgrade or inflate physical safety severity.
                </p>
              </div>
              <span className="font-mono text-2xl font-bold text-indigo-600 tabular-nums">
                {issue.upvotedByUserIds.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleUpvote}
              className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                hasVoted
                  ? 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>
                {hasVoted
                  ? 'Remove Your Support Vote'
                  : 'Support / Upvote This Issue'}
              </span>
            </button>

            {issue.status === 'resolved_awaiting_confirmation' && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-2.5">
                <p className="text-xs font-semibold text-indigo-900">
                  Department marked work complete — citizen confirmation requested
                </p>
                {issue.resolutionEvidence && (
                  <div className="rounded-lg border border-indigo-100 bg-white p-2.5 text-xs text-slate-700 space-y-1.5">
                    <p className="font-semibold text-slate-900">
                      Official Resolution Note:
                    </p>
                    <p>{issue.resolutionEvidence.note}</p>
                    {issue.resolutionEvidence.photoUrl && (
                      <img
                        src={issue.resolutionEvidence.photoUrl}
                        alt="Department resolution evidence"
                        className="h-28 w-full rounded object-cover"
                      />
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => confirmComplaintResolution(issue.id)}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirm Issue Is Resolved (+10 pts)</span>
                </button>

                {!showDisputeForm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDisputeForm(true);
                      setDisputeError(null);
                    }}
                    className="flex min-h-10 w-full items-center justify-center rounded-xl border border-orange-300 bg-white px-4 py-2 text-xs font-semibold text-orange-800 hover:bg-orange-50 cursor-pointer"
                  >
                    Dispute Resolution (Issue Persists)
                  </button>
                ) : (
                  <div className="space-y-2 rounded-lg border border-orange-200 bg-white p-3">
                    <label
                      htmlFor="citizen-dispute-reason"
                      className="block text-[11px] font-semibold text-slate-700"
                    >
                      Why is this issue not resolved?
                    </label>
                    <textarea
                      id="citizen-dispute-reason"
                      rows={2}
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      placeholder="Describe what remains unresolved on-site..."
                      className="w-full rounded-md border border-slate-200 p-2 text-xs"
                    />
                    {disputeError && (
                      <p className="text-[11px] font-medium text-red-600">
                        {disputeError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (disputeReason.trim().length < 5) {
                            setDisputeError(
                              'Please enter a brief explanation (at least 5 characters).'
                            );
                            return;
                          }
                          disputeComplaintResolution(issue.id, disputeReason);
                          setShowDisputeForm(false);
                          setDisputeReason('');
                          setFeedback(
                            'Dispute submitted. Complaint has been returned to the municipal department for review.'
                          );
                        }}
                        className="min-h-9 flex-1 rounded-lg bg-orange-600 px-3 text-xs font-semibold text-white hover:bg-orange-700 cursor-pointer"
                      >
                        Submit Dispute
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDisputeForm(false)}
                        className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {issue.citizenDispute && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-orange-900">
                <p className="font-semibold">
                  Resolution Disputed — Returned to Department Review
                </p>
                <p className="mt-0.5 text-orange-800">
                  &ldquo;{issue.citizenDispute.reason}&rdquo;
                </p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-slate-900">
                Lifecycle &amp; Escalation Progress
              </h2>
              <span className="font-mono text-xs text-slate-500">
                {SEVERITY_CONFIG[issue.safetySeverity].slaText}
              </span>
            </div>

            {issue.escalation.state !== 'none' && (
              <div
                className={`rounded-md border p-3 text-xs space-y-1 ${
                  issue.escalation.state === 'escalation_acknowledged'
                    ? 'border-sky-200 bg-sky-50 text-sky-900'
                    : 'border-orange-200 bg-orange-50 text-orange-900'
                }`}
              >
                <p className="font-semibold flex items-center gap-1.5">
                  {issue.escalation.state === 'escalation_acknowledged' ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <span>
                    {issue.escalation.state === 'escalation_acknowledged'
                      ? 'Escalation Acknowledged by Higher Authority'
                      : 'Escalation Initiated — Awaiting Authority Acknowledgement'}
                  </span>
                </p>
                <p>Authority: {issue.escalation.nextAuthorityLevel}</p>
                <p>{issue.escalation.reason}</p>
              </div>
            )}

            <ol className="space-y-3">
              {COMPLAINT_LIFECYCLE_STAGES.map((stage, idx) => {
                const recorded = issue.timeline.find((t) => t.stage === stage.id);
                const reached = idx <= currentStageIdx;
                return (
                  <li key={stage.id} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold ${
                        reached
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {stage.stepNumber}
                    </div>
                    <div className="min-w-0 flex-1 border-b border-slate-100 pb-2.5 last:border-b-0">
                      <p
                        className={`text-xs font-semibold ${
                          reached ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {stage.label}
                      </p>
                      {recorded ? (
                        <>
                          <p className="mt-0.5 text-xs text-slate-600">
                            {recorded.note}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-slate-400 tabular-nums">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(recorded.timestamp).toLocaleString('en-IN')}
                            </span>
                          </p>
                        </>
                      ) : (
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Not yet recorded
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
};
