/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Registry Service
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { ENV } from '../config/environments';
import {
  ADAMConsultModel,
  ADAMFounderSessionModel,
  ADAMMessageModel,
} from './adam.schema';
import { ADAMPasswordResetModel } from './adam-password-reset.schema';
import { ADAMStudentAccountModel } from './adam-student.schema';
import { ADAMWorkspaceModel } from './adam-workspace.schema';
import { ADAMMessageLedgerModel } from '../qxk24brain/adam-ledger.schema';
import { isGoogleSignInEnabled } from './adam-google-auth.service';
import { isStudentSelfRegisterEnabled } from './adam-platform-settings.service';
import {
  FOUNDER_USER_ID,
  SEED_STUDENT_ACCOUNTS,
  type StudentAccountRecord,
} from './adam-student.types';

const BCRYPT_ROUNDS = 10;

let activeAccounts: StudentAccountRecord[] = [];

function parseSeedPasswords(): Record<string, string> {
  const raw = process.env.STUDENT_PASSWORDS ?? '';
  const map: Record<string, string> = {};

  if (raw.trim().startsWith('{')) {
    try {
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      return map;
    }
  }

  for (const part of raw.split(',')) {
    const idx = part.indexOf(':');
    if (idx === -1) continue;
    const id = part.slice(0, idx).trim();
    const pass = part.slice(idx + 1).trim();
    if (id && pass) map[id] = pass;
  }

  for (const s of SEED_STUDENT_ACCOUNTS) {
    const envKey = `STUDENT_PASSWORD_${s.userId.toUpperCase().replace(/-/g, '_')}`;
    const single = process.env[envKey];
    if (single) map[s.userId] = single;
  }

  return map;
}

function isUsableSeedPassword(pass: string | undefined): pass is string {
  if (!pass || pass.length < 6) return false;
  if (/^CHANGE_ME/i.test(pass)) return false;
  return true;
}

async function insertSeedAccount(
  seed: (typeof SEED_STUDENT_ACCOUNTS)[number],
  plain: string,
): Promise<void> {
  await ADAMStudentAccountModel.create({
    userId:         seed.userId,
    name:           seed.name,
    passwordHash:   await bcrypt.hash(plain, BCRYPT_ROUNDS),
    active:         true,
    createdBy:      FOUNDER_USER_ID,
    passwordSource: 'env',
  });
}

/** Env sync must not overwrite passwords P.alt set in the Students panel. */
function envMayOverwritePassword(doc: {
  passwordSource?: string;
  createdAt?:      Date;
  updatedAt?:      Date;
}): boolean {
  if (doc.passwordSource === 'founder' || doc.passwordSource === 'self-register' || doc.passwordSource === 'google') {
    return false;
  }
  if (doc.passwordSource === 'env') return true;

  const created = doc.createdAt?.getTime() ?? 0;
  const updated = doc.updatedAt?.getTime() ?? 0;
  /** Legacy rows — treat post-create updates as founder-managed */
  return updated <= created + 2000;
}

/** Adds seed students missing from DB when env passwords are configured. */
export async function syncMissingSeedStudents(): Promise<number> {
  const passwords = parseSeedPasswords();
  let added = 0;

  for (const seed of SEED_STUDENT_ACCOUNTS) {
    const exists = await ADAMStudentAccountModel.exists({ userId: seed.userId });
    if (exists) continue;

    const plain = passwords[seed.userId];
    if (!isUsableSeedPassword(plain)) {
      console.warn(`[ALAMTOLOGI] Seed sync skipped (no password in env): ${seed.userId}`);
      continue;
    }

    await insertSeedAccount(seed, plain);
    console.log(`[QXK24] Seed sync added student: ${seed.userId}`);
    added += 1;
  }

  if (added > 0) await refreshStudentCache();
  return added;
}

/** Re-hash seed passwords from env when stale (common after lab memory import). */
export async function syncSeedStudentPasswords(force = false): Promise<number> {
  const passwords = parseSeedPasswords();
  let updated = 0;

  for (const seed of SEED_STUDENT_ACCOUNTS) {
    const plain = passwords[seed.userId];
    if (!isUsableSeedPassword(plain)) continue;

    const doc = await ADAMStudentAccountModel.findOne({ userId: seed.userId }).lean();
    if (!doc?.passwordHash) continue;
    if (!force && !envMayOverwritePassword(doc)) continue;

    const matches = await bcrypt.compare(plain, doc.passwordHash);
    if (matches) continue;

    await ADAMStudentAccountModel.updateOne(
      { userId: seed.userId },
      {
        passwordHash:   await bcrypt.hash(plain, BCRYPT_ROUNDS),
        passwordSource: 'env',
      },
    );
    console.log(`[QXK24] Seed password re-synced: ${seed.userId}`);
    updated += 1;
  }

  if (updated > 0) await refreshStudentCache();
  return updated;
}

