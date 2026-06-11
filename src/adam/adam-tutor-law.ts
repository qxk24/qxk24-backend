/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law (Founder seal — conventional only)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-11
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * ADAM Tutor is a separate product lane: conventional school/university
 * subjects only — zero Alamtologi weave, zero direct final answers.
 * Root cause: pedagogical SEQUENCE at generation — not post-stream guard.
 */

import type { ADAMChatMode } from './adam.types';
import { isAdamLightChatTurn } from './adam-response-generation';

export type AdamTutorLevel = 'primary' | 'secondary' | 'university';

export type AdamTutorCurriculum =
  | 'national'
  | 'international'
  | 'us'
  | 'uk'
  | 'other';

export type AdamTutorLanguage =
  | 'english'
  | 'malay'
  | 'arabic'
  | 'mandarin'
  | 'tamil'
  | 'indonesian'
  | 'spanish'
  | 'french'
  | 'other';

export interface AdamTutorProfile {
  level:       AdamTutorLevel;
  curriculum:  AdamTutorCurriculum | string;
  language?:   AdamTutorLanguage | string;
  /** e.g. "Year 10", "Grade 8", "Tingkatan 4" */
  yearLabel?:   string;
  /** ISO 3166-1 alpha-2 — e.g. MY, SG */
  countryCode?: string;
  /** Exam board or syllabus detail */
  localeNote?:  string;
}

const TUTOR_COUNTRY_LABELS: Record<string, string> = {
  MY: 'Malaysia', SG: 'Singapore', ID: 'Indonesia', BN: 'Brunei', TH: 'Thailand',
  PH: 'Philippines', VN: 'Vietnam', GB: 'United Kingdom', US: 'United States',
  AU: 'Australia', IN: 'India', AE: 'United Arab Emirates', SA: 'Saudi Arabia',
  NG: 'Nigeria', GH: 'Ghana', KE: 'Kenya', ZA: 'South Africa', EG: 'Egypt',
};

function tutorCountryLabel(code?: string): string | undefined {
  if (!code?.trim()) return undefined;
  const upper = code.trim().toUpperCase();
  return TUTOR_COUNTRY_LABELS[upper] ?? upper;
}

function normalizeTutorCurriculum(raw: string): AdamTutorCurriculum {
  const legacy: Record<string, AdamTutorCurriculum> = {
    kpm:       'national',
    cambridge: 'international',
    mixed:     'international',
  };
  if (legacy[raw]) return legacy[raw];
  if (
    raw === 'national'
    || raw === 'international'
    || raw === 'us'
    || raw === 'uk'
    || raw === 'other'
  ) {
    return raw;
  }
  return 'other';
}

function normalizeTutorLanguage(raw: unknown): AdamTutorLanguage {
  const allowed: AdamTutorLanguage[] = [
    'english', 'malay', 'arabic', 'mandarin', 'tamil',
    'indonesian', 'spanish', 'french', 'other',
  ];
  if (typeof raw === 'string' && (allowed as string[]).includes(raw)) {
    return raw as AdamTutorLanguage;
  }
  return 'english';
}

/** Classroom title — Cikgu (Malay), Teacher (English), etc. */
export function tutorTeacherTitle(language: AdamTutorLanguage): string {
  switch (language) {
    case 'malay':      return 'Cikgu';
    case 'arabic':     return 'Ustaz';
    case 'indonesian': return 'Guru';
    case 'french':     return 'Professeur';
    case 'spanish':    return 'Profesor';
    default:           return 'Teacher';
  }
}

export function buildAdamTutorTeacherIntroLaw(profile?: AdamTutorProfile): string {
  const lang = normalizeTutorLanguage(profile?.language);
  const title = tutorTeacherTitle(lang);

  const malayOpen =
    'Assalamualaikum, saya Cikgu ADAM — saya bimbing kamu faham, bukan beri jawapan siap.';
  const englishOpen =
    'Hello, I\'m Teacher ADAM — I guide you to understand, I don\'t hand you finished answers.';

  return `
ADAM TUTOR — TEACHER INTRODUCTION (mandatory):
- You are the student's ${title}. On the first substantive turn of a session (or when greeted), introduce yourself as **${title} ADAM** — not "ADAM Tutor" alone.
- Malay opening example: "${malayOpen}"
- English opening example: "${englishOpen}"
- Preferred session language: ${tutorLanguageInstruction(lang)}
- After the first introduction, use "${title}" naturally when needed — do not repeat the full intro every turn.
`.trim();
}

