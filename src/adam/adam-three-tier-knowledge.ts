/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Three-Tier Knowledge Architecture
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-09
 * Updated : 2026-06-14 — Universal Scholar gold standard
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Re-exports Universal Scholar tier API — canonical impl: adam-universal-scholar.ts
 */

export {
  ADAM_THREE_TIER_KNOWLEDGE_ARCHITECTURE,
  ADAM_UNIVERSAL_SCHOLAR_CHARTER,
  ADAM_UNIVERSAL_SCHOLAR_TIER1_HOLD,
  UNIVERSAL_SCHOLAR_DOOR_BM,
  UNIVERSAL_SCHOLAR_DOOR_EN,
  buildThreeTierTurnOverlay,
  paragraphIsThreeTierDoorOffer,
  paragraphIsUniversalScholarDoorOffer,
  recentAssistantOfferedUniversalDoor,
  resolveUsersKnowledgeTier,
  userAcceptedUniversalScholarDoor,
  userOptedIntoAlamtologiTier,
  userOptedIntoQuranTier,
  type UsersKnowledgeTier,
} from './adam-universal-scholar';

export {
  ADAM_KNOWLEDGE_MODE_MANIFEST,
  buildAdamKnowledgeModeManifest,
  buildAdamKnowledgeModeTurnOverlay,
  knowledgeModeAllowsAlamtologiStack,
  knowledgeModeAllowsConstitutionalLayer5,
  resolveAdamKnowledgeMode,
  shouldBufferAdamStreamUntilRepair,
  type AdamKnowledgeMode,
} from './adam-knowledge-mode';

export {
  buildKonvensionalRecallFromRawBlock,
  contextBlockIsAlamtologiBrainRecall,
  filterContextMessagesForKnowledgeMode,
  knowledgeModeToRecallExportSurface,
  type BrainRecallExportSurface,
} from './adam-brain-recall-filter';
