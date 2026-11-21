import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {
  CheckCircle2,
  LogOut,
  RotateCcw,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import {useCitiSolve} from '../../context/CitiSolveContext';
import {DEMO_OFFICIAL_ACCOUNTS} from '../../data/officialDemoData';

export const OfficialProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentOfficial,
    officialAuditLog,
    loginWithOfficialCredentials,
    logoutOfficial,
    resetDemoWorkspace,
  } = useCitiSolve();

  const [guardResult, setGuardResult] = useState<string | null>(null);
  const [guardLoading, setGuardLoading] = useState(false);

  if (!currentOfficial) return null;

  const verifyBackendGuard = async () => {
    setGuardLoading(true);
    setGuardResult(null);
    try {
      const resp = await fetch('/api/official/verify-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-citisolve-role': 'government_official',
          'x-citisolve-municipality': encodeURIComponent(currentOfficial.municipality),
          'x-citisolve-wards': encodeURIComponent(
            JSON.stringify(currentOfficial.authorizedWards)
          ),
        },
        body: JSON.stringify({
          municipality: currentOfficial.municipality,
          ward: currentOfficial.authorizedWards[0],
        }),
      });
      const data = await resp.json();
      if (resp.ok && (data.authorized || data.allowed)) {
        setGuardResult(
          `Verified (${resp.status}): Authorized for ${data.municipality} (${data.authorizedWards.join(', ')}).`
        );
      } else {
        setGuardResult(
          `Denied (${resp.status}): ${data.message ?? data.error ?? 'Unauthorized'}`
        );
      }
    } catch {
      setGuardResult('Unable to reach /api/official/verify-access.');
    } finally {
      setGuardLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-[#0F172A]">
            Official Profile &amp; Audit Settings
          </h1>
          <p className="text-xs text-slate-600">
            Authorized jurisdiction credentials, backend access check, audit history, and demonstration controls.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            logoutOfficial();
            navigate('/');
          }}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Official Profile Summary */}
        <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-4 lg:col-span-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-[#0F766E]" />
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                Official Credentials
              </h2>
            </div>
            <span className="rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-[#0F766E]">
              Demo Official Session
            </span>
          </div>

          <dl className="grid gap-3 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Officer Name</dt>
              <dd className="font-semibold text-[#0F172A]">{currentOfficial.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Employee ID</dt>
              <dd className="font-mono font-semibold text-[#0F172A]">
                {currentOfficial.employeeId}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Official Email</dt>
              <dd className="font-medium text-[#0F172A]">
                {currentOfficial.officialEmail}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Designation</dt>
              <dd className="font-medium text-[#0F172A]">
                {currentOfficial.designation}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Role Level</dt>
              <dd className="font-mono uppercase text-[#0F766E]">
                {currentOfficial.roleLevel.replace('_', ' ')}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Municipality</dt>
              <dd className="font-medium text-[#0F172A]">
                {currentOfficial.municipality}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Department Scope</dt>
              <dd className="font-medium text-[#0F172A]">
                {currentOfficial.department}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Authorized Wards</dt>
              <dd className="font-medium text-[#0F172A]">
                {currentOfficial.authorizedWards.join(', ')}
              </dd>
            </div>
          </dl>

          <div className="border-t border-[#E2E8F0] pt-3 space-y-2">
            <button
              type="button"
              onClick={verifyBackendGuard}
              disabled={guardLoading}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-[#0F766E] px-3.5 text-xs font-semibold text-white hover:bg-[#115E59] cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>
                {guardLoading
                  ? 'Checking Backend Role Guard...'
                  : 'Verify Server-Side Role & Jurisdiction Guard'}
              </span>
            </button>
            {guardResult && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-[#0F766E]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{guardResult}</span>
              </p>
            )}
          </div>
        </section>

        {/* Demo Account Switcher & Reset */}
        <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-4 lg:col-span-6">
          <h2 className="font-display text-base font-bold text-[#0F172A]">
            Switch Demonstration Official Role
          </h2>
          <p className="text-xs text-slate-600">
            Switch between Municipal Officer and Ward Officer demonstration accounts.
          </p>

          <div className="space-y-2">
            {DEMO_OFFICIAL_ACCOUNTS.map((acc) => {
              const active = acc.id === currentOfficial.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() =>
                    loginWithOfficialCredentials(acc.employeeId, 'demo1234')
                  }
                  className={`flex w-full items-center justify-between rounded-md border px-3.5 py-2.5 text-left text-xs cursor-pointer ${
                    active
                      ? 'border-[#0F766E] bg-teal-50/70'
                      : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <p className="font-bold text-[#0F172A]">
                      {acc.name}{' '}
                      <span className="font-mono text-[#0F766E]">
                        ({acc.employeeId})
                      </span>
                    </p>
                    <p className="text-slate-600">
                      {acc.designation} · {acc.authorizedWards.join(', ')}
                    </p>
                  </div>
                  {active && (
                    <span className="font-semibold text-[#0F766E]">Active</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-[#E2E8F0] pt-3">
            <button
              type="button"
              onClick={() => {
                resetDemoWorkspace();
                navigate('/');
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset All Demonstration Data</span>
            </button>
          </div>
        </section>
      </div>

      {/* Audit Log */}
      <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 space-y-3">
        <h2 className="font-display text-base font-bold text-[#0F172A]">
          Official Action &amp; Override Audit Log ({officialAuditLog.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Complaint</th>
                <th className="px-3 py-2">Official</th>
                <th className="px-3 py-2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {officialAuditLog.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2 font-mono font-semibold text-[#0F172A]">
                    {entry.action}
                  </td>
                  <td className="px-3 py-2 font-mono">
                    {entry.complaintId ? (
                      <Link
                        to={`/official/complaints/${entry.complaintId}`}
                        className="text-[#0F766E] hover:underline"
                      >
                        {entry.complaintId}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                    {entry.officialName} ({entry.employeeId})
                  </td>
                  <td className="px-3 py-2 text-slate-600">{entry.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
