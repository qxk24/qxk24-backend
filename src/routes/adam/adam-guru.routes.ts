/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAMGuru Routes
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

import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { withSseKeepalive } from '../../adam/adam-sse-keepalive';
import { getTokenUser, isFounderPayload, requireAdamUser, requireGuru } from '../../middleware/auth.middleware';
import { attachSubscriptionAccess } from '../../middleware/subscription-guard.middleware';
import {
  hasActivePasKelas,
  hasActivePremiumLayer1,
  resolveStudentKelasAccess,
} from '../../adam/adam-guru-student-access.service';
import { loadMessageHistory } from '../../adam/adam-chat-session.service';
import { streamADAMGuruKelasChat } from '../../adam/adam-guru-stream.service';
import {
  acceptGuruInvitation,
  approveJoinRequest,
  assertGuruKelasAccess,
  createGuruKelas,
  findKelasByJoinRef,
  inviteStudentToKelas,
  isKelasAdamAwake,
  listGuruJoinRequestInbox,
  listGuruKelasForUser,
  listPendingInvitations,
  listStudentJoinRequests,
  previewKelasForJoin,
  rejectJoinRequest,
  requestJoinKelas,
  setKelasAdamAwake,
} from '../../adam/adam-guru.service';
import {
  getGuruProfile,
  isGuruProfileComplete,
  upsertGuruProfile,
  ensureGuruProfileSubject,
} from '../../adam/adam-guru-profile.service';
import { GURU_PROFILE_MAX_SUBJECTS } from '../../adam/adam-guru-profile.schema';
import { getStudentAccount } from '../../adam/adam-student.service';
import { getAccountRole } from '../../adam/adam-student-registry.service';
import type { ADAMChatMode } from '../../adam/adam.types';
import type { ChatParticipant } from '../../adam/adam-student.types';

const router = new Hono();

const CreateKelasSchema = z.object({
  title:   z.string().min(2).max(120),
  subject: z.string().min(2).max(120),
});

const GuruProfileSchema = z.object({
  fullName:        z.string().min(2).max(120),
  credentialTitle: z.string().max(40).optional(),
  institution:     z.string().min(2).max(200),
  email:           z.string().max(120).optional(),
  phone:           z.string().max(40).optional(),
  country:         z.string().max(80).optional(),
  bio:             z.string().max(500).optional(),
  subjects:        z.array(z.string().min(2).max(80)).min(1).max(GURU_PROFILE_MAX_SUBJECTS),
  teachingFocus:   z.string().max(300).optional(),
});

const InviteSchema = z.object({
  inviteeUserId: z.string().min(2).max(32),
});

const AcceptInviteSchema = z.object({
  token: z.string().min(20),
});

const JoinRequestSchema = z.object({
  joinCode: z.string().min(4).max(16).optional(),
  kelasId:  z.string().min(4).max(80).optional(),
  message:  z.string().max(300).optional(),
}).refine((d) => Boolean(d.joinCode?.trim() || d.kelasId?.trim()), {
  message: 'joinCode or kelasId is required',
});

const ChatSchema = z.object({
  message:    z.string().max(32_000).optional(),
  mode:       z.enum(['TEACHING', 'QUESTIONING', 'AUDIT', 'CONSTITUTIONAL', 'JOURNAL_GEN']).optional(),
  teach:      z.boolean().optional(),
});

const AdamAwakeSchema = z.object({
  awake: z.boolean(),
});

async function kelasAccessPayload(
  user: NonNullable<ReturnType<typeof getTokenUser>>,
  guruId: string,
  memberRole: 'guru' | 'student',
  isMember: boolean,
) {
  return resolveStudentKelasAccess({
    userId:     user.userId ?? '',
    guruId,
    memberRole,
    isFounder:  isFounderPayload(user),
    isMember,
  });
}

function participantFromToken(user: NonNullable<ReturnType<typeof getTokenUser>>): ChatParticipant {
  const userId = user.userId ?? '';
  const account = getStudentAccount(userId);
  const role: ChatParticipant['role'] = user.role === 'guru' ? 'guru' : 'student';
  return {
    userId,
    userName:    user.name ?? account?.name ?? userId,
    role,
    sessionType: 'guru',
  };
}

