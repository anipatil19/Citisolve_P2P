import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Clock,
  FileCheck2,
  MapPin,
  ShieldCheck,
  ThumbsUp,
  Wrench,
} from 'lucide-react';
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

type StatusFilter = 'all' | 'submitted' | 'in_progress' | 'resolved' | 'escalated';

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  if (mins < 60) return mins === 1 ? '1 min ago' : `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

export const StatusDashboardPage: React.FC = () => {
  const {
    currentUser,
    issues,
    sessionSubmittedIds,
    sessionSubmittedIssues,
    unreadNotificationsCount,
    confirmComplaintResolution,
  } = useCitiSolve();
  const [searchParams, setSearchParams] = useSearchParams();
  const trackerRef = useRef<HTMLElement | null>(null);

  const initialFilter = (searchParams.get('filter') as StatusFilter) || 'all';
  const initialTrackId = searchParams.get('track');

  const [filter, setFilter] = useState<StatusFilter>(initialFilter);
  const [scope, setScope] = useState<'my_reports' | 'all_ward'>(
    initialFilter === 'escalated' ? 'all_ward' : 'my_reports'
  );
  const [trackedIssueId, setTrackedIssueId] = useState<string | null>(
    initialTrackId
  );

  useEffect(() => {
    const paramFilter = searchParams.get('filter') as StatusFilter | null;
    const paramTrack = searchParams.get('track');
    if (paramFilter) {
      setFilter(paramFilter);
      if (paramFilter === 'escalated') setScope('all_ward');
    }
    if (paramTrack) {
      setTrackedIssueId(paramTrack);
    }
  }, [searchParams]);

  const myScopedBase = useMemo(() => {
    if (scope === 'my_reports' && currentUser) {
      return issues.filter(
        (i) =>
          i.reporterId === currentUser.id || sessionSubmittedIds.includes(i.id)
      );
    }
    return issues;
  }, [issues, scope, currentUser, sessionSubmittedIds]);

  const counts = useMemo(() => {
    return {
      submitted: myScopedBase.filter(
        (i) =>
          sessionSubmittedIds.includes(i.id) ||
          i.status === 'submitted' ||
          i.status === 'ai_analysed' ||
          i.status === 'assigned'
      ).length,
      inProgress: myScopedBase.filter(
        (i) =>
          i.status === 'assigned' ||
          i.status === 'received_by_department' ||
          i.status === 'under_process'
      ).length,
      resolved: myScopedBase.filter(
        (i) =>
          i.status === 'resolved_awaiting_confirmation' ||
          i.status === 'resolution_confirmed'
      ).length,
      escalated: myScopedBase.filter((i) => i.escalation.state !== 'none').length,
    };
  }, [myScopedBase, sessionSubmittedIds]);

  const scopedIssues = useMemo(() => {
    return myScopedBase.filter((issue) => {
      if (filter === 'all') return true;
      if (filter === 'submitted') {
        return (
          sessionSubmittedIds.includes(issue.id) ||
          issue.status === 'submitted' ||
          issue.status === 'ai_analysed' ||
          issue.status === 'assigned'
        );
      }
      if (filter === 'in_progress') {
        return (
          issue.status === 'assigned' ||
          issue.status === 'received_by_department' ||
          issue.status === 'under_process'
        );
      }
      if (filter === 'resolved') {
        return (
          issue.status === 'resolved_awaiting_confirmation' ||
          issue.status === 'resolution_confirmed'
        );
      }
      if (filter === 'escalated') {
        return issue.escalation.state !== 'none';
      }
      return true;
    });
  }, [myScopedBase, filter, sessionSubmittedIds]);

  const trackedIssue = useMemo(() => {
    if (trackedIssueId) {
      const explicit = issues.find((i) => i.id === trackedIssueId);
      if (explicit) return explicit;
    }
    if (sessionSubmittedIssues.length > 0) {
      return sessionSubmittedIssues[0];
    }
    return scopedIssues[0] ?? myScopedBase[0] ?? null;
  }, [trackedIssueId, issues, sessionSubmittedIssues, scopedIssues, myScopedBase]);

  const handleSelectTrackIssue = (issueId: string) => {
    setTrackedIssueId(issueId);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('track', issueId);
    setSearchParams(nextParams, {replace: true});
    trackerRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };

  const filterTabs: Array<{id: StatusFilter; label: string}> = [
    {id: 'all', label: 'All'},
    {id: 'submitted', label: 'Submitted'},
    {id: 'in_progress', label: 'In Progress'},
    {id: 'resolved', label: 'Resolved'},
    {id: 'escalated', label: 'Escalated'},
  ];

  const firstName = (currentUser?.name ?? 'Citizen').split(/\s+/)[0];

  return (
    <div className="space-y-5">
      {/* Vibrant Indigo Mobile-App Header (Matches Reference Theme) */}
      <section className="relative rounded-b-3xl bg-gradient-to-br from-indigo-600 to-indigo-700 px-5 pb-12 pt-5 text-white shadow-sm lg:rounded-2xl lg:px-7 lg:pb-12 lg:pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              My Complaints &amp; Tracking
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-indigo-100 sm:text-sm">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {currentUser?.hierarchy.locality} · {currentUser?.hierarchy.ward}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/home"
              aria-label="Open notifications on Home"
              className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 lg:hidden"
            >
              <Bell className="h-5 w-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 font-mono text-[10px] font-bold text-white tabular-nums">
                  {unreadNotificationsCount}
                </span>
              )}
            </Link>
            <Link
              to="/profile"
              aria-label="Open profile"
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/60 bg-indigo-500 font-display text-sm font-bold text-white lg:hidden"
            >
              {firstName.charAt(0).toUpperCase()}
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Complaint ownership scope"
            className="inline-flex rounded-xl bg-white/15 p-1 text-xs font-semibold backdrop-blur-xs"
          >
            <button
              type="button"
              onClick={() => setScope('my_reports')}
              className={`min-h-9 rounded-lg px-3.5 py-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                scope === 'my_reports'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-indigo-100 hover:text-white'
              }`}
            >
              My Reports
            </button>
            <button
              type="button"
              onClick={() => setScope('all_ward')}
              className={`min-h-9 rounded-lg px-3.5 py-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                scope === 'all_ward'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-indigo-100 hover:text-white'
              }`}
            >
              All Ward Samples
            </button>
          </div>

          <Link
            to="/report"
            className="inline-flex min-h-9 items-center rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-50"
          >
            + Report Issue
          </Link>
        </div>
      </section>

      {/* Overlapping 2x2 Quick Status Summary Tiles (Matches Screenshot 2 Theme) */}
      <div className="-mt-9 px-4 lg:px-2">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => setFilter('submitted')}
            className={`flex flex-col justify-between rounded-2xl border bg-white p-4 text-left shadow-sm transition-transform duration-150 active:scale-[0.98] cursor-pointer ${
              filter === 'submitted'
                ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                : 'border-slate-200/80 hover:border-indigo-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <span className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                {counts.submitted}
              </span>
            </div>
            <div className="mt-3">
              <p className="font-display text-sm font-bold text-slate-900">
                Submitted
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {sessionSubmittedIssues.length > 0
                  ? `${sessionSubmittedIssues.length} in this session`
                  : 'Session & queued'}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFilter('in_progress')}
            className={`flex flex-col justify-between rounded-2xl border bg-white p-4 text-left shadow-sm transition-transform duration-150 active:scale-[0.98] cursor-pointer ${
              filter === 'in_progress'
                ? 'border-amber-500 ring-2 ring-amber-500/20'
                : 'border-slate-200/80 hover:border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-600 text-white">
                <Wrench className="h-5 w-5" />
              </div>
              <span className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                {counts.inProgress}
              </span>
            </div>
            <div className="mt-3">
              <p className="font-display text-sm font-bold text-slate-900">
                In Progress
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Department action
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFilter('resolved')}
            className={`flex flex-col justify-between rounded-2xl border bg-white p-4 text-left shadow-sm transition-transform duration-150 active:scale-[0.98] cursor-pointer ${
              filter === 'resolved'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                : 'border-slate-200/80 hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                {counts.resolved}
              </span>
            </div>
            <div className="mt-3">
              <p className="font-display text-sm font-bold text-slate-900">
                Resolved
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Confirmed closure
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFilter('escalated')}
            className={`flex flex-col justify-between rounded-2xl border bg-white p-4 text-left shadow-sm transition-transform duration-150 active:scale-[0.98] cursor-pointer ${
              filter === 'escalated'
                ? 'border-red-500 ring-2 ring-red-500/20'
                : 'border-slate-200/80 hover:border-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <span className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                {counts.escalated}
              </span>
            </div>
            <div className="mt-3">
              <p className="font-display text-sm font-bold text-slate-900">
                Escalated
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                SLA &amp; safety alerts
              </p>
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-5 px-4 lg:px-0">
        {/* Submitted Reports in Current Session */}
        {sessionSubmittedIssues.length > 0 && (
          <section className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  Submitted Reports (Current Session)
                </h2>
                <p className="text-xs text-slate-500">
                  Every report submitted in this session is recorded below for live status tracking.
                </p>
              </div>
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-mono text-xs font-bold text-indigo-700 tabular-nums">
                {sessionSubmittedIssues.length} Submitted
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {sessionSubmittedIssues.map((item) => {
                const isTracking = trackedIssue?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
                      isTracking
                        ? 'border-indigo-500 bg-indigo-50/50'
                        : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CivicImage
                        src={item.photoUrl}
                        alt={item.title}
                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {item.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                          <span className="font-mono font-semibold text-indigo-700">
                            {item.id}
                          </span>
                          <ResolutionStatusLabel status={item.status} />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectTrackIssue(item.id)}
                      className={`min-h-9 shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                        isTracking
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {isTracking ? 'Tracking' : 'Track'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Live Status Tracker Card (Themed after Screenshot 1 + Screenshot 2) */}
        {trackedIssue && (
          <section
            ref={trackerRef}
            aria-label="Active report status tracker"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-100 bg-indigo-50/60 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-700">
                  {trackedIssue.id}
                </span>
                {sessionSubmittedIds.includes(trackedIssue.id) && (
                  <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Current Session
                  </span>
                )}
              </div>
              <span className="font-mono text-xs text-slate-500">
                {SEVERITY_CONFIG[trackedIssue.safetySeverity].slaText}
              </span>
            </div>

            <div className="grid lg:grid-cols-12">
              {/* Left: Screenshot 1 style visual dossier */}
              <div className="p-4 sm:p-5 lg:col-span-5 lg:border-r lg:border-slate-100 space-y-3">
                <CivicImage
                  src={trackedIssue.photoUrl}
                  alt={trackedIssue.title}
                  className="h-44 w-full rounded-xl object-cover"
                />

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                      {CATEGORY_MAP[trackedIssue.category].shortLabel}
                    </span>
                    <SeverityLabel severity={trackedIssue.safetySeverity} compact />
                  </div>
                  <h2 className="pt-1 font-display text-lg font-bold text-slate-900">
                    {trackedIssue.approximateArea}
                  </h2>
                  <p className="text-xs font-medium text-slate-600">
                    {trackedIssue.title}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1 font-medium text-red-600">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span className="font-mono tabular-nums">
                      {trackedIssue.upvotedByUserIds.length} Upvotes
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono tabular-nums">
                      {trackedIssue.mapPosition.distanceKmFromCenter} KMs
                    </span>
                  </span>
                  <ResolutionStatusLabel status={trackedIssue.status} />
                </div>

                <p className="text-xs text-slate-500">
                  Reported: {formatRelativeTime(trackedIssue.createdAt)} · Routed to{' '}
                  {trackedIssue.assignedDepartments.join(' + ')}
                </p>

                <div className="pt-1 flex flex-col gap-2">
                  {trackedIssue.status === 'resolved_awaiting_confirmation' && (
                    <button
                      type="button"
                      onClick={() => confirmComplaintResolution(trackedIssue.id)}
                      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Confirm Issue Resolved (+10 pts)</span>
                    </button>
                  )}
                  <Link
                    to={`/issues/${trackedIssue.id}`}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <span>Open Full Issue Dossier</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Right: 7-Stage Vertical Status Stepper */}
              <div className="border-t border-slate-100 p-4 sm:p-5 lg:col-span-7 lg:border-t-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Live 7-Stage Status Tracker
                  </h3>
                  <span className="font-mono text-xs font-semibold text-indigo-600 tabular-nums">
                    Stage{' '}
                    {Math.max(
                      1,
                      COMPLAINT_LIFECYCLE_STAGES.findIndex(
                        (s) => s.id === trackedIssue.status
                      ) + 1
                    )}{' '}
                    of 7
                  </span>
                </div>

                <ol className="space-y-3">
                  {COMPLAINT_LIFECYCLE_STAGES.map((stage, idx) => {
                    const currentIdx = COMPLAINT_LIFECYCLE_STAGES.findIndex(
                      (s) => s.id === trackedIssue.status
                    );
                    const reached = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    const recorded = trackedIssue.timeline.find(
                      (t) => t.stage === stage.id
                    );

                    return (
                      <li key={stage.id} className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold ${
                            isCurrent
                              ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                              : reached
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {stage.stepNumber}
                        </div>
                        <div className="min-w-0 flex-1 border-b border-slate-100 pb-2.5 last:border-b-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p
                              className={`text-xs font-bold ${
                                reached ? 'text-slate-900' : 'text-slate-400'
                              }`}
                            >
                              {stage.label}
                            </p>
                            {isCurrent && (
                              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                Current Stage
                              </span>
                            )}
                          </div>
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
                              {stage.description}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </section>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5">
          <div
            role="tablist"
            aria-label="Filter complaints by status"
            className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1"
          >
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                onClick={() => setFilter(tab.id)}
                className={`min-h-9 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="font-mono text-xs text-slate-500 tabular-nums">
            {scopedIssues.length} report{scopedIssues.length === 1 ? '' : 's'} shown
          </p>
        </div>

        {/* Complaint Feed List */}
        {scopedIssues.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-slate-900">
              No complaints match this status filter
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Switch to &ldquo;All Ward Samples&rdquo; or submit a new civic issue report.
            </p>
            <Link
              to="/report"
              className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Report an Issue
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {scopedIssues.map((issue) => {
              const stageIdx = COMPLAINT_LIFECYCLE_STAGES.findIndex(
                (s) => s.id === issue.status
              );
              const lastEvent = issue.timeline[issue.timeline.length - 1];
              const isSessionReport = sessionSubmittedIds.includes(issue.id);
              const isBeingTracked = trackedIssue?.id === issue.id;

              return (
                <article
                  key={issue.id}
                  className={`rounded-2xl border bg-white p-4 sm:p-5 shadow-xs space-y-4 ${
                    isBeingTracked
                      ? 'border-indigo-400 ring-2 ring-indigo-500/15'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-bold text-slate-800">
                          {issue.id}
                        </span>
                        {isSessionReport && (
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                            Submitted in Session
                          </span>
                        )}
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
                          {CATEGORY_MAP[issue.category].shortLabel}
                        </span>
                        <span className="font-mono tabular-nums text-slate-400">
                          {formatRelativeTime(issue.createdAt)}
                        </span>
                      </div>

                      <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
                        {issue.title}
                      </h2>

                      <p className="text-xs text-slate-600">
                        Assigned: {issue.assignedDepartments.join(' + ')} ·{' '}
                        <span className="font-mono">
                          {SEVERITY_CONFIG[issue.safetySeverity].slaText}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityLabel severity={issue.safetySeverity} compact />
                      <ResolutionStatusLabel status={issue.status} />
                    </div>
                  </div>

                  <div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {COMPLAINT_LIFECYCLE_STAGES.map((stage, idx) => {
                        const reached = idx <= stageIdx;
                        return (
                          <div key={stage.id} className="space-y-1">
                            <div
                              className={`h-2 rounded-full ${
                                reached ? 'bg-indigo-600' : 'bg-slate-200'
                              }`}
                            />
                            <p
                              className={`hidden sm:block text-[10px] leading-tight ${
                                reached
                                  ? 'font-semibold text-slate-800'
                                  : 'text-slate-400'
                              }`}
                            >
                              {stage.shortLabel}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        Latest event (
                        {new Date(lastEvent.timestamp).toLocaleString('en-IN')}):{' '}
                        {lastEvent.note}
                      </span>
                    </p>
                  </div>

                  {issue.escalation.state !== 'none' && (
                    <div
                      className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border p-3 text-xs ${
                        issue.escalation.state === 'escalation_acknowledged'
                          ? 'border-sky-200 bg-sky-50 text-sky-900'
                          : 'border-orange-200 bg-orange-50 text-orange-900'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {issue.escalation.state === 'escalation_acknowledged' ? (
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                        ) : (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold">
                            {issue.escalation.state === 'escalation_acknowledged'
                              ? 'Escalation Acknowledged'
                              : 'Escalation Initiated (Receipt Not Yet Recorded)'}
                          </p>
                          <p className="mt-0.5">
                            Next Authority: {issue.escalation.nextAuthorityLevel} —{' '}
                            {issue.escalation.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectTrackIssue(issue.id)}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
                      >
                        <span>
                          {isBeingTracked ? 'Viewing in Tracker' : 'Track Status'}
                        </span>
                      </button>

                      {issue.status === 'resolved_awaiting_confirmation' && (
                        <button
                          type="button"
                          onClick={() => confirmComplaintResolution(issue.id)}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Confirm Resolution (+10 pts)</span>
                        </button>
                      )}
                    </div>

                    <Link
                      to={`/issues/${issue.id}`}
                      className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      <span>View Details</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
