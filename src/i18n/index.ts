import type {
  ComplaintLifecycleStage,
  EscalationState,
  IssueCategoryId,
  OfficialRoleLevel,
  SafetySeverity,
  SupportedLanguageCode,
} from '../types/civic';
import {bn} from './bn';
import {en, type TranslationDict, type TranslationKey} from './en';
import {hi} from './hi';
import {kn} from './kn';
import {mr} from './mr';
import {ta} from './ta';
import {te} from './te';

export const TRANSLATIONS: Record<SupportedLanguageCode, TranslationDict> = {
  en,
  hi,
  kn,
  mr,
  ta,
  te,
  bn,
};

export type {TranslationKey, TranslationDict};

export function translate(
  lang: SupportedLanguageCode,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  const dict = TRANSLATIONS[lang] ?? en;
  let template = dict[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      template = template.split(`{${k}}`).join(String(v));
    }
  }
  return template;
}

export function translateCategory(
  lang: SupportedLanguageCode,
  category: IssueCategoryId,
  short = false
): string {
  const key = (short ? `catShort.${category}` : `cat.${category}`) as TranslationKey;
  return translate(lang, key);
}

export function translateCategoryDesc(
  lang: SupportedLanguageCode,
  category: IssueCategoryId
): string {
  return translate(lang, `catDesc.${category}` as TranslationKey);
}

export function translateStage(
  lang: SupportedLanguageCode,
  stage: ComplaintLifecycleStage,
  short = false
): string {
  const key = (short ? `stageShort.${stage}` : `stage.${stage}`) as TranslationKey;
  return translate(lang, key);
}

export function translateStageDesc(
  lang: SupportedLanguageCode,
  stage: ComplaintLifecycleStage
): string {
  return translate(lang, `stageDesc.${stage}` as TranslationKey);
}

export function translateSeverity(
  lang: SupportedLanguageCode,
  severity: SafetySeverity
): string {
  return translate(lang, `sev.${severity}` as TranslationKey);
}

export function translateSeveritySla(
  lang: SupportedLanguageCode,
  severity: SafetySeverity
): string {
  return translate(lang, `sevSla.${severity}` as TranslationKey);
}

export function translateDepartment(
  lang: SupportedLanguageCode,
  dept: string
): string {
  const key = `dept.${dept}` as TranslationKey;
  const dict = TRANSLATIONS[lang] ?? en;
  return dict[key] ?? en[key] ?? dept;
}

export function translateEscalation(
  lang: SupportedLanguageCode,
  state: EscalationState
): string {
  return translate(lang, `esc.${state}` as TranslationKey);
}

export function translateOfficialRole(
  lang: SupportedLanguageCode,
  roleLevel: OfficialRoleLevel
): string {
  return translate(lang, `role.${roleLevel}` as TranslationKey);
}
