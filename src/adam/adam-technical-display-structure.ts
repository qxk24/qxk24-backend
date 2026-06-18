/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Technical Display Structure Repair
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
 * Post-stream repair:
 *   Users direct route (answerPlan) — ### + prose synthesis; light-touch when stream OK.
 *   Legacy opt-in — Ringkasnya template when user asked for structure.
 */

import {
  isAdamCivicsGovernmentTurn,
  isAdamCompareTurn,
  isAdamTechnicalKonvensionalDisplayTurn,
  stripLeadingAdamSalutation,
  userExplicitlyAskedStructuredDisplay,
} from './adam-response-generation';
import { isUsersTechnicalPlan, type AdamAnswerPlan } from './adam-answer-plan';
import {
  compareFormalStructureAdequate,
  hasMarkdownTable,
  repairCompareFragmentCorruption,
  repairEconomicsFormalTables,
  repairEconomicsStreamFragments,
} from './adam-compare-formal-display';
import {
  buildFormalDisplaySections,
  formalDisplayStructureAdequate,
  isRegistryFormalDisplayChannel,
  repairScienceFormalDisplay,
} from './adam-formal-display-registry';
import type { AdamDisplayChannel } from './turn-gate/adam-turn-gate.types';
import {
  extractComparePair,
  extractSecondarySectionTitle,
  extractTeachingTopicTitle,
  isComparativeShape,
  type AdamAnswerShape,
} from './adam-answer-shape';
import {
  ADAM_GENERIC_SECONDARY_FALLBACK,
} from './adam-answer-compound';
import type { AdamAnswerComposer } from './adam-answer-composer';
import {
  extractAdamTechnicalDiagramInner,
  outputHasTechnicalDiagram,
  pickFallbackDiagramForMessage,
  replaceTechnicalDiagramInner,
  stashAdamTechnicalDiagramBlocks,
  restoreAdamTechnicalDiagramBlocks,
} from './adam-technical-diagram-guard';
import { stripKonvensionalAlamtologiTailInline, stripWebSearchAttributionInline } from './adam-users-output-law';
import { formatUsersHaiGreeting, userAddressedAdamByName } from './adam-users-greeting';
import { stripRedundantAlphaGoldStandardClose } from './adam-gold-standard';

const MEDIA_STASH_RE = /<adam-chat-(?:image|video)\b[^>]*\/?>/gi;
const GENERIC_DIAGRAM_MARK = 'Definisi konsep';

export { extractSecondarySectionTitle, extractTeachingTopicTitle } from './adam-answer-shape';
export { ADAM_GENERIC_SECONDARY_FALLBACK } from './adam-answer-compound';

function isGenericFallbackDiagram(text: string): boolean {
  if (!outputHasTechnicalDiagram(text)) return false;
  const inner = extractAdamTechnicalDiagramInner(text);
  return Boolean(inner?.includes(GENERIC_DIAGRAM_MARK));
}

function replaceGenericDiagram(text: string, userMessage: string): string {
  if (!isGenericFallbackDiagram(text)) return text;
  const fallback = pickFallbackDiagramForMessage(userMessage);
  return replaceTechnicalDiagramInner(text, fallback);
}

function splitBodyParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p && !/^<adam-(?:technical-diagram|chat-image|chat-video)\b/i.test(p));
}

function paragraphIsClosingInvite(p: string): boolean {
  return /^mahu\s+saya\s+jelaskan/i.test(p.trim())
    || /^would you like me to explain further/i.test(p.trim());
}

function paragraphIsRingkasan(p: string): boolean {
  return /^\*\*Ringkasnya:\*\*/i.test(p.trim());
}

function paragraphIsCadangan(p: string): boolean {
  return /^\*\*Cadangan:\*\*/i.test(p.trim()) || /^Cadangan:/im.test(p.trim());
}

function paragraphIsHaiOpener(p: string): boolean {
  return /^hai\s+/i.test(p.trim());
}

