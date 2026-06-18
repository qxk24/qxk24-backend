/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Turn Gate Display Channel
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

import { isAdamCompareTurn } from '../adam-response-generation';
import type { AdamAnswerShape, AdamAnswerShapeIntent } from '../adam-answer-shape';
import {
  usersDomainRequiresFormalLayout,
  type AdamUsersDomainFacet,
} from '../adam-users-domain-router';
import type { AdamDisplayChannel } from './adam-turn-gate.types';

export function resolveDisplayChannel(
  domainFacet: AdamUsersDomainFacet,
  shapeIntent: AdamAnswerShapeIntent,
  message: string,
  structured: boolean,
): AdamDisplayChannel {
  if (shapeIntent === 'comparative' || isAdamCompareTurn(message)) {
    return structured ? 'compare-formal' : 'none';
  }
  if (!structured || !usersDomainRequiresFormalLayout(domainFacet)) {
    return 'none';
  }
  switch (domainFacet) {
    case 'economics':        return 'economics-formal';
    case 'science':          return 'science-formal';
    case 'civics':           return 'civics-formal';
    case 'technology':       return 'technology-formal';
    case 'academic':         return 'academic-formal';
    case 'mathematics':      return 'mathematics-formal';
    case 'business-studies': return 'business-formal';
    case 'accounting':       return 'accounting-formal';
    case 'health':           return 'health-formal';
    case 'environment':      return 'environment-formal';
    default:                 return 'none';
  }
}

/** Sync formalDataLayout on shape from display channel. */
export function syncFormalDataLayoutFromChannel(
  answerShape: AdamAnswerShape,
  displayChannel: AdamDisplayChannel,
): AdamAnswerShape {
  const formal = displayChannel !== 'none' && displayChannel !== 'compare-formal'
    ? true
    : displayChannel === 'compare-formal'
      ? Boolean(answerShape.formalDataLayout)
      : false;
  return {
    ...answerShape,
    formalDataLayout: formal && answerShape.structured,
  };
}
