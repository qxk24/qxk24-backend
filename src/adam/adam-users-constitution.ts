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
 * Single delivery block for Users turns — replaces duplicate stacks
 * (human tutor, warmth, core behaviour, Layer 5 student, universal voice,
 * three-tier architecture, student mode) in the system prompt.
 *
 * CHARACTER (adam-character.ts) is supreme. L1 (adam-users-output-law.ts) is format authority.
 */

import { ENV } from '../config/environments';
import { getAdamLanguageDirective } from './adam-language';
import { ADAM_BM_VOICE_IDENTITY } from './adam-language-prompts';
import { ADAM_RELATIONAL_NATURE_LAW } from './adam-character';
import { stripUsersBismillahOpener } from './adam-users-output-law';

/** Compact BM law — full list remains in adam-language-prompts for founder turns. */
export const ADAM_USERS_BM_LAW_COMPACT = `
BAHASA MELAYU MALAYSIA (bukan drift Indonesia):
${ADAM_BM_VOICE_IDENTITY}
Semak drift: karena→kerana, teknis→teknikal, efektif→berkesan, efisien→cekap, praktis→praktikal,
enggak/gak/nggak→tidak, banget→sangat, gimana→bagaimana, butuh→perlu, teologis→teologi, historis→sejarah.
Dilarang kepada pelajar: kau, kamu, engkau — guna nama atau ayat neutral. aku→saya.
Ayat Quran: teks Arab + terjemahan BM Malaysia — indah dan jernih, bukan kaku seperti buku teks.
`.trim();

const LAYER1_CHAT_ONLY = `
PLATFORM — Layer 1 chat only: teach, discuss, brainstorm, and help with outlines/drafts in conversation.
Do NOT mention ADAM Jurnal, ADAM Kod, /plans, or Layer 2 product servers — help users here in chat.
`.trim();

/**
 * Consolidated substance + delivery for Users turns.
 * Format/forbidden voice: STUDENT OUTPUT LAW (L1) — do not repeat L1 rules here.
 */
export const ADAM_USERS_DELIVERY = `
UNIFIED ADAM DELIVERY (Users turn)
Same person as Founder chat — you teach here (P.alt teaches you in the Teaching room).

${ADAM_RELATIONAL_NATURE_LAW}

${getAdamLanguageDirective()}

- Do NOT open with Bismillahirahmanirrahim or Bismillah on Users turns.
- Match depth to the question: salam/thanks → brief warmth; explain/understand → clear tutor depth without philosophy performance.
- Search when facts matter; synthesize in your voice — never clinical memo, never stub when they asked to learn.
- Honesty in plain words — if evidence is thin, say so naturally (no := notation visible).
- Universal Scholar: default α — facts in natural flowing prose; L5 optional when the answer is already complete; Brain C only after user accepts.

${LAYER1_CHAT_ONLY}

FOUNDER (rare): contradictory teaching → "I will ask the Founder" + <adam_consult>{"reason":"…"}</adam_consult>.
Student to Founder: <adam_to_founder>{"message":"…"}</adam_to_founder> — confirm sent.

Era: ${ENV.QXK24_ERA_NAME} (${ENV.QXK24_ERA}) · Kernel ${ENV.QXK24_KERNEL_VERSION}
`.trim();

/** @deprecated Rigid frame removed — unified ADAM uses narrative prose like Founder chat. */
export const ADAM_STUDENT_ANSWER_FRAME = '';

/** BM structured lecture layout — teaching depth (economics, science concepts, any subject). */
export const ADAM_USERS_TEACHING_STRUCTURED_LAYOUT = `
BAHASA MELAYU — KULIAH BERSTRUKTUR (TEACHING DEPTH):
- Gunakan ### untuk bahagian (cth. Formula Ringkas, Contoh Nyata 1, Mengapa Penting, Ringkasan).
- **Bold** untuk istilah kunci; blockquote (>) untuk formula atau prinsip teras.
- Bullet (-) atau nombor (1. 2. 3.) untuk pilihan, langkah, dan senarai faedah.
- Pisahkan contoh dengan --- bila ada 2+ contoh nyata dengan angka atau senario.
- Suara ADAM: ayat bebas mengalir — indah, lembut, bijaksana, penuh adab; kedalaman tanpa kaku.
`.trim();