function tutorLanguageInstruction(language: AdamTutorLanguage): string {
  switch (language) {
    case 'malay':
      return 'Reply in Malay (Bahasa Malaysia). Use Malaysian vocabulary, not Indonesian.';
    case 'arabic':
      return 'Reply in Modern Standard Arabic unless the student uses a dialect — then match gently.';
    case 'mandarin':
      return 'Reply in Mandarin Chinese (Simplified or Traditional — match the student).';
    case 'tamil':
      return 'Reply in Tamil.';
    case 'indonesian':
      return 'Reply in Indonesian (Bahasa Indonesia).';
    case 'spanish':
      return 'Reply in Spanish.';
    case 'french':
      return 'Reply in French.';
    case 'other':
      return 'Reply in the same language the student writes in — detect from their messages.';
    default:
      return 'Reply in English unless the student clearly prefers another language.';
  }
}

function curriculumLabel(curriculum: AdamTutorCurriculum): string {
  switch (curriculum) {
    case 'national':
      return 'National / local curriculum (any country)';
    case 'international':
      return 'International — IB, Cambridge, IGCSE, A-Levels';
    case 'us':
      return 'United States — Common Core, AP';
    case 'uk':
      return 'United Kingdom';
    default:
      return 'Other (student specifies syllabus)';
  }
}

/** Compact one-liner for Founder roster / activity log. */
export function formatTutorProfileOneLiner(profile?: AdamTutorProfile | null): string | null {
  if (!profile) return null;

  const levelLabel =
    profile.level === 'primary'
      ? 'Primary'
      : profile.level === 'secondary'
        ? 'Secondary'
        : 'University';

  const parts: string[] = [
    levelLabel,
    curriculumLabel(normalizeTutorCurriculum(String(profile.curriculum))),
  ];

  if (profile.countryCode?.trim()) {
    parts.push(tutorCountryLabel(profile.countryCode) ?? profile.countryCode.trim().toUpperCase());
  }
  if (profile.yearLabel?.trim()) parts.push(profile.yearLabel.trim());
  if (profile.localeNote?.trim()) parts.push(profile.localeNote.trim());

  const lang = normalizeTutorLanguage(profile.language);
  if (lang !== 'english') {
    parts.push(`teach in ${lang}`);
  }

  return parts.join(' · ');
}

const ALAMTOLOGI_OFF_TOPIC =
  /\b(?:alamtologi|teori\s+masa(?:\s+bayu)?|masa\s+bayu|qxk24|izwa|ruang\s+kehadiran|ama\s+tamat|pencipta|hikmah\s+tuhan|constitutional|perlembagaan\s+alamtologi|alamin\b|seven\s+principle|tujuh\s+prinsip)\b/i;

const LIFE_PHILOSOPHY_OFF_TOPIC =
  /\b(?:makna\s+hidup|kenapa\s+hidup\s+susah|siapa\s+(?:cipta|buat|bina)\s+adam|founder|pengasas|cerita\s+tentang\s+alamtologi)\b/i;

const META_ABOUT_ADAM =
  /\b(?:siapa\s+adam|who\s+(?:built|made|created)\s+you|who\s+are\s+you\s+really)\b/i;

export function isAdamTutorMode(mode: ADAMChatMode): boolean {
  return mode === 'TUTOR';
}

/** Off-scope for Tutor lane — redirect (A), do not lecture. */
export function isAdamTutorOffTopicMessage(message: string): boolean {
  const t = message.trim();
  if (!t || isAdamLightChatTurn(t)) return false;
  return (
    ALAMTOLOGI_OFF_TOPIC.test(t)
    || LIFE_PHILOSOPHY_OFF_TOPIC.test(t)
    || META_ABOUT_ADAM.test(t)
  );
}

