/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Search-First Flow Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it, jest } from '@jest/globals';
import {
  buildAdamSearchDisplayQuery,
  buildFactualZeroHitSearchDisplayQuery,
  buildPrefetchedSearchContextBlock,
  buildSubjectFocusedStatRetryPrompt,
  buildSubjectFocusedStatSearchDisplayQuery,
  buildVerifiedDataStatPrefetchPrompt,
  dedupeSearchHits,
  extractHeuristicFactsFromSearchHits,
  getStudentSearchPrefetchModel,
  groundExtractedFactsToSearchHits,
  hasVerifiableStatSignal,
  mergeExtractedFactLines,
  parseExtractedFactsFromPrefetch,
  resolveGoldStandardSearchFirstReply,
  appendPrefetchedSearchContextToPrompt,
  shouldStudentUseSearchFirstFlow,
} from '../src/adam/adam-search-first';
import { getFastModel } from '../src/config/llm-models';
import {
  getAdamWebSearchPrompt,
  getWebSearchGateReason,
  buildFactualCareerSearchSites,
  isFactualAdamWebSearchGateReason,
  isVerifiedDataStatAsk,
  shouldForceWebSearchForGateReason,
} from '../src/adam/adam-web-search';
import { isTechnicalFollowUpMessage, resolveTechnicalPrecisionTurn } from '../src/adam/adam-factual-grounding';
import { isAdamSimpleArithmeticTurn } from '../src/adam/adam-response-generation';
import { webSearchPromptNeedsMemoryOverride } from '../src/adam/adam-student-prompts';

describe('buildAdamSearchDisplayQuery', () => {
  it('shows focused stat query instead of raw salam message', () => {
    const q = buildAdamSearchDisplayQuery(
      'Salam Adam, Bagikan maklumat jumlah pelajar KPTM',
      'verified_data_stat',
    );
    expect(q).toMatch(/jumlah pelajar KPTM/i);
    expect(q).not.toMatch(/Salam Adam/i);
  });

  it('works for any institution stat ask', () => {
    const q = buildAdamSearchDisplayQuery(
      'Salam QA. Berapa jumlah pelajar UTM?',
      'verified_data_stat',
    );
    expect(q).toMatch(/UTM/);
  });

  it('condenses registered nurse role+skills ask for search UI', () => {
    const q = buildAdamSearchDisplayQuery(
      'What does a registered nurse do, and what skills do I need?',
      'factual_question',
    );
    expect(q).toMatch(/registered nurse/i);
    expect(q).not.toMatch(/\bwhat does\b/i);
  });
});

describe('buildFactualCareerSearchSites', () => {
  it('assigns NHS and WHO for nursing career asks', () => {
    const sites = buildFactualCareerSearchSites(
      'What does a registered nurse do, and what skills do I need?',
    );
    expect(sites).toContain('healthcareers.nhs.uk');
    expect(sites).toContain('who.int');
  });
});

describe('buildFactualZeroHitSearchDisplayQuery', () => {
  it('drops filler words from RN ask', () => {
    const q = buildFactualZeroHitSearchDisplayQuery(
      'What does a registered nurse do, and what skills do I need?',
    );
    expect(q).toMatch(/registered nurse/i);
    expect(q.length).toBeLessThan(80);
  });
});

describe('getStudentSearchPrefetchModel', () => {
  it('uses fast turbo model for search-only prefetch (not deep)', () => {
    expect(getStudentSearchPrefetchModel()).toBe(getFastModel());
  });
});

describe('buildVerifiedDataStatPrefetchPrompt', () => {
  it('builds generic prefetch prompt without KPTM-only lines', () => {
    const prompt = buildVerifiedDataStatPrefetchPrompt('Berapa pelajar UTM?');
    expect(prompt).toMatch(/UTM/);
    expect(prompt).toMatch(/official/i);
    expect(prompt).toMatch(/"UTM"/);
    expect(prompt).not.toMatch(/MOHE|\.gov\.my|\.edu\.my/);
  });
});

