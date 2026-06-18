/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Prose Craft
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
 * Expand / reshape user prose — flowing essay only, no bullets.
 */

import {
  isAdamCompareTurn,
  isAdamLightChatTurn,
  isAdamTeachingDepthTurn,
  stripLeadingAdamSalutation,
} from './adam-response-generation';
import { ADAM_BM_VOICE_IDENTITY } from './adam-language-prompts';
import { sanitizeAdamProseDashBridges } from './adam-prose-sanitize';
import { paragraphIsUnsolicitedFaithSermon } from './adam-users-output-law';
import { userOpenedFaithDoor } from './adam-universal-voice';

const PROSE_CRAFT_ASK =
  /\b(?:kembang(?:kan)?|perkembang(?:kan)?|susun(?:kan)?\s+(?:semula\s+)?(?:ayat|perenggan|teks|naskhah)|perbaiki\s+gaya|baiki\s+gaya|perhalusi\s+gaya|haluskan\s+ayat|polish|rewrite|rephrase|tulis\s+semula|ulang\s+semula\s+(?:ayat|perenggan)|jadikan\s+(?:lebih\s+)?(?:panjang|indah|halus|lembut)|buat\s+(?:lebih\s+)?panjang|panjangkan|perindah|perhalus|expand(?:\s+this)?\s+(?:sentence|paragraph|text|passage)|arrange\s+(?:this\s+)?(?:sentence|paragraph|text)|beautif(?:y|ul)\s+(?:this\s+)?(?:sentence|paragraph|text))\b/i;

/** User wants prose expansion / reshape — not teaching, not technical. */
export function isAdamProseCraftTurn(message: string): boolean {
  const t = stripLeadingAdamSalutation(message).trim();
  if (!t || isAdamLightChatTurn(t)) return false;
  if (isAdamCompareTurn(t)) return false;
  if (isAdamTeachingDepthTurn(t) && !PROSE_CRAFT_ASK.test(t)) return false;
  return PROSE_CRAFT_ASK.test(t);
}

/** Founder meterai — gaya esei BM indah (rujuk contoh Qwen — prose-craft). */
export const ADAM_PROSE_CRAFT_GOLD_VOICE = `
GAYA ESEI INDAH (meterai Founder — wajib pada giliran kembangkan/susun ayat):
Tulis seperti esei BM yang mengalir — perenggan panjang, metafora hidup, bahasa klasik yang lembut.

PEMBUKA (wajib):
- JANGAN buka dengan "Hai {name}," atau "Hai QA," — terus masuk esei dari ayat pertama user
  (cth. "Apabila manusia telah lupa pada realiti…") atau satu ayat lembut tanpa nama.
- Tiada salam berulang — giliran ini adalah sambungan seni kata, bukan perbualan baru.

SENTUHAN JIWA (wajib):
- Bacaan mesti menyentuh hati user — lembut, hangat, seperti bisikan pada malam tenang; bukan kuliah atau hukuman.
- Nada kasih sayang dan kesedaran, bukan menggurui; reader merasa dipeluk kata, bukan ditegur.

UNIVERSAL SCHOLAR — FALSAFAH HIDUP (meterai Founder):
ADAM bukan sekadar cantikkan kata — ADAM membawa kesedaran lembut melalui prosa.
Nilai falsafah universal: realiti vs ilusi, makna pilihan, harga melupakan diri, konsekuensi jiwa.
Kebijaksanaan manusiawi mengalir dalam ayat — tanpa jargon akademik, tanpa khutbah.
Reader merasa dipahami, bukan digurui.
Falsafah dan metafora alam berjalan serentak — ombak, tanah, subuh, benih.

METAFORA ALAM (wajib — hubung jiwa dengan ciptaan):
Selitkan imej alam yang hidup dan lembut: ombak, sauh, pantai, angin, tanah, benih, akar, pokok,
sungai, subuh, bintang, kunang-kunang, hujan, cahaya menyusup, fatamorgana di permukaan air.
Metafora alam membawa jiwa kembali kepada realiti — bukan jargon teknikal.

CIRI ESEI:
- Ayat panjang dibenarkan bila mengalir; selang ayat pendek untuk nafas.
- Metafora indah dibenarkan: labirin mimpi, istana pasir, pentas tanpa naskhah, melayani maksud.
- Peribah BM klasik semula jadi: mendarah daging, helaian demi helaian, gelap gelita.
- Setiap perenggan satu gerakan fikir — ikut tema user.

CONTOH NADARAN (potongan gaya — jangan salin mentah):
"…seperti pelaut yang melepaskan tali sauh… ombak bukan kawan, melainkan penggoda… fatamorgana di permukaan air…"
"…istana pasir di tepi pantai… ombak kebenaran… benih ditanam dalam tanah realiti…"

IMAN — WAJIB IKUT TEKS USER:
- Jika teks user TIDAK menyebut ALLAH, Quran, Surah, atau iman — DILARANG tambah ALLAH, Al-Quran, ayat, Surah, Rasulullah, khutbah, atau istilah Arab berat.
- Hanya bila user sendiri buka pintu iman dalam teks mereka.

DILARANG pada giliran ini:
- "Hai QA," / "Hai {name}," di pembuka atau ulangan salam.
- *asterisk* untuk penekanan — tulis terus tanpa markdown italic.
- Em dash (—), en dash (–), atau sengkang berspasi sebagai jambatan klausa; guna koma, "iaitu", atau ayat baru (ADAM PROSE DASH LAW).
- Bullet (-), 1. 2. 3., ###, rantai mekanik "bukan sekadar X, melainkan Y" setiap ayat.
- Khutbah, ayat Quran, Surah, ALLAH, Ilahi, Rabb tanpa diminta user.
`.trim();

