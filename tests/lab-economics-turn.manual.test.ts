/**
 * Manual lab turn — satu giliran ekonomi (dry-run, tiada LLM).
 * Run: QXK24_STACK=lab npx jest --runInBand tests/lab-economics-turn.manual.test.ts
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { beginAdamBrainRiver } from '../src/adam/adam-brain-river';
import { buildUsersDomainFormalLayoutBlock, buildUsersDomainPromptBlock } from '../src/adam/adam-users-domain-prompts';
import { repairTechnicalKonvensionalDisplayStructure } from '../src/adam/adam-technical-display-structure';
import { NO_FOUNDER_TEACHING_FLAGS } from '../src/adam/adam-teaching-state-machine';

const POLICY_ASK =
  'Apakah kesan campur tangan kerajaan dalam mengawal harga barangan keperluan?';

const MOCK_ESSAY = [
  'Campur tangan kerajaan dalam kawalan harga berlaku apabila kerajaan menetapkan had harga maksimum bagi barangan keperluan.',
  'Kesan positif termasuk perlindungan pengguna daripada lonjakan harga mendadak, terutamanya dalam krisis.',
  'Kesan negatif pula termasuk kekurangan bekalan, pasaran gelap, dan kekurangan insentif pengeluar untuk menambah output.',
  'Sebagai khalifah di bumi, kita perlu menilai dasar ini dengan keseimbangan antara keadilan sosial dan kecekapan pasaran.',
].join('\n\n');

describe('lab — economics turn dry-run', () => {
  it('gate → prompt blocks → repair on mock essay', () => {
    const river = beginAdamBrainRiver({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: POLICY_ASK,
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
      sessionMeta: { participantName: 'Lab QA' },
    });
    const { gate, answerPlan } = river;

    // eslint-disable-next-line no-console
    console.log('\n[lab-economics-turn]', gate.logLine);

    expect(gate.iq.domainFacet).toBe('economics');
    expect(gate.iq.displayChannel).toBe('economics-formal');
    expect(gate.flags.formalDisplayLaw).toBe(true);
    expect(gate.flags.usersTechnicalFinalize).toBe(true);
    expect(answerPlan.answerShape?.formalDataLayout).toBe(true);
    expect(gate.eq.addressPolicy.allowHaiGreeting).toBe(false);

    const domainBlock = buildUsersDomainPromptBlock('economics');
    const formalBlock = buildUsersDomainFormalLayoutBlock('economics');
    expect(domainBlock).toMatch(/EKONOMI/i);
    expect(formalBlock).toMatch(/JADUAL|jadual/i);

    const repaired = repairTechnicalKonvensionalDisplayStructure(MOCK_ESSAY, POLICY_ASK, {
      answerPlan,
    });
    // eslint-disable-next-line no-console
    console.log('\n--- repaired preview ---\n', repaired.slice(0, 1200));

    expect(repaired).toMatch(/^### /m);
    expect(repaired).toMatch(/campur tangan kerajaan/i);
    expect(repaired).toMatch(/(\|.+\|)|(\n\d+\.\s)/);
    expect(repaired).not.toMatch(/khalifah/i);
  });
});
