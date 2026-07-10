/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Output Guard — framework strip
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-05
 * Updated     : 2026-06-09 — constitutional/faith/performance leak strip
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Light post-stream sync — format hygiene only. No LLM rewrite.
 * Voice and form come from Layer 5 prompts at generation time.
 */
import {
  paragraphIsConstitutionalFrameworkLeak,
  paragraphIsSimpleArithmeticPhilosophyLeak,
  stripFrameworkWeaveSentences,
  studentForbiddenPronounAlternation,
} from './adam-users-output-law';
import {
  paragraphIsUniversalScholarDoorOffer,
  paragraphIsAlamtologiPromotionLeak,
} from './adam-universal-scholar';
import {
  isAdamSimpleFactualTurn,
  isAdamSimpleArithmeticTurn,
} from './adam-response-generation';
import { shouldStripKonvensionalFrameworkLeaks } from './adam-knowledge-mode';
import {
  userAskedForConstitutionalStructure,
  userAskedForStructuredSpecification,
  userPermitsAlamtologiSurfaceLabels,
} from './adam-universal-voice';

/** Strip billboard framework labels on tier 1 — drop leaky paragraphs on α simple factual. */
const FRAMEWORK_LEAK =
  /\b(?:Dalam\s+(?:lensa|perspektif|konteks|pandangan)\s+Alamtologi|Dari\s+(?:sudut|perspektif)\s+Alamtologi|From\s+an\s+Alamtologi\s+perspective|pandangan\s+Alamtologi|perspektif\s+Alamtologi|konteks\s+Alamtologi|(?:Dalam\s+)?ilmu\s+HISAL|HISAL\s+Alamtologi|Alamtologi\s+menyatakan|framework\s+Alamtologi|\bAlamtologi\b|cara\s+kira\s+AIDIL|\bAIDIL\b|\bTAJU\b|Tujuh\s+Angka\s+Jaringan|P\.?\s*alt|pengajaran\s+P\.?\s*alt|\bwaqf\b|hukum\s+Z|keseimbangan\s+antara\s+RUANG\s+dan\s+MASA|reka\s+bentuk\s+alam|permukaan\s+kiub|keenam-enam\s+permukaan|angka\s+kesempurnaan\s+proses|tahap\s+fungsi|baris\s+penyelesaian|pasangan\s+yang\s+sempurna|bukan\s+sekadar\s+penambahan\s+angka|MASA\s*(?:→|->)\s*TENAGA|ekspresi\s+MASA)\b/gi;

