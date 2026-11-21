import React, {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, Building2, CheckCircle2, Clock} from 'lucide-react';
import {
  ResolutionStatusLabel,
  SeverityLabel,
} from '../../components/common/SeverityAndStatus';
import {
  COMPLAINT_LIFECYCLE_STAGES,
  ISSUE_CATEGORIES,
  MUNICIPAL_DEPARTMENTS,
} from '../../constants/civicDomain';
import {useCitiSolve} from '../../context/CitiSolveContext';
import {useTranslation} from '../../i18n/useTranslation';
import {isIssueClosed} from '../../utils/officialHelpers';

export const OfficialDepartmentsPage: React.FC = () => {
  const {officialJurisdictionIssues} = useCitiSolve();
  const {t, tc, ts, tDept} = useTranslation();

  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'solved'>('all');

  const departmentGroups = useMemo(() => {
    const depts =
      deptFilter === 'all'
        ? MUNICIPAL_DEPARTMENTS
        : MUNICIPAL_DEPARTMENTS.filter((d) => d === deptFilter);

    return depts.map((dept) => {
      const allAssigned = officialJurisdictionIssues.filter((i) =>
        i.assignedDepartments.includes(dept)
      );
      const filtered = allAssigned.filter((i) => {
        if (statusFilter === 'open') return !isIssueClosed(i);
        if (statusFilter === 'solved') return isIssueClosed(i);
        return true;
      });
      const solvedCount = allAssigned.filter(isIssueClosed).length;
      const openCount = allAssigned.length - solvedCount;
      const autoCategories = ISSUE_CATEGORIES.filter(
        (c) => c.defaultDepartment === dept
      ).map((c) => tc(c.id, true));

      return {
        dept,
        autoCategories,
        total: allAssigned.length,
        openCount,
        solvedCount,
        complaints: filtered,
      };
    });
  }, [officialJurisdictionIssues, deptFilter, statusFilter, tc]);

  const totalAutoAssigned = officialJurisdictionIssues.length;
  const totalSolved = officialJurisdictionIssues.filter(isIssueClosed).length;
  const totalOpen = totalAutoAssigned - totalSolved;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-[#0F172A]">
            {t('offDept.title')}
          </h1>
          <p className="text-xs text-slate-600">
            {t('offDept.subtitle')}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase text-slate-500">
            {t('offDept.activeDepts')}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-[#0F172A]">
            {MUNICIPAL_DEPARTMENTS.length}
          </p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase text-slate-500">
            {t('offDept.autoAssignedReports')}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-[#0F766E]">
            {totalAutoAssigned}
          </p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase text-slate-500">
            {t('offDept.openInProgress')}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-amber-700">
            {totalOpen}
          </p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase text-slate-500">
            {t('offDept.solvedComplaints')}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-[#0B8043]">
            {totalSolved}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-white p-3.5">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              {id: 'all', label: t('offDept.allComplaintsTab')},
              {id: 'open', label: t('offDept.openInProgress')},
              {id: 'solved', label: t('offDept.solvedTab')},
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`min-h-8 rounded-md px-3 text-xs font-semibold cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#0F766E] text-white'
                  : 'bg-[#F8FAFC] text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          aria-label={t('ward.filterDept')}
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="min-h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#0F172A]"
        >
          <option value="all">{t('offDept.allDepts')}</option>
          {MUNICIPAL_DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {tDept(dept)}
            </option>
          ))}
        </select>
      </div>

      {/* Departments with Auto-Assigned Complaints & Track Status */}
      <div className="space-y-4">
        {departmentGroups.map((group) => (
          <section
            key={group.dept}
            className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#0F766E]" />
                  <h2 className="font-display text-sm font-bold text-[#0F172A]">
                    {tDept(group.dept)}
                  </h2>
                </div>
                {group.autoCategories.length > 0 && (
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {t('offDept.autoCategories')} {group.autoCategories.join(', ')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="rounded border border-[#E2E8F0] bg-white px-2 py-0.5 font-semibold text-slate-700">
                  {group.total} {t('offDash.colTotal')}
                </span>
                <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">
                  {group.openCount} {t('offDash.colOpen')}
                </span>
                <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                  {group.solvedCount} {t('offDept.solvedTab')}
                </span>
              </div>
            </div>

            {group.complaints.length === 0 ? (
              <div className="p-4 text-xs text-slate-500">
                {t('offDept.noDeptComplaints', {dept: tDept(group.dept)})}
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {group.complaints.map((issue) => {
                  const stageIdx = COMPLAINT_LIFECYCLE_STAGES.findIndex(
                    (s) => s.id === issue.status
                  );
                  const closed = isIssueClosed(issue);

                  return (
                    <div key={issue.id} className="p-4 space-y-2.5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono font-bold text-[#0F766E]">
                              {issue.id}
                            </span>
                            <SeverityLabel severity={issue.safetySeverity} compact />
                            <ResolutionStatusLabel status={issue.status} />
                            {closed && (
                              <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-[#0B8043]">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>{t('offDept.solvedTab')}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-[#0F172A]">
                            {issue.title}
                          </p>
                          <p className="text-xs text-slate-600">
                            {issue.hierarchy.ward} · {issue.approximateArea} ·{' '}
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
                              <Clock className="h-3 w-3" />
                              {new Date(issue.createdAt).toLocaleDateString('en-IN')}
                            </span>
                          </p>
                          {issue.resolutionEvidence && (
                            <p className="text-xs font-medium text-emerald-800">
                              {t('offDept.resolutionLabel')} {issue.resolutionEvidence.note}
                            </p>
                          )}
                        </div>

                        <Link
                          to={`/official/complaints/${issue.id}`}
                          className="inline-flex min-h-8 items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0F766E] hover:bg-slate-100 shrink-0"
                        >
                          <span>{t('offComp.manageBtn')}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>

                      {/* 7-Stage Status Track */}
                      <div className="grid grid-cols-7 gap-1.5">
                        {COMPLAINT_LIFECYCLE_STAGES.map((stage, idx) => {
                          const reached = idx <= stageIdx;
                          return (
                            <div key={stage.id} className="space-y-1">
                              <div
                                className={`h-1.5 rounded-full ${
                                  reached
                                    ? closed
                                      ? 'bg-[#0F9D58]'
                                      : 'bg-[#0F766E]'
                                    : 'bg-slate-200'
                                }`}
                              />
                              <p
                                className={`hidden sm:block text-[10px] leading-tight ${
                                  reached
                                    ? 'font-semibold text-[#0F172A]'
                                    : 'text-slate-400'
                                }`}
                              >
                                {ts(stage.id, true)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};
