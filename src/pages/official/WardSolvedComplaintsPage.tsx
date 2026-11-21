import React, {useMemo} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight, CheckCircle2, Clock} from 'lucide-react';
import {CivicImage} from '../../components/common/CivicImage';
import {
  ResolutionStatusLabel,
  SeverityLabel,
} from '../../components/common/SeverityAndStatus';
import {useCitiSolve} from '../../context/CitiSolveContext';
import {useTranslation} from '../../i18n/useTranslation';
import {isIssueClosed} from '../../utils/officialHelpers';

export const WardSolvedComplaintsPage: React.FC = () => {
  const {currentOfficial, officialJurisdictionIssues} = useCitiSolve();
  const {t, tDept} = useTranslation();

  const solvedIssues = useMemo(
    () =>
      officialJurisdictionIssues
        .filter(isIssueClosed)
        .sort(
          (a, b) =>
            new Date(b.resolutionEvidence?.resolvedAt ?? b.createdAt).getTime() -
            new Date(a.resolutionEvidence?.resolvedAt ?? a.createdAt).getTime()
        ),
    [officialJurisdictionIssues]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-[#0F172A] sm:text-2xl">
            {t('ward.solvedTitle')}
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">
            {t('ward.solvedSubtitle')}{' '}
            <strong className="text-[#0F766E]">
              {currentOfficial?.authorizedWards.join(', ')}
            </strong>
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-mono text-xs font-bold text-[#0B8043]">
          <CheckCircle2 className="h-4 w-4" />
          <span>{t('ward.solvedCountBadge', {count: solvedIssues.length})}</span>
        </span>
      </div>

      {solvedIssues.length === 0 ? (
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-8 text-center text-xs text-slate-500">
          {t('ward.noSolvedYet')}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {solvedIssues.map((issue) => (
            <article
              key={issue.id}
              className="overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/70 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0F9D58] text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <span className="font-mono text-xs font-bold text-[#0B8043]">
                    {issue.id}
                  </span>
                </div>
                <ResolutionStatusLabel status={issue.status} />
              </div>

              <div className="p-4 space-y-3">
                <div className="flex gap-3">
                  <CivicImage
                    src={issue.photoUrl}
                    alt={issue.title}
                    className="h-20 w-24 shrink-0 rounded-md object-cover border border-[#E2E8F0]"
                  />
                  <div className="min-w-0 space-y-1">
                    <SeverityLabel severity={issue.safetySeverity} compact />
                    <h2 className="text-sm font-bold text-[#0F172A] line-clamp-2">
                      {issue.title}
                    </h2>
                    <p className="text-xs text-slate-600">
                      {issue.approximateArea} ·{' '}
                      <strong className="text-[#0F766E]">
                        {issue.assignedDepartments.map((d) => tDept(d)).join(' + ')}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 text-xs space-y-1">
                  <p className="font-semibold text-[#0F172A]">
                    {t('ward.resolutionSummary')}
                  </p>
                  <p className="text-slate-700">
                    {issue.resolutionEvidence?.note ??
                      issue.timeline[issue.timeline.length - 1]?.note}
                  </p>
                  <p className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(
                        issue.resolutionEvidence?.resolvedAt ??
                          issue.timeline[issue.timeline.length - 1]?.timestamp ??
                          issue.createdAt
                      ).toLocaleString('en-IN')}
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span className="font-medium text-emerald-700">
                    {t('ward.syncedTag')}
                  </span>
                  <Link
                    to={`/official/complaints/${issue.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-[#0F766E] hover:underline"
                  >
                    <span>{t('ward.dossierBtn')}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
