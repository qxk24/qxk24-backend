/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Memory Redundancy System (Layer 10)
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
 *
 * 3-2-1 backup rule for ADAM's constitutional memory:
 * Copy 1 — MongoDB Atlas primary (live database)
 * Copy 2 — MongoDB Atlas secondary region (Atlas DR — infra config)
 * Copy 3 — Encrypted JSON backup to Cloudflare R2 (this module)
 */

import crypto from 'crypto';
import { ENV } from '../config/environments';
import { r2StorageService } from '../services/r2-storage.service';
import { ADAMVaultModel } from './adam-vault.schema';
import { ADAMBackupLogModel } from './adam-redundancy.schema';
import {
  QXK24BrainEntityModel,
  QXK24BrainMasterModel,
} from './qxk24brain.schema';

function stripMongoInternals<T extends Record<string, unknown>>(doc: T): Omit<T, '_id' | '__v'> {
  const { _id, __v, ...rest } = doc;
  void _id;
  void __v;
  return rest;
}

function backupEncryptionKey(): Buffer {
  const raw = process.env.ADAM_BACKUP_ENCRYPTION_KEY
    ?? process.env.JWT_SECRET
    ?? '';
  if (!raw) {
    throw new Error('ADAM_BACKUP_ENCRYPTION_KEY or JWT_SECRET required for encrypted backups.');
  }
  return crypto.createHash('sha256').update(raw).digest();
}

export function encryptBackupPayload(plaintext: string): string {
  const key = backupEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return JSON.stringify({
    v:         1,
    algorithm: 'aes-256-gcm',
    kernel:    'QXK24',
    iv:        iv.toString('base64'),
    tag:       tag.toString('base64'),
    payload:   ciphertext.toString('base64'),
  });
}