// GET /api/adam/guru/profile — guru teacher registration card
router.get('/profile', requireGuru, async (c) => {
  try {
    const user = getTokenUser(c)!;
    const userId = user.userId ?? '';
    const profile = await getGuruProfile(userId);
    return c.json({
      success: true,
      profile,
      profileComplete: profile ? profile.profileComplete : false,
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// PUT /api/adam/guru/profile — complete or update teacher registration
router.put('/profile', requireGuru, zValidator('json', GuruProfileSchema), async (c) => {
  try {
    const user = getTokenUser(c)!;
    const userId = user.userId ?? '';
    const body = c.req.valid('json');
    const profile = await upsertGuruProfile(userId, {
      ...body,
      email: body.email ?? '',
    });

    return c.json({ success: true, profile });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// POST /api/adam/guru/kelas — create classroom (guru only, one subject per kelas)
router.post('/kelas', requireGuru, zValidator('json', CreateKelasSchema), async (c) => {
  try {
    const user = getTokenUser(c)!;
    const userId = user.userId ?? '';
    const body = c.req.valid('json');
    const account = getStudentAccount(userId);
    const existingProfile = await getGuruProfile(userId);

    if (!isGuruProfileComplete(existingProfile)) {
      return c.json({
        success: false,
        error:   'Complete your guru registration before creating a kelas.',
        code:    'GURU_PROFILE_REQUIRED',
        kernel:  'ALAMTOLOGI',
      }, 403);
    }

    const subject = body.subject.trim();
    await ensureGuruProfileSubject(userId, subject);

    const guruName = existingProfile?.fullName
      ?? user.name
      ?? account?.name
      ?? userId;

    const kelas = await createGuruKelas({
      guruId:   userId,
      guruName,
      title:    body.title,
      subject,
    });

    return c.json({ success: true, kelas });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// GET /api/adam/guru/kelas — list kelas for current user
router.get('/kelas', requireAdamUser, async (c) => {
  try {
    const user = getTokenUser(c)!;
    const kelas = await listGuruKelasForUser(user.userId);
    return c.json({ success: true, kelas });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// GET /api/adam/guru/invitations — pending invites for student (+ access preview)
router.get('/invitations', requireAdamUser, async (c) => {
  try {
    const user = getTokenUser(c)!;
    const invitations = await listPendingInvitations(user.userId);
    const enriched = await Promise.all(
      invitations.map(async (inv) => ({
        ...inv,
        access: await kelasAccessPayload(user, inv.guruId, 'student', false),
      })),
    );
    return c.json({ success: true, invitations: enriched });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// GET /api/adam/guru/kelas-access?kelasId= — student access for kelas (or general paths)
router.get('/kelas-access', requireAdamUser, async (c) => {
  try {
    const user = getTokenUser(c)!;
    const kelasId = c.req.query('kelasId')?.trim();

    if (!kelasId) {
      const userId = user.userId ?? '';
      const [premium, pasKelas] = await Promise.all([
        hasActivePremiumLayer1(userId),
        hasActivePasKelas(userId),
      ]);
      return c.json({
        success: true,
        premium,
        pasKelas,
        pasKelasPriceMYR: 15,
        message: premium || pasKelas
          ? 'You have kelas access via your subscription.'
          : 'Join via guru invitation or request with a join code — access via Premium, Pas Kelas, or guru seat quota.',
      });
    }

    const { kelas, memberRole } = await assertGuruKelasAccess(kelasId, user.userId ?? '');
    const studentAccess = await kelasAccessPayload(user, kelas.guruId, memberRole, true);
    return c.json({ success: true, kelasId, memberRole, access: studentAccess });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// GET /api/adam/guru/kelas/preview?joinCode=… — student previews kelas before requesting
router.get('/kelas/preview', requireAdamUser, async (c) => {
  const joinCode = c.req.query('joinCode')?.trim();
  const kelasId = c.req.query('kelasId')?.trim();
  if (!joinCode && !kelasId) {
    return c.json({ success: false, error: 'joinCode or kelasId required.', kernel: 'ALAMTOLOGI' }, 400);
  }

  try {
    const preview = await previewKelasForJoin({ joinCode, kelasId });
    const user = getTokenUser(c)!;
    const kelasDoc = await findKelasByJoinRef({ kelasId: preview.kelasId });
    const access = kelasDoc
      ? await kelasAccessPayload(user, kelasDoc.guruId, 'student', false)
      : null;

    return c.json({ success: true, preview, access });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kelas not found.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 404);
  }
});

// POST /api/adam/guru/kelas/join-request — student requests to join
router.post('/kelas/join-request', requireAdamUser, zValidator('json', JoinRequestSchema), async (c) => {
  const user = getTokenUser(c)!;
  const body = c.req.valid('json');
  const account = getStudentAccount(user.userId ?? '');
  const userName = user.name ?? account?.name ?? user.userId ?? '';

  try {
    const request = await requestJoinKelas({
      joinCode: body.joinCode,
      kelasId:  body.kelasId,
      userId:   user.userId ?? '',
      userName,
      message:  body.message,
    });
    return c.json({ success: true, request });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Join request failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// GET /api/adam/guru/join-requests/mine — student's join requests
router.get('/join-requests/mine', requireAdamUser, async (c) => {
  try {
    const user = getTokenUser(c)!;
    const requests = await listStudentJoinRequests(user.userId ?? '');
    return c.json({ success: true, requests });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// GET /api/adam/guru/join-requests/inbox — guru pending requests
router.get('/join-requests/inbox', requireGuru, async (c) => {
  try {
    const user = getTokenUser(c)!;
    const requests = await listGuruJoinRequestInbox(user.userId ?? '');
    return c.json({ success: true, requests });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// POST /api/adam/guru/join-requests/:requestId/approve
router.post('/join-requests/:requestId/approve', requireGuru, async (c) => {
  const user = getTokenUser(c)!;
  const requestId = c.req.param('requestId') ?? '';
  if (!requestId) {
    return c.json({ success: false, error: 'requestId required.', kernel: 'ALAMTOLOGI' }, 400);
  }
  try {
    const kelas = await approveJoinRequest({ requestId, guruId: user.userId ?? '' });
    return c.json({ success: true, kelas });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Could not approve request.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/adam/guru/join-requests/:requestId/reject
router.post('/join-requests/:requestId/reject', requireGuru, async (c) => {
  const user = getTokenUser(c)!;
  const requestId = c.req.param('requestId') ?? '';
  if (!requestId) {
    return c.json({ success: false, error: 'requestId required.', kernel: 'ALAMTOLOGI' }, 400);
  }
  try {
    await rejectJoinRequest({ requestId, guruId: user.userId ?? '' });
    return c.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Could not reject request.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/adam/guru/invitations/accept
router.post('/invitations/accept', requireAdamUser, zValidator('json', AcceptInviteSchema), async (c) => {
  try {
    const user = getTokenUser(c)!;
    const { token } = c.req.valid('json');
    const kelas = await acceptGuruInvitation({ token, userId: user.userId });
    const access = await kelasAccessPayload(user, kelas.guruId, 'student', true);
    return c.json({ success: true, kelas, access });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// POST /api/adam/guru/kelas/:kelasId/invite — guru invites student by userId
router.post(
  '/kelas/:kelasId/invite',
  requireGuru,
  zValidator('json', InviteSchema),
  async (c) => {
    try {
      const user = getTokenUser(c)!;
      const kelasId = c.req.param('kelasId');
      const { inviteeUserId } = c.req.valid('json');

      const invite = await inviteStudentToKelas({
        kelasId,
        guruId: user.userId,
        inviteeUserId: inviteeUserId.trim().toLowerCase(),
      });

      return c.json({ success: true, invite });
  
    } catch (err) {
      console.error(err);
      throw err;
    }},
);

// GET /api/adam/guru/kelas/:kelasId/history
router.get('/kelas/:kelasId/history', requireAdamUser, async (c) => {
  try {
    const user = getTokenUser(c)!;
    const kelasId = c.req.param('kelasId') ?? '';
    const userId = user.userId ?? '';
    if (!kelasId) {
      return c.json({ success: false, error: 'Kelas id required.', kernel: 'ALAMTOLOGI' }, 400);
    }
    const { kelas, memberRole } = await assertGuruKelasAccess(kelasId, userId);
    const access = await kelasAccessPayload(user, kelas.guruId, memberRole, true);
    if (!access.canAccess) {
      return c.json({
        success: false,
        error:   access.message ?? 'Kelas access required.',
        code:    access.code ?? 'KELAS_ACCESS_REQUIRED',
        access,
        kernel:  'ALAMTOLOGI',
      }, 402);
    }

    const messages = await loadMessageHistory(kelas.sessionId, 100);
    return c.json({
      success: true,
      sessionId: kelas.sessionId,
      adamAwake: isKelasAdamAwake(kelas),
      access,
      messages: messages.map((m) => ({
        role:        m.role,
        content:     m.content,
        speakerName: m.speakerName,
        createdAt:   m.createdAt.toISOString(),
      })),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// PUT /api/adam/guru/kelas/:kelasId/adam-awake — guru puts ADAM to sleep or wakes ADAM
router.put(
  '/kelas/:kelasId/adam-awake',
  requireGuru,
  zValidator('json', AdamAwakeSchema),
  async (c) => {
    try {
      const user = getTokenUser(c)!;
      const kelasId = c.req.param('kelasId') ?? '';
      const userId = user.userId ?? '';
      const { awake } = c.req.valid('json');

      if (!kelasId) {
        return c.json({ success: false, error: 'Kelas id required.', kernel: 'ALAMTOLOGI' }, 400);
      }

      const kelas = await setKelasAdamAwake({ kelasId, guruId: userId, awake });
      return c.json({ success: true, kelas, adamAwake: kelas.adamAwake });
  
    } catch (err) {
      console.error(err);
      throw err;
    }},
);

// POST /api/adam/guru/kelas/:kelasId/chat — shared kelas SSE stream
router.post(
  '/kelas/:kelasId/chat',
  requireAdamUser,
  attachSubscriptionAccess,
  zValidator('json', ChatSchema),
  async (c) => {
    const user = getTokenUser(c)!;
    const kelasId = c.req.param('kelasId');
    const body = c.req.valid('json');

    const { kelas, memberRole } = await assertGuruKelasAccess(kelasId, user.userId);
    const access = await kelasAccessPayload(user, kelas.guruId, memberRole, true);
    if (!access.canAccess) {
      return c.json({
        success: false,
        error:   access.message ?? 'Kelas access required.',
        code:    access.code ?? 'KELAS_ACCESS_REQUIRED',
        access,
        kernel:  'ALAMTOLOGI',
      }, 402);
    }
    const participant = participantFromToken(user);
    const mode = (body.mode ?? 'QUESTIONING') as ADAMChatMode;
    const isTeachTurn = memberRole === 'guru' && (body.teach === true || mode === 'TEACHING');

    c.header('Content-Type', 'text/event-stream');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');

    return stream(c, async (s) => {
      try {
        await withSseKeepalive(s, () =>
          streamADAMGuruKelasChat({
            kelas: {
              kelasId:   kelas.kelasId,
              guruId:    kelas.guruId,
              guruName:  kelas.guruName,
              title:     kelas.title,
              subject:   kelas.subject,
              sessionId: kelas.sessionId,
              adamAwake: isKelasAdamAwake(kelas),
            },
            sessionId:   kelas.sessionId,
            userMessage: body.message ?? '',
            mode:        isTeachTurn ? 'TEACHING' : mode,
            participant,
            isTeachTurn,
            memberRole,
            onEvent: async (event, data) => {
              try {
                await s.write(`event: ${event}\ndata: ${data}\n\n`);
            
              } catch (err) {
                console.error(err);
                throw err;
              }},
          }),
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'ADAMGuru stream failed';
        await s.write(`event: adam_error\ndata: ${JSON.stringify({ error: msg })}\n\n`);
      }
      await s.write('event: adam_done\ndata: {}\n\n');
    });
  },
);

// GET /api/adam/guru/me — account role + profile status
router.get('/me', requireAdamUser, async (c) => {
  try {
    const user = getTokenUser(c)!;
    const userId = user.userId ?? '';
    const accountRole = await getAccountRole(userId);
    const profile = accountRole === 'guru' ? await getGuruProfile(userId) : null;

    return c.json({
      success: true,
      userId,
      name:    user.name,
      role:    user.role,
      accountRole,
      profile,
      profileComplete: profile?.profileComplete ?? false,
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

export default router;
