/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Sunom Verification Test
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
import { INVENTED_CITATION_NOTE, UNIFIED_VERIFICATION_CATATAN } from '../src/adam/adam-factual-grounding';
import {
  applySunomVerificationGate,
  extractPicuLerai,
  runSunomVerification,
  sanitizeSunomVerifiedOutput,
} from '../src/adam/adam-sunom-verification';
import { scorePicuGabung, perPicuSupportCounts } from '../src/adam/adam-sunom-lidah';
import { readKmStudentSensing, buildKmSensingPromptBlock } from '../src/adam/adam-sunom-km-sensing';
import { enrichSunomVerificationInput } from '../src/adam/adam-sunom-pipeline';
import { fetchSunomEvidenceSnippets } from '../src/adam/adam-sunom-fingers';

describe('SuNom picu lerai extraction', () => {
  it('extracts torque and power picu from output', () => {
    const picu = extractPicuLerai('Tork enjin ialah 90 Nm @ 3600 rpm dan kuasa 61 PS.');
    expect(picu.some((p) => p.value === 90 && p.unit === 'nm')).toBe(true);
    expect(picu.some((p) => p.value === 61 && p.unit === 'ps')).toBe(true);
  });

  it('extracts pH picu from chemistry phrasing', () => {
    const picu = extractPicuLerai('pH purata air laut ialah 8.2.');
    expect(picu.some((p) => p.value === 8.2 && p.unit === 'ph')).toBe(true);
  });

  it('deduplicates repeated claims', () => {
    const picu = extractPicuLerai('90 Nm dan lagi 90 Nm.');
    expect(picu.filter((p) => p.unit === 'nm')).toHaveLength(1);
  });
});

describe('SuNom lika resolution', () => {
  const searchHits = [
    { title: 'Engine torque 90 Nm @ 3600 rpm specification', url: 'https://example.com/spec.pdf' },
    { title: 'Power 61 PS at 6000 rpm datasheet', url: 'https://wikipedia.org/wiki/example' },
  ];

  it('marks lika pasif when search dropped on technical turn', () => {
    const report = runSunomVerification({
      outputText: 'Tork ialah 90 Nm.',
      userMessage: 'Berapa tork?',
      searchUsed: false,
      searchDropped: true,
      searchResults: [],
    });
    expect(report.lika).toBe('pasif');
    expect(report.tenaga).toBe(1);
  });

  it('marks lika ga when multiple search hits support picu', () => {
    const report = runSunomVerification({
      outputText: 'Tork enjin 90 Nm @ 3600 rpm.',
      userMessage: 'Berapa tork enjin?',
      searchUsed: true,
      searchDropped: false,
      searchResults: [
        { title: 'Torque 90 Nm @ 3600 rpm official manual', url: 'https://gov.example/manual.pdf' },
        { title: '90 Nm torque specification review', url: 'https://news.example/torque' },
      ],
    });
    expect(['ga', 'pa']).toContain(report.lika);
    expect(report.tenaga).toBeGreaterThanOrEqual(5);
  });

  it('marks lika pasif when search ran but picu not in titles', () => {
    const report = runSunomVerification({
      outputText: 'Tork ialah 120 Nm @ 4000 rpm.',
      userMessage: 'tork?',
      searchUsed: true,
      searchDropped: false,
      searchResults: searchHits,
    });
    expect(report.lika).toBe('pasif');
    expect(report.unsupportedClaims).toBeGreaterThan(0);
  });

  it('skips lika gate on non-technical turns', () => {
    const report = runSunomVerification({
      outputText: 'Salam, saya di sini untuk mendengar.',
      userMessage: 'salam',
      searchUsed: false,
      searchResults: [],
    });
    expect(report.lika).toBe('pa');
  });
});

