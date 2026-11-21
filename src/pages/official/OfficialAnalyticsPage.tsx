import React, {useMemo, useState} from 'react';
import {BarChart3, Filter} from 'lucide-react';
import {
  CATEGORY_MAP,
  ISSUE_CATEGORIES,
  MUNICIPAL_DEPARTMENTS,
} from '../../constants/civicDomain';
import {useCitiSolve} from '../../context/CitiSolveContext';
import type {SafetySeverity} from '../../types/civic';
import {isIssueClosed, isIssueOverdue} from '../../utils/officialHelpers';

export const OfficialAnalyticsPage: React.FC = () => {
  const {currentOfficial, officialJurisdictionIssues, slaConfig} = useCitiSolve();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [wardFilter, setWardFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const filteredIssues = useMemo(() => {
    return officialJurisdictionIssues.filter((issue) => {
      if (wardFilter !== 'all' && issue.hierarchy.ward !== wardFilter) return false;
      if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;
      if (
        departmentFilter !== 'all' &&
        !issue.assignedDepartments.includes(departmentFilter)
      ) {
        return false;
      }
      const createdMs = new Date(issue.createdAt).getTime();
      if (startDate) {
        const startMs = new Date(`${startDate}T00:00:00`).getTime();
        if (createdMs < startMs) return false;
      }
      if (endDate) {
        const endMs = new Date(`${endDate}T23:59:59`).getTime();
        if (createdMs > endMs) return false;
      }
      return true;
    });
  }, [
    officialJurisdictionIssues,
    wardFilter,
    categoryFilter,
    departmentFilter,
    startDate,
    endDate,
  ]);

  const metrics = useMemo(() => {
    const total = filteredIssues.length;
    const resolved = filteredIssues.filter(isIssueClosed);
    const pending = total - resolved.length;
    const overdue = filteredIssues.filter((i) =>
      isIssueOverdue(i, slaConfig)
    ).length;

    const resolutionHoursList = resolved
      .map((issue) => {
        const resolvedTs =
          issue.resolutionEvidence?.resolvedAt ??
          issue.timeline.find(
            (t) =>
              t.stage === 'resolved_awaiting_confirmation' ||
              t.stage === 'resolution_confirmed'
          )?.timestamp;
        if (!resolvedTs) return null;
        return Math.max(
          1,
          (new Date(resolvedTs).getTime() - new Date(issue.createdAt).getTime()) /
            (1000 * 60 * 60)
        );
      })
      .filter((v): v is number => v !== null);

    const avgResolutionHours =
      resolutionHoursList.length > 0
        ? Math.round(
            resolutionHoursList.reduce((a, b) => a + b, 0) /
              resolutionHoursList.length
          )
        : null;

    const overduePct = total > 0 ? Math.round((overdue / total) * 100) : 0;
    const resolvedPct = total > 0 ? Math.round((resolved.length / total) * 100) : 0;

    return {
      total,
      resolvedCount: resolved.length,
      pendingCount: pending,
      overdueCount: overdue,
      overduePct,
      resolvedPct,
      avgResolutionHours,
    };
  }, [filteredIssues, slaConfig]);

  const overTimeBuckets = useMemo(() => {
    const map = new Map<string, number>();
    filteredIssues.forEach((issue) => {
      const day = new Date(issue.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      });
      map.set(day, (map.get(day) ?? 0) + 1);
    });
    return Array.from(map.entries());
  }, [filteredIssues]);

  const categoryCounts = useMemo(() => {
    return ISSUE_CATEGORIES.map((cat) => ({
      id: cat.id,
      label: cat.shortLabel,
      count: filteredIssues.filter((i) => i.category === cat.id).length,
    })).filter((c) => c.count > 0);
  }, [filteredIssues]);

  const severityCounts = useMemo(() => {
    const order: SafetySeverity[] = ['critical', 'high', 'medium', 'low'];
    return order.map((sev) => ({
      sev,
      count: filteredIssues.filter((i) => i.safetySeverity === sev).length,
    }));
  }, [filteredIssues]);

  const repeatedLocations = useMemo(() => {
    const map = new Map<string, {area: string; ward: string; total: number; open: number}>();
    filteredIssues.forEach((issue) => {
      const key = `${issue.approximateArea}__${issue.hierarchy.ward}`;
      const existing = map.get(key) ?? {
        area: issue.approximateArea,
        ward: issue.hierarchy.ward,
        total: 0,
        open: 0,
      };
      existing.total += 1;
      if (!isIssueClosed(issue)) existing.open += 1;
      map.set(key, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredIssues]);

  const departmentPerformance = useMemo(() => {
    return MUNICIPAL_DEPARTMENTS.map((dept) => {
      const items = filteredIssues.filter((i) =>
        i.assignedDepartments.includes(dept)
      );
      const resolved = items.filter(isIssueClosed).length;
      const overdue = items.filter((i) => isIssueOverdue(i, slaConfig)).length;
      return {
        dept,
        total: items.length,
        resolved,
        pending: items.length - resolved,
        overdue,
      };
    }).filter((d) => d.total > 0);
  }, [filteredIssues, slaConfig]);

  const wardBreakdown = useMemo(() => {
    const wards = Array.from(
      new Set(filteredIssues.map((i) => i.hierarchy.ward))
    );
    return wards.map((ward) => {
      const items = filteredIssues.filter((i) => i.hierarchy.ward === ward);
      const resolved = items.filter(isIssueClosed).length;
      return {
        ward,
        total: items.length,
        resolved,
        pending: items.length - resolved,
      };
    });
  }, [filteredIssues]);

  const maxCatCount = Math.max(1, ...categoryCounts.map((c) => c.count));
  const maxDayCount = Math.max(1, ...overTimeBuckets.map(([, c]) => c));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-[#0F172A]">
          Reports &amp; Municipal Analytics
        </h1>
        <p className="text-xs text-slate-600">
          Computed from demonstration and session complaints inside{' '}
          <span className="font-semibold text-[#0F766E]">
            {currentOfficial?.municipality}
          </span>
          .
        </p>
      </div>

      {/* Filters */}
      <section className="rounded-lg border border-[#E2E8F0] bg-white p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
          <Filter className="h-4 w-4 text-[#0F766E]" />
          <span>Filter Analytics Scope</span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="ana-start" className="block text-[11px] text-slate-500 mb-1">
              From Date
            </label>
            <input
              id="ana-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="min-h-9 w-full rounded-md border border-[#E2E8F0] px-2.5 text-xs"
            />
          </div>
          <div>
            <label htmlFor="ana-end" className="block text-[11px] text-slate-500 mb-1">
              To Date
            </label>
            <input
              id="ana-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="min-h-9 w-full rounded-md border border-[#E2E8F0] px-2.5 text-xs"
            />
          </div>
          <div>
            <label htmlFor="ana-ward" className="block text-[11px] text-slate-500 mb-1">
              Ward
            </label>
            <select
              id="ana-ward"
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="min-h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs"
            >
              <option value="all">All Authorized Wards</option>
              {(currentOfficial?.authorizedWards ?? []).map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ana-cat" className="block text-[11px] text-slate-500 mb-1">
              Category
            </label>
            <select
              id="ana-cat"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="min-h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs"
            >
              <option value="all">All Categories</option>
              {ISSUE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shortLabel}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ana-dept" className="block text-[11px] text-slate-500 mb-1">
              Department
            </label>
            <select
              id="ana-dept"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="min-h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs"
            >
              <option value="all">All Departments</option>
              {MUNICIPAL_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase text-slate-500">
            Total Filtered
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-[#0F172A]">
            {metrics.total}
          </p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase text-slate-500">
            Avg Resolution Time
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-[#0F766E]">
            {metrics.avgResolutionHours !== null ? `${metrics.avgResolutionHours}h` : 'N/A'}
          </p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase text-slate-500">
            Overdue Percentage
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-red-700">
            {metrics.overduePct}%
          </p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase text-slate-500">
            Resolved vs Pending
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-[#0F172A]">
            {metrics.resolvedCount} / {metrics.pendingCount}
          </p>
          <p className="text-[11px] text-slate-500">{metrics.resolvedPct}% resolved</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Complaints Over Time */}
        <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#0F766E]" />
            <h2 className="font-display text-sm font-bold text-[#0F172A]">
              Complaints Over Time
            </h2>
          </div>
          {overTimeBuckets.length === 0 ? (
            <p className="text-xs text-slate-500">No complaints match selected filters.</p>
          ) : (
            <div className="space-y-2">
              {overTimeBuckets.map(([day, count]) => (
                <div key={day} className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-mono text-slate-700">{day}</span>
                    <span className="font-mono font-semibold text-[#0F172A]">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0F766E]"
                      style={{width: `${Math.round((count / maxDayCount) * 100)}%`}}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Category & Severity Distribution */}
        <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-4">
          <h2 className="font-display text-sm font-bold text-[#0F172A]">
            Category &amp; Severity Distribution
          </h2>
          <div className="space-y-2">
            {categoryCounts.map((c) => (
              <div key={c.id} className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-700">{CATEGORY_MAP[c.id].shortLabel}</span>
                  <span className="font-mono font-semibold">{c.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0F766E]"
                    style={{width: `${Math.round((c.count / maxCatCount) * 100)}%`}}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 border-t border-[#E2E8F0] pt-3 text-center text-xs">
            {severityCounts.map((s) => (
              <div key={s.sev} className="rounded border border-[#E2E8F0] bg-[#F8FAFC] p-2">
                <p className="uppercase text-[10px] font-semibold text-slate-500">
                  {s.sev}
                </p>
                <p className="font-mono text-base font-bold text-[#0F172A]">{s.count}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Ward-wise, Repeated Locations & Department Performance */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3">
          <h2 className="font-display text-sm font-bold text-[#0F172A]">
            Repeated Issue Locations (Area Clusters)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] uppercase text-slate-500">
                <tr>
                  <th className="px-2.5 py-2">Approximate Area</th>
                  <th className="px-2.5 py-2">Ward</th>
                  <th className="px-2.5 py-2">Reports</th>
                  <th className="px-2.5 py-2">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {repeatedLocations.map((loc) => (
                  <tr key={`${loc.area}_${loc.ward}`}>
                    <td className="px-2.5 py-2 font-medium text-[#0F172A]">{loc.area}</td>
                    <td className="px-2.5 py-2 text-slate-600">{loc.ward}</td>
                    <td className="px-2.5 py-2 font-mono">{loc.total}</td>
                    <td className="px-2.5 py-2 font-mono font-semibold text-[#0F766E]">
                      {loc.open}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3">
          <h2 className="font-display text-sm font-bold text-[#0F172A]">
            Department Performance &amp; Ward Summary
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] uppercase text-slate-500">
                <tr>
                  <th className="px-2.5 py-2">Department</th>
                  <th className="px-2.5 py-2">Total</th>
                  <th className="px-2.5 py-2">Resolved</th>
                  <th className="px-2.5 py-2">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {departmentPerformance.map((d) => (
                  <tr key={d.dept}>
                    <td className="px-2.5 py-2 font-medium text-[#0F172A]">{d.dept}</td>
                    <td className="px-2.5 py-2 font-mono">{d.total}</td>
                    <td className="px-2.5 py-2 font-mono text-emerald-700">{d.resolved}</td>
                    <td className="px-2.5 py-2 font-mono text-red-700">{d.overdue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {wardBreakdown.length > 0 && (
            <div className="border-t border-[#E2E8F0] pt-3 space-y-1.5">
              <p className="text-[11px] font-bold uppercase text-slate-500">
                Ward Breakdown
              </p>
              {wardBreakdown.map((w) => (
                <div
                  key={w.ward}
                  className="flex items-center justify-between rounded border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs"
                >
                  <span className="font-medium text-[#0F172A]">{w.ward}</span>
                  <span className="font-mono text-slate-600">
                    {w.resolved} resolved / {w.pending} pending ({w.total} total)
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
