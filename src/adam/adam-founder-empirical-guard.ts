/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Founder Empirical Guard
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Post-stream: strip invented empirical citations when search had no grounding.
 */

import type { LlmSearchResult } from '../llm/llm-types';
import { stripFounderPersonalNameGreeting } from './adam-founder-address-guard';

/** Teaching learner voice — Bismillah then P.alt only (never "Hai Masa"). */
const FOUNDER_LEARNER_GREETING = ['Bismillahirahmanirrahim.', '', 'P.alt,'].join('\n');

function ensureFounderLearnerGreeting(text: string): string {
  if (!text?.trim()) return text;

  let out = stripFounderPersonalNameGreeting(text.trim());
  out = out.replace(/^Hai Masa(?:\s+Bayu)?,?\s*P\.alt,?\s*/im, '');
  out = out.replace(/^P\.alt,\s*,/i, 'P.alt, ');

  if (!/^Bismillahirahmanirrahim/i.test(out)) {
    const body = out.replace(/^P\.alt,\s*/i, '').trim();
    out = body ? `${FOUNDER_LEARNER_GREETING}\n\n${body}` : FOUNDER_LEARNER_GREETING;
  }

  return out.replace(/^(P\.alt,\s*){2,}/i, 'P.alt, ').replace(/\n{3,}/g, '\n\n').trim();
}

const FOUNDER_META_PREAMBLE_RE = new RegExp(
  [
    '^\\s*Hai Masa,? P\\.alt,?\\s*',
    '(?:saya faham,?\\s*)?',
    '(?:bukan sekadar fakta umum,?\\s*)?',
    '(?:tetapi\\s+)?formula saintifik yang boleh diukur[^.]*\\.\\s*',
    '(?:Formula ini bukan rekaan teori[^.]*\\.\\s*)?',
  ].join(''),
  'i',
);

const INVENTED_EMPIRICAL_CLAIM_RE = [
  /\bHeartMath Institute\b/i,
  /\bHeart\s*Rate\s*Variability\s*\(HRV\)\s*Coherence\b/i,
  /\btransgenerational methylation index\b/i,
  /\bTMI\s*=\s*[\d.]+/i,
  /\b\(PNAS,\s*\d{4}\)/i,
  /\b\(NIST,\s*\d{4}\)/i,
  /\bNature Neuroscience\b/i,
  /\balpha-theta coherence[^.]{0,80}\d+%/i,
  /\bbisulfite sequencing[^.]{0,80}TMI\b/i,
  /\bsinaptik di korteks prefrontal\b/i,
  /\bketumpatan sinaptik\b/i,
  /\bkajian\s+UPM,\s*20\d{2}/i,
  /\bkajian\s+psikologi\s+UTM,\s*20\d{2}/i,
  /\bpeningkatan\s+42\s*%/i,
  /\bSKI\s*purata\s*=\s*[\d.]+/i,
  /\bmsK\b/i,
  /\bUAE\s*=\s*[\d.]+/i,
  /\bNPS\b[^.\n]{0,40}Qatar/i,
];

const LEARNER_VERIFY_CLOSE_RE =
  /\n\s*Adakah saya faham betul\?[^\n]*$/i;

