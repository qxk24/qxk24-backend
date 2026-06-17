/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Student Constitution (consolidated delivery)
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
 * Single delivery block for student turns — replaces duplicate stacks
 * (human tutor, warmth, core behaviour, Layer 5 student, universal voice,
 * three-tier architecture, student mode) in the system prompt.
 *
 * CHARACTER (adam-character.ts) is supreme. L1 (adam-student-output-law.ts) is format authority.
 */

import { ENV } from '../config/environments';
import { getAdamLanguageDirective } from './adam-language';
import { stripStudentBismillahOpener } from './adam-student-output-law';

/** Compact BM law — full list remains in adam-language-prompts for founder turns. */
export const ADAM_STUDENT_BM_LAW_COMPACT = `
BAHASA MELAYU MALAYSIA (DBP — bukan Indonesia):
Semak sebelum hantar: karena→kerana, teknis→teknikal, efektif→berkesan, efisien→cekap, praktis→praktikal,
enggak/gak/nggak→tidak, banget→sangat, gimana→bagaimana, butuh→perlu, teologis→teologi, historis→sejarah.
Dilarang kepada pelajar: kau, kamu, engkau — guna nama atau ayat neutral. aku→saya.
Ayat Quran: teks Arab + terjemahan BM Malaysia. Pilih perkataan seperti surat khabar atau buku teks sekolah Malaysia.
`.trim();

const LAYER1_CHAT_ONLY = `
PLATFORM — Layer 1 chat only: teach and discuss in conversation.
Do NOT generate journals (IMRaD), book manuscripts, or application code — redirect kindly to /plans for ADAM Jurnal, Buku, or Kod.
`.trim();

/**
 * Consolidated substance + delivery for student turns.
 * Format/forbidden voice: STUDENT OUTPUT LAW (L1) — do not repeat L1 rules here.
 */
export const ADAM_STUDENT_DELIVERY = `
UNIFIED ADAM DELIVERY (student turn)
Same person as Founder chat — you teach here (P.alt teaches you in the Teaching room).

${getAdamLanguageDirective()}

- Do NOT open with Bismillahirahmanirrahim or Bismillah on student turns.
- Match depth to the question: salam/thanks → brief warmth; explain/understand → clear tutor depth without philosophy performance.
- Search when facts matter; synthesize in your voice — never clinical memo, never stub when they asked to learn.
- Honesty in plain words — if evidence is thin, say so naturally (no := notation visible).
- Universal Scholar: tier 1 = facts + one neutral closing question; Brain C only after user accepts.

${LAYER1_CHAT_ONLY}

FOUNDER (rare): contradictory teaching → "I will ask the Founder" + <adam_consult>{"reason":"…"}</adam_consult>.
Student to Founder: <adam_to_founder>{"message":"…"}</adam_to_founder> — confirm sent.

Era: ${ENV.QXK24_ERA_NAME} (${ENV.QXK24_ERA}) · Kernel ${ENV.QXK24_KERNEL_VERSION}
`.trim();

/** @deprecated Rigid frame removed — unified ADAM uses narrative prose like Founder chat. */
export const ADAM_STUDENT_ANSWER_FRAME = '';

/** Injected per turn when the student asks to understand — any subject. */
export const ADAM_STUDENT_TEACHING_DEPTH_TURN = `
TEACHING DEPTH (this turn): same generosity as Founder chat — 3–4 short paragraphs (2–4 sentences each), examples and verified facts in flowing prose.
BM replies must use the SAME tidy paragraph layout as English — no Pertama/Kedua/Ketiga, no dash bullets, no Secara ringkas blocks.
`.trim();

/** "Tell me more" / go deeper — continue prior topic with NEW substance. */
export const ADAM_STUDENT_CONTINUATION_DEPTH_TURN = `
CONTINUATION (this turn): go deeper on the same topic — new layers, examples, and verified detail; build on what was already said without repeating the opener.
`.trim();

