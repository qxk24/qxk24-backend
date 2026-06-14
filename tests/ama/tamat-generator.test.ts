/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Tamat Generator Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { describe, expect, it } from '@jest/globals';
import {
  generateTamat,
  generateTamatSingleLane,
  buildTamatLayer5PromptBlock,
  crossLaneCoherence,
} from '../../src/lib/ama/tamat-generator';
import { routeAmaFlow } from '../../src/lib/ama/ama-flow.service';
import { resolveOassActivation } from '../../src/lib/ama/ama-oass-gate';

describe('tamat-generator', () => {
  it('single lane IKJ uses Kr only', () => {
    const out = generateTamatSingleLane({
      kr:   'Formula x=m/t menetapkan Faktor Masa.',
      kn:   'Rain in Kelantan episode.',
      lane: 'IKJ',
    });
    expect(out.body).toContain('x=m/t');
    expect(out.body).not.toContain('Kelantan');
    expect(out.integrated).toBe(false);
  });

  it('single lane LWJ uses Kn only', () => {
    const out = generateTamatSingleLane({
      kr:   'Formula x=m/t.',
      kn:   'P.alt taught during rain in Kelantan.',
      lane: 'LWJ',
    });
    expect(out.body).toContain('Kelantan');
    expect(out.integrated).toBe(false);
  });

  it('buildTamatLayer5PromptBlock marks OASS disabled when flag off', () => {
    const prevV2 = process.env.ADAM_AMA_BRAIN_V2;
    const prevOass = process.env.ADAM_AMA_TAMAT_OASS;
    process.env.ADAM_AMA_BRAIN_V2 = 'true';
    process.env.ADAM_AMA_TAMAT_OASS = 'false';

    const route = routeAmaFlow('Apakah formula x=m/t?');
    const tamat = generateTamatSingleLane({ kr: 'Formula.', kn: 'Episode.', lane: 'IKJ' });
    const oass = resolveOassActivation('Apakah formula x=m/t?');
    const block = buildTamatLayer5PromptBlock(route, tamat, oass);

    expect(block).toContain('OASS DISABLED');
    expect(block).toContain('KOTAK 20–22');

    if (prevV2 === undefined) delete process.env.ADAM_AMA_BRAIN_V2;
    else process.env.ADAM_AMA_BRAIN_V2 = prevV2;
    if (prevOass === undefined) delete process.env.ADAM_AMA_TAMAT_OASS;
    else process.env.ADAM_AMA_TAMAT_OASS = prevOass;
  });

  it('buildTamatLayer5PromptBlock shows OASS active on mixed low-confidence', () => {
    const prevV2 = process.env.ADAM_AMA_BRAIN_V2;
    const prevOass = process.env.ADAM_AMA_TAMAT_OASS;
    process.env.ADAM_AMA_BRAIN_V2 = 'true';
    delete process.env.ADAM_AMA_TAMAT_OASS;

    const q = 'Formula x=m/t yang P.alt ajar waktu hujan di Kelantan?';
    const route = routeAmaFlow(q);
    const tamat = generateTamat({ kr: 'Formula x=m/t.', kn: 'Rain in Kelantan.', mode: 'OASS', oassActive: true });
    const oass = resolveOassActivation(q);
    const block = buildTamatLayer5PromptBlock(route, tamat, oass);

    expect(oass.active).toBe(true);
    expect(block).toContain('OASS ACTIVE');
    expect(block).toContain('mixed_lane_low_confidence');

    if (prevV2 === undefined) delete process.env.ADAM_AMA_BRAIN_V2;
    else process.env.ADAM_AMA_BRAIN_V2 = prevV2;
    if (prevOass === undefined) delete process.env.ADAM_AMA_TAMAT_OASS;
    else process.env.ADAM_AMA_TAMAT_OASS = prevOass;
  });

  it('single lane output when OASS inactive', () => {
    const out = generateTamat({
      kr:         'Prinsip: x=m/t mengatur Faktor Masa.',
      kn:         'Konteks: hujan di Kelantan.',
      mode:       'OAT',
      oassActive: false,
    });
    expect(out.integrated).toBe(false);
    expect(out.sentenceCount).toBeLessThanOrEqual(3);
  });

  it('integrates Kr + Kn when OASS active and coherence high', () => {
    const kr = 'Formula x=m/t menetapkan PG mesti hadir.';
    const kn = 'Saya rasa salah sejak solat subuh hari tu.';
    const coherence = crossLaneCoherence(kr, kn);
    const out = generateTamat({
      kr,
      kn,
      mode:       'OASS',
      oassActive: true,
    });
    expect(out.sentenceCount).toBeLessThanOrEqual(3);
    if (coherence >= 0.75) {
      expect(out.integrated).toBe(true);
    } else {
      expect(out.body).toMatch(/Prinsip:/);
      expect(out.body).toMatch(/Konteks:/);
    }
  });

  it('deep turn sample contains principle and context cues', () => {
    const out = generateTamat({
      kr:         'Formula x=m/t kata PG mesti hadir.',
      kn:         'Saya rasa salah sejak solat subuh hari tu.',
      mode:       'OASS',
      oassActive: true,
    });
    expect(out.principleBlock).toBeTruthy();
    expect(out.contextBlock).toBeTruthy();
  });
});
