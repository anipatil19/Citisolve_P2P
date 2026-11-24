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
  X,
} from 'lucide-react';
import {CivicImage} from '../components/common/CivicImage';
import {LanguageSelector} from '../components/common/LanguageSelector';
import {
  ResolutionStatusLabel,
  SeverityLabel,
} from '../components/common/SeverityAndStatus';
import {LeafletWardMap} from '../components/map/LeafletWardMap';
import {ISSUE_CATEGORIES} from '../constants/civicDomain';
import {useCitiSolve} from '../context/CitiSolveContext';
import {useTranslation} from '../i18n/useTranslation';
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
  const {t, tc} = useTranslation();

  const [categoryFilter, setCategoryFilter] = useState<'all' | IssueCategoryId>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | SafetySeverity>('all');
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [voteFeedback, setVoteFeedback] = useState<string | null>(null);
  const [permStatusMsg, setPermStatusMsg] = useState<string | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [showNearbyList, setShowNearbyList] = useState(false);

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

  const handleOpenNearbyIssues = () => {
    setShowNearbyList(true);
    window.setTimeout(() => {
      const el = document.getElementById('nearby-issues-section');
      el?.scrollIntoView({behavior: 'smooth', block: 'start'});
    }, 60);
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
              {t('home.greeting', {name: firstName})}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-indigo-100 sm:text-sm">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {currentUser?.hierarchy.locality} · {currentUser?.hierarchy.ward}
              </span>
            </p>
          </div>

          <div className="relative flex items-center gap-2 shrink-0">
            <div className="lg:hidden">
              <LanguageSelector variant="indigo" compact />
            </div>

            <button
              type="button"
              aria-label={`${t('nav.notifications')} (${unreadNotificationsCount})`}
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
              aria-label={t('nav.profile')}
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/60 bg-indigo-500 font-display text-sm font-bold text-white lg:hidden"
            >
              {firstName.charAt(0).toUpperCase()}
            </Link>

            {alertsOpen && (
              <div
                role="dialog"
                aria-label={t('nav.notifications')}
                className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-display text-sm font-semibold">
                    {t('nav.notifications')}
                  </span>
                  {unreadNotificationsCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {t('nav.markAllRead')}
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
                {t('home.tileReport')}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {t('home.tileReportSub')}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleOpenNearbyIssues}
            className={`flex flex-col justify-between rounded-2xl border bg-white p-4 text-left shadow-sm transition-transform duration-150 active:scale-[0.98] hover:border-teal-200 cursor-pointer ${
              showNearbyList ? 'border-teal-400 ring-2 ring-teal-500/20' : 'border-slate-200/80'
            }`}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="mt-3">
              <p className="font-display text-sm font-bold text-slate-900">
                {t('home.tileNearby')}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {t('home.tileNearbySub')}
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
                  {sessionSubmittedIssues.length}
                </span>
              )}
            </div>
            <div className="mt-3">
              <p className="font-display text-sm font-bold text-slate-900">
                {t('home.tileMyComplaints')}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {t('home.tileMyComplaintsSub')}
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
                {t('home.tileAlerts')}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {t('home.tileAlertsSub')}
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
                  {t('home.sessionReportsTitle')} ({sessionSubmittedIssues.length})
                </h2>
                <p className="text-xs text-slate-500">
                  {t('home.sessionReportsSub')}
                </p>
              </div>
              <Link
                to="/status?filter=submitted"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
              >
                {t('common.viewAll')} &gt;
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
                    {t('report.trackStatusBtn')}
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
                  {t('profile.permissionsSection')}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {t('home.enableLocationPrompt')}
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
                    {!needsLocationPerm ? t('auth.gpsEnabled') : t('home.enableGpsBtn')}
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
                    {!needsCameraPerm ? t('auth.cameraEnabled') : t('home.enableCamBtn')}
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
                {t('home.mapSectionTitle')}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label={t('home.filterAllCategories')}
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as 'all' | IssueCategoryId)
                }
                className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
              >
                <option value="all">{t('home.filterAllCategories')}</option>
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {tc(cat.id, true)}
                  </option>
                ))}
              </select>

              <select
                aria-label={t('home.filterAllSeverities')}
                value={severityFilter}
                onChange={(e) =>
                  setSeverityFilter(e.target.value as 'all' | SafetySeverity)
                }
                className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
              >
                <option value="all">{t('home.filterAllSeverities')}</option>
                <option value="critical">{t('sev.critical')}</option>
                <option value="high">{t('sev.high')}</option>
                <option value="medium">{t('sev.medium')}</option>
                <option value="low">{t('sev.low')}</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <div className={prioritizedIssue ? 'lg:col-span-7' : 'lg:col-span-12'}>
              <LeafletWardMap
                issues={filteredIssues}
                selectedIssueId={prioritizedIssue?.id ?? null}
                onSelectIssue={setSelectedIssueId}
                radiusKm={radiusKm}
                onChangeRadiusKm={setRadiusKm}
              />
            </div>

            {prioritizedIssue && (
              <div className="lg:col-span-5">
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
                        {prioritizedIssue.upvotedByUserIds.length} {t('common.upvotes')}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-mono tabular-nums">
                        {t('common.kmAway', {
                          km: prioritizedIssue.mapPosition.distanceKmFromCenter,
                        })}
                      </span>
                    </span>
                    <ResolutionStatusLabel status={prioritizedIssue.status} />
                  </div>

                  <p className="text-xs text-slate-500">
                    {formatRelativeDays(prioritizedIssue.createdAt)} ·{' '}
                    {tc(prioritizedIssue.category)}
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
                          ? t('common.upvoted')
                          : t('common.upvote')}
                      </span>
                    </button>

                    <Link
                      to={`/issues/${prioritizedIssue.id}`}
                      className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
                    >
                      <span>{t('common.viewDetails')}</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Nearby Issues List — shown only after clicking "Issues near me" */}
        {showNearbyList && (
          <section id="nearby-issues-section" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-slate-900">
                {t('home.nearYouTitle')}
              </h2>
              <div className="flex items-center gap-3">
                <Link
                  to="/history"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  {t('common.viewAll')} &gt;
                </Link>
                <button
                  type="button"
                  aria-label={t('common.close')}
                  onClick={() => setShowNearbyList(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {filteredIssues.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-600">
                {t('common.noMatches')}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredIssues.slice(0, 6).map((item) => {
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
                              {tc(item.category, true)}
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
                        onClick={() => {
                          setSelectedIssueId(item.id);
                          document
                            .getElementById('home-map-section')
                            ?.scrollIntoView({behavior: 'smooth', block: 'start'});
                        }}
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
                          <span>{hasVoted ? t('common.upvoted') : t('common.upvote')}</span>
                        </button>

                        <Link
                          to={`/issues/${item.id}`}
                          className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                          <span>{t('common.viewDetails')}</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <section
          aria-label={t('home.summaryTitle')}
          className="rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-slate-900">
              {t('home.summaryTitle')}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-medium text-slate-500">{t('home.summaryOpen')}</p>
              <p className="mt-0.5 font-mono text-xl font-bold text-slate-900 tabular-nums">
                {activeCount}
              </p>
            </div>
            <div className="rounded-xl bg-red-50/70 p-3">
              <p className="text-[11px] font-medium text-red-700">{t('sev.critical')}</p>
              <p className="mt-0.5 font-mono text-xl font-bold text-red-600 tabular-nums">
                {criticalCount}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50/70 p-3">
              <p className="text-[11px] font-medium text-emerald-700">{t('home.summaryResolved')}</p>
              <p className="mt-0.5 font-mono text-xl font-bold text-emerald-700 tabular-nums">
                {resolvedCount}
              </p>
            </div>
            <div className="rounded-xl bg-indigo-50/70 p-3">
              <p className="text-[11px] font-medium text-indigo-700">
                {t('issue.communitySupport')}
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