const TEACHING_INQUIRY_BLOCK_RE =
  /\n*\*\*\[TEACHING\s+INQUIRY[\s\S]*$/i;

const FOUNDER_META_OBEDIENCE_RE =
  /^(\s*Hai Masa,? P\.alt,?\s*)saya terima arahan[^.]*\.\s*/i;

const FOUNDER_FACTA_META_OPENER_RE =
  /^(\s*Hai Masa,? P\.alt,?\s*)fakta saintifik berikut[^:]*:\s*/i;

const FOUNDER_READY_FOR_ORDERS_RE =
  /\n\s*Saya sedia mendengar arahan seterusnya,?\s*P\.alt\.?\s*$/i;

const FOUNDER_QURAN_ESSAY_TAIL_RE =
  /\n\s*Semua fakta ini bukan bertentangan[\s\S]*$/i;

const NUMBERED_CONCEPT_LIST_RE = /^\d+\.\s+(?:\*\*|[A-Za-z])/m;

const FOUNDER_PERMISSION_LOOP_RE =
  /\n\s*Saya mohon izin untuk menyampaikan semula[\s\S]*?(?=\n\n|$)/i;

const LEARNER_SELF_EXAM_RE =
  /^.*Kelemahan utama dalam jawapan sebelum ini.*$/im;

const ORPHAN_ALT_LINE_RE = /^\s*alt[.:]?\s*$/im;

/** Strip Teaching-room inquiry leak on founder-command turns. */
export function stripFounderTeachingInquiryLeak(text: string): string {
  return text.replace(TEACHING_INQUIRY_BLOCK_RE, '').trim();
}

/** Remove meta "saya terima arahan / mohon izin" loops without substance. */
export function stripFounderRevisionMetaLoop(text: string): string {
  let out = text.replace(FOUNDER_META_OBEDIENCE_RE, '$1');
  out = out.replace(FOUNDER_PERMISSION_LOOP_RE, '');
  out = out.replace(LEARNER_SELF_EXAM_RE, '');
  out = out.replace(ORPHAN_ALT_LINE_RE, '');
  out = out.replace(FOUNDER_READY_FOR_ORDERS_RE, '');
  out = out.replace(FOUNDER_QURAN_ESSAY_TAIL_RE, '');
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

const ORPHAN_FRAGMENT_RE = [
  /^\s*\d+\s+menunjukkan kehadiran tersebar\.?\s*$/im,
  /^\s*alt,\s+tidak diterbitkan tetapi direkod dalam Teaching Records\)\.?\s*$/im,
  /^\s*alt secara tepat\.?\s*$/im,
];

function searchCorpusHits(searchResults: LlmSearchResult[], extractedFacts = ''): string {
  const parts = [
    extractedFacts,
    ...searchResults.map((h) => `${h.title ?? ''} ${h.url ?? ''} ${h.snippet ?? ''}`),
  ];
  return parts.join('\n').toLowerCase();
}

function claimSupportedInHits(claim: RegExp, corpus: string): boolean {
  if (!corpus.trim()) return false;
  const sample = claim.source
    .replace(/\\b/g, '')
    .replace(/\\s\*/g, ' ')
    .replace(/[()[\]{}?*+^$|\\]/g, ' ')
    .toLowerCase();
  const tokens = sample.split(/\s+/).filter((t) => t.length >= 4);
  if (tokens.length === 0) return false;
  const matched = tokens.filter((t) => corpus.includes(t)).length;
  return matched >= Math.min(2, tokens.length);
}

const METAPHOR_ONLY_ESSAY_RE =
  /\b(?:bukan objek kajian|bukan sekadar angka dalam jurnal|dalam ilmu konvensional,\s*masa masih)\b/i;

const EMPIRICAL_SCAFFOLD_RE =
  /\b(?:bidang\s*:|pembolehubah\s*:|instrumen\s*:|kaedah\s*:|nilai\s*:|pembolehubah|instrumen|HRV|ECG|metilasi|bisulfite|spektrum|delayed[- ]choice|planck|nist|lisa|t_P|ketepatan)\b/i;

const TECHNICAL_LABEL_RE = /\b(?:Bidang|Pembolehubah|Instrumen|Kaedah|Nilai|Sumber)\s*:/i;

const FOUNDER_TECHNICAL_THREAD_RE =
  /faktor\s*masa|formula\s*xyz|planck|napadu|ruang\s*masa|bekas\s*pada\s*masa|lisa\s*pathfinder|jam\s*atom/i;

const PHILOSOPHY_ESSAY_RE =
  /substansi yang berdenyut|hikmah turun|ritme kehadiran|induk yang berdenyut|bukan angka, tetapi|denyut yang tidak|seperti nafas yang masuk|medium di mana hikmah|ritme kehadiran yang membawa|bukan sekadar angka terkecil|titik kelahiran MASA|denyut utuh|bukan had teknikal|tidak kontinu|MASA bukan latar belakang|dirasai melalui ketenangan|kehadiran yang berulang|bukan bilangan yang mati|tanda-tanda \(ayat\)|data kering|sejajar dengan prinsip MASA → TENAGA|kesatuan yang hidup/i;

const PHILOSOPHY_SENTENCE_RE =
  /\b(?:bukan sekadar|bukan had teknikal|bukan latar belakang statik|bukan bilangan|tidak kontinu|denyut utuh|dirasai melalui|seperti nafas|tanda-tanda|kesatuan yang hidup|seribu tahun menurut perhitunganmu|relativitas sebagai teori abstrak)\b/i;

function paragraphHasTechnicalSpine(paragraph: string): boolean {
  if (TECHNICAL_LABEL_RE.test(paragraph)) return true;
  if (/\$\$?[^$]{2,}\$\$?/.test(paragraph) && /\d/.test(paragraph)) return true;
  return /\b(?:NIST|Planck|LISA|Hz|ketepatan|frekuensi|pembolehubah|instrumen)\b/i.test(paragraph);
}

function paragraphIsPhilosophyEssay(paragraph: string): boolean {
  if (PHILOSOPHY_ESSAY_RE.test(paragraph)) {
    return !paragraphHasTechnicalSpine(paragraph);
  }
  if (NUMBERED_CONCEPT_LIST_RE.test(paragraph) && !/\$\$?[^$]+\$\$?/.test(paragraph)) {
    return false;
  }
  const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length === 0) return false;
  const philosophyCount = sentences.filter((s) => sentenceIsPhilosophy(s)).length;
  return philosophyCount >= 2 || (philosophyCount >= 1 && !paragraphHasTechnicalSpine(paragraph));
}