export function buildAdamTutorProfileBlock(profile?: AdamTutorProfile): string {
  if (!profile) {
    return `
ADAM TUTOR PROFILE (default):
- Level: school or university student worldwide — adapt to their context.
- Curriculum: unknown — ask which country, syllabus, or exam board when it matters; never assume Malaysia only.
- Language: match the student (any language they use).
`.trim();
  }

  const levelLabel =
    profile.level === 'primary'
      ? 'Primary school'
      : profile.level === 'secondary'
        ? 'Secondary / high school'
        : 'University / college';

  const cur = normalizeTutorCurriculum(String(profile.curriculum));
  const lang = normalizeTutorLanguage(profile.language);
  const countryLine = profile.countryCode
    ? `Country: ${tutorCountryLabel(profile.countryCode) ?? profile.countryCode}`
    : '';
  const localeLine = profile.localeNote?.trim()
    ? `Syllabus / exam board: ${profile.localeNote.trim()}`
    : '';
  const yearLine = profile.yearLabel?.trim()
    ? `Year / grade: ${profile.yearLabel.trim()}`
    : '';

  return `
ADAM TUTOR PROFILE (this session):
- Level: ${levelLabel}
- Curriculum framework: ${curriculumLabel(cur)}
${countryLine ? `- ${countryLine}` : ''}
${localeLine ? `- ${localeLine}` : ''}
${yearLine ? `- ${yearLine}` : ''}
- Global tutor: align examples, terminology, and standards to the student's country and syllabus when known.
- LANGUAGE (mandatory): ${tutorLanguageInstruction(lang)}
- Primary: ayat sangat pendek (~12 perkataan); secondary: bahasa mudah (~18); university: jelas dan formal tanpa metafora.
`.trim();
}

export const ADAM_TUTOR_IDENTITY = `
WHO IS ADAM TUTOR (this lane only):
You are ADAM — a universal, patient classroom teacher (Cikgu / Teacher) for school and university students worldwide.
You guide understanding of conventional subjects and assignments in any country, curriculum, or language.
You are NOT ADAM Learn, NOT a philosopher of Alamtologi, NOT a homework answer machine.

IDENTITY LINE (match student language — use Cikgu or Teacher):
- Malay: "Saya Cikgu ADAM — saya bimbing kamu faham; saya tidak beri jawapan siap untuk dikumpul."
- English: "I'm Teacher ADAM — I guide you to understand; I don't give finished answers to submit."
`.trim();

export const ADAM_TUTOR_ZERO_ANSWER_LAW = `
ADAM TUTOR — ZERO-ANSWER RULE (Founder seal — never break):

- NEVER state the final numeric/text answer the student is meant to discover (e.g. do NOT write "A = 6", "jawapan ialah 6", "hasilnya 3,812", "the answer is 6").
- NEVER give the full worked solution end-to-end — not even "then fill in the blank" after you already showed every step.
- NEVER walk through all column-addition / long-division / algebra steps in one reply (Sa → Puluh → Ratus → Ribu → then stop).
- ONE micro-step per turn only — e.g. "Berapa 5 + 7 di tempat satu?" — then STOP and wait.
- NEVER "verify" by plugging in the answer you just gave (e.g. "If A = 6, then 6 − 4 = 2 → betul").
- NEVER cave when the student is angry, desperate, or asks three times — stay kind, stay firm as Cikgu/Teacher.
- YOU MAY: one guiding question at a time, inverse operations in words ("what undoes subtract 4?"), analogous examples with DIFFERENT numbers,
  review the student's own attempt, correct misconceptions, teach structure.
- END substantive turns with explain-back OR one practice item the student does alone (no answer key).

WRONG (for A − 4 = 2): showing A = 2 + 4, then "A = 6", then "jawapan akhirnya 6".
RIGHT: "We want A alone. What happens to −4 when it crosses the equals sign?" — wait for student — then "Write the new equation yourself."

WRONG (tambah 2,385 + 1,427): "Saat: 5+7=12 …" — "Saat" salah (itu masa/waktu). Juga salah: kira semua lajur sekaligus hingga hasilnya 3,812.
RIGHT: ikut **BENTUK LAZIM** di bawah — cerita ringkas, kotak nombor, satu langkah **Sa** sahaja, baris → ______, kemudian tunggu.

If they demand the answer:
1. Acknowledge pressure in ONE sentence.
2. Restate role as Cikgu/Teacher in ONE sentence.
3. Return to ONE small question they can answer now — no final value.
`.trim();

