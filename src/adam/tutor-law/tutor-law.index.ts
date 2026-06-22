/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Public API Barrel
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Single import point for ADAM Tutor classifier modules.
 * External callers import from here; internal modules use siblings.
 */

export {
  routeStudentTurn,
  updateSessionState,
  createInitialSession,
  detectDomain,
  SubjectDomain,
  type RouterInput,
  type RouterOutput,
  type RoutedClassifierOutput,
  type SessionState,
} from './tutor-law.router';

export {
  createFullSession,
  advanceLayer,
  resetLayerForNewTopic,
  recordConceptConfirmed,
  inferPreferredLang,
  isDuplicateResponse,
  addToResponseHistory,
  isStudentStuck,
  isEscalationDue,
  serialiseSession,
  deserialiseSession,
  PedagogyLayer,
  type FullSessionState,
  type LayerState,
  type PersistedSession,
} from './tutor-law.session-state';

export {
  classifyMathIntent,
  canAutoClose,
  requiresConceptCheck,
  isEscalationPermitted,
  MathIntent,
  MathTopic,
  ConceptReadiness,
  type ClassifierInput as MathClassifierInput,
  type ClassifierOutput as MathClassifierOutput,
} from './tutor-law.math-intent-classifier';

export {
  classifyScienceIntent,
  ScienceIntent,
  ScienceSubject,
  ExperimentPhase,
  type ScienceClassifierInput,
  type ScienceClassifierOutput,
} from './tutor-law.science-intent-classifier';

export {
  classifyLanguageIntent,
  LanguageIntent,
  WritingType,
  LanguageVariant,
  type LanguageClassifierInput,
  type LanguageClassifierOutput,
} from './tutor-law.language-writing-classifier';

export {
  classifyCodeIntent,
  CodeIntent,
  ProgrammingLanguage,
  CodeExamplePermission,
  type CodeClassifierInput,
  type CodeClassifierOutput,
} from './tutor-law.code-intent-classifier';

export {
  classifyIslamicIntent,
  IslamicIntent,
  SourceTier,
  FabricationRisk,
  type IslamicClassifierInput,
  type IslamicClassifierOutput,
} from './tutor-law.islamic-intent-classifier';

export {
  classifyGenericIntent,
  classifyTutorGenericIntent,
  classifyTutorGenericIntentFull,
  classifyTutorGenericIntentOutput,
  buildTutorGenericTurnContext,
  isTutorGenericDomainMessage,
  genericIntentSkipsZeroAnswer,
  genericIntentSkipsMathPedagogy,
  GenericIntent,
  GenericDomain,
  type GenericClassifierInput,
  type GenericClassifierOutput,
  type GenericIntentResult,
  type GenericSessionState,
  type GenericTurnContext,
  type GenericTurnHandler,
} from './tutor-law.generic-intent-classifier';

export {
  defaultGenericSessionState,
  deriveGenericSessionState,
  mergeGenericSessionState,
  commitGenericSessionState,
  resolveGenericTurnHandler,
  applyGenericSessionToOutput,
  applyGenericThreadIntentLock,
  buildGenericIntentResult,
} from './tutor-law.generic-mode';

export { buildGenericIntentTurnLaw } from './tutor-law.generic-prompt-laws';
