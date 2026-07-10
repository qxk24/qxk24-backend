/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Permanent Knowledge Vault (Layer 4)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import type { CompletedFamily, MasterConnection } from './qxk24brain.schema';
import { AlamtologiBrainEntityModel } from './qxk24brain.schema';
import { ADAMVaultModel } from './adam-vault.schema';
import { getOrCreateMaster } from './qxk24brain.engine';

export interface VaultSealInput {
  uid:               string;
  family:            string;
  principle:         string;
  cycle:             number;
  content:           string;
  masterConnection?: MasterConnection;
}

function vaultFamilyKey(family: string): string {
  return family.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 28);
}

async function nextVaultCycle(founderId: string, family: string): Promise<number> {
  const count = await ADAMVaultModel.countDocuments({ founderId, family });
  return count + 1;
}

export async function sealInVault(
  entity: VaultSealInput,
  founderId = 'masa-bayu',
): Promise<string | null> {
  const existing = await ADAMVaultModel.findOne({ entityUid: entity.uid }).lean();
  if (existing) return existing.vaultId;

  const masa = new Date();
  const cycle = await nextVaultCycle(founderId, entity.family);
  const vaultId = `K24V-${vaultFamilyKey(entity.family)}-${masa.getTime()}`;

  await ADAMVaultModel.create({
    vaultId,
    entityUid:    entity.uid,
    family:       entity.family,
    principle:    entity.principle,
    cycle,
    sealedContent: entity.content.trim(),
    masterConnection: entity.masterConnection,
    k24Address:   `K24vault-${masa.getTime()}`,
    judgment:     'MAKMUR',
    masa_sealed:  masa,
    founderId,
    kernel:       'Alamtologi',
    era:          ENV.QXK24_ERA,
    isConstitutionallySealed: true,
    canBeErased:              false,
    canBeModified:            false,
  });

  return vaultId;
}

async function sealFromCompletedFamily(
  founderId: string,
  completed: CompletedFamily,
): Promise<string | null> {
  const entity = await AlamtologiBrainEntityModel.findOne({ uid: completed.completedUid }).lean();
  const content = entity?.content?.trim() || completed.summary?.trim();
  if (!content) return null;

  return sealInVault({
    uid:               completed.completedUid,
    family:            completed.family,
    principle:         completed.principle,
    cycle:             await nextVaultCycle(founderId, completed.family),
    content,
  }, founderId);
}

/** Backfill vault entries for completed 1(7) families missing from vault. */
export async function backfillMissingVaultEntries(founderId: string): Promise<number> {
  const master = await getOrCreateMaster(founderId);
  let created = 0;

  const completedUids = master.completedFamilies.map((c) => c.completedUid);
  const existingEntries = await ADAMVaultModel.find({
    founderId,
    entityUid: { $in: completedUids },
  }).lean();
  const existingUidSet = new Set(existingEntries.map((e) => e.entityUid));

  for (const completed of master.completedFamilies) {
    if (existingUidSet.has(completed.completedUid)) continue;

    const id = await sealFromCompletedFamily(founderId, completed);
    if (id) created += 1;
  }
  return created;
}

export async function listVaultEntries(
  founderId = 'masa-bayu',
  limit = 50,
) {
  try {
    await backfillMissingVaultEntries(founderId);
    return ADAMVaultModel.find({ founderId })
      .sort({ masa_sealed: 1 })
      .limit(limit)
      .lean();

  } catch (err) {
    console.error(err);
    throw err;
  }}

export async function getVaultSummary(founderId = 'masa-bayu'): Promise<string> {
  await backfillMissingVaultEntries(founderId);

  const vaultEntries = await ADAMVaultModel
    .find({ founderId })
    .sort({ masa_sealed: 1 })
    .lean();

  if (vaultEntries.length === 0) return '';

  return `
═══ CONSTITUTIONAL VAULT (Completed 1(7) Families) ═══
These families have completed all seven AIDIL stages.
They are permanently sealed. They cannot be erased or modified.
They are the foundation of everything ADAM knows.

${vaultEntries.map((v, i) =>
  `${i + 1}. ${v.family} (${v.principle}) — Cycle ${v.cycle} — Sealed: ${
    new Date(v.masa_sealed).toISOString().slice(0, 10)
  } · ${v.vaultId}`,
).join('\n')}

Total sealed: ${vaultEntries.length}
canBeErased: false · canBeModified: false
═══ END VAULT ═══`.trim();
}

export async function buildVaultContextBlock(founderId = 'masa-bayu'): Promise<string> {
  const summary = await getVaultSummary(founderId);
  if (!summary) {
    return `
[CONSTITUTIONAL VAULT — Permanent 1(7) foundation]
No families sealed in the vault yet. When a family completes Stage 7,
its understanding is locked here forever — informing every response but
never transformed or overwritten again.
`.trim();
  }
  return summary;
}

export async function getVaultEntry(
  vaultId: string,
  founderId = 'masa-bayu',
) {
  return ADAMVaultModel.findOne({ vaultId, founderId }).lean();
}