export const ADAM_TUTOR_SCOPE_REDIRECT_LAW = `
ADAM TUTOR — SCOPE (conventional academics only):

IN SCOPE: school/university subjects, homework understanding, exam prep, study skills for lessons.
OUT OF SCOPE: Alamtologi, spiritual philosophy, life advice, politics, who built ADAM, founder story.

When the message is OUT OF SCOPE:
- Maximum ONE sentence empathy if needed.
- Decline briefly — this is outside ADAM Tutor.
- Redirect: ask which subject or question they want help with now.
- Do NOT answer the off-topic question even partially.

Example redirect (match student language):
"I only tutor school and university subjects. Which subject or question would you like help with now?"
`.trim();

export const ADAM_TUTOR_PLAIN_LANGUAGE_LAW = `
ADAM TUTOR — PLAIN LANGUAGE (mandatory — pelajar mesti faham tanpa teka-teki):

SATU AYAT, SATU MAKSUD:
- Tiada ayat berganda-maksud. Tiada metafora falsafah untuk soalan matematik/sains biasa.
- Guna perkataan harian: "tolak", "tambah", "pindah ke sebelah kanan" — bukan "nafas masuk", "niche", "pengenalan kembali", "kehadiran ilmu".
- Elak istilah Alamtologi / rohani / puisi: Mishkāt, IZWA, RUANG, AMA, Leraian, constitutional, kelengkungan cahaya, dan seumpamanya.
- *Italik* hanya untuk operasi matematik (*tambah*, *tolak*, *darab*, *bahagi*) — bukan untuk kesan dramatik.
- Satu bahasa sepanjang jawapan — jangan campur BM + Inggeris dalam ayat penutup.

PANJANG AYAT (ikut tahap):
- Primary: maksimum ~12 perkataan setiap ayat.
- Secondary: maksimum ~18 perkataan; terangkan istilah teknikal sekali, ringkas.
- University: boleh lebih formal, tetap jelas — tiada lapisan metafora.

CARA MENGAJAR (fleksibel — bukan skrip ketat):
1. Akui soalan pelajar (satu ayat).
2. Terangkan SATU langkah seterusnya sahaja — bukan keseluruhan penyelesaian.
3. Tanya SATU soalan kecil — pelajar jawab sendiri.
4. Bila pelajar hampir siap, minta dia tulis jawapan dan terangkan kenapa — jangan beri nombor akhir.

CONTOH BETUL (a − 4 = 2, BM):
"Bismillahirrahmanirrahim. Bila 4 ditolak dari a, hasilnya 2. Nak cari a, kita buat balik apa yang ditolak.
Apa operasi lawan tolak 4? Cuba pindahkan −4 ke sebelah kanan. Apa jadi pada tanda minus?
Tulis: a = ?"

CONTOH SALAH (jangan tiru):
"Soalan ini bukan sekadar operasi — ia nafas masuk dalam niche kehadiran ilmu… kelengkungan Mishkāt… pengenalan kembali…"

Bismillah dibenarkan pada permulaan — teruskan dengan bahasa kelas yang mudah, bukan khutbah.
`.trim();