function paragraphIsStructuredHeader(p: string): boolean {
  return /^#{1,6}\s+/m.test(p.trim());
}

/** Natural prose paragraphs — not ### sections, closes, or scripted blocks. */
function countNaturalProseParagraphs(text: string): number {
  return splitBodyParagraphs(text).filter((p) => {
    if (paragraphIsClosingInvite(p)) return false;
    if (paragraphIsRingkasan(p)) return false;
    if (paragraphIsCadangan(p)) return false;
    if (paragraphIsStructuredHeader(p)) return false;
    return p.length >= 40;
  }).length;
}

function normalizeUsersDirectOpener(
  opener: string | undefined,
  topic: string,
  userMessage?: string,
  participantName?: string,
): string {
  if (userMessage && !userAddressedAdamByName(userMessage)) {
    return '';
  }
  if (!opener) {
    return userMessage && userAddressedAdamByName(userMessage)
      ? formatUsersHaiGreeting(participantName)
      : '';
  }
  if (/berikut penjelasan tentang\s+yang\s+dimaksudkan/i.test(opener) && opener.length > 120) {
    const nameMatch = opener.match(/^Hai\s+([^,]+),/i);
    return nameMatch ? `Hai ${nameMatch[1]},` : formatUsersHaiGreeting(participantName);
  }
  return opener;
}

export function stripHomeworkCadanganBlock(text: string): string {
  return text
    .replace(/\n{0,2}\*\*Cadangan:\*\*\s*\n(?:\s*\d+\.\s+[^\n]+\n?)+/gi, '\n\n')
    .replace(/\n{0,2}Cadangan:\s*\n(?:\s*\d+\.\s+[^\n]+\n?)+/gi, '\n\n')
    .trim();
}