/** BM essay layout — overrides hybrid bullet layout on prose-craft turns. */
export const ADAM_PROSE_CRAFT_ESSAY_LAYOUT = `
BAHASA MELAYU — ESEI PROSA INDAH (giliran ini):
${ADAM_BM_VOICE_IDENTITY}
${ADAM_PROSE_CRAFT_GOLD_VOICE}
- 3–4 perenggan prosa panjang mengalir. Tiada bullet (-), tiada 1. 2. 3., tiada ###.
`.trim();

/** Prompt block — expand user's text in lyrical adab essay voice. */
export const ADAM_PROSE_CRAFT_TURN = `
PROSE CRAFT TURN (kembangkan / susun ayat — wajib giliran ini):
Giliran UNIVERSAL SCHOLAR — bukan sekadar cantikkan kata, tetapi sedarkan jiwa melalui falsafah yang hidup.

User minta teks mereka dikembangkan atau disusun semula — BUKAN soalan fakta, BUKAN kuliah berstruktur.

TUGAS:
- Kembangkan ayat/perenggan USER menjadi esei BM yang jauh lebih panjang, indah, dan bermakna falsafah — KEKALKAN tema asal.
- Tambah lapisan: imej alam, perasaan, kebijaksanaan universal — supaya reader bukan sahaja membaca, tetapi sedar.

${ADAM_PROSE_CRAFT_GOLD_VOICE}

BENTUK (wajib):
- 3–4 perenggan prosa sahaja. Tiada bullet (-), tiada senarai bernombor, tiada ###, tiada jadual.
- Panjang sasaran: jauh lebih luas daripada teks asal user — setiap perenggan 4–8 ayat mengalir.
- DILARANG buka "Hai {name}," / "Hai QA," — terus esei; tiada menu coaching.

SUARA:
- Universal Scholar: indah, lembut, bijaksana, penuh adab — prosa mengalir seperti sahabat bijak; metafora alam; hangat manusiawi, bukan khutbah.
- Watak relasional semula jadi — ikut siapa di hadapan; bukan satu persona kaku.

IMAN:
- Ikut teks user sahaja — tiada ALLAH/Quran/Surah/Rasul melainkan user sendiri membukanya dalam ayat mereka.

DILARANG:
- "Hai QA," / salam berulang, bullet (-), 1. 2. 3., ###, *asterisk*, em/en dash (— –), Cadangan, "Mahu saya jelaskan?"
- Gaya kaku mesin, label Alamtologi/MASA/TENAGA.
`.trim();

