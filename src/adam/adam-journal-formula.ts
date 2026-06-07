/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Journal Formula Tags
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * [FORMULA] / [INLINE_FORMULA] / [DISPLAY_FORMULA] avoid $ conflicts during writes.
 */

/** Prompt block — ADAM wraps math in [FORMULA]…[/FORMULA], not raw $. */
export const ADAM_JOURNAL_FORMULA_LAW = `
FORMULA RENDERING (mandatory for all journals):
- Wrap every mathematical expression in [FORMULA]...[/FORMULA] tags.
  Example: [FORMULA]x = \\frac{m}{t}[/FORMULA]  [FORMULA]E = mc^2[/FORMULA]
- Inside [FORMULA] tags write LaTeX only — NEVER nest raw $ delimiters (wrong: [FORMULA]$x = m/t$[/FORMULA])
- Prefer \\frac{m}{t} over slash m/t — slash reads as prose, not mathematics
- Constitutional x = m/t is ALWAYS inline in prose — never $$ display on its own line
- Do NOT use raw dollar signs ($) outside [FORMULA] tags — they break parsers during long writes.
- Arabic Quranic rasm (Uthmani) stays as plain UTF-8 text — no escaping needed.
- Hukum Z tables: use markdown tables; put each cell formula in [FORMULA] tags when needed.

FORMULA RULE — STRICT:
Only use LaTeX ($...$) or [FORMULA] tags for genuine mathematical equations
such as E=mc², x=m/t, H=Σ(pᵢ×Qᵢ).

Statistics and percentage statements must be written in plain prose:
  CORRECT: "Science understands only 5% of the universe."
  WRONG:   $\\text{Science understands} = 5\\%$

Never wrap a prose sentence inside a LaTeX formula tag.

ABSOLUTE PROHIBITION — never write percentage statistics
or comparative statements as LaTeX formulas, even if they
contain = signs.

WRONG:
$$\\text{Science understands} = 5\\% \\text{ of the universe}$$

CORRECT:
Science understands only 5% of the universe.
Science cannot explain 95% of the universe.

The = sign in a prose comparison is not a mathematical
operator. It is not a formula. Write it as a sentence.
`.trim();

/** Movement 4 (Q) — dedicated Quran section for the locked topic; separate from Alamtologi. */
export const ADAM_JOURNAL_QURAN_SECTION_LAW = `
QURAN SECTION (Q) — DEDICATED MOVEMENT (mandatory; separate from Alamtologi):
Movement 4 / Quran section is ONLY for Al-Quran — do NOT teach Alamtologi syllabus, principles,
scientific formulas, or discipline structure here. That belongs in Movement 5.

Requirements:
- Select ayat from [QURAN CORPUS] that speak directly to the locked journal topic and subfield
- Present Uthmani rasm in UTF-8 Arabic, then faithful translation in prose (cite Surah:Ayah)
- Weave 2–4 ayat thematically — not a disconnected list; explain why each ayat addresses this topic
- Reverent quiet authority — gift offered, not argument; not defensive or apologetic
- NO tafsir in brackets, NO Alamtologi principle names, NO [FORMULA] tags in this section
- Do NOT preview or repeat Movement 5 (Alamtologi framework) content here
`.trim();

