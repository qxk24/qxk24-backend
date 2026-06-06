import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import {
  appendEpisodicEvidence,
  buildAmaLongTermMemoryBlock,
  buildDualLaneUpdate,
  isAmaBrainV2Enabled,
} from '../../src/lib/ama/ama-brain-integration.service';
import { routeAmaFlow } from '../../src/lib/ama/ama-flow.service';

import type { AlamtologiBrainMasterDocument } from '../../src/qxk24brain/qxk24brain.schema';

const mockMaster = (): AlamtologiBrainMasterDocument => ({
  structuralLane:       'Formula x=m/t governs Faktor Masa.',
  episodicLane:         '',
  unifiedUnderstanding: 'Legacy unified blob.',
  amaLevel:             '124(1)',
  totalTransformations: 42,
  activeFamilies:       [{ family: 'Test', principle: 'MASA', nucleusUid: 'n1', stage: 1, summary: '', masa_opened: new Date() }],
  completedFamilies:    [],
}) as unknown as AlamtologiBrainMasterDocument;

describe('ama-brain-integration', () => {
  const prevV2 = process.env.ADAM_AMA_BRAIN_V2;
  const prevOass = process.env.ADAM_AMA_TAMAT_OASS;

  afterEach(() => {
    if (prevV2 === undefined) delete process.env.ADAM_AMA_BRAIN_V2;
    else process.env.ADAM_AMA_BRAIN_V2 = prevV2;
    if (prevOass === undefined) delete process.env.ADAM_AMA_TAMAT_OASS;
    else process.env.ADAM_AMA_TAMAT_OASS = prevOass;
  });

  it('isAmaBrainV2Enabled respects env flag', () => {
    process.env.ADAM_AMA_BRAIN_V2 = 'true';
    expect(isAmaBrainV2Enabled()).toBe(true);
    process.env.ADAM_AMA_BRAIN_V2 = 'false';
    expect(isAmaBrainV2Enabled()).toBe(false);
  });

  it('appendEpisodicEvidence preserves prior B blocks', () => {
    const first = appendEpisodicEvidence('', 'Data from 42 students', 'tx-1', 'rh');
    const second = appendEpisodicEvidence(first, 'Rain in Kelantan', 'tx-2', 'rh');
    expect(second).toContain('42 students');
    expect(second).toContain('Kelantan');
  });

  it('buildDualLaneUpdate sets C on structural and appends B on episodic', () => {
    const master = mockMaster();
    master.episodicLane = 'Prior episode';
    const out = buildDualLaneUpdate(master, {
      founderId:        'masa-bayu',
      transformationId: 'tx-99',
      episodicB:        'New evidence B',
      structuralC:      'Updated C formula',
      unifiedLegacy:    'Unified for migration',
      family:           'rh',
    });
    expect(out.structuralLane).toBe('Updated C formula');
    expect(out.episodicLane).toContain('Prior episode');
    expect(out.episodicLane).toContain('New evidence B');
    expect(out.unifiedUnderstanding).toBe('Unified for migration');
  });

  describe('buildAmaLongTermMemoryBlock', () => {
    beforeEach(() => {
      process.env.ADAM_AMA_BRAIN_V2 = 'true';
    });

    it('loads Kr only for structural question (OAT IKJ)', () => {
      const block = buildAmaLongTermMemoryBlock(mockMaster(), 8000, {
        message:   'Apakah formula x=m/t?',
        isFounder: true,
      });
      expect(block).toContain('Kotak 2');
      expect(routeAmaFlow('Apakah formula x=m/t?').lane).toBe('IKJ');
    });

    it('loads Kn for episodic recall question', () => {
      const master = mockMaster();
      master.episodicLane = 'P.alt taught during rain in Kelantan.';
      const block = buildAmaLongTermMemoryBlock(master, 8000, {
        message:   'Adam, ingat tak waktu kita di Kelantan?',
        isFounder: true,
      });
      expect(block).toContain('Kotak 3');
      expect(block).toContain('Kelantan');
    });

    it('loads both lanes on mixed question only when Tamat OASS enabled', () => {
      process.env.ADAM_AMA_TAMAT_OASS = 'false';
      const master = mockMaster();
      master.episodicLane = 'Teaching in Kelantan during rain.';
      const q = 'Formula x=m/t yang P.alt ajar waktu hujan di Kelantan?';
      const block = buildAmaLongTermMemoryBlock(master, 8000, {
        message:   q,
        isFounder: true,
      });
      expect(routeAmaFlow(q).needsOass).toBe(true);
      expect(block).toContain('Kotak 2');
      expect(block).not.toContain('Kotak 3');
    });

    it('loads both lanes on mixed question when Tahap 3 OASS default on', () => {
      delete process.env.ADAM_AMA_TAMAT_OASS;
      const master = mockMaster();
      master.episodicLane = 'Teaching in Kelantan during rain.';
      const q = 'Formula x=m/t yang P.alt ajar waktu hujan di Kelantan?';
      const block = buildAmaLongTermMemoryBlock(master, 8000, {
        message:   q,
        isFounder: true,
      });
      expect(routeAmaFlow(q).needsOass).toBe(true);
      expect(block).toContain('Kotak 2');
      expect(block).toContain('Kotak 3');
    });
  });
});