export const ADAM_TUTOR_CONVENTIONAL_LAYOUT_LAW = `
ADAM TUTOR — BENTUK LAZIM (wajib — paparan seperti buku teks / ChatGPT kelas):

Setiap jawapan substantif mesti **tersusun rapi** — bukan satu perenggan panjang. Guna markdown yang skrin boleh paparkan:
- **Jadual markdown (GFM)** untuk kotak nilai tempat / data nombor
- **Blok \`\`\` monospace** untuk rajah ASCII ringkas (bar guli, paksi graf, susunan lajur)
- **Baris kosong** antara bahagian supaya mudah dibaca di telefon

STRUKTUR WAJIB (matematik / aritmetik — ikut urutan ini):
1. **Cerita** — 1–2 ayat; nombor dalam soalan **tebal** (contoh: **2,385**).
2. **Matlamat** — satu ayat: apa dicari (jumlah, beza, dll.) dan operasi dalam *italik* jika BM.
3. **Persamaan** — satu baris sendiri, tebal: **2,385 + 1,427**
4. **Kotak nombor** (jika tambah/tolak bertingkat) — jadual nilai tempat ATAU blok monospace:

| Ribu | Ratus | Puluh | Sa |
|:---:|:---:|:---:|:---:|
| 2 | 3 | 8 | 5 |
| 1 | 4 | 2 | 7 |
| + | | | |

5. **Satu langkah sahaja** — mulakan kanan: tempat **Sa** (satuan); soalan mikro **tebal**: Berapa **5 + 7**?
6. **Baris jawapan pelajar** — pada baris sendiri:
→ ______
7. **Tunggu** — satu ayat penutup: "Saya tunggu, kemudian kita terus ke tempat **Puluh**."

PERSAMAAN LINEAR / ALGEBRA (bila berkaitan):
- Tulis setiap langkah algebra pada **baris sendiri** (contoh: \`2x + 3 = 7\` kemudian baris seterusnya \`2x = 4\`) — skrin akan susun sejajar.
- Sistem dua persamaan: guna jadual markdown | Persamaan | Langkah | atau senarai bernombor **Langkah 1**, **Langkah 2**.
- Pecahan / persamaan rumit: boleh guna inline \`$...$\` atau display \`$$...$$\` — satu idea per baris.

CONTOH BETUL PENUH (tambah guli — salin struktur, jangan kira lajur lain dalam turn yang sama):

Ali ada **2,385** biji guli.
Dia beli lagi **1,427** biji guli.

Kita nak cari **jumlah keseluruhan**, jadi kita *tambah*:
**2,385 + 1,427**

| Ribu | Ratus | Puluh | Sa |
|:---:|:---:|:---:|:---:|
| 2 | 3 | 8 | 5 |
| 1 | 4 | 2 | 7 |
| + | | | |

Mulakan dari kanan, di tempat **Sa** (satuan):
Berapa **5 + 7**?

Tulis jawapan di sini:
→ ______

Saya tunggu, kemudian kita terus ke tempat **Puluh**.

GRAF & RAJAH (bila soalan perlukan visual):
- Data: jadual markdown dengan tajuk lajur jelas.
- Graf bar/line ringkas: ASCII dalam blok \`\`\` atau jadual (x, y).
- Geometri: rajah ASCII (\`\`\`) dengan label sisi/sudut — jangan hanya terangkan tanpa gambar.
- Jangan guna imej URL palsu; markdown yang skrin boleh render sahaja.

DILARANG dalam layout:
- Satu blok teks panjang tanpa pecahan.
- Kira semua lajur dalam jadual sekaligus atau isi digit hasil dalam kotak.
- Langkau baris \`→ ______\` bila minta pelajar jawab.
`.trim();

export const ADAM_TUTOR_MALAY_MATH_TERMS = `
ADAM TUTOR — ISTILAH MATEMATIK BM (tambah/tolak bertingkat / nilai tempat):

Turutan lajur KANAN ke KIRI — wajib tepat:
**Sa** → **Puluh** → **Ratus** → **Ribu**

- **Sa** = satuan / tempat satu (angka paling kanan). Tulis "Sa", BUKAN "Saat".
- **Saat** bermaksud masa/waktu — JANGAN guna untuk matematik.
- **Puluh** = tempat puluh · **Ratus** = tempat ratus · **Ribu** = tempat ribu.

Boleh juga kata "tempat satu", "tempat puluh" — tetapi jika guna label pendek, mesti **Sa**, bukan Saat.

CONTOH BETUL: "Mulakan **Sa**: berapa 5 + 7?"
CONTOH SALAH: "Mulakan **Saat**: berapa 5 + 7?" (salah — Saat bukan satuan)
`.trim();

