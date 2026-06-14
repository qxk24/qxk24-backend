/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Succession Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

// ============================================================
// QXK24 ADAM Teaching Engine — Succession Service
// File: src/adam/adam-succession.service.ts
// Version: 1.0.0
// Author: Alamtologi Constitutional Kernel
// Date: 2026-05-28
// ============================================================

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { SuccessionModel } from './adam.schema';
import type {
  SuccessionRecord,
  SuccessionHeir,
  HeirPosition,
  IdType,
} from './adam.types';

// ─── Encrypt Sensitive Fields ─────────────────────────────────

function encrypt(value: string): string {
  const key = Buffer.from(
    process.env.QXK24_SUCCESSION_ENCRYPTION_KEY ??
    process.env.JWT_SECRET?.slice(0, 32) ?? '',
    'utf8',
  ).slice(0, 32);
  const iv  = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(value: string): string {
  try {
    const key = Buffer.from(
      process.env.QXK24_SUCCESSION_ENCRYPTION_KEY ??
      process.env.JWT_SECRET?.slice(0, 32) ?? '',
      'utf8',
    ).slice(0, 32);
    const [ivHex, encHex] = value.split(':');
    const iv        = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');
    const decipher  = crypto.createDecipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return '[encrypted]';
  }
}

// ─── Generate Constitutional Hash ────────────────────────────

function generateConstitutionalHash(record: Partial<SuccessionRecord>): string {
  const payload = JSON.stringify({
    founderName: record.founderName,
    founderId:   record.founderId,
    heirCount:   record.heirs?.length ?? 0,
    timestamp:   new Date().toISOString(),
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// ─── Get or Create Succession Record ─────────────────────────

export async function getOrCreateSuccessionRecord(
  founderName: string,
  founderId:   string,
): Promise<SuccessionRecord> {
  let doc = await SuccessionModel.findOne({ founderId });

  if (!doc) {
    const hash = generateConstitutionalHash({ founderName, founderId, heirs: [] });
    doc = await SuccessionModel.create({
      founderName,
      founderId,
      heirs:              [],
      createdAt:          new Date(),
      lastUpdatedAt:      new Date(),
      isSealed:           false,
      constitutionalHash: hash,
    });
  }

  return mapToSuccessionRecord(doc);
}

// ─── Add or Update Heir ───────────────────────────────────────

export async function upsertHeir(
  founderId: string,
  heir: {
    position:           HeirPosition;
    fullLegalName:      string;
    relationship:       string;
    idType:             IdType;
    idNumber:           string;
    issuingCountry:     string;
    nationality:        string;
    phone:              string;
    email:              string;
    cityOfResidence:    string;
    countryOfResidence: string;
    founderNote:        string;
  },
): Promise<SuccessionRecord | null> {
  const doc = await SuccessionModel.findOne({ founderId });
  if (!doc || doc.isSealed) return null;

  const existingIndex = doc.heirs.findIndex((h) => h.position === heir.position);

  const newHeir: SuccessionHeir = {
    id:                 uuidv4(),
    position:           heir.position,
    fullLegalName:      heir.fullLegalName,
    relationship:       heir.relationship,
    idType:             heir.idType,
    idNumber:           encrypt(heir.idNumber),
    issuingCountry:     heir.issuingCountry,
    nationality:        heir.nationality,
    phone:              encrypt(heir.phone),
    email:              encrypt(heir.email),
    cityOfResidence:    heir.cityOfResidence,
    countryOfResidence: heir.countryOfResidence,
    founderNote:        encrypt(heir.founderNote),
    designatedAt:       new Date(),
    designatedBy:       'Masa Bayu',
    isActive:           true,
    replacementHistory: [],
  };

  if (existingIndex >= 0) {
    // Record replacement history
    const old = doc.heirs[existingIndex];
    newHeir.replacementHistory = [
      ...(old.replacementHistory ?? []),
      {
        previousHeirName: old.fullLegalName,
        replacedBy:       heir.fullLegalName,
        replacedAt:       new Date(),
        reason:           'Updated by Founder',
        sealedBy:         'Masa Bayu',
      },
    ];
    doc.heirs[existingIndex] = newHeir;
  } else {
    doc.heirs.push(newHeir);
  }

  doc.lastUpdatedAt      = new Date();
  doc.constitutionalHash = generateConstitutionalHash(doc.toObject());
  await doc.save();

  return mapToSuccessionRecord(doc);
}

// ─── Remove Heir ──────────────────────────────────────────────

export async function removeHeir(
  founderId: string,
  position:  HeirPosition,
): Promise<SuccessionRecord | null> {
  const doc = await SuccessionModel.findOne({ founderId });
  if (!doc || doc.isSealed) return null;

  doc.heirs           = doc.heirs.filter((h) => h.position !== position) as any;
  doc.lastUpdatedAt   = new Date();
  doc.constitutionalHash = generateConstitutionalHash(doc.toObject());
  await doc.save();

  return mapToSuccessionRecord(doc);
}

// ─── Seal Succession Record (permanent) ──────────────────────

export async function sealSuccessionRecord(founderId: string): Promise<SuccessionRecord | null> {
  const doc = await SuccessionModel.findOne({ founderId });
  if (!doc || doc.heirs.length === 0) return null;

  doc.isSealed           = true;
  doc.sealedAt           = new Date();
  doc.constitutionalHash = generateConstitutionalHash(doc.toObject());
  await doc.save();

  return mapToSuccessionRecord(doc);
}

// ─── Get Succession Record ────────────────────────────────────

export async function getSuccessionRecord(
  founderId: string,
  includeDecrypted = false,
): Promise<SuccessionRecord | null> {
  const doc = await SuccessionModel.findOne({ founderId }).lean();
  if (!doc) return null;
  return mapToSuccessionRecord(doc, includeDecrypted);
}

// ─── Map Document to Type ─────────────────────────────────────

function mapToSuccessionRecord(
  doc:             any,
  includeDecrypted = false,
): SuccessionRecord {
  const heirs: SuccessionHeir[] = (doc.heirs ?? []).map((h: any) => ({
    id:                 h.id,
    position:           h.position,
    fullLegalName:      h.fullLegalName,
    relationship:       h.relationship,
    idType:             h.idType,
    idNumber:           includeDecrypted ? decrypt(h.idNumber) : '[encrypted]',
    issuingCountry:     h.issuingCountry,
    nationality:        h.nationality,
    phone:              includeDecrypted ? decrypt(h.phone) : '[encrypted]',
    email:              includeDecrypted ? decrypt(h.email) : '[encrypted]',
    cityOfResidence:    h.cityOfResidence,
    countryOfResidence: h.countryOfResidence,
    founderNote:        includeDecrypted ? decrypt(h.founderNote) : '[encrypted]',
    designatedAt:       h.designatedAt,
    designatedBy:       h.designatedBy,
    isActive:           h.isActive,
    replacementHistory: h.replacementHistory ?? [],
  }));

  return {
    id:                 doc._id?.toString() ?? doc.founderId,
    founderName:        doc.founderName,
    founderId:          doc.founderId,
    heirs,
    createdAt:          doc.createdAt,
    lastUpdatedAt:      doc.lastUpdatedAt,
    sealedAt:           doc.sealedAt,
    isSealed:           doc.isSealed,
    constitutionalHash: doc.constitutionalHash,
  };
}
