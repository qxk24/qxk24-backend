/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Founder Auth Helpers
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/** Trim BOM/whitespace; unwrap stray quotes if dotenv did not parse them. */
export function normalizeEnvSecret(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  let value = raw.replace(/^\uFEFF/, '').trim();
  if (!value) return undefined;
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    value = value.slice(1, -1);
  }
  return value;
}

function resolveEnvFilePath(): string | undefined {
  const isLab = process.env.QXK24_STACK === 'lab';
  const names = isLab ? ['.env.lab', '.env'] : ['.env'];
  for (const name of names) {
    const candidates = [
      path.resolve(process.cwd(), name),
      path.resolve(__dirname, '../../', name),
      path.resolve(__dirname, '../../../', name),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return undefined;
}

/** dotenv treats `#` as comment in unquoted values — read the raw line for founder password. */
function readFounderPasswordFromEnvFile(): string | undefined {
  const envPath = resolveEnvFilePath();
  if (!envPath) return undefined;

  let raw: string;
  try {
    raw = fs.readFileSync(envPath, 'utf8');
  } catch {
    return undefined;
  }

  const prefix = process.env.FOUNDER_AUTH_SECRET || 'FOUNDER_AUTH_SECRET=';

  for (const line of raw.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (!trimmed.startsWith(prefix)) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    return normalizeEnvSecret(line.slice(eq + 1));
  }
  return undefined;
}

function readFounderPasswordB64(): string | undefined {
  const b64 = normalizeEnvSecret(process.env.FOUNDER_PASSWORD_B64);
  if (!b64) return undefined;
  try {
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    return decoded || undefined;
  } catch {
    return undefined;
  }
}

export function getFounderPassword(): string | undefined {
  const fromB64 = readFounderPasswordB64();
  if (fromB64) return fromB64;

  const fromFile = readFounderPasswordFromEnvFile();
  const fromEnv = normalizeEnvSecret(process.env.FOUNDER_PASSWORD);

  // Prefer raw file when dotenv truncated an unquoted value containing `#`.
  if (fromFile && fromEnv && fromFile.length > fromEnv.length) {
    return fromFile;
  }

  return fromFile ?? fromEnv;
}

export function verifyFounderPassword(candidate: string, expected: string): boolean {
  const a = Buffer.from(candidate, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
