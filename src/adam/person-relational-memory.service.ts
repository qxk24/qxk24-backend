/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : Person Relational Memory Service
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
 *
 * Formal layer above studentTracks + adam_messages.
 * One relational profile per known person — loaded selectively per turn.
 */

import {
  ADAMFounderSessionModel,
  ADAMMessageModel,
} from './adam.schema';
import { getStudentAccounts } from './adam-student-registry.service';
import { getUserWorkspaces } from './adam-workspace.service';
import { getOrCreateMaster } from '../qxk24brain/qxk24brain.engine';
import { findBestStudentTrack } from '../qxk24brain/qxk24brain-student.engine';
import {
  founderAsksDrAminullahContext,
  founderAsksPersonalBiography,
} from './adam-knowledge-prompts';
import type {
  PersonRef,
  PersonRelationalProfile,
} from './person-relational-memory.types';

export type {
  PersonContextOptions,
  PersonMessageStats,
  PersonRef,
  PersonRelationalProfile,
} from './person-relational-memory.types';

export {
  ADAM_PERSON_RELATIONAL_IDENTITY_LAW,
  buildPersonIdentityOutputLock,
  buildPersonRelationalMemoryAck,
  buildPersonRelationalMemoryContextBlock,
} from './person-relational-memory.prompts';

const PERSON_INQUIRY_PATTERN =
  /\b(?:pernah\s+(?:bercakap|communicat|contact|hubung)|apa\s+(?:yang|y\s*ang)\s+(?:[\w-]+\s+){0,4}(?:kata|tanya|tanyakan|message)|siapa\s+(?:pernah|yang)|ingat\s+(?:tak|kan)\s+(?:[\w-]+\s+){0,3}|cerita\s+tentang|mesej\s+dari|hubungan\s+(?:dengan|dgn)|aktiviti\s+(?:[\w-]+\s+){0,3}|ad\s*am\s+tutor|pelajar\s+(?:ini|itu|nama)|communicate\s+with|spoken\s+with|message\s+from|student\s+[\w-]+\s+(?:said|asked|tanya)|tanya\s+(?:tentang|pasal))\b/i;