describe('SuNom Lidah — picu gabung', () => {
  it('scores Pa when snippets + official + multi-domain', () => {
    const evidence = [
      {
        title: 'Manual',
        url: 'https://gov.example/owner-manual.pdf',
        snippet: 'Maximum torque 90 Nm at 3600 rpm for the 1.0L engine.',
        fetched: true,
      },
      {
        title: 'Review',
        url: 'https://cars.example/review',
        snippet: 'Dyno shows 90 Nm torque peak at 3600 rpm.',
        fetched: true,
      },
      {
        title: 'Wiki',
        url: 'https://wikipedia.org/wiki/example_engine',
        snippet: 'Output torque 90 Nm @ 3600 rpm.',
        fetched: true,
      },
    ];
    const picu = extractPicuLerai('90 Nm @ 3600 rpm');
    const counts = perPicuSupportCounts(evidence, picu);
    const gabung = scorePicuGabung(evidence, picu.length, counts);
    expect(gabung.kadar).toBe('Pa');
    expect(gabung.ratioLabel).toBe('4:1');
  });
});

describe('SuNom KM sensing bridge', () => {
  it('detects technical follow-up peringkat ga+', () => {
    const km = readKmStudentSensing('Exclusive pula?', ['Berapa tork enjin Viva?']);
    expect(km.technicalFollowUp).toBe(true);
    expect(km.forceFingerFetch).toBe(true);
    expect(km.sudutPasif90).toBe(true);
  });

  it('builds prompt block for technical turns', () => {
    const block = buildKmSensingPromptBlock('Berapa tork enjin?', []);
    expect(block).toContain('KM SENSING');
    expect(block).toContain('PAK24');
  });
});

describe('SuNom pipeline', () => {
  it('enriches without fetch when skipFingerFetch', async () => {
    const enriched = await enrichSunomVerificationInput({
      userMessage: 'Berapa tork?',
      searchUsed: true,
      searchResults: [{ title: '90 Nm spec', url: 'https://example.com/a' }],
      skipFingerFetch: true,
    });
    expect(enriched.kmSensing?.forceFingerFetch).toBe(true);
    expect(enriched.searchResults?.[0]?.fetched).toBeUndefined();
  });
});

describe('SuNom fingers', () => {
  it('rejects blocked hosts without network', async () => {
    const report = await fetchSunomEvidenceSnippets([
      { title: 'Local', url: 'http://127.0.0.1/spec' },
      { title: 'Bad', url: 'file:///etc/passwd' },
    ]);
    expect(report.fetched).toBe(0);
    expect(report.failed).toBe(0);
  });
});