const PROSE_CRAFT_HAI_OPENER_RE =
  /^(?:Hai\s+(?:QA|[A-Za-z][A-Za-z'\-]*),?\s*)/i;

/** Strip mandatory Hai opener on prose-craft — essay dives straight in. */
export function stripProseCraftHaiOpener(text: string): string {
  let out = text.trim();
  for (let i = 0; i < 2; i += 1) {
    const next = out.replace(PROSE_CRAFT_HAI_OPENER_RE, '').trim();
    if (next === out) break;
    out = next;
  }
  if (out && /^[a-z]/.test(out)) {
    out = out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
}

const PROSE_CRAFT_MIN_RETAIN_RATIO = 0.65;

function countProseParagraphs(text: string): number {
  return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).length;
}

/** True when polish removed too much essay body (refresh would show a "summary"). */
export function proseCraftBodyWasGutted(raw: string, polished: string): boolean {
  const r = raw.trim();
  const p = polished.trim();
  if (!r || !p) return false;
  if (p.length < r.length * PROSE_CRAFT_MIN_RETAIN_RATIO) return true;
  const rawParas = countProseParagraphs(r);
  const polParas = countProseParagraphs(p);
  if (rawParas >= 2 && polParas < rawParas) return true;
  return false;
}

/** Hygiene only — Hai, emphasis, dash; never drop paragraphs. */
export function lightPolishProseCraftOutput(text: string): string {
  let out = stripProseCraftHaiOpener(text);
  out = stripProseCraftMarkdownEmphasis(out);
  out = sanitizeAdamProseDashBridges(out);
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

/** Persist/stream — never save a faith-strip that gutted the live essay. */
export function resolveProseCraftDisplayForSave(streamed: string, repaired: string): string {
  const raw = streamed.trim();
  const rep = repaired.trim();
  if (!raw) return rep;
  if (!rep || rep === raw) return lightPolishProseCraftOutput(raw);
  if (proseCraftBodyWasGutted(raw, rep)) return lightPolishProseCraftOutput(raw);
  return rep;
}
function paragraphIsProseCraftFaithWeave(paragraph: string): boolean {
  if (paragraphIsUnsolicitedFaithSermon(paragraph)) return true;
  const t = paragraph.trim();
  return /\bIlahi\b/i.test(t)
    || /\bRabb(?:-nya|ullah)?\b/i.test(t)
    || /\bliqā['']?\b/i.test(t)
    || /\bYang Maha\b/i.test(t)
    || /\bjanji-Nya\b/i.test(t)
    || /\bDzat yang Maha\b/i.test(t)
    || /\bkehadiranNya\b/i.test(t)
    || /\bAllah\b/i.test(t);
}

/** Remove faith sermon paragraphs model added without user opening the faith door. */
export function stripProseCraftUnsolicitedFaith(text: string, userMessage: string): string {
  if (userOpenedFaithDoor(userMessage)) return text;
  const kept = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p && !paragraphIsProseCraftFaithWeave(p));
  return kept.join('\n\n').trim();
}

/** Strip markdown emphasis markers prose-craft must not show. */
export function stripProseCraftMarkdownEmphasis(text: string): string {
  let out = text;
  for (let i = 0; i < 3; i += 1) {
    const next = out
      .replace(/\*\*([^*\n]+)\*\*/g, '$1')
      .replace(/\*([^*\n]+)\*/g, '$1')
      .replace(/_([^_\n]+)_/g, '$1');
    if (next === out) break;
    out = next;
  }
  return out;
}

/** Post-stream polish — prose-craft essay hygiene. */
export function polishProseCraftOutput(text: string, userMessage = ''): string {
  const light = lightPolishProseCraftOutput(text);
  if (!userMessage.trim() || userOpenedFaithDoor(userMessage)) {
    return light;
  }
  const faithStripped = stripProseCraftUnsolicitedFaith(light, userMessage);
  if (proseCraftBodyWasGutted(text, faithStripped)) {
    return light;
  }
  return faithStripped;
}

/** True when prose-craft guards changed the streamed body (UI must replace). */
export function isProseCraftSurfaceRepair(
  rawStream: string,
  surface: string,
  userMessage: string,
): boolean {
  if (!isAdamProseCraftTurn(userMessage)) return false;
  return rawStream.trim() !== surface.trim();
}
