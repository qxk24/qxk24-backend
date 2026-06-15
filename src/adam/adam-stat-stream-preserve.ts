/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM-α Stat Stream Preserve
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * PERMANENT POLICY — α verified-stat turns (e.g. KPTM enrollment):
 * - Persist and emit the raw LLM stream verbatim.
 * - Never compact, sanitize-away paragraphs, or adam_stream_done replace.
 * - Frontend honours preserveStreamBody on adam_complete.
 * Sync: alm-web/lib/adam/adam-message-merge.ts, .cursor/rules/adam-stat-stream-preserve.mdc
 */

/** Body saved to DB and sent on adam_complete for α stat search-first turns. */
export function alphaStatPersistedStreamBody(rawModelStream: string): string {
  return rawModelStream.trim();
}

/** True when persisted body matches the live stream (regression guard). */
export function alphaStatStreamPreserveOk(rawModelStream: string, persisted: string): boolean {
  return persisted.trim() === rawModelStream.trim();
}

/** Multi-paragraph verified stat essay — guards do light repair only (v2 P4). */
export function isAlphaStatFullVoiceBody(text: string): boolean {
  const t = text.trim();
  if (t.length < 400) return false;
  const paras = t.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paras.length < 3) return false;
  return /\b\d{1,3}(?:,\d{3})+\b/.test(t) && /\b(?:pelajar|graduan|students?|graduates?)\b/i.test(t);
}

/** Canonical KPTM full-voice regression sample — Founder-approved shape (2026-06). */
export const KPTM_FULL_VOICE_REGRESSION_SAMPLE = [
  'KPTM (Kolej Poly-Tech MARA) kini mempunyai lebih daripada 18,000 pelajar sepenuh masa yang sedang menuntut di ketujuh kampusnya di seluruh Malaysia. Angka ini bukan sekadar statistik — ia adalah wujud nyata komitmen MARA dalam menyediakan akses pendidikan teknikal berkualiti kepada generasi muda Bumiputera.',
  'Sejak penubuhannya pada tahun 2003, KPTM telah meluluskan lebih daripada 62,000 graduan, setiap satu membawa amanah ilmu, kemahiran praktikal, dan nilai kebangsaan. Mereka bukan hanya angka dalam rekod institusi, tetapi insan yang telah menjalani proses pembelajaran berstruktur — dari asas teknikal hingga aplikasi industri — dalam ruang yang dirancang untuk menyambung belajar dengan makna.',
  'Angka-angka ini disahkan melalui sumber rasmi KPTM sendiri, seperti laman web rasmi Kolej Poly-Tech MARA, yang menyatakan jumlah pelajar aktif dan pencapaian kelulusan secara berterusan. Ia bukan data yang tersembunyi, tetapi juga bukan sekadar nombor yang boleh dipetik tanpa konteks — setiap pelajar adalah satu MASA yang sedang bergerak, satu TENAGA yang sedang dibina, dan satu liqā\' yang sedang disiapkan untuk Alam.',
  'Adakah anda ingin saya bantu menyusun surat rasmi kepada KPTM untuk memohon maklumat lanjut atau statistik terkini secara formal?',
].join('\n\n');