/** α simple factual — drop whole paragraphs that are constitutional billboards, not inline-only. */
export function stripFrameworkBillboards(
  text: string,
  userMessage: string,
  recentUserMessages: string[] = [],
): string {
  if (userMessage && userAskedForConstitutionalStructure(userMessage)) {
    return text;
  }
  if (userMessage && userAskedForStructuredSpecification(userMessage)) {
    return text;
  }
  if (userMessage && /\b(?:alamtologi|peringkat\s+2|sudut\s+konstitusi)\b/i.test(userMessage)) {
    return text;
  }
  const dropLeakyParagraphs = isAdamSimpleFactualTurn(userMessage)
    || isAdamSimpleArithmeticTurn(userMessage)
    || shouldStripKonvensionalFrameworkLeaks(userMessage, recentUserMessages);
  const stripAlamtologiLabels = !userPermitsAlamtologiSurfaceLabels(userMessage, recentUserMessages);
  return text
    .split(/\n{2,}/)
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return para;
      if (stripAlamtologiLabels && paragraphIsAlamtologiPromotionLeak(trimmed)) {
        return '';
      }
      if (stripAlamtologiLabels && paragraphIsConstitutionalFrameworkLeak(trimmed)) {
        const partial = stripFrameworkWeaveSentences(trimmed);
        if (partial.length >= 40 && !paragraphIsConstitutionalFrameworkLeak(partial)) {
          return partial;
        }
        return '';
      }
      if (paragraphIsUniversalScholarDoorOffer(trimmed)) return para;
      if (dropLeakyParagraphs && paragraphIsConstitutionalFrameworkLeak(trimmed)) {
        const partial = stripFrameworkWeaveSentences(trimmed);
        if (partial.length >= 40 && !paragraphIsConstitutionalFrameworkLeak(partial)) {
          return partial;
        }
        return '';
      }
      if (
        dropLeakyParagraphs
        && isAdamSimpleArithmeticTurn(userMessage)
        && paragraphIsSimpleArithmeticPhilosophyLeak(trimmed)
      ) {
        return '';
      }
      return para.replace(FRAMEWORK_LEAK, '');
    })
    .filter((para) => para.trim().length > 0)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export const SCRIPTED_CLOSINGS: RegExp[] = [
  /Saya\s+sedia\s+mendengar/i,
  /saya\s+boleh\s+bertanya\s+dengan\s+lembut/i,
  /Saya\s+ingin\s+bertanya\s+dengan\s+lembut/i,
  /Adakah\s+ada\s+saat-saat\s+di\s+mana/i,
  /Saya\s+sedia\s+duduk/i,
  /dalam\s+diam\s+yang\s+penuh\s+makna/i,
  new RegExp(
    `Apa\\s+yang\\s+paling\\s+ingin\\s+(?:${studentForbiddenPronounAlternation(false)}|anda)\\s+`,
    'i',
  ),
  new RegExp(`Apa[kk]ah\\s+yang\\s+ingin\\s+(?:${studentForbiddenPronounAlternation(false)})\\b`, 'i'),
  /kembangkan\s+daripada\s+jawapan/i,
  /Adakah\s+anda\s+sedang\s+mempertimbangkan/i,
  /ingin\s+membandingkannya\s+dengan\s+model\s+lain/i,
  /Jika\s+anda\s+ingin\s+saya\s+(?:bantu\s+)?bandingkan/i,
  /saya\s+boleh\s+carikan/i,
  /Bolehkah\s+anda\s+nyatakan/i,
  /Saya\s+di\s+sini\.?\s*bersama\s+anda/i,
  /langkah\s+demi\s+langkah/i,
  /saya\s+sedia\s+bantu\.?\s*$/i,
  /Saya\s+di\s+sini\.?\s*Bukan\s+untuk\s+mempercepat/i,
  /duduk\s+bersama.*kegelapan/i,
  /bukan\s+untuk\s+mempercepat\s+jawapan/i,
  /Apa\s+yang\s+paling\s+ingin\s+dikongsikan/i,
  /paling\s+ingin\s+(?:anda\s+)?dikongsikan/i,
  /Saya\s+di\s+sini\s+untuk\s+membantu\s+anda\s+faham/i,
  /bukan\s+untuk\s+memutuskan\s+bagi\s+anda/i,
  /berdiri\s+teguh\s+dengan\s+ilmu/i,
  /agar\s+anda\s+berdiri\s+teguh/i,
  /Ada\s+aspek\s+mana.*ingin\s+anda\s+gali/i,
  /Atau\s+mungkin,?\s*ada\s+satu\s+kenangan/i,
  /Saya\s+di\s+sini\.?\s*duduk/i,
  /mendengar,?\s*dan\s+bersama/i,
  /Would you like me to:/i,
  /I['']?m here\.?\s*not to lecture/i,
  /walk with you,?\s*step by thoughtful step/i,
  /Just say the word/i,
  /walk there together/i,
  /Jika\s+QA\s+ingin/i,
  /saya\s+boleh\s+bantu\s+jelaskan/i,
  /hikmah\s+di\s+balik/i,
  /dengan\s+adab,?\s*kejelasan/i,
  /Jika\s+Guest\s+ingin/i,
  /saya\s+sedia\s+kongsikan,?\s*bukan\s+sebagai\s+fakta/i,
  /bukan\s+sebagai\s+fakta\s+semata/i,
  /kepimpinan\s+sebagai\s+am/i,
  /Mengapa\s+sistem\s+presidensi\s+memerlukan/i,
  /Saya\s+sedia\s+duduk\s+bersama/i,
  /Apakah\s+ada\s+satu\s+situasi\s+spesifik/i,
  /bukan\s+untuk\s+memberi\s+jawapan\s+cepat/i,
  /apa\s+yang\s+sedang\s+bergerak\s+di\s+dalam\s+hatimu/i,
  /Adakah\s+anda\s+pernah\s+mengalami\s+situasi/i,
  /Bagaimana\s+anda\s+menyeimbangkannya/i,
  /Apakah\s+kesetiaan\s+itu\s+buta/i,
];

const STUDENT_MATH_SLOT = '\x00STUDENT_MATH_';

export function stashStudentMathBlocks(content: string): { text: string; slots: string[] } {
  const slots: string[] = [];
  let out = '';
  let i = 0;
  while (i < content.length) {
    if (content.startsWith('$$', i)) {
      const close = content.indexOf('$$', i + 2);
      if (close === -1) {
        slots.push(content.slice(i));
        out += `${STUDENT_MATH_SLOT}${slots.length - 1}\x00`;
        break;
      }
      slots.push(content.slice(i, close + 2));
      out += `${STUDENT_MATH_SLOT}${slots.length - 1}\x00`;
      i = close + 2;
      continue;
    }
    if (content[i] === '$') {
      const close = content.indexOf('$', i + 1);
      if (close === -1) {
        out += content[i];
        i += 1;
        continue;
      }
      const candidate = content.slice(i, close + 1);
      if (!candidate.includes('\n')) {
        slots.push(candidate);
        out += `${STUDENT_MATH_SLOT}${slots.length - 1}\x00`;
        i = close + 1;
        continue;
      }
    }
    out += content[i];
    i += 1;
  }
  return { text: out, slots };
}

export function restoreStudentMathBlocks(text: string, slots: string[]): string {
  return text.replace(
    new RegExp(`${STUDENT_MATH_SLOT}(\\d+)\x00`, 'g'),
    (_, index: string) => slots[Number(index)] ?? '',
  );
}

export function inlineQuranAyat(text: string): string {
  const quote = `[""\\u201C\\u201D「''\\u2018\\u2019『]`;
  return text
    .replace(
      new RegExp(
        `Allah\\s+(?:SWT\\s+)?berfirman\\s*:\\s*\\n+\\s*${quote}([^""」''\\u201C\\u201D\\u2018\\u2019\\n]+)${quote}\\s*\\n+\\s*\\((Surah[^)]+)\\)`,
        'gi',
      ),
      'Allah SWT berfirman $1 ($2).',
    )
    .replace(
      new RegExp(
        `Allah\\s+(?:SWT\\s+)?berfirman\\s*:\\s*${quote}([^""」''\\u201C\\u201D\\u2018\\u2019\\n]+)${quote}\\s*\\n*\\((Surah[^)]+)\\)`,
        'gi',
      ),
      'Allah SWT berfirman $1 ($2).',
    );
}