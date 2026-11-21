import React, {useMemo, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  FileText,
  MapPin,
  Navigation,
  ThumbsUp,
} from 'lucide-react';
import {CivicImage} from '../components/common/CivicImage';
import {
  ResolutionStatusLabel,
  SeverityLabel,
} from '../components/common/SeverityAndStatus';
import {LeafletWardMap} from '../components/map/LeafletWardMap';
import {CATEGORY_MAP, ISSUE_CATEGORIES} from '../constants/civicDomain';
import {useCitiSolve} from '../context/CitiSolveContext';
import type {IssueCategoryId, SafetySeverity} from '../types/civic';

function formatRelativeDays(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

export const CitizenHomePage: React.FC = () => {
  const {
    currentUser,
    issues,
    sessionSubmittedIssues,
    notifications,
    unreadNotificationsCount,
    toggleUpvote,
    markNotificationRead,
    markAllNotificationsRead,
    requestLiveLocationAccess,
    requestCameraAccess,
  } = useCitiSolve();
  const navigate = useNavigate();

  const [categoryFilter, setCategoryFilter] = useState<'all' | IssueCategoryId>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | SafetySeverity>('all');
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [voteFeedback, setVoteFeedback] = useState<string | null>(null);
  const [permStatusMsg, setPermStatusMsg] = useState<string | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const firstName = (currentUser?.name ?? 'Citizen').split(/\s+/)[0];

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;
      if (severityFilter !== 'all' && issue.safetySeverity !== severityFilter)
        return false;
      if (radiusKm < 10 && issue.mapPosition.distanceKmFromCenter > radiusKm)
        return false;
      return true;
    });
  }, [issues, categoryFilter, severityFilter, radiusKm]);

  const prioritizedIssue = useMemo(() => {
    if (selectedIssueId) {
      const found = filteredIssues.find((i) => i.id === selectedIssueId);
      if (found) return found;
    }
    const ownActive = filteredIssues.find(
      (i) =>
        currentUser &&
        i.reporterId === currentUser.id &&
        i.status !== 'resolution_confirmed'
    );
    return ownActive ?? filteredIssues[0] ?? null;
  }, [filteredIssues, selectedIssueId, currentUser]);

  const activeCount = issues.filter(
    (i) => i.status !== 'resolution_confirmed'
  ).length;
  const criticalCount = issues.filter(
    (i) =>
      i.safetySeverity === 'critical' && i.status !== 'resolution_confirmed'
  ).length;
  const resolvedCount = issues.filter(
    (i) =>
      i.status === 'resolution_confirmed' ||
      i.status === 'resolved_awaiting_confirmation'
  ).length;
  const totalSupports = issues.reduce(
    (acc, i) => acc + i.upvotedByUserIds.length,
    0
  );

  const handleToggleVote = (issueId: string) => {
    const res = toggleUpvote(issueId);
    if (res.action === 'added') {
      setVoteFeedback(
        res.pointsAwarded > 0
          ? `Upvote recorded (+${res.pointsAwarded} participation points).`
          : 'Upvote recorded for this complaint.'
      );
    } else if (res.action === 'removed') {
      setVoteFeedback('Your upvote was removed.');
    }
    window.setTimeout(() => setVoteFeedback(null), 3500);
  };

  const handleEnableLocation = async () => {
    const res = await requestLiveLocationAccess();
    setPermStatusMsg(res.message);
    window.setTimeout(() => setPermStatusMsg(null), 4500);
  };

  const handleEnableCamera = async () => {
    const res = await requestCameraAccess();
    setPermStatusMsg(res.message);
    window.setTimeout(() => setPermStatusMsg(null), 4500);
  };

  const scrollToMap = () => {
    const el = document.getElementById('home-map-section');
    el?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };

  const needsLocationPerm = currentUser?.locationPermission !== 'granted';
  const needsCameraPerm = currentUser?.cameraPermission !== 'granted';

  return (
    <div className="space-y-5">
      {/* Vibrant Indigo Mobile-App Greeting Header */}
      <section className="relative rounded-b-3xl bg-gradient-to-br from-indigo-600 to-indigo-700 px-5 pb-12 pt-5 text-white shadow-sm lg:rounded-2xl lg:px-7 lg:pb-12 lg:pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Hi {firstName}!
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-indigo-100 sm:text-sm">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {currentUser?.hierarchy.locality} · {currentUser?.hierarchy.ward}
              </span>
            </p>
          </div>

          <div className="relative flex items-center gap-2 shrink-0">
            <button
              type="button"
              aria-label={`Open alerts (${unreadNotificationsCount} unread)`}
              onClick={() => setAlertsOpen((o) => !o)}
              className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 cursor-pointer"
            >
              <Bell className="h-5 w-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 font-mono text-[10px] font-bold text-white tabular-nums">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            <Link
              to="/profile"
              aria-label="Open profile settings"
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/60 bg-indigo-500 font-display text-sm font-bold text-white lg:hidden"
            >
              {firstName.charAt(0).toUpperCase()}
            </Link>

            {alertsOpen && (
              <div
                role="dialog"
                aria-label="Alerts and notifications"
                className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-display text-sm font-semibold">
                    Alerts &amp; Updates
                  </span>
                  {unreadNotificationsCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Mark read
                    </button>
                  )}
                </div>
                <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
                  {notifications.slice(0, 5).map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        markNotificationRead(n.id);
                        setAlertsOpen(false);
                        if (n.linkTo) navigate(n.linkTo);
                      }}
                      className={`w-full rounded-xl border p-2.5 text-left text-xs cursor-pointer ${
                        n.read
                          ? 'border-slate-100 bg-white'
                          : 'border-indigo-200 bg-indigo-50/50'
                      }`}
                    >
                      <p className="font-semibold text-slate-900">{n.title}</p>
                      <p className="mt-0.5 text-slate-600 line-clamp-2">
                        {n.message}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Overlapping 2x2 Quick Action Tiles (Matches Reference Screenshot 2) */}
      <div className="-mt-9 px-4 lg:px-2">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Link
            to="/report"
            className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-transform duration-150 active:scale-[0.98] hover:border-indigo-200"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Camera className="h-5 w-5" />
            </div>
            <div className="mt-3">
              <p className="font-display text-sm font-bold text-slate-900">
                Report Issue
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Raise civic problems
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={scrollToMap}
            className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition-transform duration-150 active:scale-[0.98] hover:border-teal-200 cursor-pointer"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="mt-3">
              <p className="font-display text-sm font-bold text-slate-900">
                Issues near me
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Check local problems
              </p>
            </div>
          </button>

          <Link
            to="/status?filter=submitted"
            className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-transform duration-150 active:scale-[0.98] hover:border-amber-200"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-600 text-white">
                <FileText className="h-5 w-5" />
              </div>
              {sessionSubmittedIssues.length > 0 && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-700 tabular-nums">
                  {sessionSubmittedIssues.length} new
                </span>
              )}
            </div>
            <div className="mt-3">
              <p className="font-display text-sm font-bold text-slate-900">
                My Complaints
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {sessionSubmittedIssues.length > 0
                  ? `${sessionSubmittedIssues.length} submitted in session`
                  : 'Track your reports'}
              </p>
            </div>
          </Link>

          <Link
            to="/status?filter=escalated"
            className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-transform duration-150 active:scale-[0.98] hover:border-red-200"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="mt-3">
              <p className="font-display text-sm font-bold text-slate-900">
                Alerts &amp; News
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Stay updated
              </p>
            </div>
          </Link>
        </div>
      </div>

      <div className="space-y-5 px-4 lg:px-0">
        {/* Submitted in Current Session Tracker Strip */}
        {sessionSubmittedIssues.length > 0 && (
          <section className="rounded-2xl border border-indigo-200/80 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-sm font-bold text-slate-900">
                  Submitted in Current Session ({sessionSubmittedIssues.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Tap any report below to track its 7-stage municipal status
                </p>
              </div>
              <Link
                to="/status?filter=submitted"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
              >
                View all &gt;
              </Link>
            </div>

            <div className="space-y-2.5">
              {sessionSubmittedIssues.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <CivicImage
                      src={sub.photoUrl}
                      alt={sub.title}
                      className="h-12 w-12 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {sub.title}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                        <span className="font-mono font-semibold text-indigo-700">
                          {sub.id}
                        </span>
                        <ResolutionStatusLabel status={sub.status} />
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/status?track=${sub.id}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
                  >
                    Track Status
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Camera & Location Permission Activator */}
        {(needsLocationPerm || needsCameraPerm || permStatusMsg) && (
          <section className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-sm font-semibold text-slate-900">
                  Enable Live Location &amp; Camera Permissions
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Allow GPS to center OpenStreetMap pins near you and camera access for instant street reporting.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleEnableLocation}
                  className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                    !needsLocationPerm
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {!needsLocationPerm ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Navigation className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {!needsLocationPerm ? 'Location Enabled' : 'Enable Location'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleEnableCamera}
                  className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                    !needsCameraPerm
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {!needsCameraPerm ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {!needsCameraPerm ? 'Camera Enabled' : 'Enable Camera'}
                  </span>
                </button>
              </div>
            </div>
            {permStatusMsg && (
              <p className="mt-2.5 text-xs font-medium text-indigo-700">
                {permStatusMsg}
              </p>
            )}
          </section>
        )}

        {voteFeedback && (
          <div
            role="status"
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-medium text-indigo-900"
          >
            {voteFeedback}
          </div>
        )}

        {/* OpenStreetMap + Leaflet Map & Highlighted Pin Card (Matches Reference Screenshot 1) */}
        <section id="home-map-section" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Nearby Issue Pins
              </h2>
              <p className="text-xs text-slate-500">
                Tap any OpenStreetMap pin to inspect &amp; upvote · Severity and resolution status stay separate
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter by category"
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as 'all' | IssueCategoryId)
                }
                className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
              >
                <option value="all">All 8 Categories</option>
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.shortLabel}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by severity"
                value={severityFilter}
                onChange={(e) =>
                  setSeverityFilter(e.target.value as 'all' | SafetySeverity)
                }
                className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-3">
              <LeafletWardMap
                issues={filteredIssues}
                selectedIssueId={prioritizedIssue?.id ?? null}
                onSelectIssue={setSelectedIssueId}
                radiusKm={radiusKm}
                onChangeRadiusKm={setRadiusKm}
              />

              {/* Highlighted Bottom Sheet / Card directly under Map (Screenshot 1 Pattern) */}
              {prioritizedIssue && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-bold text-slate-900 sm:text-lg">
                        {prioritizedIssue.approximateArea}
                      </h3>
                      <p className="mt-0.5 text-xs font-medium text-slate-600">
                        {prioritizedIssue.title}
                      </p>
                    </div>
                    <SeverityLabel severity={prioritizedIssue.safetySeverity} compact />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 font-medium text-red-600">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span className="font-mono tabular-nums">
                        {prioritizedIssue.upvotedByUserIds.length} Upvotes
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-mono tabular-nums">
                        {prioritizedIssue.mapPosition.distanceKmFromCenter} KMs
                      </span>
                    </span>
                    <ResolutionStatusLabel status={prioritizedIssue.status} />
                  </div>

                  <p className="text-xs text-slate-500">
                    Reported: {formatRelativeDays(prioritizedIssue.createdAt)} ·{' '}
                    {CATEGORY_MAP[prioritizedIssue.category].label}
                  </p>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => handleToggleVote(prioritizedIssue.id)}
                      className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                        currentUser &&
                        prioritizedIssue.upvotedByUserIds.includes(currentUser.id)
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>
                        {currentUser &&
                        prioritizedIssue.upvotedByUserIds.includes(currentUser.id)
                          ? 'Upvoted (Tap to Remove)'
                          : 'Upvote'}
                      </span>
                    </button>

                    <Link
                      to={`/issues/${prioritizedIssue.id}`}
                      className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
                    >
                      <span>View Details</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* "Near you" Feed Section (Matches Reference Screenshot 2) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Near you
                </h2>
                <Link
                  to="/history"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View all &gt;
                </Link>
              </div>

              <div className="space-y-3">
                {filteredIssues.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-600">
                    No active complaints recorded for this filter. An empty view does not guarantee zero on-ground issues.
                  </div>
                ) : (
                  filteredIssues.slice(0, 5).map((item) => {
                    const hasVoted =
                      currentUser &&
                      item.upvotedByUserIds.includes(currentUser.id);
                    return (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {item.reporterAlias}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span className="rounded-md bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
                                {CATEGORY_MAP[item.category].shortLabel}
                              </span>
                              <SeverityLabel severity={item.safetySeverity} compact />
                              <ResolutionStatusLabel status={item.status} />
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {formatRelativeDays(item.createdAt)}
                          </span>
                        </div>

                        <p className="text-sm leading-relaxed text-slate-700 line-clamp-2">
                          {item.description}
                        </p>

                        <button
                          type="button"
                          onClick={() => setSelectedIssueId(item.id)}
                          className="block w-full overflow-hidden rounded-xl cursor-pointer text-left"
                        >
                          <CivicImage
                            src={item.photoUrl}
                            alt={item.title}
                            className="h-40 w-full rounded-xl object-cover"
                          />
                        </button>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => handleToggleVote(item.id)}
                            className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer ${
                              hasVoted
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <ThumbsUp className="h-4 w-4" />
                            <span className="font-mono tabular-nums">
                              {item.upvotedByUserIds.length}
                            </span>
                            <span>{hasVoted ? 'Supported' : 'Upvote'}</span>
                          </button>

                          <Link
                            to={`/issues/${item.id}`}
                            className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                          >
                            <span>View Details</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Compact Community Summary Strip */}
        <section
          aria-label="Community summary (sample demonstration data)"
          className="rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-slate-900">
              Community Summary
            </h2>
            <span className="text-[11px] text-slate-500">
              Sample Ward Dataset
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-medium text-slate-500">Active</p>
              <p className="mt-0.5 font-mono text-xl font-bold text-slate-900 tabular-nums">
                {activeCount}
              </p>
            </div>
            <div className="rounded-xl bg-red-50/70 p-3">
              <p className="text-[11px] font-medium text-red-700">Critical</p>
              <p className="mt-0.5 font-mono text-xl font-bold text-red-600 tabular-nums">
                {criticalCount}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50/70 p-3">
              <p className="text-[11px] font-medium text-emerald-700">Resolved</p>
              <p className="mt-0.5 font-mono text-xl font-bold text-emerald-700 tabular-nums">
                {resolvedCount}
              </p>
            </div>
            <div className="rounded-xl bg-indigo-50/70 p-3">
              <p className="text-[11px] font-medium text-indigo-700">
                Total Support
              </p>
              <p className="mt-0.5 font-mono text-xl font-bold text-indigo-700 tabular-nums">
                {totalSupports}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
