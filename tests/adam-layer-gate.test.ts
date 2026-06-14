/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Layer Gate Test
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

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  detectServerIntent,
  matchesBookIntent,
  matchesCodeIntent,
  matchesJournalIntent,
} from '../src/adam-servers/adam-layer-intent';
import { runLayerGatePreCheck } from '../src/adam-servers/adam-layer-gate.service';

describe('adam-layer-intent', () => {
  it.each([
    'tulis jurnal',
    'full V2 journal',
    'jana draf jurnal IMRaD',
  ])('detects journal intent: %s', (phrase) => {
    expect(matchesJournalIntent(phrase)).toBe(true);
    expect(detectServerIntent(phrase)).toBe('JURNAL');
  });

  it.each([
    'tulis bab 3 buku saya',
    'mulakan buku baru',
    'Socratic writing untuk manuskrip',
  ])('detects book intent: %s', (phrase) => {
    expect(matchesBookIntent(phrase)).toBe(true);
    expect(detectServerIntent(phrase)).toBe('BUKU');
  });

  it.each([
    'Build: login page for my app',
    'bina aplikasi React',
    '/build api backend',
  ])('detects code intent: %s', (phrase) => {
    expect(matchesCodeIntent(phrase)).toBe(true);
    expect(detectServerIntent(phrase)).toBe('KOD');
  });

  it('allows plain teaching questions', () => {
    expect(detectServerIntent('Apa itu fotosintesis?')).toBeNull();
    expect(detectServerIntent('Terangkan konsep jurnal akademik')).toBeNull();
  });
});

describe('adam-layer-gate', () => {
  it('allows founder through', async () => {
    const result = await runLayerGatePreCheck({
      message:   'tulis jurnal',
      isFounder: true,
    });
    expect(result.allowed).toBe(true);
  });

  it('blocks layer 1 student journal request when layer 2 closed', async () => {
    const result = await runLayerGatePreCheck({
      userId:    'student-1',
      message:   'tulis jurnal',
      isFounder: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.server).toBe('JURNAL');
    expect(result.reason).toBe('LAYER2_TESTING');
    expect(result.message).toMatch(/Lapisan 1|ujian dalaman/i);
  });

  it('blocks guest code request', async () => {
    const result = await runLayerGatePreCheck({
      message:   'bina aplikasi mobile',
      isFounder: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.server).toBe('KOD');
  });
});