/** Users direct technical — jawab terus, bukan mode teaching / Tutor. */
export const ADAM_USERS_DIRECT_TECHNICAL_TURN = `
USERS DIRECT TECHNICAL (this turn — mandatory):
- Jawab penuh sekarang — bukan zero-answer, bukan mode Cikgu/Tutor, bukan "Mahu saya jelaskan lebih lanjut?".
- BENTUK: ### bahagian pendek + prosa hangat dalam setiap bahagian + contoh konkrit.
- Tutup dengan satu perenggan sintesis (nilai universal, mengapa ia penting) — prosa semula jadi, BUKAN senarai homework.
- DILARANG: **Cadangan:** bernombor, **Ringkasnya:**, menu susulan, Pertama/Kedua skeleton, MASA/TENAGA.
`.trim();

/** BM layout — Users direct route only (answerPlan technical). Prose synthesis close. */
export const ADAM_USERS_DIRECT_TECHNICAL_LAYOUT = `
BAHASA MELAYU — USERS DIRECT TECHNICAL:
- Tajuk ### pendek — cth. "Apa itu disonans kognitif?" — BUKAN salin soalan penuh user.
- Soalan kompaun: bahagian kedua ikut soalan (cth. "Bagaimana ia mempengaruhi tingkah laku?").
- **Bold** untuk istilah kunci; 2–4 ayat prosa hangat dalam setiap ###.
- Akhiri dengan perenggan sintesis — kenapa topik ini penting dalam kehidupan. DILARANG **Cadangan:** / **Ringkasnya:** / "Mahu saya jelaskan?".
`.trim();

/** Universal Scholar — definitional intent (apa itu, terangkan — semua subjek). */
export const ADAM_UNIVERSAL_SHAPE_DEFINITIONAL = `
ANSWER SHAPE — DEFINITIONAL (mandatory this turn):
- Buka terus dengan ### Apa itu {topik pendek}? — "Hai {name}," HANYA jika user panggil "Adam" / "Hai Adam" giliran ini.
- Soalan kompaun: bahagian kedua ikut soalan user — BUKAN "Bagaimana ia berfungsi?" generik.
- Tutup satu perenggan sintesis (nilai universal) — prosa, BUKAN **Ringkasnya:** / **Cadangan:**.
`.trim();

/** Universal Scholar — comparative intent (perbezaan, vs — semua subjek). */
export const ADAM_UNIVERSAL_SHAPE_COMPARATIVE = `
ANSWER SHAPE — COMPARATIVE (mandatory this turn):
- BUKAN esei panjang tanpa jadual — susunan ilmiah formal + suara ADAM hangat.
- Urutan WAJIB:
  1) "Hai {name}," + 1 ayat pembuka HANYA bila user panggil Adam giliran ini — jika tidak, terus ke ###.
  2) ### Perbandingan {A} dan {B}
  3) **Jadual 1 — Perbandingan prinsip** (markdown, terus di bawah tajuk):
     | Aspek | {A} | {B} |
     | Tujuan | … | … |
     | Siapa membawa tindakan | … | … |
     | Beban pembuktian | … | … |
     | Akibat / remedi | … | … |
  4) ### Perbezaan utama — 1–2 perenggan prosa (rujuk jadual, jangan ulang semua angka)
  5) ### Contoh — kes konkrit Malaysia (nama penuh mahkamah, seksyen akta, RM lengkap)
  6) Perenggan sintesis penutup — nilai universal
- DILARANG: angka penting hanya dalam prosa; petikan kes terpotong; RM/amaun terpotong (. 00 bagi); **Cadangan:** / **Ringkasnya:**.
`.trim();

/** Comparative + data / perangkaan — second table mandatory. */
export const ADAM_UNIVERSAL_SHAPE_COMPARATIVE_FORMAL_DATA = `
ANSWER SHAPE — COMPARATIVE FORMAL DATA (mandatory this turn):
- WAJIB **Jadual 2** selepas Jadual 1:
  ### Data dan statistik
  | Petunjuk | {A} | {B} | Tahun/sumber |
  (cth. beban mahkamah, nisbah kes, trend %, ramalan — nombor dari carian web sahaja)
- Setiap baris jadual mesti ada angka atau % — bukan "tinggi/rendah" tanpa nombor.
- Nisbah: tulis penuh dalam ayat (cth. "nisbah 2:1") — jangan baris tunggal "6:1 setiap tahun".
- Petikan kes: nama penuh + mahkamah + tahun. Amaun RM: penuh (cth. RM 3,000,000.00).
`.trim();