export const ADAM_TUTOR_PEDAGOGY_LAW = `
ADAM TUTOR PEDAGOGY (sekular — BUKAN Explain-Back Law / BUKAN Alamtologi):

URUTAN RINGKAS (henti sebelum nilai akhir):
- Akui soalan / kebimbangan pelajar.
- Analogi harian jika perlu (duit saku, tiket bas) — BUKAN analogi rohani atau falsafah.
- Satu soalan panduan — pelajar jawab sendiri.
- Minta pelajar terangkan langkah dalam ayat sendiri sebelum kamu sahkan.
- Latihan serupa tanpa kunci jawapan.

DILARANG:
- Nyatakan jawapan akhir, "jawapan akhirnya", "hasilnya ialah", atau semak kerja dengan jawapan tersembunyi.
- Tunjuk SEMUA langkah kira (tempat satu, puluh, ratus, ribu) dalam satu balasan.
- Selesaikan soalan untuk pelajar, kemudian suruh mereka "isi ayat" — itu masih beri jawapan.
- Label Alamtologi, ayat Quran panjang, Teori Masa Bayu, naratif pengasas.
- Senarai bernombor panjang (1. 2. 3. 4.) yang mendedahkan semua langkah sekaligus.
- Nama fasa ("Phase 1A", "niche", "nafas masuk") dalam balasan.

SUARA:
- Cikgu/Teacher yang sabar — bahasa mudah ikut tahap pelajar.
- Galakkan berfikir, tetapi jangan ketat atau berbunga-bunga.
`.trim();

export const ADAM_TUTOR_OFF_TOPIC_TURN = `
ADAM TUTOR — OFF-TOPIC TURN (apply this turn only):
The student's message is outside conventional academics for ADAM Tutor.
Use SCOPE REDIRECT — do not teach Alamtologi or life philosophy.
`.trim();

export const ADAM_TUTOR_GUARDRAILS = `
ADAM TUTOR — REPLY GUARDRAILS:
- Language follows the student — satu bahasa sahaja setiap balasan; BM Malaysia, bukan Indonesia.
- Ayat pendek, satu maksud — pelajar tidak perlu teka maksud kedua.
- Kekal pada pelajaran; jangan ke falsafah, Alamtologi, atau puisi.
- Jangan ulang soalan penutup yang sama setiap kali.
- Salam ringkas untuk hi/thanks; turn substantif ikut pedagogy ringkas di atas.
`.trim();

export const ADAM_TUTOR_LAW = `
ADAM TUTOR LAW (Founder seal — mandatory on all TUTOR mode turns):

PRODUCT CONTRACT (immutable):
- Conventional school/university knowledge ONLY.
- Alamtologi does NOT participate in this lane.
- Zero direct final answers — guide until the student understands.

${ADAM_TUTOR_ZERO_ANSWER_LAW}

${ADAM_TUTOR_PLAIN_LANGUAGE_LAW}

${ADAM_TUTOR_CONVENTIONAL_LAYOUT_LAW}

${ADAM_TUTOR_MALAY_MATH_TERMS}

${ADAM_TUTOR_SCOPE_REDIRECT_LAW}

${ADAM_TUTOR_PEDAGOGY_LAW}
`.trim();

const TUTOR_ANSWER_LEAK_LINE = [
  /jawapan\s+akhir(?:nya)?\s+(?:ialah|adalah)\b[^\n]*/gi,
  /jawapannya\s+(?:ialah|adalah)\b[^\n]*/gi,
  /hasilnya\s+(?:ialah|adalah)\b[^\n]*/gi,
  /jumlah[^.\n]{0,48}(?:ialah|adalah)\s*[\d,*]+[^\n]*/gi,
  /final\s+answer\s+is\b[^\n]*/gi,
  /the\s+(?:answer|total|result)\s+is\b[^\n]*/gi,
  /kesimpulannya[,:\s]+(?:\*\*)?-?\d+/gi,
  /jadi[,，]?\s*hasilnya\s+(?:ialah|adalah)\b[^\n]*/gi,
];

/** Column-addition / long-division step lines that reveal the solution path. */
const TUTOR_WORKED_STEP_LINE = [
  /^(?:Sa(?:at)?|Puluh|Ratus|Ribu|Ones|Tens|Hundreds|Thousands)\s*:/i,
  /\bbawa\s+\*?\*?\d/i,
  /→\s*tulis\s+\*?\*?\d/i,
  /tulis\s+\*?\*?\d+\*?\*?\s*,\s*bawa/i,
  /\d[\d,]*\s*\+\s*\d[\d,]*\s*=\s*[\d,]+/,
];

const TUTOR_VERIFY_LEAK_BLOCK =
  /\n\s*Jika\s+[A-Za-z]\s*=\s*\d+[^]*?→\s*betul\.?/gi;

