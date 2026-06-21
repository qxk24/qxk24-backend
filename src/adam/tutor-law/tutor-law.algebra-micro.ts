/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Law — Algebra Micro-Teaching
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-21
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/** Student attempted factor-pair reasoning (not "tak faham"). */
export function tutorStudentGaveFactorPairAttempt(message: string): boolean {
  const t = message.trim();
  if (!t || t.length < 4) return false;
  if (/\btak\s+faham|\btidak\s+faham\b/i.test(t)) return false;

  return (
    /\b\d+\s*[×x*]\s*\d+\b/.test(t)
    || /\(\s*-?\d+\s*\)\s*\+\s*\(\s*-?\d+\s*\)/.test(t)
    || (/\bdarab(?:nya)?\b/i.test(t) && /\d/.test(t))
    || (/\btambah(?:nya)?\b/i.test(t) && /\d/.test(t))
  );
}

export function tutorReplyIsVerboseAlgebraEssay(text: string): boolean {
  if (!text?.trim()) return false;
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (text.length > 900 && (text.match(/✅|❌/g)?.length ?? 0) >= 2) return true;
  if (paras.length >= 5 && /^#{1,3}\s/m.test(text)) return true;
  if ((text.match(/Saya faham,\s*Pelajar/gi)?.length ?? 0) >= 2) return true;
  return false;
}

/** Remove repeated blocks (same opener / near-duplicate halves). */
export function dedupeTutorReplyParagraphs(text: string): string {
  if (!text?.trim()) return text;

  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paras.length < 2) return text;

  const seen = new Set<string>();
  const kept: string[] = [];

  for (const p of paras) {
    const key = p
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, 160)
      .toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(p);
  }

  const joined = kept.join('\n\n').trim();
  const opener = /Saya faham,\s*Pelajar/i;
  const first = joined.search(opener);
  if (first >= 0) {
    const rest = joined.slice(first + 24);
    const second = rest.search(opener);
    if (second >= 0) {
      return joined.slice(0, first + 24 + second).trim();
    }
  }

  return joined;
}

export function buildTutorFactorPairCorrectionRecovery(): string {
  return [
    'Betul — anda cuba pasangan nombor. Semak **dua** syarat serentak:',
    '',
    '1. Hasil **darab** = +6 (pemalar)',
    '2. Hasil **tambah** = −5 (pekali x)',
    '',
    'Contoh semak: 2 × 3 = 6 ✅, tetapi 2 + 3 = 5 (bukan −5).',
    '',
    'Apakah **dua nombor** yang darabnya **6** dan tambahnya **−5**?',
    '→ ______',
  ].join('\n');
}
