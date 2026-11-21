import React, {useState} from 'react';
import {Link, NavLink, useLocation, useNavigate} from 'react-router-dom';
import {
  Award,
  Bell,
  Camera,
  Check,
  Clock,
  History,
  Home,
  LogOut,
  User,
} from 'lucide-react';
import {LanguageSelector} from '../common/LanguageSelector';
import {useCitiSolve} from '../../context/CitiSolveContext';
import {useTranslation} from '../../i18n/useTranslation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({children}) => {
  const {t} = useTranslation();

  const DESKTOP_NAV_LINKS = [
    {to: '/home', label: t('nav.home')},
    {to: '/report', label: t('home.tileReport')},
    {to: '/status', label: t('home.tileMyComplaints')},
    {to: '/rewards', label: t('nav.rewards')},
    {to: '/history', label: t('nav.history')},
    {to: '/profile', label: t('nav.profile')},
  ];
  const {
    currentUser,
    notifications,
    unreadNotificationsCount,
    totalAwardedPoints,
    markNotificationRead,
    markAllNotificationsRead,
    logout,
  } = useCitiSolve();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const hasMobileHeroHeader =
    location.pathname === '/home' || location.pathname === '/status';

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Compact mobile top bar on inner pages (Home & Status render edge-to-edge indigo headers) */}
      <header
        className={`sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md ${
          hasMobileHeroHeader ? 'hidden lg:block' : 'block'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-16">
          <Link
            to="/home"
            className="font-display text-lg font-bold tracking-tight text-indigo-700 whitespace-nowrap shrink-0 sm:text-xl"
          >
            CitiSOLVE
          </Link>

          <nav
            aria-label="Primary citizen navigation"
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            {DESKTOP_NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({isActive}) =>
                  `border-b-2 py-1.5 transition-colors duration-150 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-indigo-600 font-semibold text-indigo-700'
                      : 'border-transparent hover:border-slate-300 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <LanguageSelector compact />

            <div className="relative">
              <button
                type="button"
                aria-label={`${t('nav.notifications')} (${unreadNotificationsCount})`}
                onClick={() => {
                  setNotifOpen((prev) => !prev);
                  setProfileMenuOpen(false);
                }}
                className="relative flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[10px] font-bold text-white tabular-nums">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  role="dialog"
                  aria-label={t('nav.notifications')}
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h2 className="font-display text-sm font-semibold text-slate-900">
                      {t('nav.notifications')}
                    </h2>
                    {unreadNotificationsCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {t('nav.markAllRead')}
                      </button>
                    )}
                  </div>

                  <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-500">
                        {t('nav.noNotifications')}
                      </p>
                    ) : (
                      notifications.slice(0, 6).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            markNotificationRead(item.id);
                            setNotifOpen(false);
                            if (item.linkTo) navigate(item.linkTo);
                          }}
                          className={`w-full rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                            item.read
                              ? 'border-slate-100 bg-white hover:bg-slate-50'
                              : 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50'
                          }`}
                        >
                          <p className="text-xs font-semibold text-slate-900">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">
                            {item.message}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                aria-label="Account menu"
                onClick={() => {
                  setProfileMenuOpen((prev) => !prev);
                  setNotifOpen(false);
                }}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 cursor-pointer whitespace-nowrap"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                  {(currentUser?.name ?? 'C').charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline max-w-28 truncate">
                  {currentUser?.name ?? t('common.citizen')}
                </span>
                <span className="hidden md:inline font-mono text-xs font-semibold text-indigo-600 tabular-nums">
                  {t('nav.ptsBadge', {pts: totalAwardedPoints})}
                </span>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {currentUser?.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {currentUser?.hierarchy.ward}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="mt-1 flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <User className="h-4 w-4 text-slate-500" />
                    {t('nav.profile')}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('common.signOut')}
                  </button>
                </div>
              )}
            </div>

            <Link
              to="/report"
              className="hidden lg:inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 whitespace-nowrap shrink-0"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              <span>{t('home.tileReport')}</span>
            </Link>
          </div>
        </div>
      </header>

      <main
        className={`mx-auto w-full max-w-6xl flex-1 pb-24 lg:px-6 lg:py-6 lg:pb-10 ${
          hasMobileHeroHeader ? 'px-0 pt-0' : 'px-4 pt-4'
        }`}
      >
        {children}
      </main>

      {/* Mobile-App 5-Tab Bottom Bar (Thumb Zone) */}
      <nav
        aria-label="Mobile app navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 items-center border-t border-slate-200 bg-white/95 px-1 backdrop-blur-md lg:hidden"
      >
        <NavLink
          to="/home"
          className={({isActive}) =>
            `flex min-h-11 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-tight ${
              isActive ? 'text-indigo-600' : 'text-slate-500'
            }`
          }
        >
          <Home className="h-5 w-5" />
          <span>{t('nav.home')}</span>
        </NavLink>

        <NavLink
          to="/status"
          className={({isActive}) =>
            `flex min-h-11 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-tight ${
              isActive ? 'text-indigo-600' : 'text-slate-500'
            }`
          }
        >
          <Clock className="h-5 w-5" />
          <span>{t('nav.track')}</span>
        </NavLink>

        <div className="flex items-center justify-center">
          <Link
            to="/report"
            aria-label={t('home.tileReport')}
            className="flex h-12 w-12 -translate-y-2 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-transform active:scale-95"
          >
            <Camera className="h-5 w-5" />
          </Link>
        </div>

        <NavLink
          to="/rewards"
          className={({isActive}) =>
            `flex min-h-11 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-tight ${
              isActive ? 'text-indigo-600' : 'text-slate-500'
            }`
          }
        >
          <Award className="h-5 w-5" />
          <span>{t('nav.rewards')}</span>
        </NavLink>

        <NavLink
          to="/history"
          className={({isActive}) =>
            `flex min-h-11 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-tight ${
              isActive ? 'text-indigo-600' : 'text-slate-500'
            }`
          }
        >
          <History className="h-5 w-5" />
          <span>{t('nav.history')}</span>
        </NavLink>
      </nav>

      <footer className="hidden border-t border-slate-200 bg-white lg:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 text-xs text-slate-500">
          <span>
            {t('brand.name')} — {t('brand.tagline')}
          </span>
          <span>{t('nav.footerTagline')}</span>
        </div>
      </footer>
    </div>
  );
};