const RECENT_EPISODE_LIMIT = 10;
const EPISODE_SNIPPET_CHARS = 360;
const TRACK_SNIPPET_CHARS = 900;
const PRM_SUMMARY_CHARS = 1_200;

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function messageSnippet(content: string, max = EPISODE_SNIPPET_CHARS): string {
  return content
    .replace(/<adam_judgment>[\s\S]*?<\/adam_judgment>/g, '')
    .replace(/<adam_consult>[\s\S]*?<\/adam_consult>/g, '')
    .replace(/═══ FOUNDER TEACHING DATA[\s\S]*?═══ END FOUNDER TEACHING DATA ═══/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function trimText(text: string, maxChars: number): string {
  if (!text) return '';
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > maxChars ? `${t.slice(0, maxChars)}…` : t;
}

export {
  chunkMentionsOtherKnownPerson,
  chunkMentionsPerson,
} from './person-relational-memory.identity';

export function listKnownPersonRefs(): PersonRef[] {
  return getStudentAccounts().map((s) => ({
    personId:    s.userId,
    displayName: s.name,
  }));
}

export function founderAsksAboutKnownPerson(message: string): boolean {
  const m = message.trim();
  if (!m) return false;
  if (founderAsksPersonalBiography(m)) return false;
  if (founderAsksDrAminullahContext(m)) return false;
  return PERSON_INQUIRY_PATTERN.test(m);
}

export function resolvePersonFromMessage(
  message: string,
  knownPersons: PersonRef[] = listKnownPersonRefs(),
): PersonRef | null {
  const m = message.trim();
  if (!m || knownPersons.length === 0) return null;

  let best: { person: PersonRef; score: number } | null = null;

  for (const person of knownPersons) {
    let score = 0;
    const id = person.personId.toLowerCase();
    const name = person.displayName.trim();
    const lower = m.toLowerCase();

    if (id && lower.includes(id)) score += 12;

    if (name && lower.includes(name.toLowerCase())) score += 10;

    const firstName = name.split(/\s+/)[0]?.trim() ?? '';
    if (firstName.length >= 3 && new RegExp(`\\b${escapeRegex(firstName)}\\b`, 'i').test(m)) {
      score += 6;
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { person, score };
    }
  }

  return best?.person ?? null;
}

export function resolvePersonContextSubject(
  message: string,
  participant: { role: string; userId: string; userName: string },
  isGuestTrial: boolean,
): PersonRef | null {
  if (isGuestTrial) return null;

  if (participant.role === 'student') {
    return {
      personId:    participant.userId,
      displayName: participant.userName,
    };
  }

  if (participant.role !== 'founder') return null;

  const knownPersons = listKnownPersonRefs();
  const resolved = resolvePersonFromMessage(message, knownPersons);
  if (resolved) return resolved;

  if (founderAsksAboutKnownPerson(message) && knownPersons.length === 1) {
    return knownPersons[0] ?? null;
  }

  return null;
}

export async function buildPersonRelationalProfile(
  personId: string,
): Promise<PersonRelationalProfile | null> {
  const account = getStudentAccounts().find((s) => s.userId === personId);
  if (!account) return null;

  const master = await getOrCreateMaster();
  const track = findBestStudentTrack(master.studentTracks ?? [], personId);

  const [sessions, workspaces] = await Promise.all([
    ADAMFounderSessionModel.find({
      founderId:   personId,
      sessionType: { $in: ['student', 'tutor'] },
      active:      true,
    })
      .sort({ lastActiveAt: -1 })
      .lean(),
    getUserWorkspaces(personId),
  ]);

  const sessionIds = [
    ...new Set([
      ...sessions.map((s) => s.sessionId),
      ...workspaces.map((w) => w.sessionId),
    ]),
  ];

  let studentMessages = 0;
  let totalMessages = 0;
  let recentEpisodes: string[] = [];
  let lastContactAt: Date | undefined;

  if (sessionIds.length > 0) {
    const [studentMsgCount, totalCount, recent] = await Promise.all([
      ADAMMessageModel.countDocuments({
        sessionId: { $in: sessionIds },
        role:      'student',
      }),
      ADAMMessageModel.countDocuments({
        sessionId: { $in: sessionIds },
      }),
      ADAMMessageModel.find({ sessionId: { $in: sessionIds } })
        .sort({ createdAt: -1 })
        .limit(RECENT_EPISODE_LIMIT)
        .lean(),
    ]);

    studentMessages = studentMsgCount;
    totalMessages = totalCount;

    const sessionTypeById = new Map(
      sessions.map((s) => [s.sessionId, s.sessionType as string]),
    );

    recent.reverse();
    recentEpisodes = recent.map((m) => {
      const ws = workspaces.find((w) => w.sessionId === m.sessionId);
      const st = sessionTypeById.get(m.sessionId);
      const laneTag = st === 'tutor' ? ' [Tutor]' : st === 'student' ? ' [Learn]' : '';
      const bookTag = ws ? ` [${ws.title}]` : '';
      const who = m.role === 'adam' ? 'ADAM' : m.speakerName || account.name;
      return `${who}${laneTag}${bookTag}: ${messageSnippet(m.content)}`;
    });

    const latest = recent[recent.length - 1];
    if (latest?.createdAt) {
      lastContactAt = new Date(latest.createdAt);
    }
  }

  const brainTrackUnderstanding = trimText(track?.understanding ?? '', TRACK_SNIPPET_CHARS);
  const relationshipArc = trimText(track?.relationshipArc ?? '', 600);
  const lastSessionSummary = trimText(track?.lastSessionSummary ?? '', 500);
  const relationalSummary = trimText(
    track?.relationalSummary?.trim()
    || [relationshipArc, lastSessionSummary, brainTrackUnderstanding]
      .filter(Boolean)
      .join(' · '),
    PRM_SUMMARY_CHARS,
  );

  return {
    personId,
    displayName:             account.name,
    accountLane:             account.accountLane,
    brainTrackUnderstanding,
    relationalSummary,
    relationshipArc,
    lastSessionSummary,
    openQuestions:           track?.openQuestions ?? [],
    masteredTopics:          track?.masteredTopics ?? [],
    identityAnchors:         track?.identityAnchors ?? [],
    constitutionalLevel:     track?.constitutionalLevel ?? 1,
    recentEpisodes,
    messageStats: {
      studentMessages,
      totalMessages,
      sessionCount: sessionIds.length,
    },
    lastContactAt: track?.lastContactAt ?? lastContactAt,
  };
}

export async function touchPersonRelationalContact(
  personId: string,
  personName: string,
): Promise<void> {
  const { ensureStudentTrackRow } = await import('../qxk24brain/qxk24brain-student.engine');
  await ensureStudentTrackRow(personId, personName);
  const master = await getOrCreateMaster();
  const track = findBestStudentTrack(master.studentTracks ?? [], personId);
  if (!track) return;

  const { AlamtologiBrainMasterModel } = await import('../qxk24brain/qxk24brain.schema');
  const idx = master.studentTracks?.findIndex((t) => t.studentId === track.studentId) ?? -1;
  if (idx < 0) return;

  await AlamtologiBrainMasterModel.updateOne(
    { founderId: master.founderId },
    {
      [`studentTracks.${idx}.lastContactAt`]: new Date(),
      [`studentTracks.${idx}.name`]: personName,
      masa_last_updated: new Date(),
    },
  );
}
