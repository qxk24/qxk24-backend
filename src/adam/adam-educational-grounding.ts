/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Educational Grounding (search)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Teaching-depth turns: search query shaping + synthesis context only.
 * Image/video URLs come from live discovery (web hits, Wikimedia, APIs) — never hardcoded.
 */

import { stripLeadingAdamSalutation } from './adam-response-generation';

function condensedTopicQuery(body: string): string {
  const stop = new Set([
    'what', 'how', 'why', 'when', 'where', 'who', 'does', 'do', 'can', 'could',
    'would', 'should', 'the', 'a', 'an', 'and', 'or', 'for', 'to', 'of', 'in',
    'on', 'with', 'i', 'me', 'my', 'we', 'you', 'your', 'is', 'are', 'am', 'be',
    'tell', 'about', 'need', 'boleh', 'beritahu', 'tentang', 'apa', 'adakah',
    'terangkan', 'jelaskan', 'huraikan', 'dengan', 'contoh', 'kehidupan', 'seharian',
    'kita', 'negara', 'yang', 'dalam', 'pada',
  ]);
  const condensed = body
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stop.has(w.toLowerCase()))
    .join(' ')
    .trim();
  return (condensed.length >= 8 ? condensed : body).slice(0, 120);
}

/** DashScope display query — derived from the Users turn, no topic catalog. */
export function buildEducationalSearchDisplayQuery(message: string): string {
  const body = stripLeadingAdamSalutation(message.trim());
  return condensedTopicQuery(body);
}

/** Prefetch user prompt for teaching-depth / universal channel turns. */
export function buildEducationalPrefetchPrompt(message: string): string {
  const body = stripLeadingAdamSalutation(message.trim());
  const display = buildEducationalSearchDisplayQuery(message);
  const biology = /\b(?:imun|immune|patogen|pathogen|antibod|antigen|vaksin|virus|bakteria|biologi|biology|sel\s+t|limfa|tindak\s+balas|adaptif|adaptive)\b/i.test(body);
  const priority = biology
    ? 'Priority: NIH (.gov), CDC, WHO, Britannica, Khan Academy biology, university immunology notes — English sources OK for BM answers.'
    : 'Priority: official government, university, Wikipedia, Britannica, Khan Academy, verified educational publishers, and YouTube educational explainers.';
  return [
    `Find authoritative educational reference pages for: ${body}`,
    `Search query (mandatory): ${display}`,
    priority,
    'When possible include at least one YouTube watch URL in results for the topic.',
    'Return pages with clear definitions, diagrams, and everyday examples.',
    'Do NOT return homework cheat sites, forums, or AI summary farms.',
  ].join('\n');
}

/** Synthesis context when prefetch text search is empty on a teaching turn. */
export function buildEducationalZeroHitSearchContextBlock(): string {
  return [
    '[WEB SEARCH — NO TEXT HITS; CONVENTIONAL TEACHING OK]',
    'Prefetch search returned zero snippet hits for this teaching question.',
    'Answer from established school/university convention — structured lecture shape (### bahagian, bullet/nombor, contoh nyata).',
    'Do NOT tell the student "0 results", "tiada hasil", or ask them to paste a URL.',
    'FORBIDDEN: MASA/TENAGA/Alamtologi framework labels on konvensional surface.',
  ].join('\n');
}

/** Zero-hit when domain requires verifiable names — sirah/sejarah; no model-memory companions. */
export function buildDomainGroundingZeroHitSearchContextBlock(
  facet: import('./adam-users-domain-router').AdamUsersDomainFacet,
): string | null {
  if (facet === 'islamic-studies' || facet === 'history') {
    return [
      '[WEB SEARCH — NO TEXT HITS; VERIFIABLE FACTS ONLY]',
      'Prefetch search returned zero snippet hits for this historical/Islamic studies question.',
      'Do NOT name companions, dates, or events from model memory.',
      'State honestly that named figures cannot be verified this turn without a source.',
      'You may give broad context only — no invented sahabah lists or undated folklore.',
      'FORBIDDEN: MASA/TENAGA/Alamtologi framework labels on konvensional surface.',
    ].join('\n');
  }
  return null;
}
