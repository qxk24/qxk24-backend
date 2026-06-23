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
  isTutorCodeDomainMessage,
  classifyTutorCodeIntentFull,
  classifyTutorCodeIntentOutput,
  buildTutorCodeTurnContext,
  ceIntentSkipsZeroAnswer,
  ceIntentSkipsMathPedagogy,
  CodeIntent,
  ProgrammingLanguage,
  CodeExamplePermission,
  type CodeClassifierInput,
  type CodeClassifierOutput,
  type CodeIntentResult,
  type CETurnContext,
  type CESessionState,
  type CETurnHandler,
} from './tutor-law.code-intent-classifier';

export {
  classifyCEIntent,
  classifyTutorCEIntent,
  buildCEClassifierInput,
  isTutorCEDomainMessage,
  resolveCERouteTo,
  CESubdomain,
  CEAbstractionLayer,
  CESecurityFlag,
  type CEClassifierInput,
  type CEClassifierOutput,
} from './tutor-law.ce-intent-classifier';

export {
  classifyHardwareIntent,
  classifyTutorCEHardwareIntent,
  buildHardwareClassifierInput,
  shouldRouteToCEHardware,
  CE_HARDWARE_ROUTE,
  HardwareIntent,
  HardwareTopic,
  type HardwareClassifierInput,
  type HardwareClassifierOutput,
} from './tutor-law.ce-hardware-classifier';

export {
  classifyTheoryIntent,
  classifyTutorCETheoryIntent,
  buildTheoryClassifierInput,
  shouldRouteToCETheory,
  CE_THEORY_ROUTE,
  CE_THEORY_DISCRETE_ROUTE,
  TheoryIntent,
  TheoryTopic,
  type TheoryClassifierInput,
  type TheoryClassifierOutput,
} from './tutor-law.ce-theory-classifier';

export {
  classifySystemIntent,
  classifyTutorCESystemIntent,
  buildSystemClassifierInput,
  shouldRouteToCESystem,
  CE_SYSTEM_ROUTE,
  SystemIntent,
  SystemTopic,
  type SystemClassifierInput,
  type SystemClassifierOutput,
} from './tutor-law.ce-system-classifier';

export {
  classifyNetworkIntent,
  classifyTutorCENetworkIntent,
  buildNetworkClassifierInput,
  shouldRouteToCENetwork,
  CE_NETWORK_ROUTE,
  NetworkIntent,
  NetworkTopic,
  type NetworkClassifierInput,
  type NetworkClassifierOutput,
} from './tutor-law.ce-network-classifier';

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

export {
  defaultCESessionState,
  deriveCESessionState,
  mergeCESessionState,
  commitCESessionState,
  resolveCETurnHandler,
  applyCESessionToOutput,
  buildCodeIntentResult,
} from './tutor-law.ce-mode';

export {
  ADAM_TUTOR_CE_ABSTRACTION_LAW,
  ADAM_TUTOR_CE_SECURITY_LAW,
  ADAM_TUTOR_CE_EXAM_LAW,
  buildCEMasterTurnLaw,
  buildCEIntentTurnLaws,
} from './tutor-law.ce-prompt-laws';

export {
  buildCEHardwareIntentTurnLaw,
} from './tutor-law.ce-hardware-prompt-laws';

export {
  buildCETheoryIntentTurnLaw,
} from './tutor-law.ce-theory-prompt-laws';

export {
  buildCESystemIntentTurnLaw,
} from './tutor-law.ce-system-prompt-laws';

export {
  buildCENetworkIntentTurnLaw,
} from './tutor-law.ce-network-prompt-laws';

export {
  buildCodeIntentTurnLaw,
} from './tutor-law.code-prompt-laws';

export {
  classifyPedagogyV2Turn,
  classifyPedagogyV2Intent,
  pedagogyV2SkipsZeroAnswer,
  defaultPedagogyV2SessionState,
  ADAM_TUTOR_PEDAGOGY_V2_CORE_LAW,
  ADAM_TUTOR_FIVE_WHYS_LAW,
  buildPedagogyV2TurnLaw,
  PedagogyV2Intent,
  IThinkMapType,
  CrossCurricularCluster,
  type PedagogyV2TurnInput,
  type PedagogyV2TurnResult,
  type PedagogyV2ClassifierOutput,
  type PedagogyV2SessionState,
} from './tutor-law.pedagogy-v2-classifier';

export {
  ADAM_TUTOR_STEM_TOOL_LINKS_LAW,
  buildStemToolTurnLaw,
  matchStemToolLink,
  isAllowedStemToolUrl,
  type StemToolLink,
  type StemToolTurnContext,
} from './tutor-law.stem-tool-links';

export {
  buildTutorLearningStyleLaw,
} from './tutor-law.profile';
