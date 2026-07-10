/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Sensing — Domain Classifier
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-18
 * ============================================================
 */

import { isAdamNiagaMode } from '../../adam-niaga-law';
import { isAdamTutorMode } from '../../adam-tutor-law';
import {
  resolveAdamUsersDomainRoute,
  type AdamUsersDomainFacet,
} from '../../adam-users-domain-router';
import type { AdamSensingInput } from './adam-sensing.types';

/** DomainClassifier — voice + grounding facets (Article 8 S4). */
export function classifyAdamDomain(
  message: string,
  input: AdamSensingInput,
): { voiceFacet: AdamUsersDomainFacet; groundingFacet: AdamUsersDomainFacet } {
  if (input.isFounder || isAdamTutorMode(input.mode) || isAdamNiagaMode(input.mode)) {
    return { voiceFacet: 'general', groundingFacet: 'general' };
  }
  return resolveAdamUsersDomainRoute(message, {
    recentUserMessages: input.recentUserMessages,
  });
}
