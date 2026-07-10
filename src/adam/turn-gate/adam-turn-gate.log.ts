/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Turn Gate Log
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

import type { AdamTurnGateDecision } from './adam-turn-gate.types';

export function formatAdamTurnGateLog(decision: AdamTurnGateDecision): string {
  const { iq, eq, flags, fuseNotes } = decision;
  const flagParts: string[] = [];
  if (flags.domainTeachingPack) flagParts.push('teaching');
  if (flags.formalDisplayLaw) flagParts.push('formal');
  if (flags.usersTechnicalFinalize) flagParts.push('technical');
  if (flags.displayAlign) flagParts.push('align');
  if (flags.searchEnabled) flagParts.push('search');
  if (flags.faithPermitted) flagParts.push('faith');
  if (flags.konvensionalSurface) flagParts.push('konv');
  if (flags.relationalVoice) flagParts.push('relational');
  if (flags.knowledgeMode !== 'konvensional') flagParts.push(`km=${flags.knowledgeMode}`);

  const iqPart = [
    `domain=${iq.domainFacet}`,
    iq.groundingFacet !== iq.domainFacet ? `ground=${iq.groundingFacet}` : null,
    `surface=${iq.surfaceKind}`,
    `mode=${iq.usersMode}`,
    `intent=${iq.contentIntent}`,
    `display=${iq.displayChannel}`,
    `shape=${iq.shapeIntent}`,
    iq.topicTitle ? `topic=${iq.topicTitle.slice(0, 48)}` : null,
  ].filter(Boolean).join(' ');

  const eqPart = [
    `lane=${eq.lane}`,
    `virtues=${eq.virtues.join('+')}`,
    `tone=${eq.affectiveTone}`,
    `situation=${eq.situationPosture}`,
    `thread=${eq.threadPosture}`,
    eq.addressPolicy.allowHaiGreeting ? 'hai=adam' : 'hai=off',
  ].filter(Boolean).join(' ');

  const fitraPart = fuseNotes.length > 0 ? `fitra=${fuseNotes.join(',')}` : null;

  return `[adam:turn-gate] IQ ${iqPart} | EQ ${eqPart}${fitraPart ? ` | ${fitraPart}` : ''} | flags=${flagParts.join(',') || 'none'}`;
}