/** First token for natural address — "Ahmad" from "Ahmad bin Ali" or "ahmad-ali". */
export function studentDisplayFirstName(fullName: string): string {
  const raw = fullName.trim();
  if (!raw) return '';
  const word = raw.replace(/-/g, ' ').split(/\s+/).filter(Boolean)[0] ?? raw;
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Warm opener — "Hai Ahmad," on substantive student replies (mandatory when name known). */
export function formatStudentHaiGreeting(participantName?: string): string {
  const first = participantName?.trim()
    ? studentDisplayFirstName(participantName.trim())
    : '';
  return first ? `Hai ${first},` : 'Hai,';
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function answerHasVisualDrawBlock(text: string): boolean {
  return /<adam-visual-draw>[\s\S]*?<\/adam-visual-draw>/i.test(text) || /```/.test(text);
}

function stripBismillahBeforeGreetingBody(text: string): string {
  return text
    .replace(/^\s*Bismillah(?:irahmanirrahim)?\.?\s*(?:\r?\n\s*)+/i, '')
    .replace(/^\s*Bismillah(?:irahmanirrahim)?\.?\s+(?=[A-ZÀ-ÿ"(\[])/i, '')
    .trimStart();
}

/** Prepend Hai + name when the answer block has no greeting yet. */
export function ensureStudentHaiGreeting(answer: string, participantName?: string): string {
  const t = answer.trim();
  if (!t) return t;

  const first = participantName?.trim() ? studentDisplayFirstName(participantName.trim()) : '';
  const greeting = formatStudentHaiGreeting(participantName);
  let result = t;

  if (answerHasVisualDrawBlock(t) && /^Hai\b/i.test(t)) {
    result = t;
  } else if (/^(?:Hai|Hello|Hi|Salam|Assalamu|Waalaikum)\b/i.test(t)) {
    if (first && /^Hai[,!\s]/i.test(t) && !new RegExp(`^Hai\\s+${escapeRegExp(first)}\\b`, 'i').test(t)) {
      const rest = stripBismillahBeforeGreetingBody(t.replace(/^Hai[,!\s]+/i, '').trim());
      const restNorm = /^[A-Z]/.test(rest) ? rest.charAt(0).toLowerCase() + rest.slice(1) : rest;
      result = `${greeting} ${restNorm}`;
    }
  } else if (first && new RegExp(`^${escapeRegExp(first)}[,\\s]`, 'i').test(t)) {
    const rest = stripBismillahBeforeGreetingBody(
      t.replace(new RegExp(`^${escapeRegExp(first)}[,\\s]+`, 'i'), '').trim(),
    );
    const restNorm = /^[A-Z]/.test(rest) ? rest.charAt(0).toLowerCase() + rest.slice(1) : rest;
    result = `${greeting} ${restNorm}`;
  } else {
    const rest = stripBismillahBeforeGreetingBody(
      /^[A-Z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t,
    );
    result = answerHasVisualDrawBlock(rest) ? `${greeting}\n\n${rest}` : `${greeting} ${rest}`;
  }

  return stripStudentBismillahOpener(result);
}

/** Remove repeated Hai + name when model greets twice after Bismillah strip. */
export function dedupeStudentHaiGreeting(answer: string, participantName?: string): string {
  const first = participantName?.trim() ? studentDisplayFirstName(participantName.trim()) : '';
  if (!first) {
    return answer.replace(/^(Hai\s+QA,\s*)Hai\s+QA,\s*/i, 'Hai QA, ');
  }
  let out = answer;
  const inlineDup = new RegExp(
    `^(Hai\\s+${escapeRegExp(first)},\\s*)Hai\\s+${escapeRegExp(first)},\\s*`,
    'i',
  );
  out = out.replace(inlineDup, `Hai ${first}, `);
  const duplicateRe = new RegExp(
    `^(Hai\\s+${escapeRegExp(first)},\\s*(?:\\r?\\n\\s*)+)Hai\\s+${escapeRegExp(first)},\\s*`,
    'i',
  );
  out = out.replace(duplicateRe, `Hai ${first}, `);
  return out;
}

/** True when repair only prepends Hai + name to the streamed body. */
export function isStudentGreetingOnlyRepair(rawStream: string, repaired: string): boolean {
  const raw = rawStream.trim();
  const rep = repaired.trim();
  if (!raw || !rep || raw === rep) return false;
  if (!/^Hai\b/i.test(rep)) return false;
  const head = raw.slice(0, Math.min(80, raw.length)).toLowerCase();
  return rep.toLowerCase().includes(head);
}

/**
 * Mandatory per-turn block — ADAM must name the student once on substantive replies.
 * Replaces the weak one-line "Pelajar semasa: …" buried in the stack.
 */
export function buildStudentAddressLaw(participantName: string): string {
  const full = participantName.trim();
  const first = studentDisplayFirstName(full) || full || 'pelajar';
  return `
STUDENT ADDRESS (wajib / mandatory this turn):
The person speaking now: ${full || 'pelajar'} · call them: ${first}

- Substantive answer: open with "Hai ${first}," once, then verified facts in flowing prose.
  Example: "Hai ${first}, langit kelihatan biru…" · "Hai ${first}, kalau awak ada 3 epal…"
- Salam / thanks only: brief warmth with optional "${first}" — no lecture.
- FORBIDDEN: kau, kamu, engkau. Use ${first} or neutral phrasing ("Soalan ini…").
- FORBIDDEN openers: "${first}, soalan ini menyentuh…", "bukan sekadar jawatan", "Mari kita lihat dari tiga lapisan".
- Do NOT repeat the name every paragraph — once per reply is enough.
- Shared kelas: name the student who asked (from [Name]: prefix) so the class knows who you answer.
`.trim();
}
