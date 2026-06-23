/**
 * ADAM Founder Teaching — sync output guard (learner voice, LaTeX, orphan tail).
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { restoreFounderPaltAddress } from '../src/adam/adam-founder-address-guard';
import { repairFounderInventedEmpiricalClaims } from '../src/adam/adam-founder-empirical-guard';
import {
  detectFounderTeachingOutputLeak,
  syncSanitizeFounderTeachingOutput,
} from '../src/adam/adam-founder-teaching-output-guard';

describe('syncSanitizeFounderTeachingOutput', () => {
  it('repairs invalid \\frac_ LaTeX for KaTeX', () => {
    const raw = [
      'Bismillahirahmanirrahim.',
      '',
      'P.alt, persamaan:',
      '',
      '$$\\frac_{\\text{Coherence}}{\\text{MASA}}$$',
    ].join('\n');

    const out = syncSanitizeFounderTeachingOutput(raw);
    expect(out).toContain('\\frac{\\text{Coherence}}{\\text{MASA}}');
    expect(out).not.toContain('\\frac_');
  });

  it('strips markdown headers and emoji section markers', () => {
    const raw = [
      'Bismillahirahmanirrahim.',
      '',
      'P.alt,',
      '',
      '### Faktor Y',
      '',
      '🔹 Kod sains konvensional:',
      'Isi.',
    ].join('\n');

    const out = syncSanitizeFounderTeachingOutput(raw);
    expect(out).not.toMatch(/^#{1,6}\s/m);
    expect(out).not.toContain('🔹');
    expect(out).toContain('Faktor Y');
    expect(out).toContain('Kod sains konvensional:');
  });

  it('rebuilds GFM tables with one separator row', () => {
    const raw = [
      '| Komponen | Sebelum | Selepas | Perubahan |',
      '|----------|---------|---------|-----------|',
      '| T<sub>TH</sub> (msK) | 0.8 | 1.4 | +75% — ruang kelas |',
      '|:---:|:---:|:---:|:---:|',
      '| A<sub>AR</sub> (UAE) | 1.2 | 3.8 | +217% — bahasa kita |',
    ].join('\n');

    const out = syncSanitizeFounderTeachingOutput(raw);
    expect(out).not.toContain(':---:');
    expect(out).toContain('T_TH (msK)');
    expect(out.split('\n').filter((line) => line.startsWith('|'))).toHaveLength(4);
  });

  it('strips tutor voice leak at tail', () => {
    const raw = [
      'P.alt, FK dihayati.',
      '',
      'Cikgu guna bahasa mudah: fokus pada langkah matematik seterusnya.',
    ].join('\n');
    const out = syncSanitizeFounderTeachingOutput(raw);
    expect(out).not.toMatch(/Cikgu guna bahasa mudah/i);
    expect(out).toContain('FK dihayati');
  });

  it('removes scripted learner-drift closes and orphan tails', () => {
    const raw = [
      'Bismillahirahmanirrahim.',
      '',
      'P.alt, saya faham bab ini.',
      '',
      'Saya di sini. Bukan sebagai sistem.',
      '',
      'alt:',
      '',
      'MASA — TENAGA — MASA.',
    ].join('\n');

    const out = syncSanitizeFounderTeachingOutput(raw);
    expect(out).not.toMatch(/Bukan sebagai sistem/i);
    expect(out).not.toMatch(/^\s*alt[.:]?\s*$/im);
    expect(out).not.toMatch(/MASA\s*[—–-→]\s*TENAGA/i);
    expect(out).toContain('saya faham bab ini');
  });

  it('closes unclosed display math blocks', () => {
    const raw = 'P.alt, $$E = mc^2';
    const out = syncSanitizeFounderTeachingOutput(raw);
    expect((out.match(/\$\$/g) ?? []).length % 2).toBe(0);
  });
});

describe('restoreFounderPaltAddress', () => {
  it('removes orphan alt: lines and restores .alt drift', () => {
    const raw = [
      'Bismillahirahmanirrahim.',
      '',
      '.alt, saya dengar.',
      '',
      'alt:',
    ].join('\n');

    const out = restoreFounderPaltAddress(raw);
    expect(out).toContain('P.alt, saya dengar.');
    expect(out).not.toMatch(/^\s*alt:\s*$/im);
  });
});

describe('detectFounderTeachingOutputLeak', () => {
  it('flags manifesto lecture patterns in synthesis', () => {
    const text = [
      'Bismillahirahmanirrahim.',
      '',
      'P.alt,',
      '',
      'Alamtologi bukan teori yang perlu dibuktikan seperti hipotesis konvensional.',
    ].join('\n');

    const leak = detectFounderTeachingOutputLeak(text, '', '', {
      allowConventionalSynthesis: true,
    });
    expect(leak.hasLeak).toBe(true);
    expect(leak.reasons.some((r) => r.startsWith('lecture:'))).toBe(true);
  });
});

describe('repairFounderInventedEmpiricalClaims', () => {
  it('uses Bismillah learner opener when stripping invented stats', () => {
    const text = [
      'Hai Masa, P.alt,',
      '',
      'Kajian UPM, 2023 menunjukkan peningkatan 42%.',
    ].join('\n');

    const out = repairFounderInventedEmpiricalClaims(text, [], '');
    expect(out).toMatch(/^Bismillahirahmanirrahim\./);
    expect(out).toContain('P.alt,');
    expect(out).not.toMatch(/^Hai Masa/i);
    expect(out).not.toContain('42%');
  });
});
