import React, {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight, MapPin} from 'lucide-react';
import {
  ResolutionStatusLabel,
  SeverityLabel,
} from '../../components/common/SeverityAndStatus';
import {OfficialWardMap} from '../../components/official/OfficialWardMap';
import {ISSUE_CATEGORIES} from '../../constants/civicDomain';
import {useCitiSolve} from '../../context/CitiSolveContext';
import {useTranslation} from '../../i18n/useTranslation';
import type {ComplaintLifecycleStage, IssueCategoryId} from '../../types/civic';

export const OfficialWardMapPage: React.FC = () => {
  const {currentOfficial, officialJurisdictionIssues} = useCitiSolve();
  const {t, tc, ts, tDept} = useTranslation();

  const [categoryFilter, setCategoryFilter] = useState<'all' | IssueCategoryId>(
    'all'
  );
  const [statusFilter, setStatusFilter] = useState<
    'all' | ComplaintLifecycleStage
  >('all');
  const [selectedId, setSelectedId] = useState<string | null>(
    officialJurisdictionIssues[0]?.id ?? null
  );

  const filteredIssues = useMemo(() => {
    return officialJurisdictionIssues.filter((issue) => {
      if (categoryFilter !== 'all' && issue.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== 'all' && issue.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [officialJurisdictionIssues, categoryFilter, statusFilter]);

  const selectedIssue =
    filteredIssues.find((i) => i.id === selectedId) ?? filteredIssues[0] ?? null;

  if (!currentOfficial) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-[#0F172A] sm:text-2xl">
            {t('offMap.title')}
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">
            {t('offMap.subtitle', {
              count: filteredIssues.length,
              wards: currentOfficial.authorizedWards.join(', '),
            })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            aria-label={t('common.allCategories')}
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as 'all' | IssueCategoryId)
            }
            className="min-h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#0F172A]"
          >
            <option value="all">{t('common.allCategories')}</option>
            {ISSUE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {tc(c.id, true)}
              </option>
            ))}
          </select>

          <select
            aria-label={t('common.allStatuses')}
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as 'all' | ComplaintLifecycleStage
              )
            }
            className="min-h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#0F172A]"
          >
            <option value="all">{t('common.allStatuses')}</option>
            <option value="submitted">{ts('submitted')}</option>
            <option value="ai_analysed">{ts('ai_analysed')}</option>
            <option value="assigned">{ts('assigned')}</option>
            <option value="received_by_department">{ts('received_by_department', true)}</option>
            <option value="under_process">{ts('under_process')}</option>
            <option value="resolved_awaiting_confirmation">
              {ts('resolved_awaiting_confirmation', true)}
            </option>
            <option value="resolution_confirmed">{ts('resolution_confirmed')}</option>
          </select>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <OfficialWardMap
            issues={filteredIssues}
            selectedIssueId={selectedIssue?.id ?? null}
            onSelectIssue={setSelectedId}
            authorizedWards={currentOfficial.authorizedWards}
          />
        </div>

        <aside className="rounded-lg border border-[#E2E8F0] bg-white p-5 lg:col-span-4 space-y-3">
          <h2 className="font-display text-sm font-bold text-[#0F172A]">
            {t('offMap.selectedMarker')}
          </h2>
          {selectedIssue ? (
            <div className="space-y-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-[#0F766E]">
                  {selectedIssue.id}
                </span>
                <SeverityLabel severity={selectedIssue.safetySeverity} compact />
              </div>

              <p className="text-sm font-bold text-[#0F172A]">
                {selectedIssue.title}
              </p>
              <p className="text-slate-600">{selectedIssue.description}</p>

              <div className="space-y-1.5 border-t border-[#E2E8F0] pt-3">
                <p className="flex items-center gap-1.5 text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-[#0F766E]" />
                  <span>{selectedIssue.approximateArea}</span>
                </p>
                <p className="text-slate-600">
                  {t('offMap.categoryLabel')} {tc(selectedIssue.category)}
                </p>
                <p className="text-slate-600">
                  {t('offMap.deptLabel')} {selectedIssue.assignedDepartments.map((d) => tDept(d)).join(' + ')}
                </p>
                <div className="pt-1">
                  <ResolutionStatusLabel status={selectedIssue.status} />
                </div>
              </div>

              <Link
                to={`/official/complaints/${selectedIssue.id}`}
                className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-md bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#115E59]"
              >
                <span>{t('offMap.openDossier')}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              {t('offMap.noMarkers')}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
};
