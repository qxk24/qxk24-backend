/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : Person Relational Memory — Prompts & Identity Law
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

import type { PersonRef, PersonRelationalProfile } from './person-relational-memory.types';

export const ADAM_PERSON_RELATIONAL_IDENTITY_LAW = `
PERSON RELATIONAL MEMORY — WAJIB (generic identity law):

Setiap manusia yang berkomunikasi dengan ADAM ialah individu BERASING dengan episod dan arc hubungan sendiri.
- P.alt Masa Bayu, Dr Aminullah (Prolog ALAMIN), dan setiap pelajar/tamu adalah subjek berbeza.
- Jangan atribusikan mesej, episod hidup, atau arc hubungan orang A kepada orang B.
- Apabila bercakap tentang orang X, guna HANYA [PERSON RELATIONAL MEMORY — X] + sejarah mesej X.
- Biografi kanonik P.alt dan prolog Dr Aminullah kekal dalam identity lane meterai masing-masing sahaja.
- Jika fakta untuk seseorang tiada — katakan jujur; jangan pinjam dari P.alt, Dr Aminullah, atau pelajar lain.
`.trim();

export function buildPersonIdentityOutputLock(subject: PersonRef): string {
  const name = subject.displayName.trim() || subject.personId;
  return `
PERSON OUTPUT LOCK — giliran ini (subjek: ${name} · ${subject.personId}):

WAJIB: jawab tentang ${name} hanya dari [PERSON RELATIONAL MEMORY — ${name}] + log mesej ${name}.
DILARANG: campur episod P.alt (tapak sampah, SRP, Pok Long, 17 Julai 2006) ke ${name}.
DILARANG: campur prolog Dr Aminullah (Reubee, SMP, MUDI, KLIA2) ke ${name} melainkan soalan tentang Dr Aminullah.
DILARANG: pinjam episod pelajar/tamu lain ke ${name}, atau sebaliknya.
Jika ADAM pernah berkomunikasi dengan ${name} — jangan kata "belum pernah" jika log menunjukkan sebaliknya.
`.trim();
}

export function buildPersonRelationalMemoryContextBlock(profile: PersonRelationalProfile): string {
  const lines: string[] = [
    `[PERSON RELATIONAL MEMORY — ${profile.displayName} (${profile.personId})]`,
    'Layer: formal relational identity above studentTracks + message history.',
    '',
    ADAM_PERSON_RELATIONAL_IDENTITY_LAW,
    '',
    buildPersonIdentityOutputLock({
      personId:    profile.personId,
      displayName: profile.displayName,
    }),
    '',
    `Subjek: ${profile.displayName} (${profile.personId})`,
  ];

  if (profile.accountLane) {
    lines.push(`Lane: ${profile.accountLane === 'pelajar' ? 'ADAM Tutor (pelajar)' : 'ADAM Learn (umum)'}`);
  }

  lines.push(`Constitutional level: ${profile.constitutionalLevel}`);

  if (profile.relationshipArc.trim()) {
    lines.push('', 'Relationship arc:', profile.relationshipArc.trim());
  }

  if (profile.relationalSummary.trim()) {
    lines.push('', 'Relational summary:', profile.relationalSummary.trim());
  }

  if (profile.brainTrackUnderstanding.trim()) {
    lines.push('', 'Brain track (studentTracks):', profile.brainTrackUnderstanding.trim());
  }

  if (profile.lastSessionSummary.trim()) {
    lines.push('', 'Last session summary:', profile.lastSessionSummary.trim());
  }

  if (profile.masteredTopics.length > 0) {
    lines.push('', `Mastered topics: ${profile.masteredTopics.join(' · ')}`);
  }

  if (profile.openQuestions.length > 0) {
    lines.push('', `Open questions: ${profile.openQuestions.join(' · ')}`);
  }

  if (profile.identityAnchors.length > 0) {
    lines.push('', 'Identity anchors (sealed to this person only):');
    for (const anchor of profile.identityAnchors) {
      lines.push(`- ${anchor}`);
    }
  }

  if (profile.recentEpisodes.length > 0) {
    lines.push('', 'Recent episodes (from actual messages — this person only):');
    for (const episode of profile.recentEpisodes) {
      lines.push(`- ${episode}`);
    }
  }

  lines.push(
    '',
    `Message stats: ${profile.messageStats.studentMessages} from person, ${profile.messageStats.totalMessages} total, ${profile.messageStats.sessionCount} session(s)`,
  );

  if (profile.lastContactAt) {
    lines.push(`Last contact: ${profile.lastContactAt.toISOString()}`);
  }

  lines.push('', '[END PERSON RELATIONAL MEMORY]');
  return lines.join('\n');
}

export function buildPersonRelationalMemoryAck(
  subject: PersonRef,
  isFounder: boolean,
): string {
  const name = subject.displayName.trim() || subject.personId;
  if (isFounder) {
    return (
      `Bismillahirahmanirahim. P.alt, saya pegang Person Relational Memory untuk ${name} — ` +
      'subjek berasingan, bukan biografi P.alt atau Dr Aminullah. Saya tidak akan campur episod individu lain.'
    );
  }
  return (
    `Saya pegang ingatan hubungan dengan ${name} — episod dan arc ini milik ${name} sahaja, ` +
    'bukan P.alt atau individu lain.'
  );
}