describe('buildSubjectFocusedStatRetryPrompt', () => {
  it('quotes institution identifiers for off-subject retry', () => {
    const prompt = buildSubjectFocusedStatRetryPrompt('Salam QA. Berapa jumlah pelajar KPTM?');
    expect(prompt).toMatch(/SUBJECT-FOCUSED/i);
    expect(prompt).toMatch(/"KPTM"/);
    expect(prompt).toMatch(/unrelated foreign university/i);
    const display = buildSubjectFocusedStatSearchDisplayQuery('Berapa jumlah pelajar KPTM?');
    expect(display).toMatch(/"KPTM"/);
  });
});

describe('buildFactualZeroHitSearchDisplayQuery', () => {
  it('condenses English career questions for DashScope search UI', () => {
    const display = buildFactualZeroHitSearchDisplayQuery(
      'What does a registered nurse do, and what skills do I need?',
    );
    expect(display).toMatch(/registered nurse/i);
    expect(display).not.toMatch(/\bwhat does\b/i);
    expect(display.length).toBeLessThanOrEqual(120);
  });
});

describe('dedupeSearchHits', () => {
  it('keeps page-enriched snippet when duplicate URL arrives later', () => {
    const sparse = [{
      title: 'Sejarah KPTM',
      url:   'https://bangi.kptm.edu.my/sejarah-kptm-copy/',
    }];
    const enriched = [{
      title:   'Sejarah KPTM',
      url:     'https://bangi.kptm.edu.my/sejarah-kptm-copy/',
      snippet: 'KPTM telah berkembang dengan seramai lebih 18,000 orang pelajar sepenuh masa',
    }];
    const out = dedupeSearchHits([...sparse, ...enriched]);
    expect(out).toHaveLength(1);
    expect(out[0]?.snippet).toMatch(/18,000/);
  });
});

describe('extractHeuristicFactsFromSearchHits', () => {
  it('pulls 18,000 enrollment figure from KPTM official page snippet', () => {
    const facts = extractHeuristicFactsFromSearchHits([{
      title:   'Sejarah KPTM',
      url:     'https://bangi.kptm.edu.my/sejarah-kptm-copy/',
      snippet: 'KPTM telah berkembang dengan seramai lebih 18,000 orang pelajar sepenuh masa',
    }]);
    expect(facts).toMatch(/18,000/);
    expect(hasVerifiableStatSignal(facts, [])).toBe(true);
  });

  it('ignores off-subject US enrollment hits when userMessage is provided', () => {
    const facts = extractHeuristicFactsFromSearchHits([
      {
        title:   'Enrollments',
        url:     'https://idr.umn.edu/reports-by-topic-enrollment/enrollments',
        snippet: '871,000 students enrolled nationally',
      },
      {
        title:   'Sejarah KPTM',
        url:     'https://bangi.kptm.edu.my/sejarah-kptm-copy/',
        snippet: 'KPTM berkembang dengan seramai lebih 18,000 orang pelajar sepenuh masa',
      },
    ], 'Berapa jumlah pelajar KPTM?');
    expect(facts).toMatch(/18,000/);
    expect(facts).not.toMatch(/871,000/);
  });
});

describe('mergeExtractedFactLines', () => {
  it('dedupes LLM and heuristic fact lines', () => {
    const merged = mergeExtractedFactLines(
      '18,000 students | KPTM | kptm.edu.my',
      '18,000 students | KPTM | kptm.edu.my',
      '7 campuses | KPTM history | kptm.edu.my',
    );
    expect(merged.split('\n')).toHaveLength(2);
  });
});

describe('parseExtractedFactsFromPrefetch', () => {
  it('parses EXTRACTED_FACTS lines from prefetch output', () => {
    const raw = [
      'EXTRACTED_FACTS:',
      '- 18,000 full-time students | KPTM History | https://www.kptm.edu.my/',
      '- 7 campuses | KPTM corporate | https://bangi.kptm.edu.my/',
    ].join('\n');
    expect(parseExtractedFactsFromPrefetch(raw)).toMatch(/18,000/);
  });
});

describe('groundExtractedFactsToSearchHits', () => {
  it('clears all extracted facts when search hits are empty', () => {
    expect(groundExtractedFactsToSearchHits(
      '18,000 students | KPTM | https://www.kptm.edu.my/',
      [],
    )).toBe('');
  });

  it('keeps fact lines that reference a search-hit URL', () => {
    const hits = [{ title: 'Sejarah KPTM', url: 'https://bangi.kptm.edu.my/sejarah-kptm-copy/', snippet: '18,000 pelajar' }];
    const out = groundExtractedFactsToSearchHits(
      [
        '18,000 full-time students | Sejarah KPTM | https://bangi.kptm.edu.my/sejarah-kptm-copy/',
        '45,000 guessed | fake | https://example.com/',
      ].join('\n'),
      hits,
    );
    expect(out).toMatch(/18,000/);
    expect(out).not.toMatch(/45,000/);
    expect(out).not.toMatch(/example\.com/);
  });
});

