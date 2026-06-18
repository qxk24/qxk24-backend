/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Users Domain Router Test (global facets)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-18
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { resolveAdamAnswerPlan } from '../src/adam/adam-answer-plan';
import { buildUsersDomainPromptBlock, buildUsersDomainUniversalProseBlock } from '../src/adam/adam-users-domain-prompts';
import {
  resolveAdamUsersDomainFacet,
  usersDomainRequiresFormalLayout,
  usersDomainUsesTeachingPack,
  usersDomainUsesUniversalScholarProse,
} from '../src/adam/adam-users-domain-router';
import { NO_FOUNDER_TEACHING_FLAGS } from '../src/adam/adam-teaching-state-machine';
import { resolveAdamTurnGate } from '../src/adam/turn-gate';

describe('resolveAdamUsersDomainFacet — global subjects', () => {
  it('routes geography superlative worldwide', () => {
    expect(resolveAdamUsersDomainFacet('Apakah sungai terpanjang di dunia?')).toBe('geography');
    expect(resolveAdamUsersDomainFacet('What is the longest river in the world?')).toBe('geography');
    expect(resolveAdamUsersDomainFacet('Which country has the largest population?')).toBe('geography');
  });

  it('routes mathematics globally', () => {
    expect(resolveAdamUsersDomainFacet('Explain quadratic equations step by step.')).toBe('mathematics');
    expect(resolveAdamUsersDomainFacet('Apa itu teorem Pythagoras?')).toBe('mathematics');
  });

  it('routes languages and translation', () => {
    expect(resolveAdamUsersDomainFacet('Explain English grammar: past perfect tense.')).toBe('languages');
    expect(resolveAdamUsersDomainFacet('Terjemah ayat ini ke Bahasa Inggeris.')).toBe('languages');
  });

  it('routes business studies and accounting', () => {
    expect(resolveAdamUsersDomainFacet('What is a SWOT analysis in business studies?')).toBe('business-studies');
    expect(resolveAdamUsersDomainFacet('Apa itu imbangan duga dalam perakaunan?')).toBe('accounting');
  });

  it('routes pedagogy and KBAT to academic', () => {
    expect(resolveAdamUsersDomainFacet('Apa itu KBAT?')).toBe('academic');
    expect(resolveAdamUsersDomainFacet('Explain Bloom taxonomy in classroom practice.')).toBe('academic');
    expect(resolveAdamUsersDomainFacet('Terangkan PdPc dalam KSSM.')).toBe('academic');
  });

  it('routes health and environment', () => {
    expect(resolveAdamUsersDomainFacet('What does WHO say about mental health hygiene?')).toBe('health');
    expect(resolveAdamUsersDomainFacet('Explain climate change and the Paris agreement.')).toBe('environment');
  });

  it('routes arts, moral ethics, islamic studies syllabus', () => {
    expect(resolveAdamUsersDomainFacet('What is impressionism in art history?')).toBe('arts-music');
    expect(resolveAdamUsersDomainFacet('Explain utilitarianism vs deontology.')).toBe('moral-ethics');
    expect(resolveAdamUsersDomainFacet('Terangkan bab fiqh tentang wuduk.')).toBe('islamic-studies');
  });

  it('routes global civics beyond Malaysia', () => {
    expect(resolveAdamUsersDomainFacet('How does the US separation of powers work?')).toBe('civics');
    expect(resolveAdamUsersDomainFacet('Apa perbezaan antara hukum jenayah dan hukum sivil?')).toBe('civics');
  });

  it('routes entrepreneurship education and vocational', () => {
    expect(resolveAdamUsersDomainFacet('Business plan assignment for entrepreneurship class.')).toBe('entrepreneurship');
    expect(resolveAdamUsersDomainFacet('Home science food technology nutrition table.')).toBe('home-vocational');
  });

  it('marks teaching pack vs universal prose facets', () => {
    expect(usersDomainUsesTeachingPack('geography')).toBe(false);
    expect(usersDomainUsesUniversalScholarProse('geography')).toBe(true);
    expect(usersDomainUsesTeachingPack('mathematics')).toBe(true);
    expect(usersDomainRequiresFormalLayout('mathematics')).toBe(true);
    expect(usersDomainRequiresFormalLayout('geography')).toBe(false);
  });

  it('inherits geography on continuation depth', () => {
    const facet = resolveAdamUsersDomainFacet('Terangkan lagi', {
      recentUserMessages: ['What is the highest mountain in Africa?'],
    });
    expect(facet).toBe('geography');
  });
});

describe('domain prompts — global', () => {
  it('returns geography universal prose block', () => {
    expect(buildUsersDomainUniversalProseBlock('geography')).toMatch(/GEOGRAPHY/i);
    expect(buildUsersDomainPromptBlock('geography')).toBe('');
  });

  it('returns mathematics teaching block', () => {
    expect(buildUsersDomainPromptBlock('mathematics')).toMatch(/MATHEMATICS/i);
  });
});

describe('turn gate — global domain wiring', () => {
  it('mathematics gets mathematics-formal display when technical', () => {
    const gate = resolveAdamTurnGate({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: 'Solve linear equation 2x + 3 = 11.',
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    expect(gate.iq.domainFacet).toBe('mathematics');
    expect(gate.iq.displayChannel).toBe('mathematics-formal');
  });

  it('geography stays general mode with konvensional surface', () => {
    const gate = resolveAdamTurnGate({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: 'What is the capital of Australia?',
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    expect(gate.iq.domainFacet).toBe('geography');
    expect(gate.iq.usersMode).toBe('general');
    expect(gate.flags.konvensionalSurface).toBe(true);
  });
});

describe('resolveAdamAnswerPlan — users domain', () => {
  it('attaches economics domain on substantive technical plan', () => {
    const plan = resolveAdamAnswerPlan({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: 'Apa itu inflasi dan kesan kepada rakyat Malaysia?',
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    expect(plan.lane).toBe('users');
    expect(plan.usersMode).toBe('technical');
    expect(plan.usersDomain).toBe('economics');
  });

  it('does not attach domain on founder turns', () => {
    const plan = resolveAdamAnswerPlan({
      isFounder: true,
      mode: 'TEACHING',
      userMessage: 'Apa itu inflasi?',
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    expect(plan.lane).toBe('founder');
    expect(plan.usersDomain).toBeUndefined();
  });
});
