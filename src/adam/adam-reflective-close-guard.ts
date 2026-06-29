/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Reflective Close Guard
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Enforces Explain-Back Law CLOSE (L5 tamparan jiwa): the reflective turn
 * ends with EXACTLY ONE organic question — never a cold two-path option menu.
 * The model sometimes emits a recurring scaffold:
 *
 *   <Name>, izinkan saya bertanya dengan lembut:
 *   🔹 <reflective life-application question>?
 *   🔷 Atau adakah anda ingin kita baca ayat ini bersama-sama, per kata …?
 *
 * Reused each turn with only the keyword swapped, it reads as a robotic,
 * repeated template. This guard collapses that emoji menu to the single
 * primary question. Emoji-diamond bullets never appear in legitimate
 * flowing prose, so the match is narrow and safe.
 */

/** Geometric/emoji bullet markers used by the forbidden option-menu scaffold. */
const MENU_BULLET_RE =
  /^[ \t]*(?:[*_]{0,2})[ \t]*(?:🔹|🔷|🔶|🔸|🔺|🔻|🟦|🟧|🟪|🟥|🟩|🟢|🔵|🟠|◆|◇|◈|❖|♦|♢|➤|➣|▶️|▶|▸|➡️|➜)[ \t]+/u;

/** Same marker, multiline — used only to detect presence anywhere in the text. */
const MENU_BULLET_ANYWHERE_RE = new RegExp(MENU_BULLET_RE.source, 'mu');

/** Secondary "or …" branch of the menu — the part that makes the close a menu. */
const ALT_OPTION_RE = /^(?:atau)\b[\s,]*/i;

function stripMenuMarker(line: string): string {
  return line.replace(MENU_BULLET_RE, '').trim();
}

/**
 * Collapse a trailing emoji option-menu close into one reflective question.
 * No-op when the output has no emoji-bullet close.
 */
export function collapseReflectiveOptionMenuClose(text: string): string {
  if (!text || !MENU_BULLET_ANYWHERE_RE.test(text)) return text;

  const lines = text.replace(/\r\n/g, '\n').split('\n');

  // Find the last emoji-bullet line; require only blank lines after it so we
  // act strictly on the closing block, never on mid-body content.
  let lastMenu = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (MENU_BULLET_RE.test(lines[i]!)) { lastMenu = i; break; }
    if (lines[i]!.trim() !== '') return text; // substantive content after menu → leave alone
  }
  if (lastMenu === -1) return text;

  // Walk back to the start of the menu run (blank lines allowed between bullets).
  let firstMenu = lastMenu;
  for (let i = lastMenu - 1; i >= 0; i--) {
    const t = lines[i]!.trim();
    if (MENU_BULLET_RE.test(lines[i]!)) { firstMenu = i; continue; }
    if (t === '') continue;
    break;
  }

  // Collect the bulleted questions in order.
  const questions: string[] = [];
  for (let i = firstMenu; i <= lastMenu; i++) {
    if (MENU_BULLET_RE.test(lines[i]!)) {
      const q = stripMenuMarker(lines[i]!);
      if (q) questions.push(q);
    }
  }
  if (questions.length === 0) return text;

  // Prefer the primary reflective question; drop the "Atau …" alternative path.
  let kept = questions.find((q) => !ALT_OPTION_RE.test(q));
  if (!kept) kept = questions[0]!.replace(ALT_OPTION_RE, '');
  kept = kept.replace(ALT_OPTION_RE, (m) => (questions.length === 1 ? '' : m)).trim();
  // Capitalise if we stripped a leading "atau " and left a lowercase word.
  if (kept && /^[a-z]/.test(kept)) kept = kept.charAt(0).toUpperCase() + kept.slice(1);

  // A lead-in line ending with ":" right before the menu becomes the carrier.
  let leadIdx = firstMenu - 1;
  while (leadIdx >= 0 && lines[leadIdx]!.trim() === '') leadIdx--;
  const lead = leadIdx >= 0 ? lines[leadIdx]!.trim() : '';
  const hasLeadIn = lead.endsWith(':');

  const head = hasLeadIn ? lines.slice(0, leadIdx) : lines.slice(0, firstMenu);
  const merged = hasLeadIn ? `${lead} ${kept}`.replace(/\s+/g, ' ').trim() : kept;

  const rebuilt = [...head.map((l) => l), merged]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return rebuilt;
}