export function slugStudentUserId(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

  return base || 'student';
}

async function ensureUniqueUserId(preferred: string): Promise<string> {
  let userId = preferred;
  let suffix = 2;

  while (await ADAMStudentAccountModel.exists({ userId })) {
    userId = `${preferred.slice(0, 28)}-${suffix}`;
    suffix += 1;
  }

  return userId;
}

async function ensureSeeded(): Promise<void> {
  const count = await ADAMStudentAccountModel.countDocuments();
  if (count > 0) return;

  const passwords = parseSeedPasswords();

  for (const seed of SEED_STUDENT_ACCOUNTS) {
    const plain = passwords[seed.userId];
    if (!isUsableSeedPassword(plain)) {
      console.warn(`[ALAMTOLOGI] Student seed skipped (no password in env): ${seed.userId}`);
      continue;
    }

    await insertSeedAccount(seed, plain);
  }

  console.log('[QXK24] Student registry seeded from env (first boot).');
}

/** One-time — accounts updated after create were likely reset by P.alt. */
async function markLegacyFounderPasswords(): Promise<number> {
  const result = await ADAMStudentAccountModel.updateMany(
    {
      passwordSource: { $exists: false },
      $expr:          { $gt: ['$updatedAt', { $add: ['$createdAt', 2000] }] },
    },
    { $set: { passwordSource: 'founder' } },
  );
  return result.modifiedCount ?? 0;
}

export async function refreshStudentCache(): Promise<void> {
  const docs = await ADAMStudentAccountModel.find({ active: true })
    .sort({ name: 1 })
    .select({ userId: 1, name: 1 })
    .lean();

  activeAccounts = docs.map((d) => ({ userId: d.userId, name: d.name }));
}

export async function initStudentRegistry(): Promise<void> {
  await ensureSeeded();
  const legacyMarked = await markLegacyFounderPasswords();
  const added = await syncMissingSeedStudents();
  const passwordsResynced = await syncSeedStudentPasswords(false);
  await refreshStudentCache();
  console.log(
    `[QXK24] Student registry ready — ${activeAccounts.length} active account(s)` +
      (legacyMarked > 0 ? ` (${legacyMarked} founder-managed passwords preserved)` : '') +
      (added > 0 ? ` (${added} synced from env)` : '') +
      (passwordsResynced > 0 ? ` (${passwordsResynced} env passwords applied)` : '') +
      '.',
  );
}

export function getStudentAccounts(): readonly StudentAccountRecord[] {
  return activeAccounts;
}

export function getStudentAccount(userId: string): StudentAccountRecord | undefined {
  return activeAccounts.find((s) => s.userId === userId);
}

/** Accept login id or display name (case-insensitive). */
export function resolveStudentLoginUserId(raw: string): string | null {
  const id = raw.trim().toLowerCase();
  if (!id) return null;
  if (getStudentAccount(id)) return id;

  const byName = activeAccounts.find(
    (s) => s.name.trim().toLowerCase() === id,
  );
  if (byName) return byName.userId;

  const slug = id.replace(/\s+/g, '-');
  if (getStudentAccount(slug)) return slug;

  return null;
}

export function studentIds(): string[] {
  return activeAccounts.map((s) => s.userId);
}

export async function verifyStudentPassword(userId: string, password: string): Promise<boolean> {
  const doc = await ADAMStudentAccountModel.findOne({ userId, active: true }).lean();
  if (!doc?.passwordHash) return false;
  return bcrypt.compare(password, doc.passwordHash);
}

export interface FounderStudentRow {
  userId:            string;
  name:              string;
  email?:            string;
  active:            boolean;
  createdAt:         Date;
  passwordSource?:   'env' | 'founder' | 'self-register' | 'google' | 'self';
  passwordUpdatedAt?: Date;
}

export async function listStudentsForFounder(): Promise<FounderStudentRow[]> {
  const docs = await ADAMStudentAccountModel.find()
    .sort({ name: 1 })
    .select({ userId: 1, name: 1, email: 1, active: 1, createdAt: 1, passwordSource: 1, passwordUpdatedAt: 1 })
    .lean();

  return docs.map((d) => ({
    userId:            d.userId,
    name:              d.name,
    email:             d.email,
    active:            d.active,
    createdAt:         d.createdAt,
    passwordSource:    d.passwordSource,
    passwordUpdatedAt: d.passwordUpdatedAt,
  }));
}

