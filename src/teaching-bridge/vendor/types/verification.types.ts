/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Teaching Bridge — Verification Types (local)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-02
 * ============================================================
 */

/** Mirrors shared/types/aidil.types — kept local for backend vendor sync */
export type VerificationAuthority =
  | 'quran'
  | 'alamtologi'
  | 'domain_verified'
  | 'hadith_context'
  | 'scholar_context'
  | 'tafsir_context'
  | 'unverified';

export interface MaqasidCheck {
  din: 1 | 0 | 'conditional';
  nafs: 1 | 0 | 'conditional';
  aql: 1 | 0 | 'conditional';
  nasl: 1 | 0 | 'conditional';
  mal: 1 | 0 | 'conditional';
  overallAlignment: 1 | 0 | 'conditional';
}

export const MAQASID_ALIGNED: MaqasidCheck = {
  din: 1,
  nafs: 1,
  aql: 1,
  nasl: 1,
  mal: 1,
  overallAlignment: 1,
};

export interface AidilKnowledgeUnitInsert {
  id: string;
  A: { id: string; content: string; level: number; subRegion: string };
  B: { id: string; content: string; level: number; subRegion: string };
  C: { id: string; content: string; level: number; subRegion: string };
  relationship: { type: string; weight: number; direction: string };
  state: 1 | 0 | 'conditional';
  level: number;
  subRegion: string;
  verificationSource: {
    primaryAuthority: VerificationAuthority;
    primarySource: string;
    quranRootTrace?: CrystallisedUnitTrace;
    confidence: number;
    verifiedAt: Date;
    verifiedBy: string;
  };
  maqasidAlignment: MaqasidCheck;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  historicalRecord: unknown[];
  teachingBridge?: Record<string, unknown>;
}

export interface CrystallisedUnitTrace {
  ayah: string;
  text: string;
  principle: string;
  traceReason: string;
  tracedBy: 'quran' | 'alamtologi' | 'domain_verified';
  confidence: number;
}