export function decryptBackupPayload(envelopeJson: string): string {
  const envelope = JSON.parse(envelopeJson) as {
    iv: string;
    tag: string;
    payload: string;
  };
  const key = backupEncryptionKey();
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(envelope.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(envelope.payload, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

function r2Configured(): boolean {
  return Boolean(
    ENV.CLOUDFLARE_ACCOUNT_ID &&
    ENV.R2_ACCESS_KEY_ID &&
    ENV.R2_SECRET_ACCESS_KEY,
  );
}

export interface BrainBackupResult {
  layer:       'LAYER_10_REDUNDANCY';
  backupId:    string;
  r2Key:       string;
  byteSize:    number;
  entityCount: number;
  vaultCount:  number;
  encrypted:   boolean;
  status:      'SUCCESS' | 'SKIPPED' | 'FAILED';
  message?:    string;
}

export async function backupBrainToR2(
  founderId: string,
): Promise<BrainBackupResult> {
  const backupId = `K24BAK-${Date.now()}`;
  const now = new Date();

  if (!r2Configured()) {
    await ADAMBackupLogModel.create({
      backupId,
      founderId,
      r2Key:        '',
      status:       'SKIPPED',
      encrypted:    false,
      errorMessage: 'R2 storage not configured',
      masa_backup:  now,
      kernel:       ENV.QXK24_KERNEL_VERSION,
      era:          ENV.QXK24_ERA,
    });
    return {
      layer:       'LAYER_10_REDUNDANCY',
      backupId,
      r2Key:       '',
      byteSize:    0,
      entityCount: 0,
      vaultCount:  0,
      encrypted:   false,
      status:      'SKIPPED',
      message:     'R2 storage not configured — Copy 3 skipped',
    };
  }

  try {
    const master = await QXK24BrainMasterModel.findOne({ founderId }).lean();
    const entities = await QXK24BrainEntityModel.find({ founderId }).lean();
    const vault = await ADAMVaultModel.find({ founderId }).lean();

    const backup = {
      timestamp:            now.toISOString(),
      founderId,
      kernel:               ENV.QXK24_KERNEL_VERSION,
      era:                  ENV.QXK24_ERA,
      master:               master ? stripMongoInternals(master as Record<string, unknown>) : null,
      entities:             entities.length,
      entityRecords:        entities.map((e) => stripMongoInternals(e as Record<string, unknown>)),
      vault:                vault.length,
      unifiedUnderstanding: master?.unifiedUnderstanding ?? '',
      vaultEntries:         vault.map((v) => stripMongoInternals(v as Record<string, unknown>)),
      activeFamilies:       master?.activeFamilies ?? [],
      completedFamilies:    master?.completedFamilies ?? [],
      continuityBridge:     master?.continuityBridge ?? null,
    };

    const backupJson = JSON.stringify(backup, null, 2);
    const encryptedEnvelope = encryptBackupPayload(backupJson);
    const dateKey = now.toISOString().slice(0, 10);
    const backupKey = `brain-backup/${founderId}/${dateKey}-${now.getTime()}.json.enc`;

    await r2StorageService.uploadString(
      backupKey,
      encryptedEnvelope,
      'application/json',
      {
        founderId,
        encrypted: 'true',
        kernel:    'QXK24',
        layer:     'LAYER_10',
      },
    );

    await ADAMBackupLogModel.create({
      backupId,
      founderId,
      r2Key:       backupKey,
      status:      'SUCCESS',
      byteSize:    Buffer.byteLength(encryptedEnvelope, 'utf8'),
      entityCount: entities.length,
      vaultCount:  vault.length,
      encrypted:   true,
      masa_backup: now,
      kernel:      ENV.QXK24_KERNEL_VERSION,
      era:         ENV.QXK24_ERA,
    });

    console.log(`[ADAM Redundancy] Brain backup: ${backupKey} (${encryptedEnvelope.length} bytes encrypted)`);

    return {
      layer:       'LAYER_10_REDUNDANCY',
      backupId,
      r2Key:       backupKey,
      byteSize:    Buffer.byteLength(encryptedEnvelope, 'utf8'),
      entityCount: entities.length,
      vaultCount:  vault.length,
      encrypted:   true,
      status:      'SUCCESS',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await ADAMBackupLogModel.create({
      backupId,
      founderId,
      r2Key:        '',
      status:       'FAILED',
      encrypted:    true,
      errorMessage: message,
      masa_backup:  now,
      kernel:       ENV.QXK24_KERNEL_VERSION,
      era:          ENV.QXK24_ERA,
    });
    console.error('[ADAM Redundancy] Backup failed:', message);
    return {
      layer:       'LAYER_10_REDUNDANCY',
      backupId,
      r2Key:       '',
      byteSize:    0,
      entityCount: 0,
      vaultCount:  0,
      encrypted:   true,
      status:      'FAILED',
      message,
    };
  }
}

export async function listBackupLogs(
  founderId: string,
  limit = 20,
): Promise<Array<{
  backupId: string;
  r2Key: string;
  status: string;
  byteSize: number;
  entityCount: number;
  vaultCount: number;
  masa_backup: Date;
}>> {
  const rows = await ADAMBackupLogModel.find({ founderId })
    .sort({ masa_backup: -1 })
    .limit(Math.min(limit, 50))
    .lean();

  return rows.map((r) => ({
    backupId:    r.backupId,
    r2Key:       r.r2Key,
    status:      r.status,
    byteSize:    r.byteSize,
    entityCount: r.entityCount,
    vaultCount:  r.vaultCount,
    masa_backup: r.masa_backup,
  }));
}

export async function getRedundancyStatus(founderId: string): Promise<{
  layer:            'LAYER_10_REDUNDANCY';
  rule321:          { copies: number; storageTypes: number; offsite: boolean };
  copy1_atlasPrimary:   { active: boolean; note: string };
  copy2_atlasSecondary: { active: boolean; region: string | null; note: string };
  copy3_r2Encrypted:    { active: boolean; r2Configured: boolean; lastBackup: Date | null; lastStatus: string | null };
}> {
  const last = await ADAMBackupLogModel.findOne({ founderId, status: 'SUCCESS' })
    .sort({ masa_backup: -1 })
    .lean();

  const secondaryRegion = process.env.ADAM_ATLAS_SECONDARY_REGION ?? null;
  const r2Ok = r2Configured();

  return {
    layer: 'LAYER_10_REDUNDANCY',
    rule321: {
      copies:       r2Ok && last ? 3 : 2,
      storageTypes: r2Ok ? 2 : 1,
      offsite:      r2Ok,
    },
    copy1_atlasPrimary: {
      active: true,
      note:   'Live MongoDB Atlas primary — all brain writes',
    },
    copy2_atlasSecondary: {
      active: Boolean(secondaryRegion),
      region: secondaryRegion,
      note:   secondaryRegion
        ? `Atlas multi-region replica: ${secondaryRegion}`
        : 'Configure ADAM_ATLAS_SECONDARY_REGION when Atlas DR is enabled',
    },
    copy3_r2Encrypted: {
      active:        r2Ok && Boolean(last),
      r2Configured:  r2Ok,
      lastBackup:    last?.masa_backup ?? null,
      lastStatus:    last?.status ?? null,
    },
  };
}
