import React, {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCheck,
  Clock,
  MessageSquareWarning,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import {useCitiSolve} from '../../context/CitiSolveContext';
import {useTranslation} from '../../i18n/useTranslation';
import type {TranslationKey} from '../../i18n/en';
import type {OfficialNotificationItem} from '../../types/civic';

const NOTIFICATION_TYPES: OfficialNotificationItem['type'][] = [
  'new_complaint',
  'critical_issue',
  'assignment',
  'approaching_deadline',
  'overdue',
  'reassignment',
  'citizen_feedback',
  'escalation',
];

function renderTypeIcon(type: OfficialNotificationItem['type']) {
  switch (type) {
    case 'critical_issue':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case 'overdue':
      return <Clock className="h-4 w-4 text-red-600" />;
    case 'approaching_deadline':
      return <Clock className="h-4 w-4 text-amber-600" />;
    case 'escalation':
      return <ShieldAlert className="h-4 w-4 text-orange-600" />;
    case 'assignment':
    case 'reassignment':
      return <UserCheck className="h-4 w-4 text-[#0F766E]" />;
    case 'citizen_feedback':
      return <MessageSquareWarning className="h-4 w-4 text-indigo-600" />;
    default:
      return <Bell className="h-4 w-4 text-[#0F766E]" />;
  }
}

export const OfficialNotificationsPage: React.FC = () => {
  const {
    currentOfficial,
    officialNotifications,
    unreadOfficialNotificationsCount,
    markOfficialNotificationRead,
    markAllOfficialNotificationsRead,
  } = useCitiSolve();
  const {t} = useTranslation();

  const [typeFilter, setTypeFilter] = useState<'all' | OfficialNotificationItem['type']>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const scopedNotifications = useMemo(() => {
    if (!currentOfficial) return [];
    return officialNotifications.filter((n) => {
      if (!currentOfficial.authorizedWards.includes(n.ward)) return false;
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      if (unreadOnly && n.read) return false;
      return true;
    });
  }, [officialNotifications, currentOfficial, typeFilter, unreadOnly]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-[#0F172A]">
            {t('offNotif.title')}
          </h1>
          <p className="text-xs text-slate-600">
            {t('offNotif.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={markAllOfficialNotificationsRead}
          disabled={unreadOfficialNotificationsCount === 0}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#0F766E] hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
        >
          <CheckCheck className="h-4 w-4" />
          <span>{t('offNotif.markAllRead')} ({unreadOfficialNotificationsCount})</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E2E8F0] bg-white p-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-[#0F766E] text-white'
                : 'bg-[#F8FAFC] text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t('common.all')}
          </button>
          {NOTIFICATION_TYPES.map((nt) => (
            <button
              key={nt}
              type="button"
              onClick={() => setTypeFilter(nt)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                typeFilter === nt
                  ? 'bg-[#0F766E] text-white'
                  : 'bg-[#F8FAFC] text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t(`offNotif.type.${nt}` as TranslationKey)}
            </button>
          ))}
        </div>

        <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#0F766E]"
          />
          <span>{t('offNotif.unreadOnly')}</span>
        </label>
      </div>

      {/* Notification List */}
      <div className="space-y-2.5">
        {scopedNotifications.length === 0 ? (
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-8 text-center text-xs text-slate-500">
            {t('offNotif.empty')}
          </div>
        ) : (
          scopedNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4 ${
                notif.read
                  ? 'border-[#E2E8F0] bg-white'
                  : 'border-[#0F766E]/40 bg-teal-50/40'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="mt-0.5 shrink-0">{renderTypeIcon(notif.type)}</div>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded border border-[#E2E8F0] bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                      {t(`offNotif.type.${notif.type}` as TranslationKey)}
                    </span>
                    <span className="text-[11px] text-slate-500">{notif.ward}</span>
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-[#0F766E]" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {notif.title}
                  </p>
                  <p className="text-xs text-slate-600">{notif.message}</p>
                  <p className="font-mono text-[11px] text-slate-400">
                    {new Date(notif.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!notif.read && (
                  <button
                    type="button"
                    onClick={() => markOfficialNotificationRead(notif.id)}
                    className="min-h-8 rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {t('offNotif.markRead')}
                  </button>
                )}
                {notif.complaintId && (
                  <Link
                    to={`/official/complaints/${notif.complaintId}`}
                    onClick={() => markOfficialNotificationRead(notif.id)}
                    className="inline-flex min-h-8 items-center gap-1 rounded-md bg-[#0F766E] px-3 text-xs font-semibold text-white hover:bg-[#115E59]"
                  >
                    <span>{t('offNotif.openBtn')}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
