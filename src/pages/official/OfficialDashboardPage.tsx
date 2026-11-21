import React, {useMemo} from 'react';
import {Link} from 'react-router-dom';
import {
  AlertOctagon,
  ArrowUpRight,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import {
  ResolutionStatusLabel,
  SeverityLabel,
} from '../../components/common/SeverityAndStatus';
import {MUNICIPAL_DEPARTMENTS} from '../../constants/civicDomain';
import {useCitiSolve} from '../../context/CitiSolveContext';
import {useTranslation} from '../../i18n/useTranslation';
import {
  getComplaintAgeLabel,
  isIssueClosed,
  isIssueOverdue,
  sortIssuesBySafetyAndSla,
} from '../../utils/officialHelpers';
import type {IssueCategoryId} from '../../types/civic';

export const OfficialDashboardPage: React.FC = () => {
  const {
    currentOfficial,
    officialJurisdictionIssues,
    slaConfig,
  } = useCitiSolve();
  const {t, tc, tDept} = useTranslation();

  const stats = useMemo(() => {
    const total = officialJurisdictionIssues.length;
    const newCount = officialJurisdictionIssues.filter(
      (i) => i.status === 'submitted' || i.status === 'ai_analysed'
    ).length;
    const critical = officialJurisdictionIssues.filter(
      (i) => i.safetySeverity === 'critical' && !isIssueClosed(i)
    ).length;
    const high = officialJurisdictionIssues.filter(
      (i) => i.safetySeverity === 'high' && !isIssueClosed(i)
    ).length;
    const inProgress = officialJurisdictionIssues.filter(
      (i) =>
        i.status === 'assigned' ||
        i.status === 'received_by_department' ||
        i.status === 'under_process'
    ).length;
    const resolved = officialJurisdictionIssues.filter((i) =>
      isIssueClosed(i)
    ).length;
    const overdue = officialJurisdictionIssues.filter((i) =>
      isIssueOverdue(i, slaConfig)
    ).length;

    return {total, newCount, critical, high, inProgress, resolved, overdue};
  }, [officialJurisdictionIssues, slaConfig]);

  const priorityQueue = useMemo(
    () =>
      sortIssuesBySafetyAndSla(
        officialJurisdictionIssues.filter((i) => !isIssueClosed(i)),
        slaConfig
      ),
    [officialJurisdictionIssues, slaConfig]
  );

  const criticalAndOverdue = useMemo(
    () =>
      priorityQueue.filter(
        (i) => i.safetySeverity === 'critical' || isIssueOverdue(i, slaConfig)
      ),
    [priorityQueue, slaConfig]
  );

  const recentActivity = useMemo(() => {
    const events: Array<{
      id: string;
      complaintId: string;
      stage: string;
      note: string;
      timestamp: string;
    }> = [];
    for (const issue of officialJurisdictionIssues) {
      const latest = issue.timeline[issue.timeline.length - 1];
      if (latest) {
        events.push({
          id: `${issue.id}_${latest.timestamp}`,
          complaintId: issue.id,
          stage: latest.stage,
          note: latest.note,
          timestamp: latest.timestamp,
        });
      }
    }
    return events
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 6);
  }, [officialJurisdictionIssues]);

  const categoryBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const issue of officialJurisdictionIssues) {
      counts.set(issue.category, (counts.get(issue.category) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([cat, count]) => ({
        label: tc(cat as IssueCategoryId, true),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [officialJurisdictionIssues, tc]);

  const statusDistribution = useMemo(() => {
    const groups = [
      {
        label: t('offDash.newComplaints'),
        count: officialJurisdictionIssues.filter(
          (i) => i.status === 'submitted' || i.status === 'ai_analysed'
        ).length,
        color: 'bg-sky-600',
      },
      {
        label: t('offComp.filterAssigned'),
        count: officialJurisdictionIssues.filter(
          (i) =>
            i.status === 'assigned' || i.status === 'received_by_department'
        ).length,
        color: 'bg-amber-600',
      },
      {
        label: t('offDash.inProgress'),
        count: officialJurisdictionIssues.filter(
          (i) => i.status === 'under_process'
        ).length,
        color: 'bg-[#0F766E]',
      },
      {
        label: t('offDash.solvedCount'),
        count: officialJurisdictionIssues.filter((i) => isIssueClosed(i))
          .length,
        color: 'bg-emerald-600',
      },
    ];
    return groups;
  }, [officialJurisdictionIssues, t]);

  const wardOverview = useMemo(() => {
    const map = new Map<
      string,
      {ward: string; total: number; open: number; overdue: number}
    >();
    for (const issue of officialJurisdictionIssues) {
      const cur = map.get(issue.hierarchy.ward) ?? {
        ward: issue.hierarchy.ward,
        total: 0,
        open: 0,
        overdue: 0,
      };
      cur.total += 1;
      if (!isIssueClosed(issue)) cur.open += 1;
      if (isIssueOverdue(issue, slaConfig)) cur.overdue += 1;
      map.set(issue.hierarchy.ward, cur);
    }
    return Array.from(map.values());
  }, [officialJurisdictionIssues, slaConfig]);

  const deptPerformance = useMemo(() => {
    return MUNICIPAL_DEPARTMENTS.map((dept) => {
      const assigned = officialJurisdictionIssues.filter((i) =>
        i.assignedDepartments.includes(dept)
      );
      const resolved = assigned.filter((i) => isIssueClosed(i)).length;
      const overdue = assigned.filter((i) => isIssueOverdue(i, slaConfig)).length;
      return {dept, total: assigned.length, resolved, overdue};
    }).filter((d) => d.total > 0);
  }, [officialJurisdictionIssues, slaConfig]);

  if (!currentOfficial) return null;

  const summaryCards = [
    {label: t('offDash.totalInJurisdiction'), value: stats.total, tone: 'text-[#0F172A]'},
    {label: t('offDash.newComplaints'), value: stats.newCount, tone: 'text-sky-700'},
    {label: t('sev.critical'), value: stats.critical, tone: 'text-red-600'},
    {label: t('sev.high'), value: stats.high, tone: 'text-orange-600'},
    {label: t('offDash.inProgress'), value: stats.inProgress, tone: 'text-[#0F766E]'},
    {label: t('common.resolved'), value: stats.resolved, tone: 'text-emerald-700'},
    {label: t('offDash.overdueSla'), value: stats.overdue, tone: 'text-red-700'},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-[#0F172A] sm:text-2xl">
            {t('offDash.title')}
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">
            {t('offDash.subtitle', {wards: currentOfficial.authorizedWards.join(', ')})}
          </p>
        </div>
        <Link
          to="/official/complaints"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[#0F766E] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#115E59]"
        >
          <span>{t('offDash.manageAll')}</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 7 Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-[#E2E8F0] bg-white p-3.5"
          >
            <p className="text-[11px] font-medium text-slate-500">{card.label}</p>
            <p
              className={`mt-1 font-mono text-2xl font-bold tabular-nums ${card.tone}`}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Critical & Overdue Alert Section */}
      {criticalAndOverdue.length > 0 && (
        <section className="rounded-lg border border-red-200 bg-red-50/70 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-red-800">
              <AlertOctagon className="h-4 w-4 shrink-0" />
              <h2 className="font-display text-sm font-bold">
                {t('offDash.slaBreached')} ({criticalAndOverdue.length})
              </h2>
            </div>
            <Link
              to="/official/escalations"
              className="text-xs font-semibold text-red-800 hover:underline"
            >
              {t('offNav.escalations')} &rarr;
            </Link>
          </div>
          <div className="grid gap-2.5 md:grid-cols-2">
            {criticalAndOverdue.map((issue) => (
              <Link
                key={issue.id}
                to={`/official/complaints/${issue.id}`}
                className="flex items-center justify-between gap-3 rounded-md border border-red-200 bg-white p-3 hover:bg-red-50/30"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-[#0F172A]">
                      {issue.id}
                    </span>
                    <SeverityLabel severity={issue.safetySeverity} compact />
                    {isIssueOverdue(issue, slaConfig) && (
                      <span className="font-mono text-[11px] font-semibold text-red-700">
                        {t('offDash.overdueTag')}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs font-semibold text-[#0F172A]">
                    {issue.title}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Priority-Sorted Queue + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#0F172A]">
              {t('offDash.priorityQueue')}
            </h2>
            <span className="text-[11px] text-slate-500">
              {t('offDash.sortedBySla')}
            </span>
          </div>

          <div className="divide-y divide-[#E2E8F0]">
            {priorityQueue.slice(0, 6).map((issue) => (
              <div
                key={issue.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-[#0F172A]">
                      {issue.id}
                    </span>
                    <SeverityLabel severity={issue.safetySeverity} compact />
                    <ResolutionStatusLabel status={issue.status} />
                  </div>
                  <p className="truncate text-sm font-semibold text-[#0F172A]">
                    {issue.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {issue.hierarchy.ward} · {issue.assignedDepartments.map((d) => tDept(d)).join(' + ')} · {t('offDash.ageLabel')}{' '}
                    <span className="font-mono">
                      {getComplaintAgeLabel(issue.createdAt)}
                    </span>
                  </p>
                </div>
                <Link
                  to={`/official/complaints/${issue.id}`}
                  className="inline-flex min-h-9 items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#0F766E] hover:bg-teal-50 shrink-0"
                >
                  <span>{t('offComp.inspectBtn')}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 lg:col-span-5 space-y-3">
          <h2 className="font-display text-base font-bold text-[#0F172A]">
            {t('offDash.recentActivity')}
          </h2>
          <div className="divide-y divide-[#E2E8F0]">
            {recentActivity.map((act) => (
              <Link
                key={act.id}
                to={`/official/complaints/${act.complaintId}`}
                className="block py-2.5 hover:bg-slate-50/70"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono font-semibold text-[#0F766E]">
                    {act.complaintId}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    {new Date(act.timestamp).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-700 line-clamp-2">
                  {act.note}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Charts & Ward/Department Summaries */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3">
          <h2 className="font-display text-base font-bold text-[#0F172A]">
            {t('offDash.categoryWise')}
          </h2>
          <div className="space-y-2.5">
            {categoryBreakdown.map((item) => {
              const pct = Math.round(
                (item.count / Math.max(1, stats.total)) * 100
              );
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="font-mono text-slate-600 tabular-nums">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-[#0F766E]"
                      style={{width: `${pct}%`}}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3">
          <h2 className="font-display text-base font-bold text-[#0F172A]">
            {t('offDash.statusDist')}
          </h2>
          <div className="space-y-2.5">
            {statusDistribution.map((grp) => {
              const pct = Math.round(
                (grp.count / Math.max(1, stats.total)) * 100
              );
              return (
                <div key={grp.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{grp.label}</span>
                    <span className="font-mono text-slate-600 tabular-nums">
                      {grp.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${grp.color}`}
                      style={{width: `${pct}%`}}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#0F172A]">
              {t('offDash.wardOverview')}
            </h2>
            <ShieldAlert className="h-4 w-4 text-[#0F766E]" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2E8F0] text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-semibold">{t('offDash.colWard')}</th>
                  <th className="py-2 px-3 font-semibold">{t('offDash.colTotal')}</th>
                  <th className="py-2 px-3 font-semibold">{t('offDash.colOpen')}</th>
                  <th className="py-2 pl-3 font-semibold">{t('offDash.colOverdue')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {wardOverview.map((w) => (
                  <tr key={w.ward}>
                    <td className="py-2.5 pr-3 font-medium text-[#0F172A]">{w.ward}</td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">{w.total}</td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">{w.open}</td>
                    <td className="py-2.5 pl-3 font-mono font-semibold text-red-700 tabular-nums">
                      {w.overdue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3">
          <h2 className="font-display text-base font-bold text-[#0F172A]">
            {t('offDash.deptPerformance')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2E8F0] text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-semibold">{t('offDash.colDept')}</th>
                  <th className="py-2 px-3 font-semibold">{t('offDash.colAssigned')}</th>
                  <th className="py-2 px-3 font-semibold">{t('offDash.colResolved')}</th>
                  <th className="py-2 pl-3 font-semibold">{t('offDash.colOverdue')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {deptPerformance.map((d) => (
                  <tr key={d.dept}>
                    <td className="py-2.5 pr-3 font-medium text-[#0F172A]">{tDept(d.dept)}</td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">{d.total}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-700 tabular-nums">
                      {d.resolved}
                    </td>
                    <td className="py-2.5 pl-3 font-mono text-red-700 tabular-nums">
                      {d.overdue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