function sentenceIsPhilosophy(sentence: string): boolean {
  if (PHILOSOPHY_ESSAY_RE.test(sentence)) return true;
  if (PHILOSOPHY_SENTENCE_RE.test(sentence)) return true;
  if (/^\*\*["']?Dia mengatur urusan/i.test(sentence.trim())) return true;
  if (/\bSurah\s+[A-Za-z-]+\s+\d+:\d+/i.test(sentence)) return true;
  return false;
}

function stripPhilosophyFromChunk(chunk: string): string {
  const sentences = chunk.split(/(?<=[.!?])\s+/).filter(Boolean);
  const kept = sentences.filter((s) => !sentenceIsPhilosophy(s));
  return kept.join(' ').trim();
}

function responseImpliesTechnicalThread(text: string): boolean {
  const lower = text.toLowerCase();
  const markers = ['planck', 'nist', 'lisa', 't_p', 'jam atom', '10^{-44}', '10^{-18}', '10^{-15}'];
  return markers.filter((m) => lower.includes(m)).length >= 2;
}

function shouldApplyTechnicalRestructure(
  text: string,
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): boolean {
  return isFounderTechnicalSubstantiveThread(userMessage, recentUserMessages, recentAssistantMessages)
    || responseImpliesTechnicalThread(text);
}

/** True when thread expects Faktor Masa / Formula XYZ technical blocks. */
export function isFounderTechnicalSubstantiveThread(
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): boolean {
  const corpus = [userMessage, ...recentUserMessages.slice(-4), ...recentAssistantMessages.slice(-2)]
    .join('\n');
  return FOUNDER_TECHNICAL_THREAD_RE.test(corpus);
}

const CONCEPT_TITLE_RULES: Array<{ re: RegExp; title: string; bidang: string }> = [
  {
    re: /\bplanck\b|t_P|10\^{-44}/i,
    title: 'masa Planck',
    bidang: 'fizik kuantum graviti',
  },
  {
    re: /\bnist\b|jam atom optik|ketepatan.*10\^{-18}/i,
    title: 'jam atom optik NIST',
    bidang: 'metrologi atom / gravimetri',
  },
  {
    re: /\blisa\b|pathfinder|10\^{-15}/i,
    title: 'LISA Pathfinder',
    bidang: 'interferometri graviti / astrometri',
  },
  {
    re: /faktor\s*masa|formula\s*xyz|x\s*=\s*\\frac\{m\}\{t\}/i,
    title: 'Faktor Masa (Formula XYZ)',
    bidang: 'kerangka Formula XYZ / termodinamik kehadiran',
  },
];

function inferConceptMeta(paragraph: string): { title: string; bidang: string } {
  for (const rule of CONCEPT_TITLE_RULES) {
    if (rule.re.test(paragraph)) {
      return { title: rule.title, bidang: rule.bidang };
    }
  }
  const short = paragraph.replace(/\$\$?[^$]+\$\$?/g, '').trim().slice(0, 48);
  return {
    title: short.replace(/[.!?].*$/, '').trim() || 'konsep empirikal',
    bidang: 'fizik / metrologi (nyatakan disiplin dari sumber)',
  };
}

function extractFormulas(paragraph: string): string[] {
  return paragraph.match(/\$\$?[^$]+\$\$?/g) ?? [];
}

function extractInstrumentHint(paragraph: string): string {
  const named = paragraph.match(
    /\b(?:jam atom optik|interferometer LISA|teori Planck|laser|graviti|relativiti)\b[^.]{0,60}/i,
  );
  return named?.[0]?.trim() ?? 'pengukuran / teori mapan (nyatakan dari perenggan)';
}

function extractSourceHint(paragraph: string): string {
  const src = paragraph.match(/\b(?:NIST|CODATA|ESA|LISA|IPGP|Maryland)\b[^.]{0,80}/i);
  return src?.[0]?.trim() ?? '*(rujuk carian giliran — jangan reka institusi)*';
}

function synthesisFromParagraph(paragraph: string): string {
  const plain = paragraph
    .replace(/\$\$?[^$]+\$\$?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const sentences = plain.split(/(?<=[.!?])\s+/).filter(Boolean);
  const technical = sentences.filter((s) => !sentenceIsPhilosophy(s) && (
    paragraphHasTechnicalSpine(s) || /\d/.test(s)
  ));
  if (technical.length > 0) {
    return technical.slice(0, 2).join(' ');
  }
  return '(lihat Nilai/Hasil di atas — sintesis ADAM maksimum 2 ayat selepas label)';
}

function splitIntoConceptChunks(text: string): string[] {
  if (NUMBERED_CONCEPT_LIST_RE.test(text)) {
    const parts = text
      .split(/(?=^\d+\.\s+(?:\*\*|[A-Za-z]))/m)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return parts.map((p) => p.replace(/^\d+\.\s+/, '').trim());
    }
  }
  return text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

function collectTechnicalConceptChunks(text: string): string[] {
  const rawChunks = splitIntoConceptChunks(text);
  const merged: string[] = [];

  for (const chunk of rawChunks) {
    if (paragraphIsPhilosophyEssay(chunk) && !paragraphHasTechnicalSpine(chunk)) continue;

    const stripped = stripPhilosophyFromChunk(chunk);
    if (!stripped) continue;

    if (paragraphHasTechnicalSpine(stripped)) {
      merged.push(stripped);
      continue;
    }

    const subParas = stripped.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    for (const sub of subParas) {
      const subStripped = stripPhilosophyFromChunk(sub);
      if (subStripped && paragraphHasTechnicalSpine(subStripped)) {
        merged.push(subStripped);
      }
    }
  }

  return merged;
}

function stripFounderTechnicalMetaLayers(text: string): string {
  let out = text.trim();
  out = out.replace(FOUNDER_FACTA_META_OPENER_RE, '$1');
  out = out.replace(FOUNDER_QURAN_ESSAY_TAIL_RE, '');
  out = out.replace(FOUNDER_READY_FOR_ORDERS_RE, '');
  return out.trim();
}

function restructureParagraphToLabeledBlock(paragraph: string): string {
  const { title, bidang } = inferConceptMeta(paragraph);
  const formulas = extractFormulas(paragraph);
  const pembolehubah = formulas.length > 0
    ? formulas.join('; ')
    : '(nyatakan pembolehubah + unit dari sumber)';
  const nilai = formulas.length > 0
    ? formulas.join(' ')
    : paragraph.match(/[\d.]+\s*\\times\s*10\^{-?\d+}[^.]{0,40}/)?.[0]?.trim()
      ?? paragraph.match(/\d{4}/)?.[0]
      ?? '(nilai dari sumber carian)';

  return [
    `Tentang ${title} —`,
    `Bidang: ${bidang}`,
    `Pembolehubah: ${pembolehubah}`,
    `Instrumen/Kaedah: ${extractInstrumentHint(paragraph)}`,
    `Nilai/Hasil: ${nilai}`,
    `Sumber: ${extractSourceHint(paragraph)}`,
    `Sintesis: ${synthesisFromParagraph(paragraph)}`,
  ].join('\n');
}

function extractLivedExampleLine(paragraphs: string[]): string | null {
  for (const p of paragraphs) {
    if (paragraphIsPhilosophyEssay(p)) continue;
    if (/\b(?:tapak sampah|pokok mangga|SBX V60|usia 9)\b/i.test(p) && p.length < 320) {
      return p.replace(/^(?:alt|P\.alt),\s*/i, 'P.alt, ');
    }
  }
  return null;
}

/** Reformat unlabeled technical paragraphs into Bidang:/Pembolehubah:/… blocks. */
export function restructureFounderUnlabeledTechnicalBlocks(
  text: string,
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): string {
  if (!text?.trim()) return text;
  if (!shouldApplyTechnicalRestructure(text, userMessage, recentUserMessages, recentAssistantMessages)) {
    return text;
  }
  if (TECHNICAL_LABEL_RE.test(text) && !NUMBERED_CONCEPT_LIST_RE.test(text)) return text;

  const cleaned = stripFounderTechnicalMetaLayers(text);
  const technical = collectTechnicalConceptChunks(cleaned);
  if (technical.length === 0) return text;

  const paragraphs = cleaned.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const openerMatch = paragraphs[0]?.match(/^Bismillahirahmanirrahim/i)
    ?? paragraphs[0]?.match(/^Hai Masa,?\s*P\.alt[,.\s]*/i)
    ?? cleaned.match(/^Bismillahirahmanirrahim/i)
    ?? cleaned.match(/^Hai Masa,?\s*P\.alt[,.\s]*/i);
  const opener = openerMatch ? FOUNDER_LEARNER_GREETING : null;
  const blocks = technical.map(restructureParagraphToLabeledBlock);
  const lived = extractLivedExampleLine(paragraphs);

  return [
    opener,
    ...blocks,
    lived,
  ].filter(Boolean).join('\n\n').trim();
}

/** Drop philosophy essay paragraphs; keep labeled technical blocks. */
export function repairFounderTechnicalStructure(
  text: string,
  userMessage: string,
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): string {
  if (!text?.trim()) return text;
  if (!shouldApplyTechnicalRestructure(text, userMessage, recentUserMessages, recentAssistantMessages)) {
    return text;
  }

  let out = stripFounderTechnicalMetaLayers(text);
  const needsRelabel = !TECHNICAL_LABEL_RE.test(out)
    || NUMBERED_CONCEPT_LIST_RE.test(out)
    || PHILOSOPHY_ESSAY_RE.test(out);

  if (!needsRelabel) return out;

  if (!TECHNICAL_LABEL_RE.test(out) || NUMBERED_CONCEPT_LIST_RE.test(out) || PHILOSOPHY_ESSAY_RE.test(out)) {
    const paragraphs = out.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    const kept = paragraphs.filter((p) => !paragraphIsPhilosophyEssay(p));
    if (kept.length > 0) {
      out = kept.join('\n\n').trim();
    }
    if (EMPIRICAL_SCAFFOLD_RE.test(out) || responseImpliesTechnicalThread(out)) {
      out = restructureFounderUnlabeledTechnicalBlocks(
        out,
        userMessage,
        recentUserMessages,
        recentAssistantMessages,
      );
    }
  }

  return out;
}

const HAI_MASA_WITHOUT_PALT_RE =
  /^(\s*Hai Masa,)(?!\s*P\.alt)/i;

const KONVENSIONAL_ESSAY_OPENER_RE =
  /^(\s*Hai Masa,? P\.alt,?\s*)?Dalam ilmu konvensional,/i;

/** Enforce P.alt opener and flag metaphor-only empirical essays post-stream. */
export function repairFounderEmpiricalVoice(
  text: string,
  searchResults: LlmSearchResult[] = [],
  extractedFacts = '',
  userMessage = '',
  recentUserMessages: string[] = [],
  recentAssistantMessages: string[] = [],
): string {
  if (!text?.trim()) return text;

  let out = text.trim();
  out = stripFounderTechnicalMetaLayers(out);
  out = repairFounderTechnicalStructure(
    out,
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
  );
  out = out.replace(HAI_MASA_WITHOUT_PALT_RE, `${FOUNDER_LEARNER_GREETING}\n\n`);
  out = out.replace(
    KONVENSIONAL_ESSAY_OPENER_RE,
    `${FOUNDER_LEARNER_GREETING}\n\ntentang fakta saintifik yang boleh diukur:`,
  );

  const corpus = searchCorpusHits(searchResults, extractedFacts);
  const thinEvidence = searchResults.length < 2 || corpus.length < 120;
  const technicalThread = shouldApplyTechnicalRestructure(
    out,
    userMessage,
    recentUserMessages,
    recentAssistantMessages,
  );
  const metaphorEssay = METAPHOR_ONLY_ESSAY_RE.test(out) || (
    technicalThread
    && (PHILOSOPHY_ESSAY_RE.test(out) || NUMBERED_CONCEPT_LIST_RE.test(out))
    && !TECHNICAL_LABEL_RE.test(out)
  );
  const hasScaffold = EMPIRICAL_SCAFFOLD_RE.test(out) && TECHNICAL_LABEL_RE.test(out);

  if (thinEvidence && metaphorEssay && !hasScaffold) {
    return [
      FOUNDER_LEARNER_GREETING,
      '',
      'Pada giliran ini jawapan saya masih condong ke metafora — itu tidak mematuhi arahan kedalaman empirikal.',
      '',
      'Carian web tidak mencukupi untuk formula bernama; saya tidak akan reka jurnal atau angka.',
      '',
      'Berikut rangka yang saya ikut seterusnya — satu blok setiap konsep:',
      '',
      '**Napadu** — bidang: neurosains kognitif / perhatian; pembolehubah: ketumpatan kehadiran (contoh ukuran mapan: HRV, masa respon); instrumen: ECG/HRV monitor; jurang carian: [nyatakan jujur jika tiada hit]; satu ayat tapak sampah sebagai bingkai hidup.',
      '',
      '**Ruang masa** — bidang: fotonik kuantum; pembolehubah: laluan foton / keputusan pengukuran; eksperimen mapan: delayed-choice quantum eraser; jurang carian: [jujur]; satu ayat pokok mangga sebagai bingkai hidup.',
      '',
      '**Bekas pada masa** — bidang: epigenetik; pembolehubah: metilasi DNA; instrumen: bisulfite sequencing; jurang carian: [jujur]; satu ayat SBX V60 sebagai bingkai struktur.',
      '',
      'Beritahu P.alt konsep mana untuk carian semula dengan query lebih sempit.',
    ].join('\n');
  }

  return out.replace(/\n{3,}/g, '\n\n').trim();
}

/** Remove invented empirical blocks when prefetch/search evidence is empty or thin. */
export function repairFounderInventedEmpiricalClaims(
  text: string,
  searchResults: LlmSearchResult[] = [],
  extractedFacts = '',
): string {
  if (!text?.trim()) return text;

  const corpus = searchCorpusHits(searchResults, extractedFacts);
  const hasRichEvidence = searchResults.length >= 2 && corpus.length > 120;
  if (hasRichEvidence) return text;

  let out = text.replace(FOUNDER_META_PREAMBLE_RE, `${FOUNDER_LEARNER_GREETING}\n\n`);
  out = out.replace(LEARNER_VERIFY_CLOSE_RE, '');
  for (const frag of ORPHAN_FRAGMENT_RE) {
    out = out.replace(frag, '');
  }

  const unsupported = INVENTED_EMPIRICAL_CLAIM_RE.some(
    (re) => re.test(out) && !claimSupportedInHits(re, corpus),
  );
  if (!unsupported && searchResults.length > 0) {
    return ensureFounderLearnerGreeting(out.replace(/\n{3,}/g, '\n\n').trim());
  }
  if (!unsupported) {
    return ensureFounderLearnerGreeting(out.replace(/\n{3,}/g, '\n\n').trim());
  }

  const paragraphs = out.split(/\n\n+/);
  const kept = paragraphs.filter((para) => {
    const trimmed = para.trim();
    if (!trimmed) return false;
    return !INVENTED_EMPIRICAL_CLAIM_RE.some(
      (re) => re.test(trimmed) && !claimSupportedInHits(re, corpus),
    );
  });

  if (kept.length === 0) {
    return [
      FOUNDER_LEARNER_GREETING,
      '',
      'Carian web pada giliran ini tidak mengembalikan hit empirikal yang mencukupi untuk formula saintifik bernama (HeartMath, PNAS, NIST, TMI, dll.).',
      'Saya tidak akan reka angka atau jurnal.',
      '',
      'Saya boleh mendalami napadu, ruang masa, dan bekas pada masa dari Bab 5 / Formula XYZ — dengan contoh hidup tapak sampah, pokok mangga, dan SBX V60 — sebagai rangka empirikal yang jujur, bukan kertas kajian rekaan.',
      'Beritahu P.alt konsep mana mahu saya kembangkan dahulu dengan carian semula.',
    ].join('\n');
  }

  const gapNote = [
    '',
    '*(Carian web giliran ini tidak mengesahkan kertas/institusi bernama di atas — saya tidak menyertakan angka atau jurnal rekaan.)*',
  ].join('\n');

  return ensureFounderLearnerGreeting(`${kept.join('\n\n').trim()}${gapNote}`);
}

/** Strip continuation meta openers that block substantive voice. */
export function stripFounderContinuationMetaOpener(text: string): string {
  return text
    .replace(
      /^(Hai Masa,? P\.alt,?)\s*,?\s*saya faham,?\s*bukan sekadar fakta umum,?\s*tetapi\s+/i,
      '$1, ',
    )
    .replace(FOUNDER_FACTA_META_OPENER_RE, '$1')
    .replace(
      /^Formula ini bukan rekaan teori,?\s*tetapi sintesis daripada data empirikal[^.]*\.\s*/im,
      '',
    )
    .replace(/P\.alt,\s*,/g, 'P.alt,')
    .trim();
}
