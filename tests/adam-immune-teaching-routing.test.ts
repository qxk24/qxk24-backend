/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Immune / Biology Teaching Routing Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  isAdamEducationalWebSearchTurn,
  isAdamScienceNatureSynthesisTurn,
  isAdamTeachingDepthTurn,
} from '../src/adam/adam-response-generation';
import { resolveUserUmumCadanganTurn } from '../src/adam/adam-universal-scholar';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { buildPrefetchedSearchContextBlock } from '../src/adam/adam-search-first';
import { repairTeachingStructuredOutput } from '../src/adam/adam-users-output-law';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';

const IMMUNE_ASK = 'Berapa lama tindak balas imun adaptif terhadap patogen baharu?';

const IMMUNE_PROSE = [
  'Hai QA, Tindak balas imun adaptif terhadap patogen baharu adalah proses yang memerlukan masa.',
  'Pertama, sel dendritik atau makrofag menangkap patogen baharu, kemudian membawanya ke kelenjar limfa.',
  'Kedua, sel T pembantu yang sesuai diaktifkan, lalu mengeluarkan sitokin.',
  'Ketiga, sel B menghasilkan antibodi yang khusus mengikat patogen tersebut.',
].join('\n\n');

describe('immune / biology teaching routing', () => {
  it('detects berapa lama + imun as teaching depth and science synthesis', () => {
    expect(isAdamTeachingDepthTurn(IMMUNE_ASK)).toBe(true);
    expect(isAdamScienceNatureSynthesisTurn(IMMUNE_ASK)).toBe(true);
    expect(isAdamEducationalWebSearchTurn(IMMUNE_ASK)).toBe(true);
    expect(resolveUserUmumCadanganTurn(IMMUNE_ASK, [], [])).toBe(false);
  });

  it('injects teaching depth + structured layout, not cadangan short format', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode: 'TEACHING',
      isFounder: false,
      userMessage: IMMUNE_ASK,
      participantName: 'QA',
      founderStudentsBlock: '',
    });
    expect(prompt).toMatch(/TEACHING DEPTH/i);
    expect(prompt).toMatch(/KULIAH BERSTRUKTUR/i);
    expect(prompt).not.toMatch(/CADANGAN \(this turn — substantive User ask\)/);
  });

  it('zero web hits still allows full structured lecture — not "0 results" stub', () => {
    const block = buildPrefetchedSearchContextBlock([], { userMessage: IMMUNE_ASK, isFounder: false });
    expect(block).toMatch(/CONVENTIONAL TEACHING OK/i);
    expect(block).not.toMatch(/TWO short sentences/i);
    expect(block).not.toMatch(/paste an official URL/i);
  });

  it('repairs Pertama/Kedua/Ketiga paragraphs into numbered list', () => {
    const repaired = repairTeachingStructuredOutput(IMMUNE_PROSE);
    expect(repaired).toMatch(/^1\.\s+[Ss]el dendritik/m);
    expect(repaired).toMatch(/^2\.\s+sel T pembantu/m);
    expect(repaired).toMatch(/^3\.\s+sel B/m);
    expect(repaired).not.toMatch(/^Pertama,/m);
    const out = sanitizeUsersOutputSync(IMMUNE_PROSE, IMMUNE_ASK, [], [], 'QA');
    expect(out).toMatch(/^1\.\s+[Ss]el dendritik/m);
    expect(out).not.toMatch(/^Pertama,/m);
  });
});
