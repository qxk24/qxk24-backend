/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Constitutional Service
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

import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../../config/environments';
import {
  QXK24GovernRequest,
  QXK24GovernResult,
  QXK24Decision,
  AlamtologiPrinciple,
  QXK24Era,
  AHRIScore,
  ConstitutionalPrincipleScore,
  ALAMTOLOGI_PRINCIPLES
} from './qxk24.types';

// ── Principle Weights — sum must equal 1.00 ───────────────
export const PRINCIPLE_WEIGHTS: Record<AlamtologiPrinciple, number> = {
  MASA:   0.18,
  TENAGA: 0.14,
  AIR:    0.14,
  API:    0.12,
  BUMI:   0.18,
  CAHAYA: 0.14,
  RUANG:  0.10
};

// ── Blocked Actions ───────────────────────────────────────
const BLOCKED_ACTIONS = new Set([
  'FRAUDULENT_TRANSACTION',
  'HARAM_PRODUCT_LISTING',
  'UNAUTHORIZED_DATA_ACCESS',
  'CONSTITUTIONAL_VIOLATION',
  'KERNEL_TAMPER_ATTEMPT'
]);

// ── Review Actions ────────────────────────────────────────
const REVIEW_ACTIONS = new Set([
  'HIGH_VALUE_TRANSACTION',
  'BULK_DATA_EXPORT',
  'ADMIN_PRIVILEGE_ESCALATION',
  'CROSS_APP_DATA_SHARE',
  'SENSITIVE_CONTENT_PUBLISH'
]);

// ── Principle Evaluation ──────────────────────────────────
function evaluatePrinciples(
  action: string,
  _context: Record<string, unknown>
): AlamtologiPrinciple[] {
  const evaluated = new Set<AlamtologiPrinciple>();
  const a = action.toUpperCase();

  if (a.includes('TRANSACTION') || a.includes('PAYMENT') ||
      a.includes('EXPIRE') || a.includes('SCHEDULE')) {
    evaluated.add('MASA');
  }

  if (a.includes('PROCESS') || a.includes('EXECUTE') ||
      a.includes('TRIGGER') || a.includes('DISPATCH') ||
      a.includes('PUBLISH') || a.includes('SUBMIT')) {
    evaluated.add('TENAGA');
  }

  if (a.includes('SEARCH') || a.includes('QUERY') ||
      a.includes('FETCH') || a.includes('READ')) {
    evaluated.add('AIR');
  }

  if (a.includes('UPDATE') || a.includes('MODIFY') ||
      a.includes('TRANSFORM') || a.includes('CONVERT')) {
    evaluated.add('API');
  }

  if (a.includes('CREATE') || a.includes('REGISTER') ||
      a.includes('INIT') || a.includes('SETUP')) {
    evaluated.add('BUMI');
  }

  if (a.includes('AUDIT') || a.includes('LOG') ||
      a.includes('VERIFY') || a.includes('VALIDATE')) {
    evaluated.add('CAHAYA');
  }

  if (a.includes('ACCESS') || a.includes('GOVERN') ||
      a.includes('SCOPE') || a.includes('PERMISSION')) {
    evaluated.add('RUANG');
  }

  // CAHAYA and BUMI always evaluated
  evaluated.add('CAHAYA');
  evaluated.add('BUMI');

  return Array.from(evaluated);
}

// ── Decision Logic ────────────────────────────────────────
function determineDecision(
  action: string,
  context: Record<string, unknown>
): QXK24Decision {
  const a = action.toUpperCase();

  if (BLOCKED_ACTIONS.has(a)) return 'BLOCK';
  if (REVIEW_ACTIONS.has(a)) return 'REVIEW';

  const amount = context['amount'] as number | undefined;
  if (amount && amount > 50000) return 'REVIEW';

  return 'ALLOW';
}

// ── Main Govern Function ──────────────────────────────────
export async function governAction(
  request: QXK24GovernRequest
): Promise<QXK24GovernResult> {
  const auditId =
    `QXK24-${Date.now()}-${uuidv4().split('-')[0].toUpperCase()}`;
  const timestamp = new Date().toISOString();
  const era = (ENV.QXK24_ERA as QXK24Era) ?? 'ERA_1';

  const decision = determineDecision(
    request.action,
    request.context
  );

  const principlesEvaluated = evaluatePrinciples(
    request.action,
    request.context
  );

  return {
    decision,
    auditId,
    principlesEvaluated,
    timestamp,
    kernelVersion: ENV.QXK24_KERNEL_VERSION,
    era,
    allowed:        decision === 'ALLOW',
    requiresReview: decision === 'REVIEW',
    blocked:        decision === 'BLOCK',
    reason:
      decision === 'BLOCK'
        ? `Action '${request.action}' is constitutionally blocked.`
        : decision === 'REVIEW'
        ? `Action '${request.action}' requires constitutional review.`
        : undefined
  };
}

// ── AHRI Calculator ───────────────────────────────────────
export function calculateAHRI(
  scores: Partial<Record<AlamtologiPrinciple, number>>
): AHRIScore {
  const principles: ConstitutionalPrincipleScore[] = (
    Object.keys(PRINCIPLE_WEIGHTS) as AlamtologiPrinciple[]
  ).map((p) => {
    const score   = Math.min(100, Math.max(0, scores[p] ?? 0));
    const weight  = PRINCIPLE_WEIGHTS[p];
    const info    = ALAMTOLOGI_PRINCIPLES[p];
    return {
      principle:    p,
      malay:        info.malay,
      english:      info.english,
      score,
      weight,
      weightedScore: weight * score,
      evidence:     []
    };
  });

  const total      = principles.reduce((s, p) => s + p.weightedScore, 0);
  const max        = 100;
  const percentage = total;

  const grade: AHRIScore['grade'] =
    percentage >= 90 ? 'A' :
    percentage >= 75 ? 'B' :
    percentage >= 60 ? 'C' :
    percentage >= 40 ? 'D' : 'F';

  return {
    total,
    max,
    percentage,
    grade,
    principles,
    era:         (ENV.QXK24_ERA as QXK24Era) ?? 'ERA_1',
    calculatedAt: new Date().toISOString(),
    kernel:       ENV.QXK24_KERNEL_VERSION
  };
}

// ── Kernel Info ───────────────────────────────────────────
export function getKernelInfo() {
  return {
    version:          ENV.QXK24_KERNEL_VERSION,
    era:              ENV.QXK24_ERA,
    eraName:          ENV.QXK24_ERA_NAME,
    framework:        'Alamtologi',
    founder:          'Masa Bayu',
    principles:       ALAMTOLOGI_PRINCIPLES,
    principleWeights: PRINCIPLE_WEIGHTS,
    totalPrinciples:  7
  };
}