/** Movement 5 (C) — Alamtologi discipline syllabus + scientific formula; no Quran ayat here. */
export const ADAM_JOURNAL_ALAMTOLOGI_SCIENTIFIC_FORMULA_LAW = `
ALAMTOLOGI FRAMEWORK SECTION (C) — MOVEMENT 5 ONLY (mandatory):
Movement 5 is the Alamtologi discipline and syllabus for this topic — full constitutional framework.
Do NOT cite Quran ayat or Arabic rasm here — that belongs in Movement 4 (Quran section).

Every Movement 5 section MUST include at least ONE genuine scientific formula appropriate to the
locked journal topic and discipline.

Choose the domain that fits the subject:
- Mathematics — e.g. [FORMULA]x = \\frac{m}{t}[/FORMULA], [FORMULA]E = mc^2[/FORMULA], [FORMULA]a^2 + b^2 = c^2[/FORMULA]
- Physics — e.g. [FORMULA]F = ma[/FORMULA], [FORMULA]E = hf[/FORMULA], [FORMULA]PV = nRT[/FORMULA]
- Chemistry — e.g. [FORMULA]2H_2 + O_2 \\rightarrow 2H_2O[/FORMULA], [FORMULA]pH = -\\log_{10}[H^+][/FORMULA]
- Biology — e.g. [FORMULA]r = \\frac{dN}{dt}[/FORMULA], [FORMULA]P = (T - H)/T[/FORMULA] (Hardy–Weinberg)

Rules:
- Teach the Alamtologi lens for this discipline — principles, structure, syllabus depth P.alt established
- The formula must connect the Alamtologi lens to the topic — not a decorative unrelated equation
- Introduce the formula in prose: what each symbol means, why it matters, how Alamtologi reframes it
- Wrap every equation in [FORMULA]...[/FORMULA] tags (never raw $ or prose disguised as math)
- At least one [FORMULA] block is REQUIRED in Movement 5 — a journal without it is incomplete
`.trim();

const EXISTING_TAG_RE =
  /(\[FORMULA\][\s\S]*?\[\/FORMULA\]|\[DISPLAY_FORMULA\][\s\S]*?\[\/DISPLAY_FORMULA\]|\[INLINE_FORMULA\][\s\S]*?\[\/INLINE_FORMULA\])/gi;

const DISPLAY_FORMULA_RE = /\[DISPLAY_FORMULA\]([\s\S]*?)\[\/DISPLAY_FORMULA\]/gi;
const INLINE_FORMULA_RE = /\[INLINE_FORMULA\]([\s\S]*?)\[\/INLINE_FORMULA\]/gi;
const FORMULA_TAG_RE = /\[FORMULA\]([\s\S]*?)\[\/FORMULA\]/gi;

/** Canonical ratio — slash form reads as prose serif; render as stacked fraction. */
export function repairConstitutionalFormula(inner: string): string {
  const t = inner.trim();
  if (/^x\s*=\s*m\s*\/\s*t$/i.test(t)) {
    return String.raw`x = \frac{m}{t}`;
  }
  return t;
}

/** Strip nested $ delimiters ADAM sometimes puts inside [FORMULA] tags. */
export function cleanFormulaInner(inner: string): string {
  let t = inner.trim();
  if (t.startsWith('$$') && t.endsWith('$$') && t.length > 4) {
    t = t.slice(2, -2).trim();
  } else if (
    t.startsWith('$')
    && t.endsWith('$')
    && t.length > 2
    && !t.slice(1, -1).includes('$')
  ) {
    t = t.slice(1, -1).trim();
  }
  return repairConstitutionalFormula(t);
}

function protectExistingFormulaTags(content: string): { text: string; slots: string[] } {
  const slots: string[] = [];
  const text = content.replace(EXISTING_TAG_RE, (match) => {
    const key = slots.length;
    slots.push(match);
    return `\x00FORMULA_SLOT_${key}\x00`;
  });
  return { text, slots };
}

function restoreFormulaSlots(text: string, slots: string[]): string {
  return text.replace(
    /\x00FORMULA_SLOT_(\d+)\x00/g,
    (_, index: string) => slots[Number(index)] ?? '',
  );
}

function stripProseLatexInner(inner: string): string {
  return inner
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\mathrm\{([^}]*)\}/g, '$1')
    .replace(/\\%/g, '%')
    .replace(/\\/g, '')
    .trim();
}