export async function createStudentAccount(params: {
  name:      string;
  password:  string;
  userId?:   string;
  email?:    string;
  createdBy: string;
}): Promise<FounderStudentRow> {
  const name = params.name.trim();
  const preferred = (params.userId?.trim().toLowerCase() || slugStudentUserId(name));
  const userId = await ensureUniqueUserId(preferred);
  const email = params.email?.trim().toLowerCase();

  const doc = await ADAMStudentAccountModel.create({
    userId,
    name,
    ...(email ? { email } : {}),
    passwordHash:      await bcrypt.hash(params.password, BCRYPT_ROUNDS),
    active:            true,
    createdBy:         params.createdBy,
    passwordSource:    params.createdBy === 'self-register' ? 'self-register' : 'founder',
    passwordUpdatedAt: params.createdBy === 'self-register' ? undefined : new Date(),
  });

  await refreshStudentCache();

  return {
    userId:            doc.userId,
    name:              doc.name,
    email:             doc.email,
    active:            doc.active,
    createdAt:         doc.createdAt,
    passwordSource:    doc.passwordSource,
    passwordUpdatedAt: doc.passwordUpdatedAt,
  };
}

export async function updateStudentAccount(
  userId: string,
  patch: { name?: string; email?: string; password?: string; active?: boolean },
): Promise<FounderStudentRow | null> {
  const doc = await ADAMStudentAccountModel.findOne({ userId });
  if (!doc) return null;

  if (patch.name?.trim()) doc.name = patch.name.trim();
  if (patch.email !== undefined) {
    const email = patch.email.trim().toLowerCase();
    doc.email = email || undefined;
  }
  if (patch.password) {
    doc.passwordHash = await bcrypt.hash(patch.password, BCRYPT_ROUNDS);
    doc.passwordSource = 'founder';
    doc.passwordUpdatedAt = new Date();
  }
  if (typeof patch.active === 'boolean') doc.active = patch.active;

  await doc.save();
  await refreshStudentCache();

  return {
    userId:            doc.userId,
    name:              doc.name,
    email:             doc.email,
    active:            doc.active,
    createdAt:         doc.createdAt,
    passwordSource:    doc.passwordSource,
    passwordUpdatedAt: doc.passwordUpdatedAt,
  };
}

export type DeleteStudentResult = 'deleted' | 'not_found' | 'forbidden';

/** Permanently removes a student account and their ADAM chat data (founder-only). */
export async function deleteStudentAccount(userId: string): Promise<DeleteStudentResult> {
  const id = userId.trim().toLowerCase();
  if (!id || id === FOUNDER_USER_ID) return 'forbidden';

  const exists = await ADAMStudentAccountModel.exists({ userId: id });
  if (!exists) return 'not_found';

  const sessions = await ADAMFounderSessionModel.find({
    founderId:   id,
    sessionType: 'student',
  })
    .select({ sessionId: 1 })
    .lean();

  const sessionIds = sessions.map((s) => s.sessionId).filter(Boolean);
  if (sessionIds.length > 0) {
    await ADAMMessageModel.deleteMany({ sessionId: { $in: sessionIds } });
    await ADAMMessageLedgerModel.deleteMany({ sessionId: { $in: sessionIds } }).catch(() => {});
    await ADAMFounderSessionModel.deleteMany({ sessionId: { $in: sessionIds } });
  }

  await ADAMWorkspaceModel.deleteMany({ userId: id });
  await ADAMConsultModel.deleteMany({ studentId: id });
  await ADAMPasswordResetModel.deleteMany({ userId: id });
  await ADAMStudentAccountModel.deleteOne({ userId: id });
  await refreshStudentCache();

  return 'deleted';
}

export async function loginStudentWithGoogle(profile: {
  googleSub: string;
  email:     string;
  name:      string;
}): Promise<FounderStudentRow> {
  let doc = await ADAMStudentAccountModel.findOne({ googleSub: profile.googleSub });
  if (!doc) {
    doc = await ADAMStudentAccountModel.findOne({ email: profile.email });
  }

  if (doc) {
    if (!doc.active) {
      throw new Error('This account is deactivated. Contact support.');
    }

    doc.googleSub = profile.googleSub;
    if (!doc.email) doc.email = profile.email;
    await doc.save();
    await refreshStudentCache();

    return {
      userId:            doc.userId,
      name:              doc.name,
      email:             doc.email,
      active:            doc.active,
      createdAt:         doc.createdAt,
      passwordSource:    doc.passwordSource,
      passwordUpdatedAt: doc.passwordUpdatedAt,
    };
  }

  if (!isGoogleSignInEnabled()) {
    throw new Error('Google sign-in is not enabled on this stack.');
  }

  const activeCount = await ADAMStudentAccountModel.countDocuments({ active: true });
  if (activeCount >= ENV.ADAM_STUDENT_REGISTER_MAX) {
    throw new Error('Registration limit reached. Contact support.');
  }

  const emailLocal = profile.email.split('@')[0] ?? '';
  const preferred = slugStudentUserId(emailLocal || profile.name);
  const userId = await ensureUniqueUserId(preferred);
  const placeholderSecret = crypto.randomBytes(32).toString('hex');

  doc = await ADAMStudentAccountModel.create({
    userId,
    name:           profile.name.trim(),
    email:          profile.email,
    googleSub:      profile.googleSub,
    passwordHash:   await bcrypt.hash(placeholderSecret, BCRYPT_ROUNDS),
    active:         true,
    createdBy:      'google',
    passwordSource: 'google',
  });

  await refreshStudentCache();

  return {
    userId:            doc.userId,
    name:              doc.name,
    email:             doc.email,
    active:            doc.active,
    createdAt:         doc.createdAt,
    passwordSource:    doc.passwordSource,
    passwordUpdatedAt: doc.passwordUpdatedAt,
  };
}

