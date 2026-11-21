import React, {useState} from 'react';
import {Link, NavLink, useNavigate} from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Menu,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import {useCitiSolve} from '../../context/CitiSolveContext';

const MUNICIPAL_NAV_ITEMS = [
  {to: '/official', label: 'Dashboard', icon: LayoutDashboard, end: true},
  {to: '/official/complaints', label: 'Complaint Management', icon: ClipboardList, end: false},
  {to: '/official/map', label: 'Ward Map', icon: MapIcon, end: false},
  {to: '/official/departments', label: 'Departments & Track', icon: Users, end: false},
  {to: '/official/escalations', label: 'Escalations', icon: AlertTriangle, end: false},
  {to: '/official/analytics', label: 'Reports & Analytics', icon: BarChart3, end: false},
  {to: '/official/notifications', label: 'Notifications', icon: Bell, end: false},
  {to: '/official/profile', label: 'Official Profile & Settings', icon: UserCog, end: false},
];

const WARD_OFFICER_NAV_ITEMS = [
  {to: '/official', label: '1. Map View & Severity', icon: MapIcon, end: true},
  {to: '/official/ward-track', label: '2. Dept & Report Track', icon: ClipboardList, end: false},
  {to: '/official/ward-solved', label: '3. Solved Complaints', icon: CheckCircle2, end: false},
];

export const OfficialLayout: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const {
    currentOfficial,
    officialNotifications,
    unreadOfficialNotificationsCount,
    markOfficialNotificationRead,
    logoutOfficial,
  } = useCitiSolve();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  if (!currentOfficial) return null;

  const isWardOfficer = currentOfficial.roleLevel === 'ward_officer';
  const navItems = isWardOfficer ? WARD_OFFICER_NAV_ITEMS : MUNICIPAL_NAV_ITEMS;

  const handleLogout = () => {
    logoutOfficial();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]">
      {/* Desktop Left Sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col border-r border-[#E2E8F0] bg-white transition-all duration-150 shrink-0 ${
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#E2E8F0] px-4">
          {!sidebarCollapsed && (
            <Link to="/official" className="flex items-center gap-2 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#0F766E] font-display text-sm font-bold text-white">
                C
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold tracking-tight text-[#0F172A] truncate">
                  CitiSOLVE
                </p>
                <p className="text-[10px] font-medium text-[#0F766E] truncate">
                  Official Portal
                </p>
              </div>
            </Link>
          )}
          <button
            type="button"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E2E8F0] text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <nav
          aria-label="Official sidebar navigation"
          className="flex-1 space-y-1 p-2.5 overflow-y-auto"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({isActive}) =>
                  `flex items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#0F766E] text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-[#0F172A]'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {!sidebarCollapsed &&
                  item.to === '/official/notifications' &&
                  unreadOfficialNotificationsCount > 0 && (
                    <span className="rounded bg-red-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white tabular-nums">
                      {unreadOfficialNotificationsCount}
                    </span>
                  )}
              </NavLink>
            );
          })}
        </nav>

        {!sidebarCollapsed && (
          <div className="border-t border-[#E2E8F0] p-3 text-[11px] text-slate-600 space-y-1">
            <p className="font-semibold text-[#0F172A] truncate">
              {currentOfficial.municipality}
            </p>
            <p className="truncate">{currentOfficial.department}</p>
            <p className="truncate text-slate-500">
              Demo Mode · Role-Scoped Access
            </p>
          </div>
        )}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 flex w-68 flex-col bg-white border-r border-[#E2E8F0]">
            <div className="flex h-14 items-center justify-between border-b border-[#E2E8F0] px-4">
              <span className="font-display text-sm font-bold text-[#0F172A]">
                CitiSOLVE Official
              </span>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0] text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({isActive}) =>
                      `flex items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold ${
                        isActive
                          ? 'bg-[#0F766E] text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-[#E2E8F0] bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0] text-slate-700 lg:hidden cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 font-semibold text-[#0F172A]">
                  <Building2 className="h-3.5 w-3.5 text-[#0F766E]" />
                  {currentOfficial.municipality}
                </span>
                <span className="hidden sm:inline text-slate-300">|</span>
                <span className="hidden sm:inline font-medium text-slate-600 truncate">
                  {currentOfficial.department}
                </span>
                <span className="hidden md:inline text-slate-300">|</span>
                <span className="hidden md:inline text-slate-600 truncate">
                  {currentOfficial.authorizedWards.join(', ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {currentOfficial.designation} · ID: {currentOfficial.employeeId} (Demo Auth)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <button
                type="button"
                aria-label={`Official notifications (${unreadOfficialNotificationsCount} unread)`}
                onClick={() => setNotifOpen((o) => !o)}
                className="relative flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                {unreadOfficialNotificationsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[10px] font-bold text-white tabular-nums">
                    {unreadOfficialNotificationsCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-lg border border-[#E2E8F0] bg-white p-3 shadow-lg z-40">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                    <span className="text-xs font-bold text-[#0F172A]">
                      Jurisdiction Alerts
                    </span>
                    <Link
                      to="/official/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-semibold text-[#0F766E] hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
                    {officialNotifications
                      .filter((n) => currentOfficial.authorizedWards.includes(n.ward))
                      .slice(0, 5)
                      .map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            markOfficialNotificationRead(n.id);
                            setNotifOpen(false);
                            if (n.complaintId) {
                              navigate(`/official/complaints/${n.complaintId}`);
                            }
                          }}
                          className={`w-full rounded-md border p-2 text-left text-xs cursor-pointer ${
                            n.read
                              ? 'border-[#E2E8F0] bg-white'
                              : 'border-teal-200 bg-teal-50/50'
                          }`}
                        >
                          <p className="font-semibold text-[#0F172A]">{n.title}</p>
                          <p className="mt-0.5 text-slate-600 line-clamp-2">
                            {n.message}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {!isWardOfficer && (
              <Link
                to="/official/profile"
                className="hidden sm:inline-flex h-9 items-center gap-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 text-xs font-semibold text-[#0F172A] hover:bg-slate-100"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded bg-[#0F766E] text-[11px] font-bold text-white">
                  {currentOfficial.name.charAt(0)}
                </span>
                <span className="max-w-28 truncate">{currentOfficial.name}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-700 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
};
