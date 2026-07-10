/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAMGuru — Kelas Service
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import crypto from 'crypto';
import { ENV } from '../config/environments';
import {
  AdamGuruInvitationModel,
  AdamGuruJoinRequestModel,
  AdamGuruKelasModel,
  AdamGuruMemberModel,
  type AdamGuruKelasDocument,
} from './adam-guru.schema';
import { getOrCreateGuruLane } from './adam-guru-lane.service';
import { ADAMFounderSessionModel } from './adam.schema';
import { getStudentAccount } from './adam-student.service';

export function guruKelasSessionId(kelasId: string): string {
  return `K24s-guru-${kelasId}`;
}

function newKelasId(): string {
  return `kelas-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
}

function newInviteId(): string {
  return `inv-${crypto.randomBytes(12).toString('hex')}`;
}

function newJoinRequestId(): string {
  return `jr-${crypto.randomBytes(12).toString('hex')}`;
}

export function newKelasJoinCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

async function ensureKelasJoinCode(kelas: AdamGuruKelasDocument): Promise<string> {
  if (kelas.joinCode?.trim()) return kelas.joinCode.trim();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const joinCode = newKelasJoinCode();
    const clash = await AdamGuruKelasModel.findOne({ joinCode }).lean();
    if (clash && clash.kelasId !== kelas.kelasId) continue;
    kelas.joinCode = joinCode;
    await kelas.save();
    return joinCode;
  }
  throw new Error('Could not assign kelas join code.');
}

export interface GuruKelasView {
  kelasId:     string;
  guruId:      string;
  guruName:    string;
  title:       string;
  subject:     string;
  sessionId:   string;
  joinCode:    string;
  memberCount: number;
  active:      boolean;
  adamAwake:   boolean;
  createdAt:   Date;
}

export interface KelasJoinPreview {
  kelasId:     string;
  title:       string;
  subject:     string;
  guruName:    string;
  memberCount: number;
  joinCode:    string;
}

export interface GuruJoinRequestView {
  requestId:     string;
  kelasId:       string;
  kelasTitle:    string;
  subject:       string;
  studentUserId: string;
  studentName:   string;
  message:       string;
  status:        'pending' | 'approved' | 'rejected';
  createdAt:     Date;
}

export function isKelasAdamAwake(kelas: { adamAwake?: boolean }): boolean {
  return kelas.adamAwake !== false;
}

async function ensureGuruSession(sessionId: string, guruId: string): Promise<void> {
  const existing = await ADAMFounderSessionModel.findOne({ sessionId });
  if (existing) return;
  await ADAMFounderSessionModel.create({
    sessionId,
    founderId:    guruId,
    sessionType:  'guru',
    kernel:       ENV.QXK24_KERNEL_VERSION,
    era:          ENV.QXK24_ERA,
    active:       true,
    lastActiveAt: new Date(),
    messageCount: 0,
  });
}

export async function createGuruKelas(input: {
  guruId:   string;
  guruName: string;
  title:    string;
  subject?: string;
}): Promise<GuruKelasView> {
  const kelasId = newKelasId();
  const sessionId = guruKelasSessionId(kelasId);
  const subject = input.subject?.trim() ?? '';

  await ensureGuruSession(sessionId, input.guruId);

  const joinCode = newKelasJoinCode();

  await AdamGuruKelasModel.create({
    kelasId,
    guruId:    input.guruId,
    guruName:  input.guruName,
    title:     input.title.trim(),
    subject,
    sessionId,
    joinCode,
    active:    true,
    adamAwake: true,
  });

  await getOrCreateGuruLane({
    kelasId,
    guruId:   input.guruId,
    guruName: input.guruName,
    subject,
  });

  await AdamGuruMemberModel.create({
    kelasId,
    userId:   input.guruId,
    userName: input.guruName,
    role:     'guru',
    joinedAt: new Date(),
  });

  return {
    kelasId,
    guruId:      input.guruId,
    guruName:    input.guruName,
    title:       input.title.trim(),
    subject,
    sessionId,
    joinCode,
    memberCount: 1,
    active:      true,
    adamAwake:   true,
    createdAt:   new Date(),
  };
}

function kelasToView(kelas: {
  kelasId: string;
  guruId: string;
  guruName: string;
  title: string;
  subject: string;
  sessionId: string;
  joinCode?: string;
  active: boolean;
  adamAwake?: boolean;
  createdAt: Date;
}, memberCount: number, joinCode: string): GuruKelasView {
  return {
    kelasId:     kelas.kelasId,
    guruId:      kelas.guruId,
    guruName:    kelas.guruName,
    title:       kelas.title,
    subject:     kelas.subject,
    sessionId:   kelas.sessionId,
    joinCode,
    memberCount,
    active:      kelas.active,
    adamAwake:   isKelasAdamAwake(kelas),
    createdAt:   kelas.createdAt,
  };
}

export async function setKelasAdamAwake(input: {
  kelasId: string;
  guruId:  string;
  awake:   boolean;
}): Promise<GuruKelasView> {
  const kelas = await getGuruKelas(input.kelasId);
  if (!kelas) throw new Error('Kelas not found.');
  if (kelas.guruId !== input.guruId) throw new Error('Only the guru may put ADAM to sleep or wake ADAM.');

  kelas.adamAwake = input.awake;
  await kelas.save();

  const memberCount = await AdamGuruMemberModel.countDocuments({ kelasId: input.kelasId });
  const joinCode = await ensureKelasJoinCode(kelas);

  return kelasToView(kelas, memberCount, joinCode);
}

export async function listGuruKelasForUser(userId: string): Promise<GuruKelasView[]> {
  const memberships = await AdamGuruMemberModel.find({ userId }).lean();
  if (!memberships.length) return [];

  const kelasIds = memberships.map((m) => m.kelasId);
  const kelasRows = await AdamGuruKelasModel.find({
    kelasId: { $in: kelasIds },
    active:  true,
  }).lean();

  const counts = await AdamGuruMemberModel.aggregate<{ _id: string; count: number }>([
    { $match: { kelasId: { $in: kelasIds } } },
    { $group: { _id: '$kelasId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id, c.count]));

  const views: GuruKelasView[] = [];
  const docs = await AdamGuruKelasModel.find({ kelasId: { $in: kelasRows.map(k => k.kelasId) } }).lean();
  const docMap = new Map(docs.map(doc => [doc.kelasId, doc]));
  for (const k of kelasRows) {
    const doc = docMap.get(k.kelasId);
    let joinCode = k.joinCode?.trim() || doc?.joinCode?.trim() || '';
    if (!joinCode) {
      const full = await AdamGuruKelasModel.findOne({ kelasId: k.kelasId });
      if (full) joinCode = await ensureKelasJoinCode(full);
    }
    views.push(kelasToView(k, countMap.get(k.kelasId) ?? 1, joinCode));
  }
  return views;
}

export async function getGuruKelas(kelasId: string): Promise<AdamGuruKelasDocument | null> {
  return AdamGuruKelasModel.findOne({ kelasId, active: true });
}

export async function isGuruKelasMember(
  kelasId: string,
  userId: string,
): Promise<'guru' | 'student' | null> {
  const row = await AdamGuruMemberModel.findOne({ kelasId, userId }).lean();
  return row?.role ?? null;
}

export async function assertGuruKelasAccess(
  kelasId: string,
  userId: string,
): Promise<{ kelas: AdamGuruKelasDocument; memberRole: 'guru' | 'student' }> {
  const kelas = await getGuruKelas(kelasId);
  if (!kelas) throw new Error('Kelas not found.');
  const memberRole = await isGuruKelasMember(kelasId, userId);
  if (!memberRole) throw new Error('You are not a member of this kelas.');
  return { kelas, memberRole };
}

export async function inviteStudentToKelas(input: {
  kelasId:       string;
  guruId:        string;
  inviteeUserId: string;
}): Promise<{ inviteId: string; token: string; inviteeName: string }> {
  const kelas = await getGuruKelas(input.kelasId);
  if (!kelas || kelas.guruId !== input.guruId) {
    throw new Error('Only the guru of this kelas may invite students.');
  }

  const account = getStudentAccount(input.inviteeUserId);
  if (!account) throw new Error('Student account not found.');

  const existing = await AdamGuruMemberModel.findOne({
    kelasId: input.kelasId,
    userId:  input.inviteeUserId,
  });
  if (existing) throw new Error('Student is already in this kelas.');

  const token = crypto.randomBytes(24).toString('hex');
  const inviteId = newInviteId();

  await AdamGuruInvitationModel.findOneAndUpdate(
    { kelasId: input.kelasId, inviteeUserId: input.inviteeUserId, status: 'pending' },
    {
      inviteId,
      kelasId:       input.kelasId,
      guruId:        input.guruId,
      inviteeUserId: input.inviteeUserId,
      inviteeName:   account.name,
      token,
      status:        'pending',
    },
    { upsert: true, new: true },
  );

  return { inviteId, token, inviteeName: account.name };
}

export async function acceptGuruInvitation(input: {
  token:  string;
  userId: string;
}): Promise<GuruKelasView> {
  const invite = await AdamGuruInvitationModel.findOne({
    token:         input.token,
    inviteeUserId: input.userId,
    status:        'pending',
  });
  if (!invite) throw new Error('Invitation not found or expired.');

  const kelas = await getGuruKelas(invite.kelasId);
  if (!kelas) throw new Error('Kelas no longer active.');

  const account = getStudentAccount(input.userId);
  const userName = account?.name ?? invite.inviteeName;

  await AdamGuruMemberModel.findOneAndUpdate(
    { kelasId: invite.kelasId, userId: input.userId },
    {
      kelasId:  invite.kelasId,
      userId:   input.userId,
      userName,
      role:     'student',
      joinedAt: new Date(),
    },
    { upsert: true, new: true },
  );

  await AdamGuruInvitationModel.updateOne(
    { inviteId: invite.inviteId },
    { status: 'accepted' },
  );

  const memberCount = await AdamGuruMemberModel.countDocuments({ kelasId: invite.kelasId });
  const joinCode = await ensureKelasJoinCode(kelas);

  return kelasToView(kelas, memberCount, joinCode);
}

export async function findKelasByJoinRef(input: {
  kelasId?:  string;
  joinCode?: string;
}): Promise<AdamGuruKelasDocument | null> {
  const kelasId = input.kelasId?.trim();
  const joinCode = input.joinCode?.trim().toUpperCase();
  if (kelasId) {
    return getGuruKelas(kelasId);
  }
  if (joinCode) {
    const kelas = await AdamGuruKelasModel.findOne({ joinCode, active: true });
    return kelas;
  }
  return null;
}

export async function previewKelasForJoin(input: {
  kelasId?:  string;
  joinCode?: string;
}): Promise<KelasJoinPreview> {
  const kelas = await findKelasByJoinRef(input);
  if (!kelas) throw new Error('Kelas not found. Check the join code or kelas id.');
  const joinCode = await ensureKelasJoinCode(kelas);
  const memberCount = await AdamGuruMemberModel.countDocuments({ kelasId: kelas.kelasId });
  return {
    kelasId:     kelas.kelasId,
    title:       kelas.title,
    subject:     kelas.subject,
    guruName:    kelas.guruName,
    memberCount,
    joinCode,
  };
}

export async function requestJoinKelas(input: {
  kelasId?:   string;
  joinCode?:  string;
  userId:     string;
  userName:   string;
  message?:   string;
}): Promise<GuruJoinRequestView> {
  const kelas = await findKelasByJoinRef(input);
  if (!kelas) throw new Error('Kelas not found. Check the join code or kelas id.');
  if (kelas.guruId === input.userId) {
    throw new Error('You cannot request to join your own kelas.');
  }

  const existingMember = await AdamGuruMemberModel.findOne({
    kelasId: kelas.kelasId,
    userId:  input.userId,
  });
  if (existingMember) throw new Error('You are already a member of this kelas.');

  const pending = await AdamGuruJoinRequestModel.findOne({
    kelasId:       kelas.kelasId,
    studentUserId: input.userId,
    status:        'pending',
  });
  if (pending) throw new Error('You already have a pending request for this kelas.');

  const requestId = newJoinRequestId();
  const note = input.message?.trim().slice(0, 300) ?? '';

  await AdamGuruJoinRequestModel.create({
    requestId,
    kelasId:       kelas.kelasId,
    guruId:        kelas.guruId,
    studentUserId: input.userId,
    studentName:   input.userName,
    message:       note,
    status:        'pending',
  });

  return {
    requestId,
    kelasId:       kelas.kelasId,
    kelasTitle:    kelas.title,
    subject:       kelas.subject,
    studentUserId: input.userId,
    studentName:   input.userName,
    message:       note,
    status:        'pending',
    createdAt:     new Date(),
  };
}

export async function listStudentJoinRequests(userId: string): Promise<GuruJoinRequestView[]> {
  const rows = await AdamGuruJoinRequestModel.find({ studentUserId: userId })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  return enrichJoinRequests(rows);
}

export async function listGuruJoinRequestInbox(guruId: string): Promise<GuruJoinRequestView[]> {
  const rows = await AdamGuruJoinRequestModel.find({ guruId, status: 'pending' })
    .sort({ createdAt: 1 })
    .lean();

  return enrichJoinRequests(rows);
}

async function enrichJoinRequests(
  rows: Array<{
    requestId: string;
    kelasId: string;
    studentUserId: string;
    studentName: string;
    message: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
  }>,
): Promise<GuruJoinRequestView[]> {
  const kelasIds = [...new Set(rows.map((r) => r.kelasId))];
  const kelasMap = new Map(
    (await AdamGuruKelasModel.find({ kelasId: { $in: kelasIds } }).lean())
      .map((k) => [k.kelasId, k]),
  );

  return rows.map((r) => {
    const k = kelasMap.get(r.kelasId);
    return {
      requestId:     r.requestId,
      kelasId:       r.kelasId,
      kelasTitle:    k?.title ?? r.kelasId,
      subject:       k?.subject ?? '',
      studentUserId: r.studentUserId,
      studentName:   r.studentName,
      message:       r.message,
      status:        r.status,
      createdAt:     r.createdAt,
    };
  });
}

async function addStudentToKelas(input: {
  kelasId:   string;
  userId:    string;
  userName:  string;
}): Promise<void> {
  await AdamGuruMemberModel.findOneAndUpdate(
    { kelasId: input.kelasId, userId: input.userId },
    {
      kelasId:  input.kelasId,
      userId:   input.userId,
      userName: input.userName,
      role:     'student',
      joinedAt: new Date(),
    },
    { upsert: true, new: true },
  );
}

export async function approveJoinRequest(input: {
  requestId: string;
  guruId:    string;
}): Promise<GuruKelasView> {
  const req = await AdamGuruJoinRequestModel.findOne({
    requestId: input.requestId,
    guruId:    input.guruId,
    status:    'pending',
  });
  if (!req) throw new Error('Join request not found or already handled.');

  const kelas = await getGuruKelas(req.kelasId);
  if (!kelas) throw new Error('Kelas no longer active.');

  const existing = await AdamGuruMemberModel.findOne({
    kelasId: req.kelasId,
    userId:  req.studentUserId,
  });
  if (!existing) {
    await addStudentToKelas({
      kelasId:  req.kelasId,
      userId:   req.studentUserId,
      userName: req.studentName,
    });
  }

  await AdamGuruJoinRequestModel.updateOne(
    { requestId: req.requestId },
    { status: 'approved' },
  );

  const memberCount = await AdamGuruMemberModel.countDocuments({ kelasId: req.kelasId });
  const joinCode = await ensureKelasJoinCode(kelas);
  return kelasToView(kelas, memberCount, joinCode);
}

export async function rejectJoinRequest(input: {
  requestId: string;
  guruId:    string;
}): Promise<void> {
  const result = await AdamGuruJoinRequestModel.updateOne(
    { requestId: input.requestId, guruId: input.guruId, status: 'pending' },
    { status: 'rejected' },
  );
  if (result.matchedCount === 0) {
    throw new Error('Join request not found or already handled.');
  }
}

export async function listPendingInvitations(userId: string) {
  try {
    const rows = await AdamGuruInvitationModel.find({
      inviteeUserId: userId,
      status:        'pending',
    }).lean();

    const kelasIds = rows.map((r) => r.kelasId);
    const kelasMap = new Map(
      (await AdamGuruKelasModel.find({ kelasId: { $in: kelasIds } }).lean())
        .map((k) => [k.kelasId, k]),
    );

    return rows
      .filter((r) => kelasMap.has(r.kelasId))
      .map((r) => {
        const k = kelasMap.get(r.kelasId)!;
        return {
          inviteId:      r.inviteId,
          token:         r.token,
          kelasId:       r.kelasId,
          guruId:        k.guruId,
          title:         k.title,
          subject:       k.subject,
          guruName:      k.guruName,
          createdAt:     r.createdAt,
        };
      });

  } catch (err) {
    console.error(err);
    throw err;
  }}
