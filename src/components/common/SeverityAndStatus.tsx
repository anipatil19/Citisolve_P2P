import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  ShieldAlert,
} from 'lucide-react';
import {SEVERITY_CONFIG} from '../../constants/civicDomain';
import {useTranslation} from '../../i18n/useTranslation';
import type {ComplaintLifecycleStage, SafetySeverity} from '../../types/civic';

export const SeverityLabel: React.FC<{
  severity: SafetySeverity;
  compact?: boolean;
}> = ({severity, compact = false}) => {
  const cfg = SEVERITY_CONFIG[severity];
  const {tSev} = useTranslation();
  const label = tSev(severity);

  const Icon =
    severity === 'critical'
      ? AlertOctagon
      : severity === 'high'
        ? ShieldAlert
        : severity === 'medium'
          ? AlertTriangle
          : Info;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap shrink-0 ${cfg.badgeBg} ${cfg.badgeText} ${cfg.borderClass}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{compact ? label : `${label}`}</span>
    </span>
  );
};

export const ResolutionStatusLabel: React.FC<{
  status: ComplaintLifecycleStage;
}> = ({status}) => {
  const {ts} = useTranslation();
  const label = ts(status);

  const isConfirmed = status === 'resolution_confirmed';
  const isAwaiting = status === 'resolved_awaiting_confirmation';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 ${
        isConfirmed
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : isAwaiting
            ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
            : 'border-sky-200 bg-sky-50 text-sky-800'
      }`}
    >
      {isConfirmed ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      <span>{label}</span>
    </span>
  );
};
