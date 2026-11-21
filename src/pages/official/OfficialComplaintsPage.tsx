import React, {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight, ChevronLeft, ChevronRight, Search} from 'lucide-react';
import {
  ResolutionStatusLabel,
  SeverityLabel,
} from '../../components/common/SeverityAndStatus';
import {CATEGORY_MAP} from '../../constants/civicDomain';
import {useCitiSolve} from '../../context/CitiSolveContext';
import {useTranslation} from '../../i18n/useTranslation';
import {
  getComplaintAgeLabel,
  getIssueDueAt,
  isIssueClosed,
  isIssueOverdue,
  sortIssuesBySafetyAndSla,
} from '../../utils/officialHelpers';

type OfficialComplaintFilter =
  | 'all'
  | 'new'
  | 'critical'
  | 'high'
  | 'unassigned'
  | 'assigned'
  | 'in_progress'
  | 'overdue'
  | 'resolved'
  | 'escalated';

type SortMode = 'safety_sla' | 'deadline_asc' | 'newest' | 'oldest';

const PAGE_SIZE = 6;

export const OfficialComplaintsPage: React.FC = () => {
  const {officialJurisdictionIssues, slaConfig} = useCitiSolve();
  const {t, tc, tDept} = useTranslation();

  const filterTabs: Array<{id: OfficialComplaintFilter; label: string}> = [
    {id: 'all', label: t('common.all')},
    {id: 'new', label: t('offComp.filterNew')},
    {id: 'critical', label: t('sev.critical')},
    {id: 'high', label: t('sev.high')},
    {id: 'unassigned', label: t('offComp.filterUnassigned')},
    {id: 'assigned', label: t('offComp.filterAssigned')},
    {id: 'in_progress', label: t('offComp.filterInProgress')},
    {id: 'overdue', label: t('offComp.filterOverdue')},
    {id: 'resolved', label: t('common.resolved')},
    {id: 'escalated', label: t('offComp.filterEscalated')},
  ];

  const [filter, setFilter] = useState<OfficialComplaintFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('safety_sla');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = officialJurisdictionIssues.filter((issue) => {
      if (q) {
        const hay = [
          issue.id,
          issue.title,
          issue.description,
          issue.approximateArea,
          issue.hierarchy.ward,
          issue.assignedDepartments.join(' '),
          CATEGORY_MAP[issue.category].label,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      switch (filter) {
        case 'new':
          return issue.status === 'submitted' || issue.status === 'ai_analysed';
        case 'critical':
          return issue.safetySeverity === 'critical';
        case 'high':
          return issue.safetySeverity === 'high';
        case 'unassigned':
          return issue.assignedDepartments.length === 0 || !issue.assignedStaffName;
        case 'assigned':
          return issue.status === 'assigned';
        case 'in_progress':
          return (
            issue.status === 'received_by_department' ||
            issue.status === 'under_process'
          );
        case 'overdue':
          return isIssueOverdue(issue, slaConfig);
        case 'resolved':
          return isIssueClosed(issue);
        case 'escalated':
          return issue.escalation.state !== 'none';
        default:
          return true;
      }
    });

    if (sortMode === 'safety_sla') {
      return sortIssuesBySafetyAndSla(filtered, slaConfig);
    }
    if (sortMode === 'deadline_asc') {
      return [...filtered].sort(
        (a, b) =>
          getIssueDueAt(a, slaConfig).getTime() -
          getIssueDueAt(b, slaConfig).getTime()
      );
    }
    if (sortMode === 'newest') {
      return [...filtered].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return [...filtered].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [officialJurisdictionIssues, searchQuery, filter, sortMode, slaConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedIssues = filteredAndSorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-[#0F172A] sm:text-2xl">
            {t('offComp.title')}
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">
            {t('offComp.subtitle')}
          </p>
        </div>
        <span className="font-mono text-xs text-slate-500 tabular-nums">
          {t('offComp.matchingCount', {count: filteredAndSorted.length})}
        </span>
      </div>

      {/* Search, Sort & Filters */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={t('offComp.searchPlaceholder')}
              className="min-h-10 w-full rounded-md border border-[#E2E8F0] bg-white pl-9 pr-3 text-xs text-[#0F172A]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="official-sort"
              className="text-xs font-semibold text-slate-600 whitespace-nowrap"
            >
              {t('offComp.sortBy')}
            </label>
            <select
              id="official-sort"
              value={sortMode}
              onChange={(e) => {
                setSortMode(e.target.value as SortMode);
                setPage(1);
              }}
              className="min-h-10 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#0F172A]"
            >
              <option value="safety_sla">{t('offComp.sortSafetySla')}</option>
              <option value="deadline_asc">{t('offComp.sortDeadline')}</option>
              <option value="newest">{t('offComp.sortNewest')}</option>
              <option value="oldest">{t('offComp.sortOldest')}</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setFilter(tab.id);
                setPage(1);
              }}
              className={`min-h-8 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                filter === tab.id
                  ? 'border-[#0F766E] bg-[#0F766E] text-white'
                  : 'border-[#E2E8F0] bg-[#F8FAFC] text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-slate-600">
              <tr>
                <th className="px-3.5 py-3 font-semibold">{t('offComp.colId')}</th>
                <th className="px-3.5 py-3 font-semibold">{t('offComp.colCategory')}</th>
                <th className="px-3.5 py-3 font-semibold">{t('offComp.colDesc')}</th>
                <th className="px-3.5 py-3 font-semibold">{t('offComp.colSeverity')}</th>
                <th className="px-3.5 py-3 font-semibold">{t('offComp.colStatus')}</th>
                <th className="px-3.5 py-3 font-semibold">{t('offComp.colLocation')}</th>
                <th className="px-3.5 py-3 font-semibold">{t('offComp.colDept')}</th>
                <th className="px-3.5 py-3 font-semibold">{t('offComp.colSubmitted')}</th>
                <th className="px-3.5 py-3 font-semibold">{t('offComp.colAge')}</th>
                <th className="px-3.5 py-3 font-semibold">{t('offComp.colUpvotes')}</th>
                <th className="px-3.5 py-3 font-semibold text-right">{t('offComp.colAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {paginatedIssues.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-slate-500">
                    {t('common.noMatches')}
                  </td>
                </tr>
              ) : (
                paginatedIssues.map((issue) => {
                  const overdue = isIssueOverdue(issue, slaConfig);
                  return (
                    <tr key={issue.id} className="hover:bg-slate-50/80">
                      <td className="px-3.5 py-3 font-mono font-semibold text-[#0F172A] whitespace-nowrap">
                        <div>{issue.id}</div>
                        {overdue && (
                          <span className="text-[10px] font-bold text-red-700">
                            {t('offDash.overdueTag')}
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap text-slate-700">
                        {tc(issue.category, true)}
                      </td>
                      <td className="px-3.5 py-3 max-w-xs">
                        <p className="font-semibold text-[#0F172A] line-clamp-1">
                          {issue.title}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {issue.description}
                        </p>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <SeverityLabel severity={issue.safetySeverity} compact />
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <ResolutionStatusLabel status={issue.status} />
                      </td>
                      <td className="px-3.5 py-3 max-w-[180px]">
                        <p className="font-medium text-[#0F172A] truncate">
                          {issue.hierarchy.ward}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {issue.approximateArea}
                        </p>
                      </td>
                      <td className="px-3.5 py-3 max-w-[160px] text-slate-700">
                        <p className="truncate">
                          {issue.assignedDepartments.map((d) => tDept(d)).join(', ') || t('offDetail.unassigned')}
                        </p>
                        {issue.assignedStaffName && (
                          <p className="text-[11px] text-[#0F766E] truncate">
                            {issue.assignedStaffName}
                          </p>
                        )}
                      </td>
                      <td className="px-3.5 py-3 font-mono whitespace-nowrap text-slate-600 tabular-nums">
                        {new Date(issue.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-3.5 py-3 font-mono whitespace-nowrap text-slate-700 tabular-nums">
                        {getComplaintAgeLabel(issue.createdAt)}
                      </td>
                      <td className="px-3.5 py-3 font-mono font-semibold text-slate-700 tabular-nums">
                        {issue.upvotedByUserIds.length}
                      </td>
                      <td className="px-3.5 py-3 text-right whitespace-nowrap">
                        <Link
                          to={`/official/complaints/${issue.id}`}
                          className="inline-flex items-center gap-1 rounded border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-semibold text-[#0F766E] hover:bg-teal-50"
                        >
                          <span>{t('offComp.manageBtn')}</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-xs text-slate-600">
          <span className="font-mono tabular-nums">
            {t('offComp.pageOf', {page: safePage, total: totalPages})}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-8 items-center gap-1 rounded border border-[#E2E8F0] bg-white px-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>{t('offComp.prevBtn')}</span>
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex h-8 items-center gap-1 rounded border border-[#E2E8F0] bg-white px-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <span>{t('offComp.nextBtn')}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
