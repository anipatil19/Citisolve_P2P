import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  LogOut,
  MapPin,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {DEMO_LOCALITIES, SUPPORTED_LANGUAGES} from '../constants/civicDomain';
import {useCitiSolve} from '../context/CitiSolveContext';
import type {
  PrivacyDisplayPreference,
  SupportedLanguageCode,
} from '../types/civic';

export const ProfileSettingsPage: React.FC = () => {
  const {
    currentUser,
    updateProfile,
    logout,
    deleteAccount,
    resetDemoWorkspace,
    requestLiveLocationAccess,
    requestCameraAccess,
  } = useCitiSolve();
  const navigate = useNavigate();

  const [name, setName] = useState(currentUser?.name ?? '');
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [language, setLanguage] = useState<SupportedLanguageCode>(
    currentUser?.preferredLanguage ?? 'en'
  );
  const [localityIdx, setLocalityIdx] = useState(() => {
    const idx = DEMO_LOCALITIES.findIndex(
      (l) => l.ward === currentUser?.hierarchy.ward
    );
    return idx >= 0 ? idx : 0;
  });
  const [privacyPref, setPrivacyPref] = useState<PrivacyDisplayPreference>(
    currentUser?.privacyDisplayPreference ?? 'full_name'
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    currentUser?.notificationsEnabled ?? true
  );
  const [smsUpdatesEnabled, setSmsUpdatesEnabled] = useState(
    currentUser?.smsUpdatesEnabled ?? true
  );

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  if (!currentUser) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    const chosenHierarchy = DEMO_LOCALITIES[localityIdx];
    updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      preferredLanguage: language,
      hierarchy: chosenHierarchy,
      privacyDisplayPreference: privacyPref,
      notificationsEnabled,
      smsUpdatesEnabled,
    });
    setSaveMessage('Profile and privacy preferences updated.');
    window.setTimeout(() => setSaveMessage(null), 3500);
  };

  const handleRecheckLocation = async () => {
    const res = await requestLiveLocationAccess();
    setSaveMessage(res.message);
    window.setTimeout(() => setSaveMessage(null), 4000);
  };

  const handleRecheckCamera = async () => {
    const res = await requestCameraAccess();
    setSaveMessage(res.message);
    window.setTimeout(() => setSaveMessage(null), 4000);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmText.trim() !== 'DELETE') return;
    deleteAccount();
    setDeleteModalOpen(false);
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Citizen Profile &amp; Privacy Settings
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your contact details, preferred Indian language, leaderboard privacy mode, location permissions, and account controls.
        </p>
      </div>

      {saveMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="rounded-lg border border-slate-200 bg-white p-6 space-y-5"
      >
        <h2 className="font-display text-lg font-semibold text-slate-900">
          Personal &amp; Ward Details
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="prof-name"
              className="block text-xs font-medium text-slate-700"
            >
              Full Name
            </label>
            <input
              id="prof-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="prof-phone"
              className="block text-xs font-medium text-slate-700"
            >
              Phone Number (Kept Private)
            </label>
            <input
              id="prof-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="mt-1 block min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="prof-lang"
              className="block text-xs font-medium text-slate-700"
            >
              Preferred Language
            </label>
            <select
              id="prof-lang"
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value as SupportedLanguageCode)
              }
              className="mt-1 block min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name} ({l.nativeLabel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="prof-ward"
              className="block text-xs font-medium text-slate-700"
            >
              Locality / Municipality
            </label>
            <select
              id="prof-ward"
              value={localityIdx}
              onChange={(e) => setLocalityIdx(Number(e.target.value))}
              className="mt-1 block min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {DEMO_LOCALITIES.map((loc, idx) => (
                <option key={loc.ward} value={idx}>
                  {loc.locality} — {loc.ward}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5 space-y-4">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Privacy &amp; Notification Preferences
          </h2>

          <div>
            <label
              htmlFor="prof-privacy"
              className="block text-xs font-medium text-slate-700"
            >
              Public Display Name on Leaderboards &amp; Reports
            </label>
            <select
              id="prof-privacy"
              value={privacyPref}
              onChange={(e) =>
                setPrivacyPref(e.target.value as PrivacyDisplayPreference)
              }
              className="mt-1 block min-h-11 w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="full_name">Display Full Name</option>
              <option value="initials">Display Initials Only (e.g., A. D.)</option>
              <option value="ward_resident_alias">
                Anonymous Alias (Ward Citizen Contributor)
              </option>
            </select>
          </div>

          <div className="space-y-2.5 text-sm text-slate-700">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
              <span>In-app complaint lifecycle &amp; escalation alerts</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={smsUpdatesEnabled}
                onChange={(e) => setSmsUpdatesEnabled(e.target.checked)}
              />
              <span>SMS / WhatsApp resolution confirmation updates (when connected)</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <button
            type="submit"
            className="min-h-11 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer"
          >
            Save Profile Changes
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Device Permissions (Location &amp; Camera)
        </h2>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Location Permission</p>
            <p className="mt-0.5 text-xs text-slate-600">
              State:{' '}
              <span className="font-mono font-semibold text-slate-800">
                {currentUser.locationPermission}
              </span>{' '}
              · {currentUser.locationSourceLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRecheckLocation}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Enable / Re-check GPS</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Live Camera Permission</p>
            <p className="mt-0.5 text-xs text-slate-600">
              State:{' '}
              <span className="font-mono font-semibold text-slate-800">
                {currentUser.cameraPermission ?? 'prompt'}
              </span>{' '}
              · Required for in-app evidence capture
            </p>
          </div>

          <button
            type="button"
            onClick={handleRecheckCamera}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
          >
            <Camera className="h-3.5 w-3.5 text-indigo-600" />
            <span>Enable / Test Camera</span>
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Session &amp; Account Management
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>

          <button
            type="button"
            onClick={resetDemoWorkspace}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Sample Data</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDeleteConfirmText('');
              setDeleteModalOpen(true);
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {deleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm account deletion"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-2.5 text-red-700">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  Confirm Permanent Account Deletion
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  This removes your citizen profile and session reward ledger from local demonstration storage. Type <strong className="font-mono">DELETE</strong> below to confirm.
                </p>
              </div>
            </div>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="block min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.trim() !== 'DELETE'}
                onClick={handleConfirmDelete}
                className="min-h-10 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40 cursor-pointer"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