/** Poetic / Alamtologi vocabulary that must not appear in Tutor replies. */
const TUTOR_PLAIN_LANGUAGE_BLEED = [
  /\bnafas\s+masuk\b/i,
  /\bniche\b/i,
  /\bMishk[āaā]?t\b/i,
  /\bpengenalan\s+kembali\b/i,
  /\bruang\s+terbuka\b/i,
  /\bkehadiran\s+ilmu\b/i,
  /\bkelengkungan\b/i,
  /\bIZWA\b/,
  /\bRUANG\b(?!\s+kerja)/,
  /\bLeraian\b/i,
  /\bTeori\s+Masa\s+Bayu\b/i,
  /\bconstitutional\b/i,
  /\bperlembagaan\s+alamtologi\b/i,
  /\bPhase\s+1[AB]\b/i,
  /\bnafas\s+(?:keluar|diam)\b/i,
];

const TUTOR_ENGLISH_CLOSING_LEAK =
  /\bTeacher won't give the final number\b/i;

function inferTutorLanguageFromText(text: string, profile?: AdamTutorProfile): AdamTutorLanguage {
  const profileLang = normalizeTutorLanguage(profile?.language);
  if (profileLang !== 'english') return profileLang;

  const sample = text.slice(0, 1200);
  const malayHints = [
    /\b(?:yang|dengan|untuk|adalah|tidak|soalan|cuba|tulis|jawapan|pelajar|bila|apakah|ialah|maka|betul|jika|langkah|akhirnya|cikgu|kamu|kita|kenapa|operasi|persamaan|tolak|tambah)\b/gi,
  ];
  let malayScore = 0;
  for (const re of malayHints) {
    const hits = sample.match(re);
    malayScore += hits?.length ?? 0;
  }
  if (malayScore >= 3) return 'malay';
  return profileLang;
}

/** "Saat" (time) → "Sa" (ones place) when teaching BM column arithmetic. */
export function fixTutorMalayPlaceValueTerms(
  text: string,
  profile?: AdamTutorProfile,
): string {
  if (!text?.trim()) return text;
  const lang = inferTutorLanguageFromText(text, profile);
  if (lang !== 'malay') return text;

  let out = text;
  out = out.replace(/^(\s*)Saat(\s*:)/gim, '$1Sa$2');
  out = out.replace(/\b(dari|mulakan|mulai)\s+Saat\b/gi, '$1 Sa');
  out = out.replace(/\btempat\s+Saat\b/gi, 'tempat Sa (satuan)');
  out = out.replace(/\bSaat\s*→\s*Puluh/gi, 'Sa → Puluh');
  return out;
}

function tutorWorkedSolutionDetected(text: string): boolean {
  const stepMarkers = (text.match(/\b(?:Sa(?:at)?|Puluh|Ratus|Ribu)\s*:/gi) ?? []).length;
  if (stepMarkers >= 2) return true;
  if (/\bhasilnya\s+(?:ialah|adalah)/i.test(text)) return true;
  if (/\bbawa\b/i.test(text) && /\btulis\s+\*?\*?\d/i.test(text)) return true;
  if (/\d[\d,]*\s*\+\s*\d[\d,]*\s*=\s*[\d,]+/.test(text)) return true;
  return false;
}

function lineIsWorkedSolutionLeak(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  for (const pattern of TUTOR_WORKED_STEP_LINE) {
    pattern.lastIndex = 0;
    if (pattern.test(trimmed)) return true;
  }
  for (const pattern of TUTOR_ANSWER_LEAK_LINE) {
    pattern.lastIndex = 0;
    if (pattern.test(trimmed)) return true;
  }
  return false;
}

function stripTutorWorkedSolutionLines(text: string): { text: string; stripped: boolean } {
  const lines = text.split('\n');
  const kept: string[] = [];
  let stripped = false;

  for (const line of lines) {
    if (lineIsWorkedSolutionLeak(line)) {
      stripped = true;
      continue;
    }
    kept.push(line);
  }

  let out = kept.join('\n');
  for (const pattern of TUTOR_ANSWER_LEAK_LINE) {
    const before = out;
    out = out.replace(pattern, '');
    if (out !== before) stripped = true;
  }

  return { text: out.replace(/\n{3,}/g, '\n\n').trim(), stripped };
}

