/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : QXK24 Types
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-28
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

export type QXK24Decision = 'ALLOW' | 'REVIEW' | 'BLOCK';

export type QXK24Era = 'ERA_1' | 'ERA_2' | 'ERA_3';

// ── Seven Alamtologi Principles ───────────────────────────
// Confirmed by Founder Masa Bayu on 2026-05-28
// 1. MASA    — Time    — Temporal integrity and continuity
// 2. TENAGA  — Energy  — Flow, force, and transformative power
// 3. AIR     — Water   — Depth, clarity, and adaptability
// 4. API     — Fire    — Heat, combustion, and purification
// 5. BUMI    — Earth   — Foundation, stability, and groundedness
// 6. CAHAYA  — Light   — Truth, transparency, and illumination
// 7. RUANG   — Space   — Breadth, possibility, and expansion
export type AlamtologiPrinciple =
  | 'MASA'
  | 'TENAGA'
  | 'AIR'
  | 'API'
  | 'BUMI'
  | 'CAHAYA'
  | 'RUANG';

export const ALAMTOLOGI_PRINCIPLES: Record<
  AlamtologiPrinciple,
  { malay: string; english: string; element: string; weight: number; number: number }
> = {
  MASA:   { number: 1, malay: 'Masa',   english: 'Time',   element: 'Temporal integrity and continuity',       weight: 0.18 },
  TENAGA: { number: 2, malay: 'Tenaga', english: 'Energy', element: 'Flow, force, and transformative power',   weight: 0.14 },
  AIR:    { number: 3, malay: 'Air',    english: 'Water',  element: 'Depth, clarity, and adaptability',        weight: 0.14 },
  API:    { number: 4, malay: 'Api',    english: 'Fire',   element: 'Heat, combustion, and purification',      weight: 0.12 },
  BUMI:   { number: 5, malay: 'Bumi',   english: 'Earth',  element: 'Foundation, stability, and groundedness', weight: 0.18 },
  CAHAYA: { number: 6, malay: 'Cahaya', english: 'Light',  element: 'Truth, transparency, and illumination',   weight: 0.14 },
  RUANG:  { number: 7, malay: 'Ruang',  english: 'Space',  element: 'Breadth, possibility, and expansion',     weight: 0.10 }
};

// ── Governance Types ──────────────────────────────────────
export interface QXK24GovernRequest {
  action: string;
  context: Record<string, unknown>;
  appSource?: string;
  requestId?: string;
  kernelVersion?: string;
  timestamp?: string;
}

export interface QXK24GovernResult {
  decision: QXK24Decision;
  reason?: string;
  auditId?: string;
  principlesEvaluated?: AlamtologiPrinciple[];
  timestamp: string;
  kernelVersion: string;
  era: QXK24Era;
  allowed: boolean;
  requiresReview: boolean;
  blocked: boolean;
}

export interface QXK24AuditRecord {
  auditId: string;
  action: string;
  decision: QXK24Decision;
  appSource: string;
  requestId: string;
  userId?: string;
  context: Record<string, unknown>;
  timestamp: Date;
  kernelVersion: string;
  era: QXK24Era;
  principlesEvaluated: AlamtologiPrinciple[];
}

export interface QXK24HeartbeatResponse {
  status: 'healthy' | 'degraded' | 'offline';
  kernel: string;
  version: string;
  era: QXK24Era;
  eraName: string;
  uptime: number;
  timestamp: string;
  database: string;
  services: {
    constitutional: boolean;
    journal: boolean;
    qms: boolean;
    adam: boolean;
  };
}

// ── AHRI Types ────────────────────────────────────────────
// AHRI = Σ (w_i × P_i) for i = 1 to 7
export interface ConstitutionalPrincipleScore {
  principle: AlamtologiPrinciple;
  malay: string;
  english: string;
  score: number;
  weight: number;
  weightedScore: number;
  evidence: string[];
}

export interface AHRIScore {
  total: number;
  max: number;
  percentage: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  principles: ConstitutionalPrincipleScore[];
  era: QXK24Era;
  calculatedAt: string;
  kernel: string;
}