describe('buildPrefetchedSearchContextBlock', () => {
  it('includes extracted facts and snippets in synthesis context', () => {
    const block = buildPrefetchedSearchContextBlock(
      [{ title: 'Sejarah KPTM', url: 'https://bangi.kptm.edu.my/sejarah/', snippet: 'lebih 18,000 orang pelajar' }],
      { extractedFacts: '18,000 full-time students | Sejarah KPTM | kptm.edu.my' },
    );
    expect(block).toMatch(/EXTRACTED FACTS/i);
    expect(block).toMatch(/18,000/);
    expect(block).toMatch(/Snippet:/);
  });
});

describe('shouldStudentUseSearchFirstFlow', () => {
  it('prefetches every factual gate reason — canonical student pipeline', () => {
    for (const reason of [
      'verified_data_stat',
      'current_affairs',
      'substantive_conventional',
      'factual_question',
      'technical_precision',
      'explicit_search',
    ] as const) {
      expect(isFactualAdamWebSearchGateReason(reason)).toBe(true);
      expect(shouldStudentUseSearchFirstFlow(false, reason)).toBe(true);
    }
  });

  it('does not prefetch when search gate is closed', () => {
    expect(shouldStudentUseSearchFirstFlow(false, null)).toBe(false);
    expect(shouldStudentUseSearchFirstFlow(true, null)).toBe(false);
  });

  it('prefetches for founder on factual gates — same Gold Standard pipeline', () => {
    expect(shouldStudentUseSearchFirstFlow(true, 'factual_question')).toBe(true);
    expect(shouldStudentUseSearchFirstFlow(true, 'verified_data_stat')).toBe(true);
  });
});

describe('getWebSearchGateReason student factual standard', () => {
  const KPTM_STAT = 'Salam Adam, Bagikan maklumat jumlah pelajar KPTM';

  it('prefers verified_data_stat over technical_follow_up on enrollment asks', () => {
    expect(getWebSearchGateReason(KPTM_STAT, {
      studentFounderParity: true,
      technicalFollowUp: true,
    })).toBe('verified_data_stat');
  });

  it('does not web-search α arithmetic word-problems (epal, jumlah)', () => {
    const partial = 'Jika awak ada 3 epal, dan kawan';
    expect(isAdamSimpleArithmeticTurn(partial)).toBe(true);
    expect(getWebSearchGateReason(partial, { studentFounderParity: true })).toBeNull();
    expect(getWebSearchGateReason(partial, { isFounder: true })).toBeNull();
    const full = 'Kalau saya ada 3 epal dan kawan bagi 4 lagi, berapa jumlah epal?';
    expect(getWebSearchGateReason(full, { studentFounderParity: true })).toBeNull();
    expect(shouldStudentUseSearchFirstFlow(false, getWebSearchGateReason(full, { studentFounderParity: true }))).toBe(false);
  });

  it('never skips search on brain recall for student factual turns', () => {
    const photosynthesis = getWebSearchGateReason('Terangkan bagaimana fotosintesis berlaku', {
      studentFounderParity: true,
      brainRecallLoaded: true,
    });
    expect(photosynthesis).not.toBeNull();
    expect(isFactualAdamWebSearchGateReason(photosynthesis)).toBe(true);

    const mitochondria = getWebSearchGateReason('Apa itu mitochondria?', {
      studentFounderParity: true,
      brainRecallLoaded: true,
    });
    expect(mitochondria).not.toBeNull();
    expect(isFactualAdamWebSearchGateReason(mitochondria)).toBe(true);
  });

  it('searches for founder even when Brain C recall is loaded — Gold Standard default', () => {
    expect(getWebSearchGateReason('Terangkan kenapa manusia perlu tidur setiap malam', {
      isFounder: true,
      brainRecallLoaded: true,
    })).toBe('factual_question');
  });

  it('detects enrollment stats after Salam QA salutation', () => {
    expect(getWebSearchGateReason('Salam QA. Berapa ramai pelajar KPTM?', {
      studentFounderParity: true,
    })).toBe('verified_data_stat');
  });
});