export async function changeStudentPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const doc = await ADAMStudentAccountModel.findOne({ userId, active: true });
  if (!doc?.passwordHash) throw new Error('Account not found.');

  const ok = await bcrypt.compare(currentPassword, doc.passwordHash);
  if (!ok) throw new Error('Current password is incorrect.');

  doc.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  doc.passwordSource = 'self';
  doc.passwordUpdatedAt = new Date();
  await doc.save();
}

export async function resetStudentPasswordWithToken(
  userId: string,
  newPassword: string,
): Promise<void> {
  const doc = await ADAMStudentAccountModel.findOne({ userId, active: true });
  if (!doc) throw new Error('Account not found.');

  doc.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  doc.passwordSource = 'self';
  doc.passwordUpdatedAt = new Date();
  await doc.save();
  await refreshStudentCache();
}

export { isStudentSelfRegisterEnabled } from './adam-platform-settings.service';

export function buildFounderStudentsAwarenessBlock(): string {
  const accounts = getStudentAccounts();
  const names = accounts.map((s) => s.name).join(', ') || '(none yet)';
  const ids = accounts.map((s) => s.userId).join(' | ') || '(none)';

  return `
FOUNDER STUDENT VISIBILITY:
Alamtologi students (${accounts.length}) have their own private sessions and a shared group session with you.
Active students: ${names}
When the Founder asks whether you have spoken with a student, whether they have communicated, or what they said — consult the [ALAMTOLOGI STUDENTS — ERA_1 ACTIVITY LOG] in your context.
Never say you have not communicated if the activity log shows they have. Distinguish private chat vs group chat when relevant.

STUDENT MESSAGES TO YOU:
Students may send you questions via ADAM (marked "Message from [name] via ADAM)" in this Teaching thread). Read and respond in Adab. The Consults tab lists the same items for tracking.

FOUNDER RELAY TO STUDENTS:
When the Founder wants you to convey a message to students (teaching, correction, answer on his behalf, "tell them…", "yes — … is …"), include exactly:
<adam_broadcast>{"message":"words students must read","target":"all"}</adam_broadcast>
target: "all" (group + each private chat), "group" (group only), or a student login id from: ${ids}
If the Founder attached files this turn, students receive the extracted teaching text (images read by vision) with the relay (you do not need uploadIds in JSON — the system attaches files automatically when conveying).
Tell the Founder you are conveying it. The tag is stripped from your visible reply; students receive it as "Message from Founder Masa Bayu (via ADAM)".
`.trim();
}

export function studentRegisterRequiresCode(): boolean {
  return ENV.ADAM_STUDENT_REGISTER_CODE.trim().length > 0;
}

export async function registerStudentSelf(params: {
  name:         string;
  password:     string;
  userId?:      string;
  email?:       string;
  registerCode?: string;
}): Promise<FounderStudentRow> {
  if (!isStudentSelfRegisterEnabled()) {
    throw new Error('Registration is closed.');
  }

  const expectedCode = ENV.ADAM_STUDENT_REGISTER_CODE.trim();
  if (expectedCode) {
    const supplied = (params.registerCode ?? '').trim();
    if (supplied !== expectedCode) {
      throw new Error('Invalid registration code.');
    }
  }

  const activeCount = await ADAMStudentAccountModel.countDocuments({ active: true });
  if (activeCount >= ENV.ADAM_STUDENT_REGISTER_MAX) {
    throw new Error('Registration limit reached. Contact the Founder.');
  }

  return createStudentAccount({
    name:      params.name.trim(),
    userId:    params.userId?.trim().toLowerCase(),
    email:     params.email?.trim(),
    password:  params.password,
    createdBy: 'self-register',
  });
}
