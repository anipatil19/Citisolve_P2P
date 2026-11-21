import React, {useMemo, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {ArrowUpRight, CheckCircle2, MapPin} from 'lucide-react';
import {
  ResolutionStatusLabel,
  SeverityLabel,
} from '../../components/common/SeverityAndStatus';
import {OfficialWardMap} from '../../components/official/OfficialWardMap';
import {SolvedSuccessModal} from '../../components/official/SolvedSuccessModal';
import {useCitiSolve} from '../../context/CitiSolveContext';
import {useTranslation} from '../../i18n/useTranslation';
import type {CivicIssue, SafetySeverity} from '../../types/civic';
import {
  getComplaintAgeLabel,
  isIssueClosed,
  sortIssuesBySafetyAndSla,
} from '../../utils/officialHelpers';

export const WardMapSeverityPage: React.FC = () => {
  const {
    currentOfficial,
    officialJurisdictionIssues,
    slaConfig,
    resolveOfficialComplaint,
  } = useCitiSolve();
  const navigate = useNavigate();
  const {t, tc, tSev, tDept} = useTranslation();

  const [severityFilter, setSeverityFilter] = useState<'all' | SafetySeverity>('all');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [solvedBanner, setSolvedBanner] = useState<CivicIssue | null>(null);

  const openWardIssues = useMemo(() => {
    const filtered = officialJurisdictionIssues.filter((issue) => {
      if (isIssueClosed(issue)) return false;
      if (severityFilter !== 'all' && issue.safetySeverity !== severityFilter) {
        return false;
      }
      return true;
    });
    return sortIssuesBySafetyAndSla(filtered, slaConfig);
  }, [officialJurisdictionIssues, severityFilter, slaConfig]);

  const severityCounts = useMemo(() => {
    const openOnly = officialJurisdictionIssues.filter((i) => !isIssueClosed(i));
    return {
      critical: openOnly.filter((i) => i.safetySeverity === 'critical').length,
      high: openOnly.filter((i) => i.safetySeverity === 'high').length,
      medium: openOnly.filter((i) => i.safetySeverity === 'medium').length,
      low: openOnly.filter((i) => i.safetySeverity === 'low').length,
    };
  }, [officialJurisdictionIssues]);

  const selectedIssue =
    officialJurisdictionIssues.find((i) => i.id === selectedIssueId) ??
    openWardIssues[0] ??
    null;

  const handleMarkSolved = (issue: CivicIssue) => {
    const res = resolveOfficialComplaint(issue.id, {
      resolutionNote: `Verified and marked solved on-site by ${currentOfficial?.designation ?? 'Ward Officer'}.`,
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
            {t('ward.mapTitle')}
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">
            {t('ward.mapSubtitle', {
              wards: currentOfficial?.authorizedWards.join(', ') ?? '',
            })}
          </p>
        </div>
        <Link
          to="/official/ward-track"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#0F766E] hover:bg-slate-50"
        >
          <span>{t('ward.trackTitle')}</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Severity Filter Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <button
          type="button"
          onClick={() => setSeverityFilter('all')}
          className={`rounded-lg border p-3 text-left cursor-pointer ${
            severityFilter === 'all'
              ? 'border-[#0F766E] bg-teal-50/70'
              : 'border-[#E2E8F0] bg-white hover:bg-slate-50'
          }`}
        >
          <p className="text-[11px] font-semibold uppercase text-slate-500">
            {t('ward.allActive')}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-[#0F172A]">
            {severityCounts.critical +
              severityCounts.high +
              severityCounts.medium +
              severityCounts.low}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter('critical')}
          className={`rounded-lg border p-3 text-left cursor-pointer ${
            severityFilter === 'critical'
              ? 'border-red-500 bg-red-50'
              : 'border-[#E2E8F0] bg-white hover:bg-red-50/40'
          }`}
        >
          <p className="text-[11px] font-semibold uppercase text-red-700">
            {tSev('critical')}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-red-700">
            {severityCounts.critical}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter('high')}
          className={`rounded-lg border p-3 text-left cursor-pointer ${
            severityFilter === 'high'
              ? 'border-orange-500 bg-orange-50'
              : 'border-[#E2E8F0] bg-white hover:bg-orange-50/40'
          }`}
        >
          <p className="text-[11px] font-semibold uppercase text-orange-700">
            {tSev('high')}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-orange-700">
            {severityCounts.high}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter('medium')}
          className={`rounded-lg border p-3 text-left cursor-pointer ${
            severityFilter === 'medium'
              ? 'border-amber-500 bg-amber-50'
              : 'border-[#E2E8F0] bg-white hover:bg-amber-50/40'
          }`}
        >
          <p className="text-[11px] font-semibold uppercase text-amber-800">
            {tSev('medium')}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-amber-800">
            {severityCounts.medium}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter('low')}
          className={`rounded-lg border p-3 text-left cursor-pointer ${
            severityFilter === 'low'
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-[#E2E8F0] bg-white hover:bg-emerald-50/40'
          }`}
        >
          <p className="text-[11px] font-semibold uppercase text-emerald-700">
            {tSev('low')}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-700">
            {severityCounts.low}
          </p>
        </button>
      </div>

      {/* Map + Selected Pin Panel */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <OfficialWardMap
            issues={openWardIssues}
            selectedIssueId={selectedIssue?.id ?? null}
            onSelectIssue={setSelectedIssueId}
            authorizedWards={
              currentOfficial?.authorizedWards ?? ['Ward 80 — Hoysala Nagar']
            }
          />
        </div>

        <aside className="rounded-lg border border-[#E2E8F0] bg-white p-4 space-y-3 lg:col-span-4">
          <h2 className="font-display text-sm font-bold text-[#0F172A]">
            {t('ward.selectedIssue')}
          </h2>
          {selectedIssue ? (
            <div className="space-y-3 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono font-bold text-[#0F766E]">
                  {selectedIssue.id}
                </span>
                <SeverityLabel severity={selectedIssue.safetySeverity} compact />
                <ResolutionStatusLabel status={selectedIssue.status} />
              </div>

              <p className="text-sm font-bold text-[#0F172A]">
                {selectedIssue.title}
              </p>

              <p className="text-slate-600">{selectedIssue.description}</p>

              <div className="rounded border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 space-y-1">
                <p className="flex items-center gap-1.5 text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-[#0F766E]" />
                  <span>{selectedIssue.approximateArea}</span>
                </p>
                <p className="text-slate-600">
                  <strong>{t('offMap.deptLabel')}</strong>{' '}
                  {selectedIssue.assignedDepartments.map((d) => tDept(d)).join(' + ')}
                </p>
                <p className="text-slate-600">
                  <strong>{t('offMap.categoryLabel')}</strong>{' '}
                  {tc(selectedIssue.category)}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {!isIssueClosed(selectedIssue) && (
                  <button
                    type="button"
                    onClick={() => handleMarkSolved(selectedIssue)}
                    className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-md bg-[#0F9D58] px-3 text-xs font-bold text-white hover:bg-[#0B8043] cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{t('ward.markSolvedQuick')}</span>
                  </button>
                )}

                <Link
                  to={`/official/complaints/${selectedIssue.id}`}
                  className="inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0F766E] hover:bg-slate-100"
                >
                  <span>{t('offMap.openDossier')}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              {t('ward.allFilteredSolved')}
            </p>
          )}
        </aside>
      </div>

      {/* Ward Priority List with 1-Click Mark Solved */}
      <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-[#0F172A]">
            {t('ward.activeBySev', {count: openWardIssues.length})}
          </h2>
          <span className="text-[11px] text-slate-500">
            {t('ward.clickMarkSolved')}
          </span>
        </div>

        {openWardIssues.length === 0 ? (
          <p className="text-xs text-slate-500">
            {t('ward.noActiveSev')}
          </p>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {openWardIssues.map((issue) => (
              <div
                key={issue.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-[#0F172A]">
                      {issue.id}
                    </span>
                    <SeverityLabel severity={issue.safetySeverity} compact />
                    <ResolutionStatusLabel status={issue.status} />
                  </div>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {issue.title}
                  </p>
                  <p className="text-xs text-slate-600">
                    {issue.approximateArea} · {t('offMap.deptLabel')}{' '}
                    <strong className="text-[#0F766E]">
                      {issue.assignedDepartments.map((d) => tDept(d)).join(' + ')}
                    </strong>{' '}
                    · {t('offDash.ageLabel')} <span className="font-mono">{getComplaintAgeLabel(issue.createdAt)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMarkSolved(issue)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[#0F9D58] px-3 text-xs font-semibold text-white hover:bg-[#0B8043] cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{t('ward.markSolvedQuick')}</span>
                  </button>
                  <Link
                    to={`/official/complaints/${issue.id}`}
                    className="inline-flex min-h-9 items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0F766E] hover:bg-slate-100"
                  >
                    <span>{t('offComp.manageBtn')}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
