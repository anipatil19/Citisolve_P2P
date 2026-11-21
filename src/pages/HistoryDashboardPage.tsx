import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight, BarChart3, Globe2, UserCheck} from 'lucide-react';
import {
  ResolutionStatusLabel,
  SeverityLabel,
} from '../components/common/SeverityAndStatus';
import {CATEGORY_MAP} from '../constants/civicDomain';
import {useCitiSolve} from '../context/CitiSolveContext';
import {COMMUNITY_HISTORY_DATA} from '../data/demoData';
import type {GeographyLevel} from '../types/civic';

const LEVELS: Array<{id: GeographyLevel; label: string}> = [
  {id: 'locality', label: 'Locality'},
  {id: 'ward', label: 'Ward'},
  {id: 'municipality', label: 'Municipality'},
  {id: 'district', label: 'District'},
  {id: 'state', label: 'State'},
  {id: 'country', label: 'Country'},
];

export const HistoryDashboardPage: React.FC = () => {
  const {currentUser, issues, totalAwardedPoints} = useCitiSolve();
  const [activeSection, setActiveSection] = useState<'personal' | 'community'>(
    'personal'
  );
  const [selectedLevel, setSelectedLevel] = useState<GeographyLevel>('ward');

  const reportedByMe = issues.filter(
    (i) => currentUser && i.reporterId === currentUser.id
  );
  const supportedByMe = issues.filter(
    (i) => currentUser && i.upvotedByUserIds.includes(currentUser.id)
  );
  const resolvedByMe = reportedByMe.filter(
    (i) =>
      i.status === 'resolution_confirmed' ||
      i.status === 'resolved_awaiting_confirmation'
  );

  const communityNode =
    COMMUNITY_HISTORY_DATA.find((n) => n.level === selectedLevel) ??
    COMMUNITY_HISTORY_DATA[0];

  const resolutionRate = Math.round(
    (communityNode.resolvedCount / Math.max(1, communityNode.reportedCount)) *
      100
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Personal &amp; Community Civic History
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track your personal civic footprint and explore aggregated improvement trends from locality up to national level without exposing private details.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="History view selector"
          className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'personal'}
            onClick={() => setActiveSection('personal')}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-md px-3.5 py-2 cursor-pointer whitespace-nowrap ${
              activeSection === 'personal'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Personal History</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'community'}
            onClick={() => setActiveSection('community')}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-md px-3.5 py-2 cursor-pointer whitespace-nowrap ${
              activeSection === 'community'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            <Globe2 className="h-3.5 w-3.5" />
            <span>Community Hierarchy</span>
          </button>
        </div>
      </div>

      {activeSection === 'personal' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">Issues Reported</p>
              <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {reportedByMe.length}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">Issues Supported</p>
              <p className="mt-1 font-mono text-2xl font-bold text-indigo-600 tabular-nums">
                {supportedByMe.length}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">Resolved Reports</p>
              <p className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
                {resolvedByMe.length}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">Points Earned</p>
              <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {totalAwardedPoints} pts
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-display text-base font-semibold text-slate-900">
                Issues You Reported ({reportedByMe.length})
              </h2>
              <div className="mt-3 divide-y divide-slate-100">
                {reportedByMe.length === 0 ? (
                  <p className="py-6 text-xs text-slate-500">
                    You have not submitted a report in this session yet.
                  </p>
                ) : (
                  reportedByMe.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {issue.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <SeverityLabel severity={issue.safetySeverity} compact />
                          <ResolutionStatusLabel status={issue.status} />
                        </div>
                      </div>
                      <Link
                        to={`/issues/${issue.id}`}
                        className="inline-flex min-h-9 items-center gap-1 rounded border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 shrink-0"
                      >
                        <span>View</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-display text-base font-semibold text-slate-900">
                Issues You Supported ({supportedByMe.length})
              </h2>
              <div className="mt-3 divide-y divide-slate-100">
                {supportedByMe.length === 0 ? (
                  <p className="py-6 text-xs text-slate-500">
                    Upvote nearby complaints on the Home Map to support community resolution.
                  </p>
                ) : (
                  supportedByMe.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {issue.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {issue.approximateArea} ·{' '}
                          <span className="font-mono tabular-nums">
                            {issue.upvotedByUserIds.length} votes
                          </span>
                        </p>
                      </div>
                      <Link
                        to={`/issues/${issue.id}`}
                        className="inline-flex min-h-9 items-center gap-1 rounded border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 shrink-0"
                      >
                        <span>View</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500 mb-2">
              Administrative Hierarchy Level (Sample Aggregated Dataset)
            </p>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setSelectedLevel(lvl.id)}
                  className={`min-h-10 rounded-md border px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    selectedLevel === lvl.id
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-medium text-indigo-600">
                  {communityNode.level.toUpperCase()}
                  {communityNode.parentName
                    ? ` · Part of ${communityNode.parentName}`
                    : ''}
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-slate-900">
                  {communityNode.name}
                </h2>
              </div>
              <span className="font-mono text-sm font-semibold text-emerald-700 tabular-nums">
                {resolutionRate}% Resolution Rate
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Complaints Reported</p>
                <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                  {communityNode.reportedCount.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Pending</p>
                <p className="mt-1 font-mono text-2xl font-bold text-amber-700 tabular-nums">
                  {communityNode.pendingCount.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Resolved</p>
                <p className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
                  {communityNode.resolvedCount.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Critical Tracked</p>
                <p className="mt-1 font-mono text-2xl font-bold text-red-600 tabular-nums">
                  {communityNode.criticalCount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <BarChart3 className="h-4 w-4 text-indigo-600" />
                <span>Common Issue Categories &amp; Improvement Trend</span>
              </div>

              <div className="space-y-2.5">
                {communityNode.topCategories.map((item) => {
                  const pct = Math.min(
                    100,
                    Math.round((item.count / communityNode.reportedCount) * 100)
                  );
                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800">
                          {CATEGORY_MAP[item.category].label}
                        </span>
                        <span className="font-mono text-slate-600 tabular-nums">
                          {item.count.toLocaleString('en-IN')} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-indigo-600"
                          style={{width: `${pct}%`}}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="pt-2 text-xs text-slate-600">
                <strong>Trend Note:</strong> {communityNode.monthlyTrendLabel} · Aggregated counts only—no personal reporter PII or exact addresses exposed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
