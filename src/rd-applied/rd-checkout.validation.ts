/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : R&D Checkout Validation
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  RdAppliedSku,
  type RdCategory,
  type RdLegalAck,
} from './rd-applied.types';

export interface RdCheckoutInput {
  sku:            RdAppliedSku;
  rdCategory?:    RdCategory | string | null;
  projectFocus?:  string | null;
  packId?:        string | null;
  labAdminEmail?: string | null;
  eduEmail?:      string | null;
  legalAck?:      Partial<RdLegalAck> | null;
}

const CATEGORY_SKUS = new Set<RdAppliedSku>([
  RdAppliedSku.RD_IND_SOLO,
  RdAppliedSku.RD_LAB_5,
]);

const PROJECT_FOCUS_SKUS = new Set<RdAppliedSku>([
  RdAppliedSku.RD_IND_SOLO,
  RdAppliedSku.RD_LAB_5,
]);

const PACK_ID_SKUS = new Set<RdAppliedSku>([
  RdAppliedSku.AS_IND_SOLO,
  RdAppliedSku.AS_LAB_5,
]);

const GRADUATE_SKUS = new Set<RdAppliedSku>([
  RdAppliedSku.RD_GRAD_SOLO,
  RdAppliedSku.RD_GRAD_EDU,
]);

const LAB_SKUS = new Set<RdAppliedSku>([
  RdAppliedSku.RD_LAB_5,
  RdAppliedSku.AS_LAB_5,
  RdAppliedSku.BUNDLE_IND_AS_LAB,
]);

const APPLIED_OR_BUNDLE_SKUS = new Set<RdAppliedSku>([
  RdAppliedSku.AS_IND_SOLO,
  RdAppliedSku.AS_LAB_5,
  RdAppliedSku.BUNDLE_IND_AS_SOLO,
  RdAppliedSku.BUNDLE_IND_AS_LAB,
]);

function normalizeCategory(raw: string | null | undefined): RdCategory | null {
  const v = raw?.trim().toLowerCase();
  if (v === 'academic' || v === 'akademik') return 'academic';
  if (v === 'industry' || v === 'industri') return 'industry';
  return null;
}

function isValidPackId(packId: string): boolean {
  const trimmed = packId.trim();
  if (trimmed.length < 8) return false;
  return /^ALM-RD-/i.test(trimmed) || /^[A-Z0-9][A-Z0-9_-]{5,}$/i.test(trimmed);
}

function isEduEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.edu(\.[a-z]{2,})?$/i.test(trimmed)
    || /\.ac\.[a-z]{2,}$/i.test(trimmed.split('@')[1] ?? '');
}

export function resolveRdCategoryForSku(
  sku: RdAppliedSku,
  inputCategory: string | null | undefined,
): RdCategory | null {
  if (GRADUATE_SKUS.has(sku)) return 'academic';
  if (sku === RdAppliedSku.BUNDLE_IND_AS_SOLO || sku === RdAppliedSku.BUNDLE_IND_AS_LAB) {
    return 'industry';
  }
  if (PACK_ID_SKUS.has(sku) && !CATEGORY_SKUS.has(sku)) {
    return 'industry';
  }
  return normalizeCategory(inputCategory);
}

export function validateRdCheckoutInput(input: RdCheckoutInput): {
  ok: true;
  rdCategory: RdCategory | null;
  projectFocus: string | null;
  packId: string | null;
  labAdminEmail: string | null;
  eduEmail: string | null;
  legalAck: RdLegalAck;
} | { ok: false; error: string } {
  const legal = input.legalAck ?? {};
  const legalAck: RdLegalAck = {
    platformTerms:   Boolean(legal.platformTerms),
    rdTerms:         Boolean(legal.rdTerms),
    disclaimer:      Boolean(legal.disclaimer),
    journalPublish:  Boolean(legal.journalPublish),
    graduateRules:   Boolean(legal.graduateRules),
    appliedPack:     Boolean(legal.appliedPack),
    labSharedProject: Boolean(legal.labSharedProject),
  };

  if (!legalAck.platformTerms || !legalAck.rdTerms || !legalAck.disclaimer || !legalAck.journalPublish) {
    return { ok: false, error: 'All required legal acknowledgements must be accepted.' };
  }

  if (GRADUATE_SKUS.has(input.sku) && !legalAck.graduateRules) {
    return { ok: false, error: 'Graduate Phase 0 / SATL rules acknowledgement is required.' };
  }

  if (LAB_SKUS.has(input.sku) && !legalAck.labSharedProject) {
    return { ok: false, error: 'Lab shared-project acknowledgement is required.' };
  }

  if (APPLIED_OR_BUNDLE_SKUS.has(input.sku) && !legalAck.appliedPack) {
    return { ok: false, error: 'Applied Science / bundle acknowledgement is required.' };
  }

  const rdCategory = resolveRdCategoryForSku(input.sku, input.rdCategory);
  if (CATEGORY_SKUS.has(input.sku) && !rdCategory) {
    return { ok: false, error: 'rdCategory must be academic or industry (locked for the year).' };
  }

  const projectFocus = input.projectFocus?.trim() ?? '';
  if (PROJECT_FOCUS_SKUS.has(input.sku) && projectFocus.length < 3) {
    return { ok: false, error: 'projectFocus is required (min 3 characters).' };
  }

  const packId = input.packId?.trim() ?? '';
  if (PACK_ID_SKUS.has(input.sku)) {
    if (!packId) {
      return { ok: false, error: 'packId is required for Applied Science checkout.' };
    }
    if (!isValidPackId(packId)) {
      return { ok: false, error: 'packId format is invalid. Use your sealed Technical Pack ID.' };
    }
  }

  const labAdminEmail = input.labAdminEmail?.trim() ?? '';
  if (LAB_SKUS.has(input.sku) && !labAdminEmail.includes('@')) {
    return { ok: false, error: 'labAdminEmail is required for Lab plans.' };
  }

  const eduEmailRaw = input.eduEmail?.trim() ?? '';
  let eduEmail: string | null = eduEmailRaw || null;
  if (input.sku === RdAppliedSku.RD_GRAD_EDU) {
    if (!eduEmail || !isEduEmail(eduEmail)) {
      return { ok: false, error: 'A verified `.edu` or academic institution email is required for Graduate PPP.' };
    }
  }

  return {
    ok: true,
    rdCategory,
    projectFocus: projectFocus || null,
    packId:       packId || null,
    labAdminEmail: labAdminEmail || null,
    eduEmail,
    legalAck,
  };
}