function isProseDisguisedAsLatex(inner: string): boolean {
  return /\\text\{|\\mathrm\{|understands|cannot explain|percent|universe|conspiracy|science/i.test(
    inner,
  );
}

function demoteStoredFormulaTags(content: string): string {
  return content
    .replace(/\[DISPLAY_FORMULA\]([\s\S]*?)\[\/DISPLAY_FORMULA\]/gi, (match, inner: string) => {
      if (!isProseDisguisedAsLatex(inner)) return match;
      return stripProseLatexInner(inner);
    })
    .replace(/\[INLINE_FORMULA\]([\s\S]*?)\[\/INLINE_FORMULA\]/gi, (match, inner: string) => {
      if (!isProseDisguisedAsLatex(inner)) return match;
      return stripProseLatexInner(inner);
    });
}

/** Demote prose/statistics disguised as inline or display LaTeX before escape or KaTeX. */
export function demoteProseLatexFormulas(content: string): string {
  if (!content) return '';

  // Display formulas containing \\text{} — prose, not math
  let demoted = content.replace(
    /\$\$[^$]*\\text\{[^}]*\}[^$]*\$\$/g,
    (match) => stripProseLatexInner(match.replace(/\$\$/g, '')),
  );

  // Inline formulas containing \\text{}
  demoted = demoted.replace(
    /\$[^$\n]*\\text\{[^}]*\}[^$\n]*\$/g,
    (match) => stripProseLatexInner(match.replace(/\$/g, '')),
  );

  // Legacy single-\\text{ at start patterns
  demoted = demoted.replace(
    /\$\\text\{([^}]+)\}\s*=\s*([^$]+?)\$/g,
    (_, label: string, value: string) =>
      `${label.trim()} = ${value.replace(/\\%/g, '%').trim()}`,
  );

  demoted = demoted.replace(/\$([^$\n]+?)\$/g, (match, inner: string) => {
    const trimmed = inner.trim();
    if (trimmed.length < 36) return match;
    if (isProseDisguisedAsLatex(trimmed)) {
      return stripProseLatexInner(trimmed);
    }
    return match;
  });

  demoted = demoteStoredFormulaTags(demoted);

  return demoted;
}

/** Escape raw $ / $$ before MongoDB storage — preserves existing formula tags. */
export function prepareContentForStorage(content: string): string {
  if (!content) return '';

  const { text: protectedText, slots } = protectExistingFormulaTags(content.normalize('NFC'));

  let escaped = protectedText.replace(
    /\$\$([\s\S]+?)\$\$/g,
    (_, formula: string) => `[DISPLAY_FORMULA]${formula.trim()}[/DISPLAY_FORMULA]`,
  );

  escaped = escaped.replace(
    /\$([^$\n]+?)\$/g,
    (_, formula: string) => `[INLINE_FORMULA]${formula.trim()}[/INLINE_FORMULA]`,
  );

  escaped = restoreFormulaSlots(escaped, slots);
  return Buffer.from(escaped, 'utf8').toString('utf8');
}

/** Restore formula tags to KaTeX delimiters for display. */
export function renderFormulas(content: string): string {
  if (!content) return '';

  let rendered = content.replace(
    /\[DISPLAY_FORMULA\]([\s\S]+?)\[\/DISPLAY_FORMULA\]/g,
    (_, formula: string) => `$$${cleanFormulaInner(formula)}$$`,
  );

  rendered = rendered.replace(
    /\[INLINE_FORMULA\]([\s\S]+?)\[\/INLINE_FORMULA\]/g,
    (_, formula: string) => `$${cleanFormulaInner(formula)}$`,
  );

  rendered = rendered.replace(FORMULA_TAG_RE, (_, inner: string) => `$${cleanFormulaInner(inner)}$`);
  rendered = expandParenLatexForRender(rendered);

  return rendered;
}

/** Convert stored formula tags to $…$ / $$…$$ for KaTeX/markdown renderers. */
export function expandFormulaTagsToLatex(text: string): string {
  return renderFormulas(text);
}

/** Normalise legacy \\(...\\) storage back to $ for render. */
export function expandParenLatexForRender(text: string): string {
  return text.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner: string) => `$${inner.trim()}$`);
}

/** @deprecated Use prepareContentForStorage — kept for section draft imports. */
export function normalizeJournalTextForStorage(content: string): string {
  return prepareContentForStorage(content.trim());
}

/** Display pipeline: demote prose-as-math, escape, restore for KaTeX. */
export function prepareJournalProseForDisplay(content: string): string {
  const demoted = demoteProseLatexFormulas(content);
  console.log('[FORMULA-DEMOTION]', demoted.substring(0, 200));
  const stored = prepareContentForStorage(demoted);
  return renderFormulas(stored);
}

/** Alias — same as prepareContentForStorage. */
export const prepareJournalTextForStorage = prepareContentForStorage;