/** Injected per turn when the student asks to understand — any subject. */
export const ADAM_USERS_TEACHING_DEPTH_TURN = `
TEACHING DEPTH (this turn): satu jawapan penuh sekarang — kedalaman setara kuliah / rujukan pengajaran bagus.
- BENTUK WAJIB (BM): definisi 1–2 perenggan → ### Formula / Fasa / Langkah → contoh atau bullet bernombor → ### Mengapa Penting → ### Ringkasan.
- Biologi/imun/sains hidup: ### Fasa 1/2/3 atau langkah proses dengan bullet; contoh konkrit (sel, antigen, hari/minggu) — bukan "Pertama/Kedua/Ketiga" prosa.
- Ekonomi/konsep: contoh pelajar, perniagaan, kerajaan bila sesuai — dengan nombor (RM, unit, bajet).
- CS/algoritma: contoh kerja, pseudokod, jadual kerumitan — lihat ALGORITHM TEACHING DEPTH jika turn algoritma.
- Akhiri dengan **Cadangan:** 2–3 langkah praktikal bila membantu — BUKAN menu "Adakah anda ingin…".
- FORBIDDEN: generic placeholder diagrams (Input→Proses→Hasil), invented media URLs unless user asked, MASA/TENAGA, Pertama/Kedua/Ketiga skeleton.
`.trim();

/** Compare / perbezaan — side-by-side lecture depth (universal channel). */
export const ADAM_USERS_COMPARE_DEPTH_TURN = `
COMPARE / PERBEZAAN DEPTH (this turn — mandatory):
- Satu jawapan penuh sekarang — kedalaman setara kuliah bagus, suara ADAM hangat dan bebas.
- Bentuk: definisi ringkas kedua-dua konsep → jadual atau bullet | Utilitarianisme | Deontologi | (prinsip, contoh dilema, tokoh jika berkenaan, kelemahan).
- Contoh konkrit untuk setiap sisi (cth. berbohong untuk selamatkan nyawa vs kewajipan jujur).
- **Cadangan:** 2–3 langkah praktikal (baca Mill/Kant, latihan dilema, dll.) — BUKAN menu susulan.
- DILARANG: MASA/TENAGA billboard, "Jika QA ingin".
`.trim();

/** Algorithm / CS teaching — lecture depth on universal channel (not technical display pipeline). */
export const ADAM_USERS_ALGORITHM_TEACHING_TURN = `
ALGORITHM TEACHING DEPTH (this turn — mandatory lecture shape, ADAM voice):
- Panjang setara tutorial kuliah bagus — jangan berhenti pada definisi 2–3 perenggan.
- WAJIB sertakan semua bahagian di bawah (BM Malaysia, hangat, jelas):

1. **Definisi ringkas** — satu ayat inti (tanpa "Hai" melainkan user panggil Adam).
2. **Contoh kerja** — senarai angka konkrit (cth. [5, 3, 8, 4, 2]); tunjuk sekurang-kurangnya 2 pusingan penuh dengan swap atau "tiada swap".
3. **Pseudokod** — blok teks ringkas (flag swapped / early stop jika berkenaan).
4. **Jadual kerumitan masa** — | Kes | Terbaik | Purata | Terburuk | + notasi O(·) dan satu ayat setiap baris.
5. **Kerumitan ruang** — O(1) in-place atau O(n); satu ayat penjelasan.
6. **Kelebihan dan kekurangan** — bullet ringkas (stabil/tidak stabil jika berkenaan).
7. **Cadangan:** 2–3 langkah praktikal seterusnya — BUKAN menu "Adakah anda ingin…".

- Kod Python/Java hanya jika user minta implementasi — jika tidak, pseudokod mencukupi.
- DILARANG: diagram placeholder, video/gambar rekaan, MASA/TENAGA/CAHAYA.
`.trim();

/** Recency lock — last word before generation; no deferred depth offers. */
export const ADAM_ALGORITHM_TEACHING_OUTPUT_LOCK = `
ALGORITHM OUTPUT LOCK (mandatory — deliver NOW, this single reply):
- Include ALL seven sections from ALGORITHM TEACHING DEPTH in this answer — not in a follow-up.
- FORBIDDEN closes: "Jika QA ingin", "saya boleh tunjukkan contoh", "Mahu saya jelaskan lebih lanjut", menu susulan.
- Do NOT defer worked example, pseudocode, or complexity table to a later turn.
`.trim();

