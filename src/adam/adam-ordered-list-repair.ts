/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Ordered List Repair
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-06
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/** True when the model repeated `1.` for every section heading. */
export function outputHasRepeatedOrderedOnes(text: string): boolean {
  const ones = text.match(/^1\.\s+\S/gm) ?? [];
  return ones.length >= 2;
}

/**
 * Renumber consecutive structured sections (1. 1. 1. → 1. 2. 3.).
 * Also collapses blank lines between a numbered title and its body so GFM keeps one <ol>.
 */
export function repairOrderedListNumbering(text: string): string {
  if (!text?.trim()) return text;

  const repeatOnes = outputHasRepeatedOrderedOnes(text);
  const numberedBold = (text.match(/^\d+\.\s+\*\*/gm) ?? []).length;
  if (!repeatOnes && numberedBold < 2) return text;

  let out = text.replace(
    /(^(\d+\.\s+\*\*[^*\n]+\*\*[^\n]*))\n\n+(?!\d+\.\s|#{1,6}\s|>|```|\||\* |-\s)([^\n#>`\*\-][^\n]*)/gm,
    '$1\n$3',
  );

  out = out.replace(/(^\d+\.\s+\*\*[^\n]+)\n\n+(?=^\d+\.\s)/gm, '$1\n');

  const lines = out.split('\n');
  const rebuilt: string[] = [];
  let seq = 0;
  let inRun = false;

  for (const raw of lines) {
    const trimmed = raw.trim();

    if (/^#{1,6}\s/.test(trimmed)) {
      seq = 0;
      inRun = true;
      rebuilt.push(raw);
      continue;
    }

    const m = raw.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (m) {
      const body = m[3].trim();
      const looksLikeSection =
        /^\*\*[^*\n]+\*\*/.test(body)
        || (inRun && body.length <= 160 && !/^(\*|-|\+)\s/.test(body));

      if (looksLikeSection && (repeatOnes || /^\*\*/.test(body))) {
        seq += 1;
        inRun = true;
        rebuilt.push(`${m[1]}${seq}. ${m[3]}`);
        continue;
      }
    }

    rebuilt.push(raw);
  }

  return rebuilt.join('\n');
}
