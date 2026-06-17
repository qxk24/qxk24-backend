/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Photosynthesis Media + Leak Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';
import {
  resolveStudentStreamSurface,
} from '../src/adam/adam-student-output-guard';
import { repairAdamMediaOutput } from '../src/adam/adam-media-guard';
import { extractMediaFromSearchHits } from '../src/adam/adam-media-search';
import { repairTechnicalDiagramOutput } from '../src/adam/adam-technical-diagram-guard';

const SEARCH_MEDIA_HITS = extractMediaFromSearchHits([
  {
    title: 'Fotosintesis',
    url: 'https://en.wikipedia.org/wiki/Photosynthesis',
    snippet: 'Rajah: https://upload.wikimedia.org/wikipedia/commons/5/55/Photosynthesis_en.svg Video: https://www.youtube.com/watch?v=UPBMG5EYydo',
  },
]);

const ASK = 'Apa itu fotosintesis? Tunjuk gambar dan video.';

const USER_PRODUCTION_BAD = [
  'Hai QA, Fotosintesis ialah proses biokimia di mana tumbuhan hijau, alga, dan sesetengah bakteria menghasilkan glukosa (gula) dan oksigen daripada karbon dioksida dan air, dengan bantuan tenaga cahaya matahari. Proses ini berlaku terutamanya dalam kloroplas, organel yang mengandungi pigmen hijau bernama klorofil.',
  'Tanpa fotosintesis, tiada oksigen yang cukup untuk kehidupan haiwan dan manusia, dan rantai makanan akan runtuh.',
  'Proses ini bukan sekadar reaksi kimia biasa, ia adalah satu sistem penyelarasan antara *MASA*, *TENAGA*, dan *CAHAYA*: cahaya masuk pada waktu tertentu (*MASA*), diubah menjadi tenaga kimia (*TENAGA*), lalu disimpan dalam ikatan molekul glukosa sebagai bentuk kehidupan yang boleh dialirkan (*CAHAYA* sebagai prinsip kebermaknaan).',
  'Sayangnya, saya tidak dapat menunjukkan gambar atau video secara langsung dalam chat ini. Namun, anda boleh mencari dengan mudah menggunakan kata kunci seperti:',
  '- *"fotosintesis animasi 3D Bahasa Melayu"* (untuk video pendek yang jelas)',
  '- *"diagram fotosintesis lengkap BM"* (untuk rajah berlabel dalam Bahasa Melayu)',
].join('\n\n');

const BAD = [
  'Hai QA, Fotosintesis ialah proses biokimia di mana tumbuhan hijau menghasilkan glukosa dan oksigen daripada karbon dioksida dan air, dengan bantuan tenaga cahaya matahari serta klorofil.',
  '**6CO₂ + 6H₂O + cahaya → C₆H₁₂O₆ + 6O₂**',
  'Tumbuhan bukan sekadar "menghasilkan makanan", mereka menyelaraskan MASA (waktu siang/malam), TENAGA (cahaya sebagai input), dan RUANG (struktur daun, stoma, kloroplas) secara tepat.',
  'Saya tidak boleh menunjukkan gambar atau video secara langsung dalam chat ini, tetapi saya boleh bantu anda mencarinya dengan tepat.',
  'Adakah anda ingin saya bantu sediakan pautan tersebut?',
].join('\n\n');

describe('photosynthesis — MASA leak + media refusal', () => {
  it('strips MASA/TENAGA/RUANG essay and media refusal', () => {
    const out = sanitizeStudentOutputSync(BAD, ASK, [], [], 'QA', {
      enforceStudentGreeting: true,
    });
    expect(out).not.toMatch(/\bMASA\b.*\bTENAGA\b.*\bRUANG\b/s);
    expect(out).not.toMatch(/tidak boleh menunjukkan gambar/i);
    expect(out).toMatch(/fotosintesis|glukosa|klorofil/i);
  });

  it('prefers sanitized surface over raw stream on technical turn', () => {
    const surface = sanitizeStudentOutputSync(BAD, ASK, [], [], 'QA', {
      enforceStudentGreeting: true,
    });
    const resolved = resolveStudentStreamSurface(BAD, surface, { userMessage: ASK });
    expect(resolved.fullResponse).not.toMatch(/\bMASA\b/);
  });

  it('strips production MASA/CAHAYA weave and media redirect', () => {
    const out = sanitizeStudentOutputSync(USER_PRODUCTION_BAD, 'Apa itu fotosintesis?', [], [], 'QA', {
      enforceStudentGreeting: true,
    });
    expect(out).not.toMatch(/\*MASA\*/);
    expect(out).not.toMatch(/tidak\s+dapat\s+menunjukkan/i);
    expect(out).not.toMatch(/animasi\s+3D/i);
    expect(out).toMatch(/fotosintesis|klorofil/i);
  });

  it('injects diagram and search-derived media tags', () => {
    expect(SEARCH_MEDIA_HITS.length).toBeGreaterThan(0);
    let out = sanitizeStudentOutputSync(USER_PRODUCTION_BAD, 'Apa itu fotosintesis?', [], [], 'QA', {
      enforceStudentGreeting: true,
    });
    out = repairTechnicalDiagramOutput(out, 'Apa itu fotosintesis?');
    out = repairAdamMediaOutput(out, 'Apa itu fotosintesis?', SEARCH_MEDIA_HITS);
    expect(out).toMatch(/<adam-technical-diagram>/i);
    expect(out).toMatch(/<adam-chat-image\b/i);
    expect(out).toMatch(/<adam-chat-video\b/i);
  });
});
