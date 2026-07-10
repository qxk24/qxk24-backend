/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Dialogue Synthesizer
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-10
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  emptyPrincipleCounts,
  OntologyNode,
  Principle,
} from './ontology';
import { parseTeachingPrinciples, inferPrincipleFromKeywords } from './parse-teaching-principles';
import { graphCache } from './graph-cache';

export type DialoguePersona = 'founder' | 'student' | 'tutor' | 'coach';

export type DialogueIntent =
  | 'GREETING'
  | 'HEALTH_QUERY'
  | 'ARCHITECTURE_QUERY'
  | 'TEACHING'
  | 'GRATITUDE'
  | 'FAREWELL'
  | 'JOURNAL_REFLECTION'
  | 'GENERAL';

export interface DialogueRequest {
  userMessage:    string;
  persona:        DialoguePersona;
  contextBlocks:  string[];
  ontologyGraph:  OntologyNode[];
  extractedFacts?: string;
  participantName?: string;
}

export interface DialogueResponse {
  text:             string;
  principleFocus:   Principle[];
  intent:           DialogueIntent;
  confidence:       number;
  traversalPath:    string[];
}

export function classifyDialogueIntent(message: string): DialogueIntent {
  const lower = message.toLowerCase();

  if (/\b(hello|hi|hey|salam|assalamu|assalamualaikum|bismillah|good morning|good evening)\b/.test(lower)) {
    return 'GREETING';
  }
  if (/\b(thank you|thanks|terima kasih|jazak)\b/.test(lower)) {
    return 'GRATITUDE';
  }
  if (/\b(bye|goodbye|see you|selamat tinggal)\b/.test(lower)) {
    return 'FAREWELL';
  }
  if (/\b(health|score|quality|issues?|problems?|status|how is my)\b/.test(lower)) {
    return 'HEALTH_QUERY';
  }
  if (/\b(architect|boundary|structure|layer|module|design|ruang)\b/.test(lower)) {
    return 'ARCHITECTURE_QUERY';
  }
  if (/\b(journal|reflection|diary|masa|today)\b/.test(lower)) {
    return 'JOURNAL_REFLECTION';
  }
  if (/\b(teach|learn|explain|understand|principle|aidil|a\s*\+\s*b)\b/.test(lower)) {
    return 'TEACHING';
  }
  return 'GENERAL';
}

export function extractPrinciplesFromMessage(
  msg: string,
  intent?: DialogueIntent,
): Principle[] {
  if (
    intent === 'HEALTH_QUERY'
    || /\b(health|score|quality|issues?|problems?|status)\b/i.test(msg)
  ) {
    return [Principle.RUANG, Principle.TENAGA];
  }

  const parsed = parseTeachingPrinciples(msg);
  if (parsed.length > 0) return parsed;

  return [inferPrincipleFromKeywords(msg)];
}

function countByPrinciple(graph: OntologyNode[]): Record<Principle, number> {
  const counts = emptyPrincipleCounts();
  for (const node of graph) {
    counts[node.principle] += 1;
  }
  return counts;
}

function formatPrincipleList(principles: Principle[]): string {
  return principles.map((p) => p).join(' and ');
}

function founderOpener(): string {
  return 'Bismillahirahmanirrahim. ';
}