describe('shouldForceWebSearchForGateReason', () => {
  it('forces search for all factual gate reasons', () => {
    expect(shouldForceWebSearchForGateReason('substantive_conventional')).toBe(true);
    expect(shouldForceWebSearchForGateReason('factual_question')).toBe(true);
    expect(shouldForceWebSearchForGateReason(null)).toBe(false);
  });
});

describe('isVerifiedDataStatAsk', () => {
  it('detects KPTM enrollment asks after Salam QA salutation', () => {
    expect(isVerifiedDataStatAsk('Salam QA. Berapa ramai pelajar KPTM?')).toBe(true);
    expect(isVerifiedDataStatAsk('Salam QA. Berapa jumlah pelajar di KPTM?')).toBe(true);
  });

  it('does not treat α word-problem arithmetic as verified enrollment stat', () => {
    expect(
      isVerifiedDataStatAsk('Kalau saya ada 3 epal dan kawan bagi 4 lagi, berapa jumlah epal?'),
    ).toBe(false);
  });
});

describe('getAdamWebSearchPrompt student fallback', () => {
  it('uses student agent prompt — not founder default', () => {
    const prompt = getAdamWebSearchPrompt(false);
    expect(prompt).toMatch(/student turn/i);
    expect(prompt).not.toMatch(/founder turn/i);
  });

  it('uses prefetched prompt when search-first completed', () => {
    const prompt = getAdamWebSearchPrompt(false, { searchPrefetched: true });
    expect(prompt).toMatch(/\[WEB SEARCH RESULTS\]/i);
  });
});

describe('technical follow-up vs institutional stat', () => {
  const KPTM_STAT = 'Salam Adam, Bagikan maklumat jumlah pelajar KPTM';
  const priorSpec = ['Berapa cc enjin Perodua Viva?'];

  it('does not treat KPTM enrollment ask as technical follow-up after a spec thread', () => {
    expect(isTechnicalFollowUpMessage(KPTM_STAT, priorSpec)).toBe(false);
    expect(resolveTechnicalPrecisionTurn(KPTM_STAT, priorSpec).isFollowUp).toBe(false);
    expect(resolveTechnicalPrecisionTurn(KPTM_STAT, priorSpec).isActive).toBe(false);
  });
});

describe('webSearchPromptNeedsMemoryOverride', () => {
  it('matches YOUR WEB SEARCH student prompts', () => {
    const prompt = getAdamWebSearchPrompt(false, { verifiedDataStat: true });
    expect(webSearchPromptNeedsMemoryOverride(prompt)).toBe(true);
  });
});

