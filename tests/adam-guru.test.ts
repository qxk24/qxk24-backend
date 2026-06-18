/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAMGuru Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  ADAMGURU_EDUCATION_LAW,
  ADAMGURU_SLEEP_LISTENING,
  buildGuruLaneContextBlock,
  buildGuruProfileContextBlock,
} from '../src/adam/adam-guru-prompts';
import { isGuruProfileComplete } from '../src/adam/adam-guru-profile.service';
import { guruKelasSessionId, isKelasAdamAwake, newKelasJoinCode } from '../src/adam/adam-guru.service';
import { PAS_KELAS_PRICE_MYR } from '../src/adam/adam-guru-student-access.service';
import { getWebSearchGateReason } from '../src/adam/adam-web-search';

describe('ADAMGuru prompts', () => {
  it('mandates educate-not-photocopy and unified voice', () => {
    expect(ADAMGURU_EDUCATION_LAW).toMatch(/EDUCATE/i);
    expect(ADAMGURU_EDUCATION_LAW).toMatch(/same warm voice/i);
    expect(ADAMGURU_EDUCATION_LAW).toMatch(/Synthesise/i);
  });

  it('builds guru identity block for ADAM context', () => {
    const block = buildGuruProfileContextBlock({
      fullName:        'Ahmad Ali',
      credentialTitle: 'Dr.',
      institution:     'UIAM',
      email:           'dr.ali@example.com',
      country:         'Malaysia',
      bio:             'Clinical anatomist.',
      subjects:        ['Anatomy', 'Physiology'],
      teachingFocus:   'Formation through clinical cases',
    });
    expect(block).toContain('Dr. Ahmad Ali');
    expect(block).toContain('Anatomy, Physiology');
    expect(block).toContain('[END GURU IDENTITY]');
  });

  it('builds guru lane block scoped to teacher', () => {
    const block = buildGuruLaneContextBlock({
      guruName:   'Dr Ali',
      subject:    'Anatomy',
      title:      'Kelas Sem 1',
      laneDigest: 'Heart has four chambers.',
    });
    expect(block).toContain('Dr Ali');
    expect(block).toContain('Heart has four chambers');
    expect(block).toContain('[END GURU LANE]');
  });
});

describe('ADAMGuru profile completeness', () => {
  it('requires name, institution, and at least one subject', () => {
    expect(isGuruProfileComplete(null)).toBe(false);
    expect(isGuruProfileComplete({ fullName: 'Ali', institution: 'UIAM', subjects: [] })).toBe(false);
    expect(isGuruProfileComplete({ fullName: 'Ali', institution: 'UIAM', subjects: ['Anatomy'] })).toBe(true);
  });
});

describe('ADAMGuru kelas sleep', () => {
  it('defines sleep as silent presence not absence', () => {
    expect(ADAMGURU_SLEEP_LISTENING).toMatch(/monitoring/i);
    expect(ADAMGURU_SLEEP_LISTENING).toMatch(/not offline/i);
    expect(ADAMGURU_SLEEP_LISTENING).toMatch(/withheld speech/i);
  });

  it('defaults missing flag to awake', () => {
    expect(isKelasAdamAwake({})).toBe(true);
    expect(isKelasAdamAwake({ adamAwake: true })).toBe(true);
    expect(isKelasAdamAwake({ adamAwake: false })).toBe(false);
  });
});

describe('ADAMGuru student kelas access', () => {
  it('Pas Kelas add-on price is RM 15', () => {
    expect(PAS_KELAS_PRICE_MYR).toBe(15);
  });
});

describe('ADAMGuru join codes', () => {
  it('generates 8-character uppercase join codes', () => {
    const code = newKelasJoinCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[0-9A-F]{8}$/);
  });
});

describe('ADAMGuru session ids', () => {
  it('uses deterministic kelas session prefix', () => {
    expect(guruKelasSessionId('kelas-abc')).toBe('K24s-guru-kelas-abc');
  });
});

describe('ADAMGuru — student search gate', () => {
  it('substantive kelas teaching asks answer from knowledge — no blanket search', () => {
    expect(
      getWebSearchGateReason('Terangkan struktur jantung', { userUmumChannelGate: true }),
    ).toBeNull();
  });
});
