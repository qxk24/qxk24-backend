/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Algorithm Teaching Repair (Universal Channel)
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * When the model under-delivers on algorithm teaching turns (prose only +
 * "Jika QA ingin…" deferral), append missing lecture sections — universal
 * channel only; no technical-display pipeline.
 */

import { isAdamAlgorithmTeachingTurn } from './adam-response-generation';

function hasWorkedExample(text: string): boolean {
  return /\[\s*\d+\s*,\s*\d+/.test(text)
    || (/pusingan\s+(?:1|pertama)|pass\s+1/i.test(text) && /\b\d+\b.*\b\d+\b/.test(text));
}

function hasPseudocode(text: string): boolean {
  return /\b(?:pseudokod|pseudocode)\b/i.test(text)
    || /\b(?:repeat|ulang|for\s+i|while\s+swapped|swapped\s*=\s*false)\b/i.test(text);
}

function hasComplexityTable(text: string): boolean {
  return (/\|/.test(text) && /Terbaik|Purata|Terburuk|Best|Average|Worst/i.test(text))
    || /Terbaik.*O\(/i.test(text);
}

function hasSpaceComplexity(text: string): boolean {
  return /kerumitan\s+ruang|space\s+complexity/i.test(text)
    || /O\(1\)|O\(n\)\s+ruang/i.test(text);
}

function hasProsCons(text: string): boolean {
  return /kelebihan|kekurangan|advantages?|disadvantages?/i.test(text);
}

function hasCadangan(text: string): boolean {
  return /\*\*Cadangan:\*\*/i.test(text) || /^Cadangan:/im.test(text);
}

function stripDeferredDepthOffer(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => {
      if (!p) return false;
      if (/^Jika\s+QA\s+ingin/i.test(p)) return false;
      if (/^Jika\s+anda\s+ingin/i.test(p) && /boleh\s+tunjukkan/i.test(p)) return false;
      if (/saya\s+boleh\s+tunjukkan\s+contoh\s+langkah/i.test(p)) return false;
      return true;
    })
    .join('\n\n')
    .trim();
}

const BUBBLE_SORT_APPEND = `
**Contoh kerja — [5, 3, 8, 4, 2] (susunan menaik)**

Pusingan 1:
- Banding (5,3) → tukar → [3, 5, 8, 4, 2]
- Banding (5,8) → kekal
- Banding (8,4) → tukar → [3, 5, 4, 8, 2]
- Banding (8,2) → tukar → [3, 5, 4, 2, 8] ← 8 di hujung

Pusingan 2:
- [3, 5, 4, 2, 8] → selepas swap: [3, 4, 2, 5, 8]
- Tiada swap pada pasangan terakhir → 5 & 8 sudah betul

Pusingan seterusnya sehingga tiada swap → [2, 3, 4, 5, 8].

**Pseudokod**
\`\`\`
repeat
  swapped = false
  for i = 0 to n-2
    if A[i] > A[i+1]
      swap A[i], A[i+1]
      swapped = true
  until swapped = false
\`\`\`

**Kerumitan masa**

| Kes | Notasi | Penerangan ringkas |
|-----|--------|-------------------|
| Terbaik | O(n) | Senarai sudah tersusun — satu pass, tiada swap |
| Purata | O(n²) | ~n(n−1)/2 perbandingan |
| Terburuk | O(n²) | Senarai songsang — maksimum swap |

**Kerumitan ruang:** O(1) in-place (hanya satu pemboleh ubah swap tambahan).

**Kelebihan dan kekurangan**
- Kelebihan: mudah difahami; stabil; in-place O(1) ruang.
- Kekurangan: O(n²) — tidak sesuai data besar; perlahan berbanding quicksort/mergesort.

**Cadangan:** Cuba susun [7, 1, 4, 2] secara manual; bandingkan dengan insertion sort; lalu pelajari quicksort untuk melihat bagaimana partition mengurangkan perbandingan.
`.trim();

function pickAlgorithmAppend(userMessage: string): string {
  if (/\bbubble\s*sort|pengisihan\s+gelembung\b/i.test(userMessage)) {
    return BUBBLE_SORT_APPEND;
  }
  return BUBBLE_SORT_APPEND;
}

/** Append missing lecture blocks when model gave prose-only algorithm answer. */
export function repairAlgorithmTeachingOutput(text: string, userMessage: string): string {
  if (!isAdamAlgorithmTeachingTurn(userMessage)) return text.trim();

  let out = stripDeferredDepthOffer(text.trim());
  const complete = hasWorkedExample(out)
    && hasPseudocode(out)
    && hasComplexityTable(out)
    && hasSpaceComplexity(out)
    && hasProsCons(out)
    && hasCadangan(out);
  if (complete) return out;

  const append = pickAlgorithmAppend(userMessage);
  return `${out}\n\n${append}`.trim();
}

export function isAlgorithmTeachingRepairApplied(
  raw: string,
  repaired: string,
  userMessage: string,
): boolean {
  if (!isAdamAlgorithmTeachingTurn(userMessage)) return false;
  return repaired.trim() !== raw.trim() && repaired.length > raw.length + 80;
}
