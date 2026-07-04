/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Route Schemas
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-23
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { z } from 'zod';
import { CREDIT_PACK_ID } from '../../../freemium/adam-freemium-credit.service';

export const LoginSchema = z.object({
  username: z.string().optional().default(''),
  password: z.string().min(1),
});

export const UserIdSchema = z
  .string()
  .min(2)
  .max(32)
  .regex(/^[a-z0-9-]+$/, 'Login id: lowercase letters, numbers, hyphens only.');

export const RegisterSchema = z.object({
  name:         z.string().min(2).max(80),
  userId:       UserIdSchema.optional(),
  email:        z.string().email().max(120).optional(),
  password:     z.string().min(6).max(128),
  registerCode: z.string().max(64).optional(),
  accountLane:  z.enum(['umum', 'pelajar', 'tools', 'niaga']).optional(),
});

export const GoogleSchema = z.object({
  idToken:     z.string().min(20),
  /** New Google accounts only — existing accounts keep their lane. */
  accountLane: z.enum(['umum', 'pelajar', 'tools', 'niaga']).optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email().max(120),
  stack: z.enum(['lab', 'production']).optional(),
});

export const ResetPasswordSchema = z.object({
  token:       z.string().min(20),
  newPassword: z.string().min(6).max(128),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(6).max(128),
});

export const ChatSchema = z.object({
  sessionId:    z.string().optional(),
  message:      z.string().max(100_000).optional(),
  mode:         z.enum(['TEACHING', 'QUESTIONING', 'AUDIT', 'CONSTITUTIONAL', 'JOURNAL_GEN', 'TUTOR']).default('QUESTIONING'),
  answerStyle:  z.enum(['natural', 'philosophy', 'formal', 'technical']).optional(),
  uploadIds:    z.array(z.string().min(1)).max(5).optional(),
}).refine(
  (d) => (d.message?.trim()?.length ?? 0) > 0 || (d.uploadIds?.length ?? 0) > 0,
  { message: 'Provide a message and/or at least one attached file (uploadIds).' },
);

export const TutorProfileSchema = z.object({
  level:      z.enum(['primary', 'secondary', 'university']),
  curriculum: z.enum([
    'national', 'international', 'us', 'uk', 'other',
    'kpm', 'cambridge', 'mixed',
  ]),
  language:   z.enum([
    'english', 'malay', 'arabic', 'mandarin', 'tamil',
    'indonesian', 'spanish', 'french', 'other',
  ]).optional(),
  yearLabel:   z.string().max(64).optional(),
  countryCode: z.string().length(2).regex(/^[A-Z]{2}$/).optional(),
  localeNote:  z.string().max(120).optional(),
});

export const TutorChatSchema = z.object({
  sessionId:     z.string().optional(),
  message:       z.string().max(100_000).optional(),
  answerStyle:   z.enum(['natural', 'philosophy', 'formal', 'technical']).optional(),
  uploadIds:     z.array(z.string().min(1)).max(5).optional(),
  tutorProfile:  TutorProfileSchema.optional(),
  viaVoice:      z.boolean().optional(),
  responseMs:    z.number().int().min(0).max(3_600_000).optional(),
}).refine(
  (d) => (d.message?.trim()?.length ?? 0) > 0 || (d.uploadIds?.length ?? 0) > 0,
  { message: 'Provide a message and/or at least one attached file (uploadIds).' },
);

export const CoachingChatSchema = z.object({
  sessionId:    z.string().optional(),
  message:      z.string().max(100_000).optional(),
  answerStyle:  z.enum(['natural', 'philosophy', 'formal', 'technical']).optional(),
  uploadIds:    z.array(z.string().min(1)).max(5).optional(),
  viaVoice:     z.boolean().optional(),
}).refine(
  (d) => (d.message?.trim()?.length ?? 0) > 0 || (d.uploadIds?.length ?? 0) > 0,
  { message: 'Provide a message and/or at least one attached file (uploadIds).' },
);

export const DocsGenerateSchema = z.object({
  taskId:     z.enum([
    'study-pack',
    'document-faq',
    'meeting-minutes',
    'pitch-deck-content',
    'business-checklist',
  ]),
  brief:      z.string().max(12_000).optional(),
  sourceText: z.string().max(80_000).optional(),
  sessionId:  z.string().optional(),
});

export const MacBridgeToggleSchema = z.object({
  open: z.boolean(),
});

export const BuyCreditSchema = z.object({
  packId: z.string().optional().default(CREDIT_PACK_ID),
});

export const SessionTitleSchema = z.object({
  title: z.string().min(1).max(72),
});