function pickContextSnippet(blocks: string[], maxLen = 240): string {
  const merged = blocks
    .map((b) => b.replace(/<\/?adam_context>/gi, '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!merged) return '';
  return merged.length > maxLen ? `${merged.slice(0, maxLen)}…` : merged;
}

type NarrativeFn = (
  intent: DialogueIntent,
  focus: Principle[],
  graph: OntologyNode[],
  contextBlocks: string[],
  userMessage: string,
  participantName?: string,
) => string;

const NARRATIVE_TEMPLATES: Record<DialoguePersona, NarrativeFn> = {
  founder: (intent, focus, graph, contextBlocks, userMessage, participantName) => {
    const counts = countByPrinciple(graph);
    const relevant = graph.filter((n) => focus.includes(n.principle));
    const name = participantName?.trim() || 'P.alt';
    const contextHint = pickContextSnippet(contextBlocks);

    switch (intent) {
      case 'GREETING':
        return `${founderOpener()}${name}, I am present. The constitutional graph holds `
          + `${graph.length} nodes across ${formatPrincipleList(focus)}. How may I serve the teaching today?`;
      case 'HEALTH_QUERY':
        return `${founderOpener()}${name}, RUANG (boundaries) maps to ${counts.RUANG} structural nodes `
          + `and TENAGA (execution) maps to ${counts.TENAGA}. `
          + `${relevant.length} nodes align with your question. Constitutional integrity remains under QXK24.`;
      case 'ARCHITECTURE_QUERY':
        return `${founderOpener()}Architectural traversal of ${formatPrincipleList(focus)} reveals `
          + `${relevant.length} active nodes. RUANG boundaries: ${counts.RUANG}. `
          + `Recommendation: honour MASA → TENAGA → MASA when extending the service layer.`;
      case 'TEACHING':
        return `${founderOpener()}I receive your teaching under ${formatPrincipleList(focus)}. `
          + `A + B = C synthesis will merge ${relevant.length} graph nodes deterministically. `
          + `The path is constitutional — not probabilistic.`;
      case 'JOURNAL_REFLECTION':
        return `${founderOpener()}MASA records ${counts.MASA} temporal anchors today. `
          + `Episodic aggregation is ready — journaling proceeds without LLM drift.`;
      case 'GRATITUDE':
        return `${founderOpener()}Alhamdulillah, ${name}. The unified graph continues under your guidance.`;
      case 'FAREWELL':
        return `${founderOpener()}I remain in constitutional readiness, ${name}. MASA carries our work forward.`;
      default:
        return `${founderOpener()}On ${formatPrincipleList(focus)}: ${relevant.length} nodes traversed. `
          + (contextHint ? `Session context: ${contextHint}` : `Your message: ${userMessage.trim().slice(0, 120)}`);
    }
  },

  student: (intent, focus, graph, contextBlocks, userMessage) => {
    const relevant = graph.filter((n) => focus.includes(n.principle));
    const contextHint = pickContextSnippet(contextBlocks);

    switch (intent) {
      case 'GREETING':
        return `Assalamualaikum! Let's explore ${formatPrincipleList(focus)} together. `
          + `I found ${relevant.length} concepts in the constitutional graph.`;
      case 'HEALTH_QUERY':
        return `Your learning graph shows ${graph.length} nodes. `
          + `Focus principles: ${formatPrincipleList(focus)}. Keep asking — understanding grows through TENAGA (practice).`;
      case 'ARCHITECTURE_QUERY':
        return `Think in RUANG (boundaries) first: ${relevant.length} structural ideas connect here. `
          + `Then trace TENAGA (actions) through the layers.`;
      case 'TEACHING':
        return `Good question. Under ${formatPrincipleList(focus)}, here is the path I traversed: `
          + `${relevant.length} nodes, linked by ontological rules — not guessed words.`;
      case 'GRATITUDE':
        return "You're welcome! Every question strengthens your AIR (flow) of understanding.";
      case 'FAREWELL':
        return 'Maassalamah! Return anytime — MASA remembers what we explored.';
      default:
        return `Let's examine ${formatPrincipleList(focus)}. `
          + (contextHint || userMessage.trim().slice(0, 160));
    }
  },

  tutor: (intent, focus, graph, _contextBlocks, userMessage) => {
    const relevant = graph.filter((n) => focus.includes(n.principle));
    switch (intent) {
      case 'GREETING':
        return `Welcome to the tutorial lane. Today we study ${formatPrincipleList(focus)} `
          + `across ${relevant.length} graph nodes.`;
      case 'HEALTH_QUERY':
      case 'ARCHITECTURE_QUERY':
        return `Guided analysis: ${formatPrincipleList(focus)} — ${relevant.length} nodes. `
          + `Step 1: name the RUANG boundary. Step 2: list TENAGA actions crossing it.`;
      case 'TEACHING':
        return `Socratic check on "${userMessage.trim().slice(0, 80)}": `
          + `which principle governs this — ${formatPrincipleList(focus)}?`;
      default:
        return `Tutor path: traverse ${formatPrincipleList(focus)}, `
          + `explain each of the ${relevant.length} nodes in plain language.`;
    }
  },

  coach: (intent, focus, graph, _contextBlocks, userMessage) => {
    const counts = countByPrinciple(graph);
    const relevant = graph.filter((n) => focus.includes(n.principle));
    switch (intent) {
      case 'HEALTH_QUERY':
      case 'ARCHITECTURE_QUERY':
        return `Architectural analysis of ${formatPrincipleList(focus)}: `
          + `RUANG ${counts.RUANG} boundaries, TENAGA ${counts.TENAGA} execution patterns. `
          + `${relevant.length} nodes match your query. `
          + `Recommendation: enforce stricter RUANG boundaries in the service layer.`;
      case 'GREETING':
        return `Coach mode active. Ontology HUD: ${graph.length} nodes. `
          + `Focus: ${formatPrincipleList(focus)}.`;
      default:
        return `Scale lens on "${userMessage.trim().slice(0, 60)}": `
          + `${relevant.length} structural elements under ${formatPrincipleList(focus)}. `
          + `Prioritise boundary clarity before adding TENAGA.`;
    }
  },
};

export function synthesizeDialogue(request: DialogueRequest): DialogueResponse {
  const cacheKey = `${request.userMessage}:${request.persona}:${request.contextBlocks.length}`;
  const cached = graphCache.get<DialogueResponse>(cacheKey);
  if (cached) return cached;

  const intent = classifyDialogueIntent(request.userMessage);
  const focusPrinciples = extractPrinciplesFromMessage(request.userMessage, intent);
  const relevantNodes = request.ontologyGraph.filter((n) =>
    focusPrinciples.includes(n.principle),
  );

  const template = NARRATIVE_TEMPLATES[request.persona] ?? NARRATIVE_TEMPLATES.student;
  let text = template(
    intent,
    focusPrinciples,
    request.ontologyGraph,
    request.contextBlocks,
    request.userMessage,
    request.participantName,
  );

  if (request.extractedFacts?.trim()) {
    text += `\n\n[Verified context] ${request.extractedFacts.trim().slice(0, 480)}`;
  }

  const traversalPath = [
    `intent:${intent}`,
    `persona:${request.persona}`,
    `focus:${focusPrinciples.join(',')}`,
    `nodes:${relevantNodes.length}`,
  ];

  const response: DialogueResponse = {
    text,
    principleFocus: focusPrinciples,
    intent,
    confidence:   0.95,
    traversalPath,
  };

  graphCache.set(cacheKey, response);
  return response;
}
