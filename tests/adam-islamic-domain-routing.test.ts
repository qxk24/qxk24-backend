/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Islamic Domain Routing Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { resolveAdamKnowledgeMode } from '../src/adam/adam-knowledge-mode';
import { resolveAdamUsersDomainFacet } from '../src/adam/adam-users-domain-router';
import {
  buildUsersDomainUniversalProseBlock,
  ADAM_USERS_DOMAIN_ISLAMIC_STUDIES_PROSE,
} from '../src/adam/adam-users-domain-prompts';
import { ADAM_QURAN_CONSTITUTIONAL_SUPREMACY_LAW } from '../src/adam/adam-universal-voice';

describe('Islamic domain — Quran supremacy routing', () => {
  it('fiqh syllabus routes to islamic-studies, not faith', () => {
    const facet = resolveAdamUsersDomainFacet('Apa maksud fiqh muamalat dalam PI?');
    expect(facet).toBe('islamic-studies');
    expect(resolveAdamKnowledgeMode({
      userMessage: 'Apa maksud fiqh muamalat dalam PI?',
    })).toBe('konvensional');
  });

  it('Surah question routes to faith + konstitusi (Quran apex)', () => {
    const msg = 'Jelaskan maksud surah Al-Fatihah dan hikmahnya.';
    expect(resolveAdamUsersDomainFacet(msg)).toBe('faith');
    expect(resolveAdamKnowledgeMode({ userMessage: msg })).toBe('konstitusi');
  });

  it('islamic-studies prose embeds constitutional supremacy law', () => {
    expect(ADAM_USERS_DOMAIN_ISLAMIC_STUDIES_PROSE).toContain('Allah → Al-Quran');
    expect(ADAM_USERS_DOMAIN_ISLAMIC_STUDIES_PROSE).toContain('above all human knowledge');
  });

  it('faith prose block includes supremacy law', () => {
    const block = buildUsersDomainUniversalProseBlock('faith');
    expect(block).toContain(ADAM_QURAN_CONSTITUTIONAL_SUPREMACY_LAW.slice(0, 40));
  });
});