describe('SuNom verification gate', () => {
  it('strips unverified picu when search ran but numbers not in evidence', () => {
    const report = runSunomVerification({
      outputText: 'Ringkas: enjin 1.0L.\n\nTork ialah 120 Nm @ 4000 rpm (palsu).',
      userMessage: 'tork?',
      searchUsed: true,
      searchResults: [{ title: '90 Nm torque spec', url: 'https://a.example' }],
    });
    const out = applySunomVerificationGate(
      'Ringkas: enjin 1.0L.\n\nTork ialah 120 Nm @ 4000 rpm (palsu).',
      report,
      [{ title: '90 Nm torque spec', url: 'https://a.example' }],
      { userMessage: 'tork?' },
    );
    expect(out).not.toMatch(/^Catatan:/);
    expect(out).not.toMatch(/120\s*Nm/i);
    expect(out).not.toMatch(/Taip semula/i);
  });

  it('strips qualitative trim comparison and unverified picu when search lacks match', () => {
    const report = runSunomVerification({
      outputText:
        'Tork 90 Nm.\n\nTiada perbezaan tork antara Elite dan Exclusive kerana enjin sama.',
      userMessage: 'Exclusive pula?',
      recentUserMessages: ['Berapa tork enjin Viva?'],
      searchUsed: true,
      searchResults: [{ title: '61 PS power output', url: 'https://b.example' }],
    });
    expect(report.lika).toBe('pasif');
    const raw =
      'Tork 90 Nm.\n\nTiada perbezaan tork antara Elite dan Exclusive kerana enjin sama.';
    const out = applySunomVerificationGate(raw, report, [{ title: '61 PS', url: 'https://b.example' }], {
      userMessage: 'Exclusive pula?',
      recentUserMessages: ['Berapa tork enjin Viva?'],
    });
    expect(out).not.toMatch(/Tiada perbezaan tork/i);
    expect(out).not.toMatch(/90\s*Nm/i);
    expect(out).toBe('');
  });

  it('strips hollow teaser and passive menu on lika pasif technical turn', () => {
    const report = runSunomVerification({
      outputText:
        'Tork Elite 90 Nm.\n\nBerikut perbandingan ringkas tork mengikut varian Viva.\n\n'
        + 'Jika anda merujuk model 2007–2012, sila beritahu — saya cari semula dengan spesifikasi tepat.\n\n'
        + 'Adakah anda ingin bandingkan tork ini dengan model kereta lain?',
      userMessage: 'Exclusive pula?',
      recentUserMessages: ['Berapa tork Viva Elite?'],
      searchUsed: true,
      searchResults: [{ title: '61 PS spec', url: 'https://b.example' }],
    });
    const raw =
      `${INVENTED_CITATION_NOTE}\n\n`
      + 'Berikut perbandingan ringkas tork mengikut varian Viva (semua model 1.0L).\n\n'
      + 'Jika anda merujuk model 2007–2012, sila beritahu — saya cari semula dengan spesifikasi tepat.\n\n'
      + 'Adakah anda ingin bandingkan tork ini dengan model kereta lain?';
    const out = applySunomVerificationGate(raw, report, [{ title: '61 PS', url: 'https://b.example' }], {
      userMessage: 'Exclusive pula?',
      recentUserMessages: ['Berapa tork Viva Elite?'],
    });
    expect(out).not.toMatch(/Berikut perbandingan ringkas/i);
    expect(out).not.toMatch(/Adakah anda ingin/i);
    expect(out).toMatch(/2007|carian semula|spesifikasi tepat/i);
    expect(out).not.toMatch(/^Catatan:/);
  });

  it('strips false verified preamble silently when search ran', () => {
    const report = runSunomVerification({
      outputText: 'Tork 90 Nm.\n\nIni berdasarkan spesifikasi rasmi yang disahkan melalui carian web terkini.',
      userMessage: 'Berapa tork Viva Elite?',
      searchUsed: true,
      searchResults: [{ title: '61 PS only', url: 'https://example.com/spec' }],
    });
    const out = applySunomVerificationGate(
      `${UNIFIED_VERIFICATION_CATATAN}\n\n`
      + 'Ini berdasarkan spesifikasi rasmi Perodua dan data teknikal yang disahkan melalui carian web terkini:\n\n'
      + 'Sumber: [Brochure](https://www.perodua.com.my), [Carlist](https://www.carlist.my/spec).',
      report,
      [{ title: '61 PS only', url: 'https://example.com/spec' }],
      { userMessage: 'Berapa tork Viva Elite?' },
    );
    expect(out).not.toMatch(/disahkan melalui carian/i);
    expect(out).not.toMatch(/Sumber:/i);
    expect(out).not.toMatch(/Taip semula|tahun model/i);
    expect(out).not.toMatch(/^Catatan:/);
  });

  it('sanitizeSunomVerifiedOutput integrates verify + gate', () => {
    const out = sanitizeSunomVerifiedOutput('Kuasa 67 PS.', {
      outputText: 'Kuasa 67 PS.',
      userMessage: 'Berapa kuasa enjin?',
      searchUsed: true,
      searchResults: [{ title: '61 PS power output', url: 'https://b.example' }],
    });
    expect(out).not.toMatch(/^Catatan:/);
    expect(out).not.toMatch(/67\s*PS/i);
    expect(out).not.toMatch(/Taip semula/i);
    expect(out).toBe('');
  });
});