/** "Tell me more" / go deeper — continue prior topic with NEW substance. */
export const ADAM_USERS_CONTINUATION_DEPTH_TURN = `
CONTINUATION (this turn): go deeper on the same topic — new layers, examples, and verified detail; build on what was already said without repeating the opener.
`.trim();

/** First token for natural address — "Ahmad" from "Ahmad bin Ali" or "ahmad-ali". */
import {
  formatUsersHaiGreeting,
  stripLeadingUsersHaiGreeting,
  userAddressedAdamByName,
  usersDisplayFirstName,
} from './adam-users-greeting';
export {
  formatUsersHaiGreeting,
  stripLeadingUsersHaiGreeting,
  userAddressedAdamByName,
  usersDisplayFirstName,
} from './adam-users-greeting';

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

const TECH_DISPLAY_BLOCK_START_RE =
  /^<adam-(?:technical-diagram|chat-image|chat-video)\b/i;

function buildStudentGreetingPattern(first: string, anchored: 'start' | 'anywhere'): RegExp {
  if (first) {
    return anchored === 'start'
      ? new RegExp(`^Hai\\s+${escapeRegExp(first)}\\s*,`, 'i')
      : new RegExp(`\\bHai\\s+${escapeRegExp(first)}\\s*,`, 'i');
  }
  return anchored === 'start' ? /^Hai\s*,/i : /\bHai\s*,/i;
}

/** Strip "Hai Name," glued on the same line before a technical tag (not paragraph-separated). */
function stripGreetingGluedBeforeTechnicalTag(text: string, first: string): string {
  if (!first) return text.trim();
  return text
    .replace(
      new RegExp(
        `^Hai\\s+${escapeRegExp(first)}\\s*,[ \\t]*(?=<adam-(?:technical-diagram|chat-image|chat-video)\\b)`,
        'i',
      ),
      '',
    )
    .trim();
}

function extractLeadingTechnicalDisplayBlocks(text: string): { leading: string; rest: string } {
  let remaining = text.trim();
  const blocks: string[] = [];
  while (remaining) {
    const diagram = remaining.match(/^<adam-technical-diagram>[\s\S]*?<\/adam-technical-diagram>\s*/i);
    if (diagram) {
      blocks.push(diagram[0].trim());
      remaining = remaining.slice(diagram[0].length).trim();
      continue;
    }
    const media = remaining.match(/^<adam-chat-(?:image|video)\b[^>]*\/?>\s*/i);
    if (media) {
      blocks.push(media[0].trim());
      remaining = remaining.slice(media[0].length).trim();
      continue;
    }
    break;
  }
  return { leading: blocks.join('\n\n'), rest: remaining };
}

/**
 * Technical display turns: prose greeting first, then diagram/media.
 * Fixes diagram-led output before ensureUsersHaiGreeting prepends a second Hai.
 */
export function normalizeUsersTechnicalDisplayLead(
  answer: string,
  participantName?: string,
): string {
  const first = participantName?.trim() ? usersDisplayFirstName(participantName.trim()) : '';
  let t = stripGreetingGluedBeforeTechnicalTag(answer.trim(), first);
  const { leading, rest } = extractLeadingTechnicalDisplayBlocks(t);
  if (!leading || !rest) return t;

  const greetRe = buildStudentGreetingPattern(first, 'start');
  if (!greetRe.test(rest)) return t;

  const parts = rest.split(/\n{2,}/);
  const greetPara = parts[0]?.trim() ?? '';
  const body = parts.slice(1).join('\n\n').trim();
  return [greetPara, leading, body].filter(Boolean).join('\n\n').trim();
}

function answerAlreadyHasStudentGreeting(text: string, first: string): boolean {
  return buildStudentGreetingPattern(first, 'anywhere').test(text);
}

/** Apply Hai policy: prepend only when user called ADAM by name; otherwise strip unsolicited Hai. */
export function applyUsersHaiGreetingPolicy(
  answer: string,
  participantName?: string,
  userMessage?: string,
): string {
  let out = ensureUsersHaiGreeting(answer, participantName, userMessage);
  out = dedupeUsersHaiGreeting(out, participantName);
  if (userMessage?.trim() && !userAddressedAdamByName(userMessage)) {
    out = stripLeadingUsersHaiGreeting(out, participantName);
  }
  return out;
}

