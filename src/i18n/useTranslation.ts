import {useCallback} from 'react';
import {useCitiSolve} from '../context/CitiSolveContext';
import type {
  ComplaintLifecycleStage,
  EscalationState,
  IssueCategoryId,
  OfficialRoleLevel,
  SafetySeverity,
} from '../types/civic';
import {
  translate,
  translateCategory,
  translateCategoryDesc,
  translateDepartment,
  translateEscalation,
  translateOfficialRole,
  translateSeverity,
  translateSeveritySla,
  translateStage,
  translateStageDesc,
  type TranslationKey,
} from './index';

export function useTranslation() {
  const {appLanguage, setAppLanguage} = useCitiSolve();

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      translate(appLanguage, key, vars),
    [appLanguage]
  );

  const tc = useCallback(
    (cat: IssueCategoryId, short = false) =>
      translateCategory(appLanguage, cat, short),
    [appLanguage]
  );

  const tcDesc = useCallback(
    (cat: IssueCategoryId) => translateCategoryDesc(appLanguage, cat),
    [appLanguage]
  );

  const ts = useCallback(
    (stage: ComplaintLifecycleStage, short = false) =>
      translateStage(appLanguage, stage, short),
    [appLanguage]
  );

  const tsDesc = useCallback(
    (stage: ComplaintLifecycleStage) => translateStageDesc(appLanguage, stage),
    [appLanguage]
  );

  const tSev = useCallback(
    (sev: SafetySeverity) => translateSeverity(appLanguage, sev),
    [appLanguage]
  );

  const tSevSla = useCallback(
    (sev: SafetySeverity) => translateSeveritySla(appLanguage, sev),
    [appLanguage]
  );

  const tDept = useCallback(
    (dept: string) => translateDepartment(appLanguage, dept),
    [appLanguage]
  );

  const tEsc = useCallback(
    (esc: EscalationState) => translateEscalation(appLanguage, esc),
    [appLanguage]
  );

  const tRole = useCallback(
    (role: OfficialRoleLevel) => translateOfficialRole(appLanguage, role),
    [appLanguage]
  );

  return {
    lang: appLanguage,
    setLang: setAppLanguage,
    t,
    tc,
    tcDesc,
    ts,
    tsDesc,
    tSev,
    tSevSla,
    tDept,
    tEsc,
    tRole,
  };
}
