import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
  Building2,
  Camera,
  CheckCircle2,
  Loader2,
  MapPin,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {LanguageSelector} from '../components/common/LanguageSelector';
import {DEMO_LOCALITIES, SUPPORTED_LANGUAGES} from '../constants/civicDomain';
import {useCitiSolve} from '../context/CitiSolveContext';
import {DEMO_OFFICIAL_ACCOUNTS} from '../data/officialDemoData';
import {useTranslation} from '../i18n/useTranslation';
import type {
  AgeEligibilityOption,
  LocationPermissionStatus,
  SupportedLanguageCode,
  UserRole,
} from '../types/civic';

export const WelcomeAuthPage: React.FC = () => {
  const {
    appLanguage,
    setAppLanguage,
    loginAsDemoCitizen,
    loginWithCredentials,
    loginWithOfficialCredentials,
    registerCitizen,
  } = useCitiSolve();
  const {t} = useTranslation();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
  const [citizenView, setCitizenView] = useState<'login' | 'register' | 'forgot'>('login');
  const [officialForgotOpen, setOfficialForgotOpen] = useState(false);

  // Citizen login state
  const [loginIdentifier, setLoginIdentifier] = useState('ananya.deshmukh@example.in');
  const [loginPassword, setLoginPassword] = useState('demo-pass');

  // Official login state (strictly 2 roles: Municipal Officer & Ward Officer)
  const [officialLoginRole, setOfficialLoginRole] = useState<
    'municipal_admin' | 'ward_officer'
  >('municipal_admin');
  const [officialIdentifier, setOfficialIdentifier] = useState(
    DEMO_OFFICIAL_ACCOUNTS[0].employeeId
  );
  const [officialPassword, setOfficialPassword] = useState('official-demo');

  // Citizen registration state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ageEligibility, setAgeEligibility] =
    useState<AgeEligibilityOption>('adult_18_plus');
  const [guardianName, setGuardianName] = useState('');
  const [guardianConsentConfirmed, setGuardianConsentConfirmed] = useState(false);

  const [selectedLocalityIdx, setSelectedLocalityIdx] = useState(0);
  const [locationPermission, setLocationPermission] =
    useState<LocationPermissionStatus>('prompt');
  const [locationLabel, setLocationLabel] = useState(
    'Tap Enable Location for nearby pins'
  );
  const [liveCoords, setLiveCoords] = useState<
    | {
        lat: number;
        lng: number;
        accuracyMeters?: number;
        updatedAt: string;
      }
    | undefined
  >(undefined);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [locating, setLocating] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [forgotInput, setForgotInput] = useState('');

  const handleRoleSwitch = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
    setSuccessMsg(null);
    setOfficialForgotOpen(false);
    if (role === 'government_official') {
      setCitizenView('login');
    }
  };

  const handleRequestLocation = () => {
    setErrorMsg(null);
    if (ageEligibility === 'minor_with_guardian' && !guardianConsentConfirmed) {
      setErrorMsg(
        'Guardian consent confirmation is required before enabling location for users under 18.'
      );
      return;
    }

    if (!('geolocation' in navigator)) {
      setLocationPermission('demo_manual');
      setLocationLabel(`Demo Ward: ${DEMO_LOCALITIES[selectedLocalityIdx].ward}`);
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const accuracy = Math.round(pos.coords.accuracy);
        setLiveCoords({
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
          accuracyMeters: accuracy,
          updatedAt: new Date().toISOString(),
        });
        setLocationPermission('granted');
        setLocationLabel(`Live GPS Enabled (±${accuracy}m)`);
      },
      () => {
        setLocating(false);
        setLocationPermission('denied');
        setLocationLabel(
          `Demo Ward fallback: ${DEMO_LOCALITIES[selectedLocalityIdx].ward}`
        );
      },
      {enableHighAccuracy: true, timeout: 6000}
    );
  };

  const handleRequestCameraPermission = async () => {
    setErrorMsg(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Camera hardware API unavailable in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: 'environment'},
        audio: false,
      });
      stream.getTracks().forEach((t) => t.stop());
      setCameraGranted(true);
    } catch {
      setErrorMsg('Camera permission was denied; you can enable it later in settings.');
    }
  };

  const handleCitizenLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (loginPassword.trim().length < 4) {
      setErrorMsg(t('auth.errPasswordLength'));
      return;
    }
    setSubmitting(true);
    window.setTimeout(() => {
      const res = loginWithCredentials(loginIdentifier);
      setSubmitting(false);
      if (!res.ok) {
        setErrorMsg(res.error ?? 'Could not sign in.');
        return;
      }
      navigate('/home');
    }, 180);
  };

  const handleGoogleDemoSignIn = () => {
    setErrorMsg(null);
    setSubmitting(true);
    window.setTimeout(() => {
      loginAsDemoCitizen('google');
      setSubmitting(false);
      navigate('/home');
    }, 180);
  };

  const handleOfficialLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    window.setTimeout(() => {
      const res = loginWithOfficialCredentials(
        officialIdentifier,
        officialPassword,
        officialLoginRole
      );
      setSubmitting(false);
      if (!res.ok) {
        setErrorMsg(res.error ?? 'Could not sign in to official portal.');
        return;
      }
      navigate('/official');
    }, 180);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (fullName.trim().length < 2) {
      setErrorMsg(t('auth.errNameRequired'));
      return;
    }
    const cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg(t('auth.errPhoneRequired'));
      return;
    }
    if (ageEligibility === 'minor_with_guardian') {
      if (guardianName.trim().length < 2 || !guardianConsentConfirmed) {
        setErrorMsg(t('auth.errGuardianRequired'));
        return;
      }
    }

    const chosenArea = DEMO_LOCALITIES[selectedLocalityIdx];
    const effectiveLocPerm: LocationPermissionStatus =
      locationPermission === 'prompt' ? 'demo_manual' : locationPermission;
    const effectiveLocLabel =
      locationPermission === 'granted'
        ? locationLabel
        : `Demonstration Ward Data (${chosenArea.ward})`;

    setSubmitting(true);
    window.setTimeout(() => {
      registerCitizen({
        name: fullName,
        phone,
        email,
        preferredLanguage: appLanguage,
        ageEligibility,
        guardianName:
          ageEligibility === 'minor_with_guardian' ? guardianName : undefined,
        guardianConsentConfirmed:
          ageEligibility === 'minor_with_guardian'
            ? guardianConsentConfirmed
            : undefined,
        hierarchy: chosenArea,
        locationPermission: effectiveLocPerm,
        locationSourceLabel: effectiveLocLabel,
        liveCoordinates: liveCoords,
        cameraPermission: cameraGranted ? 'granted' : 'prompt',
      });
      setSubmitting(false);
      setSuccessMsg(`Citizen account created for ${chosenArea.ward}.`);
      window.setTimeout(() => navigate('/home'), 450);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-center px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-md rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-7">
        {/* Top Row: Language Switcher */}
        <div className="flex justify-end mb-2">
          <LanguageSelector />
        </div>

        {/* Compact Wordmark & Heading */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0F766E] font-display text-sm font-bold text-white">
              C
            </span>
            <span className="font-display text-base font-bold tracking-tight text-[#0F172A]">
              {t('brand.name')}
            </span>
          </div>
          <h1 className="mt-3 font-display text-xl font-bold text-[#0F172A]">
            {t('auth.welcomeHeading')}
          </h1>
          <p className="mt-1 text-xs text-slate-600">{t('auth.signInSubtitle')}</p>
        </div>

        {/* Role Selector */}
        <div
          role="radiogroup"
          aria-label="Select portal role"
          className="mt-5 grid grid-cols-2 gap-2.5"
        >
          <button
            type="button"
            role="radio"
            aria-checked={selectedRole === 'citizen'}
            onClick={() => handleRoleSwitch('citizen')}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              selectedRole === 'citizen'
                ? 'border-[#0F766E] bg-teal-50/70 text-[#0F766E]'
                : 'border-[#E2E8F0] bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="h-4 w-4 shrink-0" />
            <span>{t('auth.citizenRole')}</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={selectedRole === 'government_official'}
            onClick={() => handleRoleSwitch('government_official')}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              selectedRole === 'government_official'
                ? 'border-[#0F766E] bg-teal-50/70 text-[#0F766E]'
                : 'border-[#E2E8F0] bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building2 className="h-4 w-4 shrink-0" />
            <span>{t('auth.officialRole')}</span>
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
          >
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="mt-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* CITIZEN AUTHENTICATION */}
        {selectedRole === 'citizen' && (
          <>
            {citizenView === 'login' && (
              <form onSubmit={handleCitizenLoginSubmit} className="mt-4 space-y-3.5">
                <div>
                  <label
                    htmlFor="citizen-identifier"
                    className="block text-xs font-semibold text-[#0F172A]"
                  >
                    {t('auth.phoneOrEmail')}
                  </label>
                  <input
                    id="citizen-identifier"
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder={t('auth.phoneOrEmailPlaceholder')}
                    required
                    className="mt-1 block min-h-10 w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="citizen-password"
                      className="block text-xs font-semibold text-[#0F172A]"
                    >
                      {t('auth.password')}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCitizenView('forgot');
                        setErrorMsg(null);
                      }}
                      className="text-xs font-medium text-[#0F766E] hover:underline cursor-pointer"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                  <input
                    id="citizen-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    required
                    className="mt-1 block min-h-10 w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:opacity-60 cursor-pointer"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{t('auth.loginBtn')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleGoogleDemoSignIn}
                  disabled={submitting}
                  className="flex min-h-10 w-full items-center justify-center rounded-md border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-semibold text-[#0F172A] hover:bg-slate-50 cursor-pointer"
                >
                  {t('auth.continueGoogle')}
                </button>

                <div className="border-t border-[#E2E8F0] pt-3 flex items-center justify-between text-xs text-slate-600">
                  <span>{t('auth.noAccount')}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCitizenView('register');
                      setErrorMsg(null);
                    }}
                    className="font-semibold text-[#0F766E] hover:underline cursor-pointer"
                  >
                    {t('auth.createAccount')}
                  </button>
                </div>

                <p className="text-[11px] text-center text-slate-500">
                  {t('auth.demoNotice')}
                </p>
              </form>
            )}

            {citizenView === 'forgot' && (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold text-[#0F172A]">
                  {t('auth.forgotPassword')}
                </p>
                <p className="text-xs text-slate-600">
                  {t('auth.forgotHelpCitizen')}
                </p>
                <input
                  type="text"
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  placeholder={t('auth.phoneOrEmail')}
                  className="block min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSuccessMsg(t('auth.forgotHelpCitizen'));
                    }}
                    className="min-h-10 flex-1 rounded-md bg-[#0F766E] px-3 py-2 text-xs font-semibold text-white hover:bg-[#115E59] cursor-pointer"
                  >
                    {t('common.submit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCitizenView('login');
                      setSuccessMsg(null);
                    }}
                    className="min-h-10 rounded-md border border-[#E2E8F0] px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {t('auth.backToLogin')}
                  </button>
                </div>
              </div>
            )}

            {citizenView === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-[#0F172A]">
                    {t('auth.createCitizenTitle')}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCitizenView('login');
                      setErrorMsg(null);
                    }}
                    className="text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer"
                  >
                    {t('auth.backToLogin')}
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="reg-name"
                    className="block text-xs font-semibold text-[#0F172A]"
                  >
                    {t('auth.fullName')}
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('auth.fullName')}
                    required
                    className="mt-1 block min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-1.5 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="reg-phone"
                      className="block text-xs font-semibold text-[#0F172A]"
                    >
                      {t('auth.phoneNumber')}
                    </label>
                    <input
                      id="reg-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98450 00000"
                      required
                      className="mt-1 block min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="reg-lang"
                      className="block text-xs font-semibold text-[#0F172A]"
                    >
                      {t('auth.preferredLanguage')}
                    </label>
                    <select
                      id="reg-lang"
                      value={appLanguage}
                      onChange={(e) =>
                        setAppLanguage(e.target.value as SupportedLanguageCode)
                      }
                      className="mt-1 block min-h-10 w-full rounded-md border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.nativeLabel} ({lang.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-semibold text-[#0F172A]"
                  >
                    {t('auth.emailOptional')}
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="citizen@example.in"
                    className="mt-1 block min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-1.5 text-sm"
                  />
                </div>

                <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-[#0F172A]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#0F766E]" />
                    <span>{t('auth.ageEligibility')}</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ageEligibility"
                      checked={ageEligibility === 'adult_18_plus'}
                      onChange={() => setAgeEligibility('adult_18_plus')}
                    />
                    <span>{t('auth.age18Plus')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ageEligibility"
                      checked={ageEligibility === 'minor_with_guardian'}
                      onChange={() => setAgeEligibility('minor_with_guardian')}
                    />
                    <span>{t('auth.ageUnder18')}</span>
                  </label>

                  {ageEligibility === 'minor_with_guardian' && (
                    <div className="space-y-1.5 pt-1 border-t border-[#E2E8F0]">
                      <input
                        type="text"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        placeholder={t('auth.guardianName')}
                        className="block min-h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs"
                      />
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={guardianConsentConfirmed}
                          onChange={(e) =>
                            setGuardianConsentConfirmed(e.target.checked)
                          }
                          className="mt-0.5"
                        />
                        <span>{t('auth.guardianConsent')}</span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="rounded-md border border-[#E2E8F0] p-2.5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#0F172A]">
                      {t('auth.wardLocality')}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={handleRequestLocation}
                        disabled={locating}
                        className="inline-flex items-center gap-1 rounded border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1 text-[11px] font-medium text-[#0F766E] hover:bg-teal-50 cursor-pointer"
                      >
                        <MapPin className="h-3 w-3" />
                        <span>
                          {locating
                            ? t('common.loading')
                            : locationPermission === 'granted'
                              ? t('auth.gpsEnabled')
                              : t('auth.allowGps')}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRequestCameraPermission}
                        className="inline-flex items-center gap-1 rounded border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        <Camera className="h-3 w-3" />
                        <span>
                          {cameraGranted
                            ? t('auth.cameraEnabled')
                            : t('auth.allowCamera')}
                        </span>
                      </button>
                    </div>
                  </div>
                  <select
                    aria-label={t('auth.wardLocality')}
                    value={selectedLocalityIdx}
                    onChange={(e) => setSelectedLocalityIdx(Number(e.target.value))}
                    className="block min-h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs"
                  >
                    {DEMO_LOCALITIES.map((loc, idx) => (
                      <option key={loc.ward} value={idx}>
                        {loc.locality} — {loc.ward}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">{locationLabel}</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:opacity-60 cursor-pointer"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{t('auth.createAccountSubmit')}</span>
                </button>
              </form>
            )}
          </>
        )}

        {/* GOVERNMENT OFFICIAL AUTHENTICATION (Only Municipal Officer & Ward Officer) */}
        {selectedRole === 'government_official' && (
          <form onSubmit={handleOfficialLoginSubmit} className="mt-4 space-y-3.5">
            <div>
              <p className="text-xs font-semibold text-[#0F172A] mb-1.5">
                {t('auth.selectOfficerAccount')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOfficialLoginRole('municipal_admin');
                    setOfficialIdentifier(DEMO_OFFICIAL_ACCOUNTS[0].employeeId);
                    setErrorMsg(null);
                  }}
                  className={`min-h-10 rounded-md border px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    officialLoginRole === 'municipal_admin'
                      ? 'border-[#0F766E] bg-teal-50/70 text-[#0F766E]'
                      : 'border-[#E2E8F0] bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t('common.municipalOfficer')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOfficialLoginRole('ward_officer');
                    setOfficialIdentifier(DEMO_OFFICIAL_ACCOUNTS[1].employeeId);
                    setErrorMsg(null);
                  }}
                  className={`min-h-10 rounded-md border px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    officialLoginRole === 'ward_officer'
                      ? 'border-[#0F766E] bg-teal-50/70 text-[#0F766E]'
                      : 'border-[#E2E8F0] bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t('common.wardOfficer')}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                {officialLoginRole === 'ward_officer'
                  ? t('auth.wardOfficerDesc')
                  : t('auth.municipalOfficerDesc')}
              </p>
            </div>

            <div>
              <label
                htmlFor="official-identifier"
                className="block text-xs font-semibold text-[#0F172A]"
              >
                {t('auth.officialEmailOrId')}
              </label>
              <input
                id="official-identifier"
                type="text"
                value={officialIdentifier}
                onChange={(e) => setOfficialIdentifier(e.target.value)}
                placeholder={t('auth.officialIdPlaceholder')}
                required
                className="mt-1 block min-h-10 w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="official-password"
                  className="block text-xs font-semibold text-[#0F172A]"
                >
                  {t('auth.password')}
                </label>
                <button
                  type="button"
                  onClick={() => setOfficialForgotOpen((prev) => !prev)}
                  className="text-xs font-medium text-[#0F766E] hover:underline cursor-pointer"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
              <input
                id="official-password"
                type="password"
                value={officialPassword}
                onChange={(e) => setOfficialPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                required
                className="mt-1 block min-h-10 w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A]"
              />
            </div>

            {officialForgotOpen && (
              <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 text-xs text-slate-600">
                {t('auth.enterOfficialIdPass')}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:opacity-60 cursor-pointer"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>
                {t('auth.loginAsOfficer', {
                  role:
                    officialLoginRole === 'ward_officer'
                      ? t('common.wardOfficer')
                      : t('common.municipalOfficer'),
                })}
              </span>
            </button>

            <p className="text-[11px] text-center text-slate-500">
              {t('auth.demoNotice')} (<span className="font-mono">BBMP-MUN-01</span> ·{' '}
              <span className="font-mono">BBMP-W80-01</span>)
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
