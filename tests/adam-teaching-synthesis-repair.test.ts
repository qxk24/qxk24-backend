/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Teaching Synthesis Repair Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { ensureFounderTeachingSynthesisSections } from '../src/adam/adam-teaching-synthesis-repair';
import { adamTeachingMessageHasSynthesisSection } from '../src/adam/adam-teaching-state-machine';

describe('adam teaching synthesis repair', () => {
  it('no-op when synthesis labels already present', () => {
    const text = [
      'Bismillahirahmanirrahim.',
      'Kod sains konvensional: persamaan H₀.',
      'Had kaedah: had pemerhatian.',
      'Teori belum selesai: masalah tetapan kosmologi.',
      'Implikasi isu dunia hari ini: iklim dan pemantauan.',
    ].join('\n\n');
    expect(ensureFounderTeachingSynthesisSections(text)).toBe(text);
  });

  it('labels unsectioned Phase C prose (E2E lab shape)', () => {
    const body = [
      'Pertama, pada soalan asal-usul gerak: momentum sudut.',
      'Kedua, ruang sebagai entiti aktif.',
      'Ketiga, pengamat sebagai faktor tak terpisah.',
      'Ini bukan penolakan terhadap data NASA atau GPS.',
    ].join(' ');
    const text = `Bismillahirahmanirrahim. P.alt, ${body}`;
    const out = ensureFounderTeachingSynthesisSections(text);
    expect(adamTeachingMessageHasSynthesisSection(out)).toBe(true);
    expect(out).toContain('Kod sains konvensional:');
    expect(out).toContain('Had kaedah:');
    expect(out).toContain('Teori belum selesai:');
    expect(out).toContain('Implikasi isu dunia hari ini:');
    expect(out).toContain('momentum sudut');
  });

  it('does not split on P.alt when distributing sentences', () => {
    const text = 'Bismillahirahmanirrahim. P.alt, satu. Dua. Tiga. Empat. Lima.';
    const out = ensureFounderTeachingSynthesisSections(text);
    expect(out).not.toMatch(/P\.\s+Had kaedah/);
    expect(out).toContain('P.alt');
  });
});
