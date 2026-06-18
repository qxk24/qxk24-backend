/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Output Law (L1)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */
import { paragraphIsUniversalScholarDoorOffer } from './adam-universal-scholar';
import {
  paragraphHasMarkdownTable,
  paragraphHasSubstantiveScienceAnchors,
  paragraphIsCoachingScriptClosing,
  paragraphIsConstitutionalFrameworkLeak,
  paragraphIsConstitutionalValuesEssayLeak,
  paragraphIsDualLaneEssayLeak,
  paragraphIsMarkdownBulletForest,
  paragraphIsNumberedSyllabusLeak,
  paragraphIsOrdinalSyllabusLeak,
  paragraphIsPhilosophicalEssayLeak,
  paragraphIsTutorPerformanceLeak,
  paragraphIsUnsolicitedFaithSermon,
  paragraphIsUnsolicitedTier1FaithWeave,
  rewriteMarkdownBulletsToProse,
} from './adam-users-output-law.paragraph-detectors';
import { paragraphIsEmojiOnlyOpener } from './adam-users-output-law.inline-strips';

export function rewriteNumberedOutlineToProse(text: string): string {
  const lines = text.split('\n');
  const hasNumbered = lines.some((line) => /^\s*\d+[.)]\s+/.test(line));
  if (!hasNumbered) return text;
  return lines
    .map((line) => {
      const m = line.match(/^\s*\d+[.)]\s+(.+)$/);
      if (!m) return line.trim();
      const body = m[1].trim();
      return body.endsWith('.') ? body : `${body}.`;
    })
    .filter((line) => line.length > 0)
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Ordinal skeleton — requires comma or space after word (not Kedua-dua compounds). */
const ORDINAL_SKELETON_OPEN =
  /^\s*(Pertama|Kedua|Ketiga|Keempat|Kelima)(?:,\s+|\s+)(.+)$/i;