function countStructuredSectionHeaders(text: string): number {
  return (text.match(/^###\s+.+$/gm) ?? []).length;
}

function resolvePlanDisplayChannel(answerPlan?: AdamAnswerPlan): AdamDisplayChannel {
  if (answerPlan?.displayChannel) return answerPlan.displayChannel;
  if (answerPlan?.answerShape?.formalDataLayout) return 'economics-formal';
  return 'none';
}

function usersDirectStructureAdequate(
  text: string,
  userMessage: string,
  answerShape?: AdamAnswerShape,
  displayChannel?: AdamDisplayChannel,
): boolean {
  if (isRegistryFormalDisplayChannel(displayChannel)) {
    return formalDisplayStructureAdequate(displayChannel, text, {
      formalDataLayout: answerShape?.formalDataLayout,
    });
  }
  if (answerShape?.formalDataLayout && !displayChannel) {
    return formalDisplayStructureAdequate('economics-formal', text, {
      formalDataLayout: true,
    });
  }
  if (isComparativeShape(answerShape) || isAdamCompareTurn(userMessage)) {
    return usersDirectCompareStructureAdequate(text, answerShape);
  }
  return countStructuredSectionHeaders(text) >= 2 && countNaturalProseParagraphs(text) >= 2;
}

function usersDirectCompareStructureAdequate(text: string, answerShape?: AdamAnswerShape): boolean {
  if (hasWrongCompareHeader(text)) return false;
  if (compareFormalStructureAdequate(text, {
    formalDataLayout: answerShape?.formalDataLayout,
  })) {
    return true;
  }
  const headers = countStructuredSectionHeaders(text);
  const hasCompareHeader = /^###\s+(?:Perbandingan|Perbezaan)/im.test(text);
  return headers >= 2 && hasCompareHeader
    && (hasMarkdownTable(text) || countNaturalProseParagraphs(text) >= 2);
}

function hasWrongCompareHeader(text: string): boolean {
  return /^###\s+Apa itu\s+perbezaan/im.test(text)
    || /^###\s+Apa itu\s+.+?\s+vs\b/im.test(text)
    || /^###\s+Perbandingan.+lebih\s+perinci/im.test(text)
    || /^###\s+Perbandingan.{90,}/im.test(text);
}

function paragraphIsUserQuestionEcho(paragraph: string, userMessage: string): boolean {
  const body = stripLeadingAdamSalutation(userMessage).trim();
  if (body.length < 20) return false;
  const p = stripWebSearchAttributionInline(paragraph.trim());
  if (!p || p.length < 20) return false;
  const head = body.slice(0, Math.min(64, body.length)).toLowerCase();
  const pLow = p.toLowerCase();
  if (pLow.startsWith(head)) return true;
  if (
    /^(?:terangkan|jelaskan|huraikan|apa)\s+perbezaan/i.test(pLow)
    && body.toLowerCase().includes('perbezaan')
    && p.length <= body.length + 48
  ) {
    return true;
  }
  return false;
}

function filterUserQuestionEchoParagraphs(text: string, userMessage: string): string {
  return splitBodyParagraphs(text)
    .filter((p) => paragraphIsStructuredHeader(p) || !paragraphIsUserQuestionEcho(p, userMessage))
    .join('\n\n')
    .trim();
}

function compareSectionTitle(answerShape?: AdamAnswerShape, userMessage?: string): string {
  const pair = answerShape?.comparePair ?? (userMessage ? extractComparePair(userMessage) : null);
  if (pair) return `### Perbandingan ${pair.left} dan ${pair.right}`;
  return '### Perbandingan';
}

/** Users direct route — comparative shape (table + contoh + synthesis). */
function buildUsersDirectComparativeSections(
  paragraphs: string[],
  userMessage: string,
  answerShape?: AdamAnswerShape,
): string {
  const body = paragraphs.filter(
    (p) => !paragraphIsHaiOpener(p)
      && !paragraphIsClosingInvite(p)
      && !paragraphIsRingkasan(p)
      && !paragraphIsCadangan(p)
      && !paragraphIsStructuredHeader(p)
      && !paragraphIsUserQuestionEcho(p, userMessage),
  );
  const opener = normalizeUsersDirectOpener(
    paragraphs.find(paragraphIsHaiOpener),
    extractComparePair(userMessage)?.left ?? 'topik ini',
    userMessage,
  );
  const compareHeader = compareSectionTitle(answerShape, userMessage);

  const chunks: string[] = [opener];
  if (body[0]) {
    chunks.push(compareHeader, body[0]);
  }
  if (body[1]) {
    chunks.push('### Perbezaan utama', body[1]);
  }
  if (body[2]) {
    chunks.push('### Contoh', body[2]);
  }
  if (body.length > 3) {
    chunks.push(body.slice(3).join('\n\n'));
  }
  return chunks.filter(Boolean).join('\n\n');
}

/** Users direct route — ### from answer composer; no generic secondary fallback. */
function buildUsersDirectTechnicalSections(
  paragraphs: string[],
  userMessage: string,
  answerComposer?: AdamAnswerComposer,
): string {
  const topic = answerComposer?.topicTitle ?? extractTeachingTopicTitle(userMessage);
  const secondary = answerComposer?.secondaryHeader ?? extractSecondarySectionTitle(userMessage);
  const body = paragraphs.filter(
    (p) => !paragraphIsHaiOpener(p)
      && !paragraphIsClosingInvite(p)
      && !paragraphIsRingkasan(p)
      && !paragraphIsCadangan(p)
      && !paragraphIsStructuredHeader(p),
  );
  const opener = normalizeUsersDirectOpener(
    paragraphs.find(paragraphIsHaiOpener),
    topic,
    userMessage,
  );

  const chunks: string[] = [opener];
  if (body[0]) {
    chunks.push(`### ${answerComposer?.primaryHeader ?? `Apa itu ${topic}?`}`, body[0]);
  }
  if (body[1]) {
    if (secondary) {
      chunks.push(`### ${secondary}`, body[1]);
    } else {
      chunks.push(body[1]);
    }
  }
  if (body.length > 2) {
    chunks.push(body.slice(2).join('\n\n'));
  }
  return chunks.filter(Boolean).join('\n\n');
}

function buildCivicsSections(paragraphs: string[], topic: string, userMessage: string): string {
  const body = paragraphs.filter(
    (p) => !paragraphIsHaiOpener(p) && !paragraphIsClosingInvite(p) && !paragraphIsRingkasan(p),
  );
  const opener = paragraphs.find(paragraphIsHaiOpener)
    ?? (userAddressedAdamByName(userMessage)
      ? `Hai QA, ${topic} ialah asas sistem kerajaan Malaysia.`
      : '');
  const closer = paragraphs.find(paragraphIsClosingInvite);
  const ringkas = paragraphs.find(paragraphIsRingkasan);

  const p0 = body[0] ?? '';
  const p1 = body[1] ?? '';
  const p2 = body[2] ?? '';
  const rest = body.slice(3);

  const cabangBlock = [
    '### Tiga cabang kuasa',
    '1. **Legislatif** — Parlimen membuat undang-undang.',
    '2. **Eksekutif** — Kabinet dan Perdana Menteri melaksanakan dasar.',
    '3. **Kehakiman** — Mahkamah mentafsir undang-undang dan menegakkan Perlembagaan.',
    p1,
  ].filter(Boolean).join('\n\n');

  const hakBlock = [
    '### Hak asasi dan pindaan',
    p2,
    rest.length > 0 ? rest.slice(0, -1).join('\n\n') : '',
  ].filter(Boolean).join('\n\n');

  const synthesis = rest.length > 0 ? rest[rest.length - 1]! : (body[body.length - 1] ?? '');

  const sections = [
    opener,
    `### Apa itu ${topic}?`,
    p0,
    cabangBlock,
    hakBlock,
    ringkas ?? '**Ringkasnya:** Perlembagaan ialah undang-undang tertinggi yang membahagikan kuasa dan melindungi hak rakyat.',
    synthesis && !paragraphIsRingkasan(synthesis) ? synthesis : '',
    closer,
  ];

  return sections.filter(Boolean).join('\n\n');
}

/** Legacy opt-in structured display — Ringkasnya close; no generic secondary header. */
function buildDefaultTeachingSections(
  paragraphs: string[],
  topic: string,
  secondary?: string | null,
  userMessage?: string,
): string {
  const body = paragraphs.filter(
    (p) => !paragraphIsHaiOpener(p) && !paragraphIsClosingInvite(p) && !paragraphIsRingkasan(p),
  );
  const opener = paragraphs.find(paragraphIsHaiOpener)
    ?? (userMessage && userAddressedAdamByName(userMessage)
      ? `Hai QA, berikut penjelasan tentang ${topic}.`
      : '');
  const closer = paragraphs.find(paragraphIsClosingInvite);
  const ringkas = paragraphs.find(paragraphIsRingkasan);

  const chunks: string[] = [opener];
  if (body[0]) {
    chunks.push(`### Apa itu ${topic}?`, body[0]);
  }
  if (body[1]) {
    if (secondary) {
      chunks.push(`### ${secondary}`, body[1]);
    } else {
      chunks.push(body[1]);
    }
  }
  if (body.length > 2) {
    chunks.push('### Contoh dan kepentingan', body.slice(2, -1).join('\n\n') || body[2]!);
  }
  const last = body[body.length - 1];
  if (last && body.length > 1) {
    chunks.push(ringkas ?? `**Ringkasnya:** ${last.split(/[.!?]/)[0]?.trim() ?? topic}.`);
  } else if (ringkas) {
    chunks.push(ringkas);
  }
  if (closer) chunks.push(closer);
  return chunks.filter(Boolean).join('\n\n');
}

function injectUsersDirectTechnicalSections(
  text: string,
  userMessage: string,
  answerShape?: AdamAnswerShape,
  answerComposer?: AdamAnswerComposer,
  displayChannel: AdamDisplayChannel = 'none',
): string {
  const diagramVault = stashAdamTechnicalDiagramBlocks(text);
  const mediaBlocks: string[] = [];
  const proseWithoutMedia = diagramVault.prose.replace(MEDIA_STASH_RE, (match) => {
    const slot = `\x00ADAM_MEDIA_${mediaBlocks.length}\x00`;
    mediaBlocks.push(match);
    return slot;
  });

  const paragraphs = splitBodyParagraphs(proseWithoutMedia);
  const isCompare = isComparativeShape(answerShape) || isAdamCompareTurn(userMessage);
  const topicTitle = answerComposer?.topicTitle
    ?? extractTeachingTopicTitle(userMessage);
  let out = isCompare
    ? buildUsersDirectComparativeSections(paragraphs, userMessage, answerShape)
    : isRegistryFormalDisplayChannel(displayChannel)
      ? buildFormalDisplaySections(displayChannel, paragraphs, { topicTitle, userMessage })
      : buildUsersDirectTechnicalSections(paragraphs, userMessage, answerComposer);
  out = restoreAdamTechnicalDiagramBlocks(out, diagramVault.blocks);
  for (let i = 0; i < mediaBlocks.length; i += 1) {
    out = out.replace(`\x00ADAM_MEDIA_${i}\x00`, mediaBlocks[i]!);
  }
  return out.trim();
}

function injectLegacyTechnicalSectionHeaders(text: string, userMessage: string): string {
  const topic = extractTeachingTopicTitle(userMessage);
  const secondary = extractSecondarySectionTitle(userMessage);
  const diagramVault = stashAdamTechnicalDiagramBlocks(text);
  const mediaBlocks: string[] = [];
  const proseWithoutMedia = diagramVault.prose.replace(MEDIA_STASH_RE, (match) => {
    const slot = `\x00ADAM_MEDIA_${mediaBlocks.length}\x00`;
    mediaBlocks.push(match);
    return slot;
  });

  const paragraphs = splitBodyParagraphs(proseWithoutMedia);
  const structured = isAdamCivicsGovernmentTurn(userMessage)
    ? buildCivicsSections(paragraphs, topic, userMessage)
    : buildDefaultTeachingSections(paragraphs, topic, secondary, userMessage);

  let out = restoreAdamTechnicalDiagramBlocks(structured, diagramVault.blocks);
  for (let i = 0; i < mediaBlocks.length; i += 1) {
    out = out.replace(`\x00ADAM_MEDIA_${i}\x00`, mediaBlocks[i]!);
  }
  return out.trim();
}

function polishUsersDirectComparativeHeaders(
  text: string,
  userMessage: string,
  answerShape?: AdamAnswerShape,
): string {
  const compareHeader = compareSectionTitle(answerShape, userMessage);
  let out = text;

  out = out.replace(/^###\s+Perbandingan\s+.+$/im, compareHeader);
  out = out.replace(/^###\s+Apa itu\s+perbezaan.+$/im, compareHeader);
  out = out.replace(/^###\s+Apa itu\s+.+$/im, compareHeader);
  out = out.replace(/^###\s+Bagaimana ia berfungsi\?\s*$/im, '### Perbezaan utama');

  return out;
}

function polishUsersDirectTechnicalHeaders(
  text: string,
  userMessage: string,
  answerShape?: AdamAnswerShape,
  answerComposer?: AdamAnswerComposer,
): string {
  if (isComparativeShape(answerShape) || isAdamCompareTurn(userMessage)) {
    return polishUsersDirectComparativeHeaders(text, userMessage, answerShape);
  }

  const topic = answerComposer?.topicTitle ?? extractTeachingTopicTitle(userMessage);
  const primaryHeader = answerComposer?.primaryHeader ?? `Apa itu ${topic}?`;
  const secondary = answerComposer?.secondaryHeader ?? extractSecondarySectionTitle(userMessage);
  let out = text;

  out = out.replace(
    /^###\s+Apa itu\s+.+$/im,
    `### ${primaryHeader}`,
  );

  if (secondary) {
    out = out.replace(
      new RegExp(`^###\\s+${escapeRegExp(ADAM_GENERIC_SECONDARY_FALLBACK)}\\s*$`, 'im'),
      `### ${secondary}`,
    );
  } else {
    out = out.replace(
      new RegExp(`^###\\s+${escapeRegExp(ADAM_GENERIC_SECONDARY_FALLBACK)}\\s*\\n+`, 'im'),
      '',
    );
  }

  return out;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hygieneUsersDirectTechnicalOutput(
  text: string,
  userMessage = '',
  isCompare = false,
  displayChannel: AdamDisplayChannel = 'none',
): string {
  let out = stripWebSearchAttributionInline(text);
  if (isCompare) {
    out = repairCompareFragmentCorruption(out);
  } else {
    out = repairEconomicsStreamFragments(out);
    if (displayChannel === 'economics-formal' || /^###\s+Data dan statistik/im.test(out)) {
      out = repairEconomicsFormalTables(out);
    }
    if (displayChannel === 'science-formal' || /^###\s+Data dan jadual/im.test(out)) {
      out = repairScienceFormalDisplay(out);
    }
  }
  if (userMessage.trim()) {
    out = filterUserQuestionEchoParagraphs(out, userMessage);
  }
  out = out
    .replace(/\n*\s*Mahu saya jelaskan lebih lanjut\?\s*/gi, '\n\n')
    .replace(/\n*\s*Mahukah saya jelaskan lebih lanjut\?\s*/gi, '\n\n')
    .replace(/\n{0,2}\*\*Ringkasnya:\*\*[^\n]+/gi, '')
    .trim();

  out = stripHomeworkCadanganBlock(out);
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

function isUsersDirectRoute(
  options?: { answerPlan?: AdamAnswerPlan; usersTechnicalDirect?: boolean },
): boolean {
  if (options?.usersTechnicalDirect) return true;
  return Boolean(options?.answerPlan && isUsersTechnicalPlan(options.answerPlan));
}

function shouldApplyUsersTechnicalStructureRepair(
  userMessage: string,
  options?: { answerPlan?: AdamAnswerPlan; isFounder?: boolean; usersTechnicalDirect?: boolean },
): boolean {
  if (options?.isFounder) return false;
  if (isUsersDirectRoute(options)) return true;
  return isAdamTechnicalKonvensionalDisplayTurn(userMessage);
}

/** Essay-only output → formal technical display (###, prose synthesis on Users direct). */
export function repairTechnicalKonvensionalDisplayStructure(
  text: string,
  userMessage: string,
  options?: {
    isFounder?: boolean;
    answerPlan?: AdamAnswerPlan;
    usersTechnicalDirect?: boolean;
    lightTouchOnly?: boolean;
  },
): string {
  if (options?.isFounder) return text.trim();
  if (!shouldApplyUsersTechnicalStructureRepair(userMessage, options)) {
    return stripRedundantAlphaGoldStandardClose(
      stripKonvensionalAlamtologiTailInline(text.trim()),
      userMessage,
    );
  }

  const usersDirect = isUsersDirectRoute(options);
  const lightTouch = options?.lightTouchOnly === true;
  const answerShape = options?.answerPlan?.answerShape;
  const answerComposer = options?.answerPlan?.answerComposer;
  const displayChannel = resolvePlanDisplayChannel(options?.answerPlan);
  const isCompare = isComparativeShape(answerShape) || isAdamCompareTurn(userMessage);

  let out = stripKonvensionalAlamtologiTailInline(text.trim());
  out = repairEconomicsStreamFragments(out);
  out = replaceGenericDiagram(out, userMessage);

  const naturalParas = countNaturalProseParagraphs(out);
  const hasStructuredHeaders = /^###\s/m.test(out);
  const formalLayout = isRegistryFormalDisplayChannel(displayChannel)
    || answerShape?.formalDataLayout === true;
  const structureAdequate = usersDirectStructureAdequate(
    out,
    userMessage,
    answerShape,
    displayChannel,
  );
  const formalAdequate = isRegistryFormalDisplayChannel(displayChannel)
    ? formalDisplayStructureAdequate(displayChannel, out, { formalDataLayout: answerShape?.formalDataLayout })
    : true;
  const forceStructuredShape = userExplicitlyAskedStructuredDisplay(userMessage)
    || (isCompare && !hasStructuredHeaders)
    || (usersDirect && !lightTouch && !structureAdequate && !isCompare)
    || (formalLayout && !formalAdequate);

  if (usersDirect && isCompare && hasStructuredHeaders && countStructuredSectionHeaders(out) >= 2) {
    out = polishUsersDirectComparativeHeaders(out, userMessage, answerShape);
    out = hygieneUsersDirectTechnicalOutput(out, userMessage, true, displayChannel);
    return stripRedundantAlphaGoldStandardClose(out, userMessage);
  }

  if (usersDirect && (lightTouch || structureAdequate || (hasStructuredHeaders && !(isCompare && hasWrongCompareHeader(out)) && !formalLayout))) {
    out = polishUsersDirectTechnicalHeaders(out, userMessage, answerShape, answerComposer);
    out = hygieneUsersDirectTechnicalOutput(out, userMessage, isCompare, displayChannel);
    return stripRedundantAlphaGoldStandardClose(out, userMessage);
  }

  if (!hasStructuredHeaders && naturalParas >= 2 && !forceStructuredShape) {
    return stripRedundantAlphaGoldStandardClose(out, userMessage);
  }

  if (usersDirect && isCompare && hasWrongCompareHeader(out)) {
    out = polishUsersDirectComparativeHeaders(out, userMessage, answerShape);
  } else {
    const needsFormalReinject = formalLayout && !formalAdequate;
    if (!hasStructuredHeaders || needsFormalReinject) {
      if (needsFormalReinject) {
        out = out.replace(/^###\s+.+$\n?/gm, '').trim();
      }
      out = usersDirect
        ? injectUsersDirectTechnicalSections(
          out,
          userMessage,
          answerShape,
          answerComposer,
          displayChannel,
        )
        : injectLegacyTechnicalSectionHeaders(out, userMessage);
    }
  }

  if (usersDirect) {
    out = polishUsersDirectTechnicalHeaders(out, userMessage, answerShape, answerComposer);
    out = hygieneUsersDirectTechnicalOutput(out, userMessage, isCompare, displayChannel);
  } else if (!/\*\*Ringkasnya:\*\*/i.test(out) && forceStructuredShape && naturalParas < 2) {
    out = `${out}\n\n**Ringkasnya:** ${extractTeachingTopicTitle(userMessage)} — fakta konvensional utama di atas.`;
  }

  return stripRedundantAlphaGoldStandardClose(out.trim(), userMessage);
}

/** Users direct finalize — preserve stream body when repair would shorten rich answers. */
export function repairUsersDirectTechnicalDisplay(
  text: string,
  userMessage: string,
  answerPlan: AdamAnswerPlan,
): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  if (usersDirectStructureAdequate(
    trimmed,
    userMessage,
    answerPlan.answerShape,
    resolvePlanDisplayChannel(answerPlan),
  )) {
    return repairTechnicalKonvensionalDisplayStructure(trimmed, userMessage, {
      answerPlan,
      lightTouchOnly: true,
    });
  }

  const repaired = repairTechnicalKonvensionalDisplayStructure(trimmed, userMessage, { answerPlan });
  const formalLayout = answerPlan.answerShape?.formalDataLayout === true;
  if (
    trimmed.length > 400
    && repaired.length < trimmed.length * 0.75
    && !formalLayout
  ) {
    return repairTechnicalKonvensionalDisplayStructure(trimmed, userMessage, {
      answerPlan,
      lightTouchOnly: true,
    });
  }
  return repaired;
}
