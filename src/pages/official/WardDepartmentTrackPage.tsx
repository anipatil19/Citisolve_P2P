import React, {useMemo, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {ArrowUpRight, Building2, CheckCircle2} from 'lucide-react';
import {
  ResolutionStatusLabel,
  SeverityLabel,
} from '../../components/common/SeverityAndStatus';
import {SolvedSuccessModal} from '../../components/official/SolvedSuccessModal';
import {
  COMPLAINT_LIFECYCLE_STAGES,
  MUNICIPAL_DEPARTMENTS,
} from '../../constants/civicDomain';
import {useCitiSolve} from '../../context/CitiSolveContext';
import {useTranslation} from '../../i18n/useTranslation';
import type {CivicIssue} from '../../types/civic';
import {isIssueClosed} from '../../utils/officialHelpers';

export const WardDepartmentTrackPage: React.FC = () => {
  const {
    currentOfficial,
    officialJurisdictionIssues,
    updateOfficialComplaintProgress,
    resolveOfficialComplaint,
  } = useCitiSolve();
  const navigate = useNavigate();
  const {t, ts, tDept} = useTranslation();

  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [solvedBanner, setSolvedBanner] = useState<CivicIssue | null>(null);

  const groupedByDept = useMemo(() => {
    const depts =
      deptFilter === 'all'
        ? MUNICIPAL_DEPARTMENTS
        : MUNICIPAL_DEPARTMENTS.filter((d) => d === deptFilter);

    return depts
      .map((dept) => {
        const items = officialJurisdictionIssues.filter((issue) =>
          issue.assignedDepartments.includes(dept)
        );
        return {dept, items};
      })
      .filter((group) => group.items.length > 0);
  }, [officialJurisdictionIssues, deptFilter]);

  const handleMarkSolved = (issue: CivicIssue) => {
    const res = resolveOfficialComplaint(issue.id, {
      resolutionNote: `Department field work completed and marked solved by ${currentOfficial?.designation ?? 'Ward Officer'}.`,
    });
    if (res.ok) {
      setSolvedBanner(issue);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-[#0F172A] sm:text-2xl">
            {t('ward.trackTitle')}
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">
            {t('ward.trackSubtitle')}
          </p>
        </div>

        <select
          aria-label={t('ward.filterDept')}
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="min-h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#0F172A]"
        >
          <option value="all">{t('offDept.allDepts')}</option>
          {MUNICIPAL_DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {tDept(d)}
            </option>
          ))}
        </select>
      </div>

      {groupedByDept.length === 0 ? (
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-8 text-center text-xs text-slate-500">
          {t('ward.noDeptComplaints')}
        </div>
      ) : (
        <div className="space-y-5">
          {groupedByDept.map(({dept, items}) => {
            const openCount = items.filter((i) => !isIssueClosed(i)).length;
            const solvedCount = items.length - openCount;

            return (
              <section
                key={dept}
                className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#0F766E]" />
                    <h2 className="font-display text-sm font-bold text-[#0F172A]">
                      {tDept(dept)}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold text-amber-800">
                      {openCount} {t('offDash.colOpen')}
                    </span>
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                      {solvedCount} {t('offDept.solvedTab')}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-[#E2E8F0]">
                  {items.map((issue) => {
                    const stageIdx = COMPLAINT_LIFECYCLE_STAGES.findIndex(
                      (s) => s.id === issue.status
                    );
                    const closed = isIssueClosed(issue);

                    return (
                      <div key={issue.id} className="p-4 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-mono font-bold text-[#0F766E]">
                                {issue.id}
                              </span>
                              <SeverityLabel severity={issue.safetySeverity} compact />
                              <ResolutionStatusLabel status={issue.status} />
                            </div>
                            <p className="text-sm font-bold text-[#0F172A]">
                              {issue.title}
                            </p>
                            <p className="text-xs text-slate-600">
                              {issue.approximateArea} · {t('status.reportedLabel')}{' '}
                              {new Date(issue.createdAt).toLocaleDateString('en-IN')}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {!closed && (
                              <>
                                {issue.status === 'assigned' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateOfficialComplaintProgress(
                                        issue.id,
                                        'received_by_department',
                                        `Received by ${dept} unit.`
                                      )
                                    }
                                    className="min-h-8 rounded border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                                  >
                                    {t('ward.markDeptReceived')}
                                  </button>
                                )}
                                {issue.status !== 'under_process' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateOfficialComplaintProgress(
                                        issue.id,
                                        'under_process',
                                        `Field team dispatched for ${dept}.`
                                      )
                                    }
                                    className="min-h-8 rounded border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                                  >
                                    {t('ward.markInProcess')}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleMarkSolved(issue)}
                                  className="inline-flex min-h-8 items-center gap-1 rounded bg-[#0F9D58] px-3 text-xs font-semibold text-white hover:bg-[#0B8043] cursor-pointer"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>{t('ward.markSolvedQuick')}</span>
                                </button>
                              </>
                            )}

                            <Link
                              to={`/official/complaints/${issue.id}`}
                              className="inline-flex min-h-8 items-center gap-1 rounded border border-[#E2E8F0] bg-white px-2.5 text-xs font-semibold text-[#0F766E] hover:bg-slate-50"
                            >
                              <span>{t('ward.detailsBtn')}</span>
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>

                        {/* 7-Stage Report Progress Bar */}
                        <div className="grid grid-cols-7 gap-1.5">
                          {COMPLAINT_LIFECYCLE_STAGES.map((stage, idx) => {
                            const reached = idx <= stageIdx;
                            return (
                              <div key={stage.id} className="space-y-1">
                                <div
                                  className={`h-2 rounded-full ${
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
              </section>
            );
          })}
        </div>
      )}

      <SolvedSuccessModal
        open={Boolean(solvedBanner)}
        complaintId={solvedBanner?.id ?? ''}
        title={solvedBanner?.title ?? ''}
        departments={solvedBanner?.assignedDepartments ?? []}
        onClose={() => setSolvedBanner(null)}
        onViewSolved={() => {
          setSolvedBanner(null);
          navigate('/official/ward-solved');
        }}
      />
    </div>
  );
};