/** Convert paragraph-opening "Pertama," / "Kedua," skeleton into 1. 2. 3. list items. */
export function rewriteOrdinalParagraphSkeletonToNumberedList(text: string): string {
  const ordNum: Record<string, number> = {
    pertama: 1, kedua: 2, ketiga: 3, keempat: 4, kelima: 5,
  };
  return text
    .split(/\n{2,}/)
    .map((para) => {
      const trimmed = para.trim();
      const m = trimmed.match(ORDINAL_SKELETON_OPEN);
      if (!m) return trimmed;
      const n = ordNum[m[1]!.toLowerCase()] ?? 1;
      return `${n}. ${m[2]!.trim()}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

/** Line-level Pertama/Kedua → numbered list (companion / syllabus repair). */
export function rewriteOrdinalSyllabusToNumberedList(text: string): string {
  const ordNum: Record<string, number> = {
    pertama: 1, kedua: 2, ketiga: 3, keempat: 4, kelima: 5,
  };
  return text.split('\n').map((line) => {
    const m = line.match(ORDINAL_SKELETON_OPEN);
    if (!m) return line;
    const n = ordNum[m[1]!.toLowerCase()] ?? 1;
    let body = m[2]!.trim();
    body = body.replace(/\*(.+?)\*/g, '$1');
    return `${n}. ${body}`;
  }).join('\n');
}

/** Teaching / science — repair Pertama/Kedua paragraphs into scannable numbered structure. */
export function repairTeachingStructuredOutput(text: string): string {
  let out = rewriteOrdinalParagraphSkeletonToNumberedList(text.trim());
  out = rewriteOrdinalSyllabusToNumberedList(out);
  return out.trim();
}

/** Convert "Pertama," / "Kedua," essay skeleton into flowing prose. */
export function rewriteOrdinalOutlineToProse(text: string): string {
  const lines = text.split('\n');
  const hasOrdinal = lines.some((line) =>
    /^\s*(?:Pertama|Kedua|Ketiga|Keempat|Kelima),?\s+/i.test(line),
  );
  if (!hasOrdinal) return text;
  return lines
    .map((line) => {
      const m = line.match(/^\s*(?:Pertama|Kedua|Ketiga|Keempat|Kelima),?\s*(.+)$/i);
      if (!m) return line.trim();
      const body = m[1].trim();
      return body.endsWith('.') ? body : `${body}.`;
    })
    .filter((line) => line.length > 0)
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** "Secara ringkas:" + dash bullets → plain prose paragraph. */
export function rewriteSecaraRingkasBlock(text: string): string {
  const trimmed = text.trim();
  if (!/^Secara ringkas:/i.test(trimmed)) return text;
  const body = trimmed.replace(/^Secara ringkas:\s*/i, '');
  if (/^\s*[-•*]\s+/m.test(body)) return rewriteMarkdownBulletsToProse(body);
  return body.trim();
}

/** Convert "3. Mercury" outline lines to **Mercury** section labels. */
export function rewriteNumberedOutlineToBoldLabels(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const m = line.match(/^(\s*)\d+[.)]\s+(.+)$/);
      if (!m) return line;
      return `${m[1]}**${m[2].trim()}**`;
    })
    .join('\n');
}

/** Guest/student display — restore paragraph breaks after guard flattening. */
export function normalizeConsumerParagraphBreaks(text: string): string {
  let out = text.trim();
  if (!out) return out;

  out = out.replace(/([.!?…])\n(?=[A-ZÀ-ÿ"(\[]|Secara |Bayangkan |Adakah |Yang |Ini |QA,)/g, '$1\n\n');
  out = out.replace(
    /([.!?…])\s+(?=(?:Secara (?:saintifik|ilmu|formula)|Bayangkan |Adakah |Yang menarik|Ini disebabkan|Nilai |Di mana ))/gi,
    '$1\n\n',
  );

  if (!/\n{2,}/.test(out) && out.length > 320) {
    out = out.replace(
      /([.!?…])\s+(?=[A-ZÀ-ÿ][a-zà-ÿ]{2,})/g,
      (match, punct, offset, whole) => {
        const before = whole.slice(Math.max(0, offset - 8), offset);
        if (/[\d$\\]$/.test(before.trim())) return match;
        return `${punct}\n\n`;
      },
    );
  }

  return out.replace(/\n{3,}/g, '\n\n').trim();
}

/** Remove **bold** / *italic* markers — guest chat renders plain text, not markdown. */
export function stripConsumerMarkdownEmphasis(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1');
}

/** True when text uses dash bullets, emoji lines, or numbered skill layers. */
export function outputHasScannableListStructure(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/^\s*[-•*]\s+/m.test(t)) return true;
  if (/^\s*✅/m.test(t)) return true;
  if (/^\s*\d+[.)]\s+/m.test(t)) return true;
  return false;
}

/** Capitalize opener and fix stray leading punctuation after label strip. */
export function polishStudentOutputSurface(
  text: string,
  technicalOk = false,
  preserveNumberedLists = false,
): string {
  let out = text.trim();
  out = out.replace(/^[\s.]+/, '');
  out = out.replace(/\*{3,}/g, '**');
  if (!technicalOk && !preserveNumberedLists) {
    out = out
      .split(/\n{2,}/)
      .map((para) => {
        let block = rewriteSecaraRingkasBlock(para);
        block = rewriteOrdinalOutlineToProse(block);
        block = rewriteNumberedOutlineToProse(block);
        if (/^\s*[-•*]\s+/m.test(block)) return rewriteMarkdownBulletsToProse(block);
        return block;
      })
      .join('\n\n');
  }
  out = out.replace(/\.\s+([a-z])/g, (_, c: string) => `. ${c.toUpperCase()}`);
  if (out.length > 0) {
    out = out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
}

/**
 * Founder Teaching-room / P.alt voice — must never appear on Users turns.
 * Distinct from student three-tier door offers (tier 2/3 opt-in).
 */
export function paragraphIsFounderTeachingVoiceLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (!t) return false;
  if (/\bP\.?\s*alt\b/i.test(t)) return true;
  if (/Adakah\s+ingin\s+saya\s+terangkan/i.test(t)) return true;
  if (/Atau\s+lebih\s+suka\s+saya\s+kongsikan/i.test(t)) return true;
  if (/\bAMA\s+124/i.test(t)) return true;
  if (/\bpola\s+AMA\b/i.test(t)) return true;
  if (/\bprinsip\s+AIDIL\b/i.test(t)) return true;
  if (/\blerai\s*\(\s*PL\s*\)/i.test(t)) return true;
  if (/digabung\s*\(\s*PG\s*\)/i.test(t)) return true;
  if (/\bproses\s+lerai\b/i.test(t) && /\b(?:PL|PG)\b/i.test(t)) return true;
  if (/\bkeseimbangan\s+tubuh,\s*tenaga,\s*dan\s+amanah/i.test(t)) return true;
  if (/\b(?:SuNom|NAPADU-\d|CgP|qadari)\b/i.test(t)) return true;
  if (/\bLeraian\s*\d/i.test(t)) return true;
  if (/\bDalam\s+AMA\b/i.test(t)) return true;
  return false;
}

/** "Secara ringkas:" + dash bullets — cold summary block. */
export function paragraphIsDashSummaryLeak(paragraph: string): boolean {
  const t = paragraph.trim();
  if (/^Secara ringkas:/i.test(t)) return true;
  const bullets = t.split('\n').filter((line) => /^\s*[-•*]\s+/.test(line));
  return bullets.length >= 2 && /\b(?:Jenis\s+\d|ringkas|summary)\b/i.test(t);
}

/** Universal voice paragraph strip — shared with output guard. */
export function paragraphShouldStripForUniversalVoice(
  paragraph: string,
  options: {
    faithOk: boolean;
    alamtologiOk: boolean;
    technicalKonvensionalDisplay?: boolean;
    accessibleHybridFormat?: boolean;
    preserveStructuredAnswer?: boolean;
  },
): boolean {
  if (options.preserveStructuredAnswer || options.technicalKonvensionalDisplay || options.accessibleHybridFormat) {
    if (paragraphIsMarkdownBulletForest(paragraph)) return false;
    if (paragraphIsNumberedSyllabusLeak(paragraph)) return false;
    if (/^#{1,6}\s+/m.test(paragraph.trim())) return false;
    if (paragraphHasMarkdownTable(paragraph)) return false;
  }
  if (paragraphIsEmojiOnlyOpener(paragraph)) return true;
  if (!options.technicalKonvensionalDisplay && paragraphIsPhilosophicalEssayLeak(paragraph)) return true;
  if (paragraphIsConstitutionalValuesEssayLeak(paragraph)) return true;
  if (paragraphIsDualLaneEssayLeak(paragraph)) return true;
  if (paragraphIsFounderTeachingVoiceLeak(paragraph)) return true;
  if (paragraphIsUniversalScholarDoorOffer(paragraph)) return false;
  if (!options.alamtologiOk && paragraphIsConstitutionalFrameworkLeak(paragraph)) return true;
  if (
    !options.faithOk
    && paragraphIsUnsolicitedFaithSermon(paragraph)
    && paragraphHasSubstantiveScienceAnchors(paragraph)
  ) {
    return false;
  }
  if (
    !options.faithOk
    && paragraphIsUnsolicitedTier1FaithWeave(paragraph)
    && paragraphHasSubstantiveScienceAnchors(paragraph)
  ) {
    return false;
  }
  if (!options.faithOk && paragraphIsUnsolicitedFaithSermon(paragraph)) return true;
  if (!options.faithOk && paragraphIsUnsolicitedTier1FaithWeave(paragraph)) return true;
  if (paragraphIsTutorPerformanceLeak(paragraph)) return true;
  if (paragraphIsCoachingScriptClosing(paragraph)) return true;
  if (paragraphIsOrdinalSyllabusLeak(paragraph) && !options.accessibleHybridFormat) return true;
  if (!options.accessibleHybridFormat && !options.technicalKonvensionalDisplay && !options.preserveStructuredAnswer) {
    if (paragraphIsMarkdownBulletForest(paragraph)) return true;
  }
  if (paragraphHasMarkdownTable(paragraph) && !options.preserveStructuredAnswer) return true;
  return false;
}

