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
  resolveAdamUsersDomainFacet,
  type AdamUsersDomainFacet,
} from '../../adam-users-domain-router';
import type { AdamSensingInput } from './adam-sensing.types';

/** DomainClassifier — mirrors users domain router (Article 8 S4). */
export function classifyAdamDomain(
  message: string,
  input: AdamSensingInput,
): AdamUsersDomainFacet {
  if (input.isFounder || isAdamTutorMode(input.mode) || isAdamNiagaMode(input.mode)) {
    return 'general';
  }
  return resolveAdamUsersDomainFacet(message, {
    recentUserMessages: input.recentUserMessages,
  });
}
