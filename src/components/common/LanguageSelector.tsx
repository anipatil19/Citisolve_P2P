import React from 'react';
import {Globe} from 'lucide-react';
import {SUPPORTED_LANGUAGES} from '../../constants/civicDomain';
import {useTranslation} from '../../i18n/useTranslation';
import type {SupportedLanguageCode} from '../../types/civic';

interface LanguageSelectorProps {
  variant?: 'light' | 'dark' | 'indigo';
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'light',
  compact = false,
}) => {
  const {lang, setLang, t} = useTranslation();

  const wrapperClasses =
    variant === 'indigo'
      ? 'border-white/25 bg-white/15 text-white hover:bg-white/25'
      : variant === 'dark'
        ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

  const selectClasses =
    variant === 'indigo' || variant === 'dark'
      ? 'text-white [&>option]:text-slate-900 [&>option]:bg-white'
      : 'text-slate-800';

  return (
    <label
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${wrapperClasses}`}
    >
      <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <select
        aria-label={t('common.selectLanguage')}
        value={lang}
        onChange={(e) => setLang(e.target.value as SupportedLanguageCode)}
        className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer ${selectClasses}`}
      >
        {SUPPORTED_LANGUAGES.map((item) => (
          <option key={item.code} value={item.code}>
            {compact ? item.nativeLabel : `${item.nativeLabel} (${item.name})`}
          </option>
        ))}
      </select>
    </label>
  );
};
