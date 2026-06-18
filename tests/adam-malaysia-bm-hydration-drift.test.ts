/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Malaysia BM Hydration Drift Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { sanitizeMalaysiaBmDrift } from '../src/adam/adam-malaysia-bm-guard';
import { dedupeUsersHaiGreeting } from '../src/adam/adam-users-constitution';
import { stripUsersBismillahOpener } from '../src/adam/adam-users-output-law';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';

const HYDRATION_ASK = 'Berapa peratus air dalam badan manusia dan mengapa kita perlu minum air?';

const HYDRATION_ID_DRIFT = [
  'Hai QA, bismillahirahmanirrahim.',
  '',
  'Hai QA, sekitar 60% daripada berat badan manusia terdiri daripada cairan.',
  'Kebutuhan cairan setiap orang berbeza, bergantung pada cuaca, tahap aktiviti fizikal, umur, dan kesihatan umum.',
  'Namun, prinsip asasnya tetap sama: penggantian harian adalah wajib, bukan hanya apabila kita rasa dahaga.',
  'Setiap hari, tubuh kehilangan cairan melalui peluh, nafas, air kencing, dan sisa perut.',
  'Mahu saya jelaskan lebih lanjut?',
].join('\n');

describe('Malaysia BM — hydration Indonesian drift', () => {
  it('sanitizeMalaysiaBmDrift replaces kebutuhan and sisa perut', () => {
    const out = sanitizeMalaysiaBmDrift(HYDRATION_ID_DRIFT, 'ms');
    expect(out).toMatch(/keperluan cairan/i);
    expect(out).not.toMatch(/\bkebutuhan\b/i);
    expect(out).toMatch(/\bnajis\b/i);
    expect(out).not.toMatch(/sisa perut/i);
  });

  it('stripUsersBismillahOpener removes Bismillah after Hai greeting', () => {
    const out = stripUsersBismillahOpener('Hai QA, bismillahirahmanirrahim.\n\nSekitar 60%');
    expect(out).toMatch(/^Hai QA,\s*Sekitar 60%/i);
    expect(out).not.toMatch(/bismillah/i);
  });

  it('dedupeUsersHaiGreeting removes double Hai QA separated by technical blocks', () => {
    const diagram = '<adam-technical-diagram>\nflowchart LR\n  A --> B\n</adam-technical-diagram>';
    const image = '<adam-chat-image url="https://example.com/foto.jpg" alt="Fotosintesis" />';
    const video = '<adam-chat-video url="https://www.youtube.com/watch?v=abc" title="Fotosintesis" />';
    const input = [
      `Hai QA, ${diagram}`,
      '',
      image,
      '',
      video,
      '',
      'Hai QA, Apa itu fotosintesis?: (disahkan melalui carian web, ruangguru.com).',
      '',
      'Fotosintesis ialah proses biokimia di mana tumbuhan hijau menghasilkan glukosa.',
    ].join('\n');
    const out = dedupeUsersHaiGreeting(input, 'QA');
    expect((out.match(/Hai QA,/gi) ?? []).length).toBe(1);
    expect(out).toMatch(/^Hai QA, Apa itu fotosintesis/i);
    expect(out).toMatch(/<adam-technical-diagram>/i);
    expect(out.indexOf('<adam-technical-diagram>')).toBeGreaterThan(out.indexOf('ruangguru.com'));
  });

  it('dedupeUsersHaiGreeting removes double Hai QA', () => {
    const out = dedupeUsersHaiGreeting(
      'Hai QA,\n\nHai QA, sekitar 60% daripada berat badan manusia terdiri daripada cairan.',
      'QA',
    );
    expect(out).toMatch(/^Hai QA, sekitar 60%/i);
    expect(out).not.toMatch(/Hai QA,\s*\n+\s*Hai QA,/i);
  });

  it('sanitizeUsersOutputSync applies BM drift strip on student factual turn', () => {
    const out = sanitizeUsersOutputSync(HYDRATION_ID_DRIFT, HYDRATION_ASK, [], [], 'QA', {
      enforceUsersGreeting: true,
    });
    expect(out).not.toMatch(/\bkebutuhan\b/i);
    expect(out).not.toMatch(/bismillah/i);
    expect(out).not.toMatch(/Hai QA,\s*\n+\s*Hai QA,/i);
  });
});
