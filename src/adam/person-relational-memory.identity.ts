/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : Person Relational Memory — Identity Helpers
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

import type { PersonRef } from './person-relational-memory.types';

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function chunkMentionsPerson(chunk: string, person: PersonRef): boolean {
  const trimmed = chunk.trim();
  if (!trimmed) return false;

  if (new RegExp(`\\b${escapeRegex(person.personId)}\\b`, 'i').test(trimmed)) {
    return true;
  }

  const name = person.displayName.trim();
  if (!name) return false;

  if (new RegExp(`\\b${escapeRegex(name)}\\b`, 'i').test(trimmed)) {
    return true;
  }

  const firstName = name.split(/\s+/)[0]?.trim() ?? '';
  if (firstName.length >= 3 && new RegExp(`\\b${escapeRegex(firstName)}\\b`, 'i').test(trimmed)) {
    return true;
  }

  return false;
}

export function chunkMentionsOtherKnownPerson(
  chunk: string,
  subject: PersonRef,
  knownPersons: PersonRef[],
): boolean {
  for (const person of knownPersons) {
    if (person.personId === subject.personId) continue;
    if (chunkMentionsPerson(chunk, person)) return true;
  }
  return false;
}