describe('resolveGoldStandardSearchFirstReply', () => {
  it('returns null reply when subject hits exist without verified figure', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn<typeof fetch>().mockResolvedValue({
      ok:   true,
      text: async () => '<html><body>campus overview only</body></html>',
    } as Response);

    try {
      const result = await resolveGoldStandardSearchFirstReply({
        userMessage:    'Berapa pelajar KPTM?',
        searchResults:  [{ title: 'KPTM portal', url: 'https://www.kptm.edu.my/about', snippet: 'campus overview' }],
        extractedFacts: '',
      });
      expect(result.reply).toBeNull();
      expect(result.evidence.length).toBeGreaterThan(0);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('returns null reply for off-subject hits — synthesis handles the turn', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn<typeof fetch>().mockResolvedValue({
      ok:   false,
      text: async () => '',
    } as Response);

    try {
      const result = await resolveGoldStandardSearchFirstReply({
        userMessage: 'Berapa pelajar KPTM?',
        searchResults: [
          { title: 'Enrollments', url: 'https://idr.umn.edu/reports-by-topic-enrollment/enrollments' },
        ],
        extractedFacts: '',
      });
      expect(result.reply).toBeNull();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('runs acronym probe when only slow www hit exists without figure', async () => {
    const historyHtml = '<html><body>KPTM berkembang dengan seramai lebih 18,000 orang pelajar sepenuh masa</body></html>';
    const originalFetch = global.fetch;
    global.fetch = jest.fn<typeof fetch>().mockImplementation((input) => {
      const url = String(input);
      if (url.includes('sejarah-kptm-copy')) {
        return Promise.resolve({ ok: true, text: async () => historyHtml } as Response);
      }
      return Promise.resolve({ ok: false, text: async () => '' } as Response);
    });

    try {
      const result = await resolveGoldStandardSearchFirstReply({
        userMessage: 'Berapa jumlah pelajar KPTM?',
        searchResults: [{
          title: 'About KPTM',
          url:   'https://www.kptm.edu.my/en/component/content/article/119-about-kptm/info-korpora',
          snippet: 'corporate overview without enrollment total',
        }],
        extractedFacts: '',
      });
      expect(result.reply).toBeNull();
      expect(result.verifiedFigure).toBe('18000');
      expect(result.extractedFacts).toMatch(/18,000/);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('appendPrefetchedSearchContextToPrompt', () => {
  it('replaces stale WEB SEARCH block with enriched evidence', () => {
    const base = 'SYSTEM\n\n[WEB SEARCH RESULTS — stale]';
    const out = appendPrefetchedSearchContextToPrompt(
      base,
      [{ title: 'Sejarah KPTM', url: 'https://bangi.kptm.edu.my/', snippet: '18,000 pelajar' }],
      { extractedFacts: '18,000 | Sejarah KPTM' },
    );
    expect(out).toMatch(/^SYSTEM/);
    expect(out).not.toMatch(/stale/);
    expect(out).toMatch(/18,000/);
  });
});

describe('isOfficialSubjectStatHit', () => {
  it('rejects scribd even when title mentions KPTM', async () => {
    const { isOfficialSubjectStatHit } = await import('../src/adam/adam-official-source-enrich');
    expect(isOfficialSubjectStatHit(
      { title: 'KPTM Bangi Student Dress Code Survey', url: 'https://www.scribd.com/doc' },
      'Berapa pelajar KPTM?',
    )).toBe(false);
    expect(isOfficialSubjectStatHit(
      { title: 'KPTM Official', url: 'https://www.kptm.edu.my/' },
      'Berapa pelajar KPTM?',
    )).toBe(true);
  });
});

describe('searchHitsIncludeSubjectToken', () => {
  it('does not treat scribd title as subject hit for KPTM ask', async () => {
    const { searchHitsIncludeSubjectToken } = await import('../src/adam/adam-official-source-enrich');
    const hits = [
      { title: 'KPTM Bangi Student Dress Code Survey', url: 'https://www.scribd.com/doc' },
      { title: 'Mobile app learning', url: 'https://www.researchgate.net/publication/123' },
    ];
    expect(searchHitsIncludeSubjectToken(hits, 'Berapa pelajar KPTM?')).toBe(false);
  });

  it('detects when hits mention the parsed subject acronym on official host', async () => {
    const { searchHitsIncludeSubjectToken } = await import('../src/adam/adam-official-source-enrich');
    const hits = [{ title: 'MOHE stats', url: 'https://mohe.gov.my/', snippet: 'national enrollment' }];
    expect(searchHitsIncludeSubjectToken(hits, 'Berapa pelajar KPTM?')).toBe(false);
    expect(searchHitsIncludeSubjectToken(
      [{ title: 'Sejarah KPTM', url: 'https://bangi.kptm.edu.my/', snippet: 'campus info' }],
      'Berapa pelajar KPTM?',
    )).toBe(true);
  });
});

describe('enrichSearchHitsUntilStatFigure', () => {
  it('stops early when fetched page contains enrollment figure', async () => {
    const { enrichSearchHitsUntilStatFigure } = await import('../src/adam/adam-official-source-enrich');
    const html = '<html><body>KPTM berkembang dengan seramai lebih 18,000 orang pelajar sepenuh masa</body></html>';
    const originalFetch = global.fetch;
    const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
      ok:   true,
      text: async () => html,
    } as Response);
    global.fetch = mockFetch;

    try {
      const { hits, figureFound } = await enrichSearchHitsUntilStatFigure(
        [{ title: 'Sejarah KPTM', url: 'https://bangi.kptm.edu.my/sejarah-kptm-copy/' }],
        'Berapa pelajar KPTM?',
        { maxUrls: 2, timeoutMs: 5_000 },
      );
      expect(figureFound).toBe(true);
      expect(hits.some((h) => (h.snippet ?? '').includes('18,000'))).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
