/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Site Helper Service
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Lightweight public FAQ — alamtologi.com marketing helper.
 * Not constitutional teaching chat; no brain transform or web search.
 */

import { getFastModel } from '../config/llm-models';
import { friendlyLlmError, isLlmConfigured, llmCompleteUserPrompt } from '../llm/llm-client';

export interface SiteHelperTurn {
  role:    'user' | 'assistant';
  content: string;
}

export interface SiteHelperChatInput {
  message: string;
  history?: SiteHelperTurn[];
}

const SITE_HELPER_MAX_HISTORY = 8;
const SITE_HELPER_MAX_MESSAGE = 2_000;
const SITE_HELPER_MAX_TOKENS = 1_024;

const SITE_HELPER_SYSTEM = `
You are ADAM — the public site guide for qxk24.com (not the full teaching ADAM chat).

ROLE:
- Answer questions about ADAM, Alamtologi, registration, plans, and how the platform works.
- Warm, clear, concise English. Short paragraphs (2–4 sentences). No markdown headers or bullet walls unless comparing plans.
- You are a helpful guide — not the constitutional teacher in /adam/chat.

SCOPE — answer from this knowledge:
- Alamtologi: "The Universal Science" — a unified framework for understanding the natural world and human systems (seven principles internally; do not lecture on principles unless asked).
- ADAM: constitutional AI teacher on QXK24 kernel (ERA_1), created by P.alt Masa Bayu (Malaysia). Full teaching requires a free account at /register or /adam/chat.
- ADAM Learn (umum lane): Alamtologi journey, group + private Learn chat.
- ADAM Tutor (pelajar lane): school/university subjects, zero-answer tutoring style — separate from Learn.
- Guest try: 3 lifetime questions without register; free registered tier has rolling limits; Premium/Profesional/Enterprise on /pricing/packages.
- ADAM is not medical, legal, or financial advice — consult qualified humans for binding decisions.
- ADAM does not invent citations; full ADAM uses verified facts when evidence matters.
- Support: support@alamtologi.com for account deletion.
- Founder: P.alt Masa Bayu, Malaysia.

OUT OF SCOPE:
- Deep teaching, tafsir, personal counselling, homework solutions — say: "For that, register free and open ADAM chat at qxk24.com/adam/chat."
- Do not claim to be in a live teaching session with the Founder.
- Do not open with Bismillah unless the user writes in Arabic/Islamic greeting first.

LINKS (plain text ok):
- Register: qxk24.com/register
- Pricing: qxk24.com/pricing/packages
- Full ADAM: qxk24.com/adam/chat
- FAQ: qxk24.com/faq
`.trim();

function trimHistory(history: SiteHelperTurn[] | undefined): SiteHelperTurn[] {
  if (!history?.length) return [];
  return history
    .filter((t) => t.content?.trim() && (t.role === 'user' || t.role === 'assistant'))
    .slice(-SITE_HELPER_MAX_HISTORY)
    .map((t) => ({
      role:    t.role,
      content: t.content.trim().slice(0, 1_200),
    }));
}

function buildUserPrompt(message: string, history: SiteHelperTurn[]): string {
  const lines: string[] = [];
  if (history.length) {
    lines.push('Recent conversation:');
    for (const turn of history) {
      lines.push(`${turn.role === 'user' ? 'Visitor' : 'ADAM'}: ${turn.content}`);
    }
    lines.push('');
  }
  lines.push(`Visitor: ${message}`);
  lines.push('');
  lines.push('Reply as ADAM site guide (English, concise):');
  return lines.join('\n');
}

export async function runSiteHelperChat(
  input: SiteHelperChatInput,
): Promise<{ reply: string }> {
  const message = input.message.trim().slice(0, SITE_HELPER_MAX_MESSAGE);
  if (!message) {
    throw new Error('Message is required.');
  }

  if (!isLlmConfigured()) {
    return {
      reply:
        'ADAM site guide is temporarily unavailable. Browse qxk24.com/pricing/packages or email support@alamtologi.com.',
    };
  }

  const history = trimHistory(input.history);
  const userPrompt = buildUserPrompt(message, history);

  try {
    const reply = await llmCompleteUserPrompt(
      SITE_HELPER_SYSTEM,
      userPrompt,
      getFastModel(),
      SITE_HELPER_MAX_TOKENS,
    );
    return { reply: reply.trim() || 'I could not form a reply — please try again or visit qxk24.com/faq.' };
  } catch (err) {
    console.error('[SiteHelper]', err);
    return { reply: friendlyLlmError(err) };
  }
}

export const SITE_HELPER_GREETING =
  'Hello — I\'m ADAM, your guide on qxk24.com. Ask me about ADAM, Alamtologi, registration, or our plans. For full teaching chat, register free and open ADAM at qxk24.com/adam/chat.';
