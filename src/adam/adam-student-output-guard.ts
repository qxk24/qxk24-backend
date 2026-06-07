/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Output Guard
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-05
 * Updated     : 2026-06-06 — sync sanitize only; TRAA repair removed
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

const SCRIPTED_CLOSINGS = [
  /Saya\s+sedia\s+mendengar/i,
  /saya\s+boleh\s+bertanya\s+dengan\s+lembut/i,
  /Saya\s+ingin\s+bertanya\s+dengan\s+lembut/i,
  /Adakah\s+ada\s+saat-saat\s+di\s+mana/i,
  /Saya\s+sedia\s+duduk/i,
  /dalam\s+diam\s+yang\s+penuh\s+makna/i,
  /Apa\s+yang\s+paling\s+ingin\s+(?:kamu|anda)\s+/i,
  /kembangkan\s+daripada\s+jawapan/i,
];

const STUDENT_MATH_SLOT = '\x00STUDENT_MATH_';

function stashStudentMathBlocks(content: string): { text: string; slots: string[] } {
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

function restoreStudentMathBlocks(text: string, slots: string[]): string {
  return text.replace(
    new RegExp(`${STUDENT_MATH_SLOT}(\\d+)\x00`, 'g'),
    (_, index: string) => slots[Number(index)] ?? '',
  );
}

function inlineQuranAyat(text: string): string {
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

/** Sync format hygiene — no LLM, no TRAA surgery. */
export function sanitizeStudentOutputSync(text: string): string {
  const { text: stashed, slots } = stashStudentMathBlocks(text);

  let out = stashed
    .replace(/\s—\s/g, '. ')
    .replace(/—/g, ', ')
    .replace(/^#{1,6}\s+(.+)$/gm, '$1')
    .replace(/^\[Source:[^\]]*\]\s*$/gim, '')
    .replace(/^---+$/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/\bmemperkuat\b/gi, 'menguatkan')
    .replace(/\bistirehat\b/gi, 'rehat')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1');

  out = restoreStudentMathBlocks(out, slots);
  out = inlineQuranAyat(out);

  const paragraphs = out.split(/\n{2,}/);
  const kept: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if (SCRIPTED_CLOSINGS.some((re) => re.test(trimmed))) continue;
    if (/^\[Source:/i.test(trimmed)) continue;
    if (/^Maksudnya\s*:/i.test(trimmed)) continue;
    kept.push(trimmed);
  }

  return kept.join('\n\n').trim();
}

/** Post-stream hook — sync sanitize only. Layer 5 governs voice at generation. */
export async function repairStudentOutputLeak(
  text: string,
  _studentMessage: string,
): Promise<string> {
  const synced = sanitizeStudentOutputSync(text);
  return synced.length > 0 ? synced : text.trim();
}