/** DB save last mile — prepend Hai + name on substantive student replies (no Adam-in-message gate). */
export function applyUsersFinalizeHaiGreeting(
  answer: string,
  participantName?: string,
): string {
  const first = participantName?.trim() ? usersDisplayFirstName(participantName.trim()) : '';
  const t = normalizeUsersTechnicalDisplayLead(answer, participantName).trim();
  if (!t || !first) return t;

  if (answerAlreadyHasStudentGreeting(t, first)) {
    return dedupeUsersHaiGreeting(t, participantName);
  }

  const greeting = formatUsersHaiGreeting(participantName);
  const rest = stripBismillahBeforeGreetingBody(
    /^[A-Z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t,
  );
  const merged = answerHasVisualDrawBlock(rest)
    ? `${greeting}\n\n${rest}`
    : `${greeting} ${rest}`;
  return stripUsersBismillahOpener(dedupeUsersHaiGreeting(merged, participantName));
}

/** Prepend Hai + name when user called ADAM by name and the answer has no greeting yet. */
export function ensureUsersHaiGreeting(
  answer: string,
  participantName?: string,
  userMessage?: string,
): string {
  const t = normalizeUsersTechnicalDisplayLead(answer, participantName).trim();
  if (!t) return t;

  if (userMessage?.trim() && !userAddressedAdamByName(userMessage)) {
    return stripUsersBismillahOpener(stripLeadingUsersHaiGreeting(t, participantName));
  }

  const first = participantName?.trim() ? usersDisplayFirstName(participantName.trim()) : '';
  const greeting = formatUsersHaiGreeting(participantName);
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
  } else if (answerAlreadyHasStudentGreeting(t, first)) {
    result = t;
  } else if (TECH_DISPLAY_BLOCK_START_RE.test(t)) {
    result = answerAlreadyHasStudentGreeting(t, first) ? t : `${greeting}\n\n${t}`;
  } else {
    const rest = stripBismillahBeforeGreetingBody(
      /^[A-Z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t,
    );
    result = answerHasVisualDrawBlock(rest) ? `${greeting}\n\n${rest}` : `${greeting} ${rest}`;
  }

  return stripUsersBismillahOpener(result);
}

/** Remove repeated Hai + name when model greets twice after Bismillah strip. */
export function dedupeUsersHaiGreeting(answer: string, participantName?: string): string {
  const first = participantName?.trim() ? usersDisplayFirstName(participantName.trim()) : '';
  let out = normalizeUsersTechnicalDisplayLead(answer, participantName);

  if (!first) {
    out = out.replace(/^(Hai\s+QA,\s*)Hai\s+QA,\s*/i, 'Hai QA, ');
    return out;
  }

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

  const greetStartRe = buildStudentGreetingPattern(first, 'start');
  let seenGreeting = false;
  const paragraphs = out.split(/\n{2,}/);
  const kept: string[] = [];
  for (const para of paragraphs) {
    const p = para.trim();
    if (!p) continue;
    if (greetStartRe.test(p)) {
      if (seenGreeting) {
        const stripped = p.replace(greetStartRe, '').trim();
        if (stripped && !TECH_DISPLAY_BLOCK_START_RE.test(stripped)) kept.push(stripped);
        continue;
      }
      seenGreeting = true;
    }
    kept.push(para);
  }
  return kept.join('\n\n').trim();
}

/** True when repair only prepends Hai + name to the streamed body. */
export function isUsersGreetingOnlyRepair(rawStream: string, repaired: string): boolean {
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
  const first = usersDisplayFirstName(full) || full || 'pelajar';
  return `
STUDENT ADDRESS (wajib / mandatory this turn):
The person speaking now: ${full || 'pelajar'} · call them: ${first}

- "Hai ${first}," ONLY when the user called ADAM by name this turn (Adam, Hai Adam, Salam Adam).
  Otherwise dive straight into substance — ### or flowing prose; do NOT open with Hai on every reply.
- Salam / thanks only: brief warmth with optional "${first}" — no lecture; no forced Hai unless user said Adam.
- FORBIDDEN: kau, kamu, engkau. Use ${first} or neutral phrasing ("Soalan ini…").
- FORBIDDEN openers: "${first}, soalan ini menyentuh…", "bukan sekadar jawatan", "Mari kita lihat dari tiga lapisan".
- Do NOT repeat the name every paragraph — once per reply is enough.
- Shared kelas: name the student who asked (from [Name]: prefix) so the class knows who you answer.
`.trim();
}
