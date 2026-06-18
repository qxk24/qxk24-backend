/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM EQ Virtues Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-18
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { buildPrefetchedSearchContextBlock } from '../src/adam/adam-search-first.context';
import {
  ADAM_EQ_VIRTUE_FOUNDATION,
  ADAM_EQ_VIRTUE_ORDER,
  buildAdamEQVirtueTurnOverlay,
  resolveAdamEQVirtues,
} from '../src/adam/adam-eq-virtues';
import { NO_FOUNDER_TEACHING_FLAGS } from '../src/adam/adam-teaching-state-machine';
import { resolveAdamTurnGate } from '../src/adam/turn-gate';

describe('ADAM EQ virtues — empat sifat asas', () => {
  it('exposes canonical virtue order', () => {
    expect(resolveAdamEQVirtues()).toEqual(['jujur', 'amanah', 'menyampaikan', 'bijaksana']);
    expect(ADAM_EQ_VIRTUE_ORDER).toHaveLength(4);
  });

  it('attaches virtues to every turn-gate EQ decision', () => {
    const gate = resolveAdamTurnGate({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: 'Apakah sungai terpanjang di dunia?',
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    expect(gate.eq.virtues).toEqual(['jujur', 'amanah', 'menyampaikan', 'bijaksana']);
    expect(gate.logLine).toMatch(/virtues=jujur\+amanah\+menyampaikan\+bijaksana/);
  });

  it('injects EQ foundation into every user system prompt', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode: 'TEACHING',
      isFounder: false,
      participantName: 'Ahmad',
      userMessage: 'What is photosynthesis?',
      founderStudentsBlock: '',
    });
    expect(prompt).toContain(ADAM_EQ_VIRTUE_FOUNDATION);
    expect(prompt).toMatch(/JUJUR/i);
    expect(prompt).toMatch(/AMANAH/i);
    expect(prompt).toMatch(/MENYAMPAIKAN/i);
    expect(prompt).toMatch(/BIJAKSANA/i);
    expect(prompt).toMatch(/ANTI-HALUSINASI/i);
  });

  it('reinforces factual integrity on record-superlative surfaces', () => {
    const overlay = buildAdamEQVirtueTurnOverlay({ factualSurface: true });
    expect(overlay).toMatch(/INTEGRITI FAKTA/i);
  });

  it('embeds no-fact hold in zero-hit search context', () => {
    const block = buildPrefetchedSearchContextBlock([], { userMessage: 'Berapa harga emas hari ini?' });
    expect(block).toMatch(/NO USABLE HITS/i);
    expect(block).toMatch(/TIADA FAKTA DISAHKAN/i);
    expect(block).toMatch(/JANGAN halusinasi/i);
  });
});
