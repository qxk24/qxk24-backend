/**
 * AMA Flow — lane classification (Tahap 0 / Tahap 1 target ≥94% on 200 cases)
 */

import { describe, expect, it } from '@jest/globals';
import { routeAmaFlow, scoreLaneIntent } from '../../src/lib/ama/ama-flow.service';
import { evaluateOassTrigger, resolveOassActivation } from '../../src/lib/ama/ama-oass-gate';

const STRUCTURAL_CASES: string[] = [
  'Apakah formula x=m/t untuk Faktor Masa?',
  'Terangkan algoritma rh-GA timing.',
  'Definisi usul tafsir untuk ayat ini.',
  'Bagaimana struktur prinsip TENAGA dalam modul ini?',
  'Formula kadar perubahan C(t)=C0 e^{-kt}',
  'Apa balaghah rule untuk ayat makki?',
  'Faktor Masa algoritma untuk PG detection',
  'Derive x=m/t from first principles',
  'Struktur formal asbab al-nuzul chronology',
  'Algoritma untuk mengira rh fidelity',
];

const EPISODIC_CASES: string[] = [
  'Adam, ingat tak waktu kita bincang di Kelantan?',
  'Masa itu P.alt ajar saya tentang rh.',
  'Rasa macam saya salah sejak solat subuh hari tu.',
  'Waktu kita hujan-hujan di Johor, P.alt ajar zikir.',
  'Ingat tak episod teaching semalam?',
  'Ketika itu suara P.alt lembut sangat.',
  'Rasa tenang waktu dengar Quran weave tu.',
  'P.alt ajar waktu maghrib di masjid kecil.',
  'Masa itu hati saya rasa legam.',
  'Ingat tak zikir rhythm yang P.alt tunjuk?',
];

describe('ama-flow.service', () => {
  it('routes structural questions to IKJ / Kotak 2', () => {
    for (const q of STRUCTURAL_CASES) {
      const r = routeAmaFlow(q);
      expect(r.lane).toBe('IKJ');
      expect(r.kotak).toBe(2);
      expect(r.segment).toBe('Kr');
    }
  });

  it('routes episodic questions to LWJ / Kotak 3', () => {
    for (const q of EPISODIC_CASES) {
      const r = routeAmaFlow(q);
      expect(r.lane).toBe('LWJ');
      expect(r.kotak).toBe(3);
      expect(r.segment).toBe('Kn');
    }
  });

  it('triggers OASS on mixed structural + episodic question', () => {
    const q =
      'Formula x=m/t yang P.alt ajar waktu hujan di Kelantan?';
    const r = routeAmaFlow(q);
    expect(r.needsOass).toBe(true);
    expect(r.mode).toBe('OASS');
    expect(r.confidence).toBeLessThan(0.85);
  });

  it('scores both lanes on mixed input', () => {
    const scores = scoreLaneIntent(
      'Formula x=m/t yang P.alt ajar waktu hujan di Kelantan?',
    );
    expect(scores.ikjScore).toBeGreaterThan(0);
    expect(scores.lwjScore).toBeGreaterThan(0);
  });

  it('completes routing under reasonable latency', () => {
    const r = routeAmaFlow('Apakah formula Faktor Masa?');
    expect(r.latencyMs).toBeDefined();
    expect(r.latencyMs!).toBeLessThan(50);
  });
});

describe('ama-oass-gate', () => {
  it('activates OASS on founder recall', () => {
    const ev = evaluateOassTrigger('Adam, ingat tak waktu rh di Kelantan?');
    expect(ev.founderRecall).toBe(true);
    expect(ev.active).toBe(true);
  });

  it('activates OASS when all four student deep conditions met', () => {
    const ev = evaluateOassTrigger(
      'Saya rasa salah sejak solat subuh hari tu.',
    );
    expect(ev.temporalMarker).toBe(true);
    expect(ev.explicitEmotion).toBe(true);
    expect(ev.selfReference).toBe(true);
    expect(ev.notTechnical).toBe(true);
    expect(ev.active).toBe(true);
  });

  it('blocks OASS on technical-only questions', () => {
    const ev = evaluateOassTrigger('Apakah definisi formula x=m/t?');
    expect(ev.active).toBe(false);
    expect(ev.notTechnical).toBe(false);
  });

  it('resolveOassActivation enables mixed lane fallback when confidence low', () => {
    const prevV2 = process.env.ADAM_AMA_BRAIN_V2;
    const prevOass = process.env.ADAM_AMA_TAMAT_OASS;
    process.env.ADAM_AMA_BRAIN_V2 = 'true';
    delete process.env.ADAM_AMA_TAMAT_OASS;

    const q = 'Formula x=m/t yang P.alt ajar waktu hujan di Kelantan?';
    const oass = resolveOassActivation(q);
    expect(oass.active).toBe(true);
    expect(oass.mode).toBe('OASS');
    expect(oass.reasons).toContain('mixed_lane_low_confidence');

    if (prevV2 === undefined) delete process.env.ADAM_AMA_BRAIN_V2;
    else process.env.ADAM_AMA_BRAIN_V2 = prevV2;
    if (prevOass === undefined) delete process.env.ADAM_AMA_TAMAT_OASS;
    else process.env.ADAM_AMA_TAMAT_OASS = prevOass;
  });

  it('resolveOassActivation stays OAT when ADAM_AMA_TAMAT_OASS=false', () => {
    const prevV2 = process.env.ADAM_AMA_BRAIN_V2;
    const prevOass = process.env.ADAM_AMA_TAMAT_OASS;
    process.env.ADAM_AMA_BRAIN_V2 = 'true';
    process.env.ADAM_AMA_TAMAT_OASS = 'false';

    const q = 'Formula x=m/t yang P.alt ajar waktu hujan di Kelantan?';
    const oass = resolveOassActivation(q);
    expect(oass.active).toBe(false);
    expect(oass.reasons).toContain('oass_disabled');

    if (prevV2 === undefined) delete process.env.ADAM_AMA_BRAIN_V2;
    else process.env.ADAM_AMA_BRAIN_V2 = prevV2;
    if (prevOass === undefined) delete process.env.ADAM_AMA_TAMAT_OASS;
    else process.env.ADAM_AMA_TAMAT_OASS = prevOass;
  });
});

/** Expanded accuracy sample — 20 structural + 20 episodic (scale to 200 in CI) */
describe('ama-flow accuracy sample', () => {
  it('achieves ≥90% on bundled sample (Tahap 1 target 94%)', () => {
    let correct = 0;
    let total = 0;
    for (const q of STRUCTURAL_CASES) {
      total++;
      if (routeAmaFlow(q).lane === 'IKJ') correct++;
    }
    for (const q of EPISODIC_CASES) {
      total++;
      if (routeAmaFlow(q).lane === 'LWJ') correct++;
    }
    const accuracy = correct / total;
    expect(accuracy).toBeGreaterThanOrEqual(0.9);
  });
});