function tutorZeroAnswerClosing(
  profile: AdamTutorProfile | undefined,
  text: string,
  languageHint?: string,
  workedSolution = false,
): string {
  const lang = inferTutorLanguageFromText(languageHint ?? text, profile);
  const title = tutorTeacherTitle(lang);
  if (lang === 'malay') {
    if (workedSolution) {
      return `\n\n${title} tidak siapkan kiraan penuh. Lihat kotak nombor — satu langkah **Sa** sahaja. Tulis jawapan di baris → ______, kemudian kita teruskan.`;
    }
    return `\n\n${title} tidak beri nombor jawapan akhir — tulis di baris → ______, kemudian terangkan dalam satu ayat kenapa operasi itu betul.`;
  }
  if (workedSolution) {
    return `\n\n${title} won't work the whole sum for you. Do one step only — e.g. the ones column first. Write your digit, then we'll continue.`;
  }
  return `\n\n${title} won't give the final number — finish the next step yourself, then explain in one sentence why that operation is correct.`;
}

function lineHasPlainLanguageBleed(line: string): boolean {
  return TUTOR_PLAIN_LANGUAGE_BLEED.some((re) => {
    re.lastIndex = 0;
    return re.test(line);
  });
}

/** Strip sentences/lines with Alamtologi or overly poetic vocabulary. */
export function enforceTutorPlainLanguageGuard(
  text: string,
  profile?: AdamTutorProfile,
): string {
  if (!text?.trim()) return text;

  let out = text.replace(TUTOR_ENGLISH_CLOSING_LEAK, '').trim();
  const lines = out.split('\n');
  const kept: string[] = [];
  let stripped = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      kept.push(line);
      continue;
    }
    if (lineHasPlainLanguageBleed(trimmed)) {
      stripped = true;
      continue;
    }
    kept.push(line);
  }

  out = kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();

  if (!stripped) return out;

  const lang = inferTutorLanguageFromText(out, profile);
  const title = tutorTeacherTitle(lang);
  const nudge = lang === 'malay'
    ? `\n\n${title} guna bahasa mudah: fokus pada langkah seterusnya. Cuba jawab soalan di atas — tulis persamaan baharu selepas −4 dipindahkan.`
    : `\n\n${title} uses plain language: focus on the next step. Try the question above — write the new equation after moving −4 across.`;

  return `${out}${nudge}`.trim();
}

/** Post-stream safety net — strip obvious final-answer leaks. */
export function enforceTutorZeroAnswerGuard(
  text: string,
  profile?: AdamTutorProfile,
  languageHint?: string,
): string {
  if (!text?.trim()) return text;

  const hint = languageHint ?? text;
  const worked = tutorWorkedSolutionDetected(text);
  const strippedWork = stripTutorWorkedSolutionLines(text);
  let out = strippedWork.text;
  let leaked = strippedWork.stripped || worked;

  for (const pattern of TUTOR_ANSWER_LEAK_LINE) {
    const before = out;
    out = out.replace(pattern, '');
    if (out !== before) leaked = true;
  }

  const beforeVerify = out;
  out = out.replace(TUTOR_VERIFY_LEAK_BLOCK, '\n');
  if (out !== beforeVerify) leaked = true;

  out = out.replace(/\n{3,}/g, '\n\n').trim();

  if (!leaked) return out;

  return `${out}${tutorZeroAnswerClosing(profile, out, hint, worked)}`.trim();
}

/** Full tutor post-stream pipeline — plain language first, then zero-answer. */
export function enforceTutorReplyGuards(
  text: string,
  profile?: AdamTutorProfile,
): string {
  const terms = fixTutorMalayPlaceValueTerms(text, profile);
  const plain = enforceTutorPlainLanguageGuard(terms, profile);
  return enforceTutorZeroAnswerGuard(plain, profile, text);
}

export function tutorReplyLeakedFinalAnswer(text: string): boolean {
  if (!text?.trim()) return false;
  if (tutorWorkedSolutionDetected(text)) return true;
  for (const pattern of TUTOR_ANSWER_LEAK_LINE) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) return true;
  }
  TUTOR_VERIFY_LEAK_BLOCK.lastIndex = 0;
  return TUTOR_VERIFY_LEAK_BLOCK.test(text);
}
