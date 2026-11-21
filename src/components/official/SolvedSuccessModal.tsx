import React from 'react';
import {Check} from 'lucide-react';
import {useTranslation} from '../../i18n/useTranslation';

interface SolvedSuccessModalProps {
  open: boolean;
  complaintId: string;
  title: string;
  departments: string[];
  onClose: () => void;
  onViewSolved?: () => void;
}

export const SolvedSuccessModal: React.FC<SolvedSuccessModalProps> = ({
  open,
  complaintId,
  title,
  departments,
  onClose,
  onViewSolved,
}) => {
  const {t, tDept} = useTranslation();
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Issue marked as solved"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-b from-[#0F9D58] to-[#0B8043] p-6 text-center text-white shadow-2xl">
        {/* GPay-style Circular Tick Mark */}
        <div className="mx-auto mt-3 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 ring-8 ring-white/10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#0F9D58] shadow-lg">
            <Check className="h-10 w-10 stroke-[3.5]" />
          </div>
        </div>

        <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">
          {t('solvedModal.title')}
        </h2>

        <p className="mt-1.5 font-mono text-xs font-semibold text-emerald-100">
          {complaintId}
        </p>

        <p className="mt-2 line-clamp-2 text-sm font-medium text-white/95">
          {title}
        </p>

        <div className="mt-4 rounded-2xl bg-white/15 px-4 py-3 text-xs text-emerald-50 space-y-1">
          <p className="font-semibold text-white">
            {t('solvedModal.department')}: {departments.map((d) => tDept(d)).join(' + ')}
          </p>
          <p>
            {t('solvedModal.subtitle')}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {onViewSolved && (
            <button
              type="button"
              onClick={onViewSolved}
              className="min-h-11 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#0B8043] shadow-sm hover:bg-emerald-50 cursor-pointer"
            >
              {t('solvedModal.viewSolvedBtn')}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 w-full rounded-xl border border-white/30 bg-transparent px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 cursor-pointer"
          >
            {t('solvedModal.doneBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};
