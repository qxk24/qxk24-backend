/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Official Source Enrich Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it, jest } from '@jest/globals';
import {
  enrichSearchHitsUntilStatFigure,
  extractDomainsFromMessageUrls,
  extractInstitutionAliasesFromMessage,
  extractInstitutionStatLinksFromHtml,
  extractStatSubjectFromMessage,
  filterSearchHitsForMessageLocale,
  isChineseWebAggregatorHost,
  isThirdPartyAggregatorHost,
  rankHitsForStatPageEnrich,
} from '../src/adam/adam-official-source-enrich';

describe('extractStatSubjectFromMessage', () => {
  it('extracts acronym from any institution', () => {
    expect(extractStatSubjectFromMessage('How many students at MIT?')).toMatch(/MIT/);
    expect(extractStatSubjectFromMessage('Berapa jumlah pelajar UTM?')).toMatch(/UTM/);
  });

  it('extracts org name when present', () => {
    expect(extractStatSubjectFromMessage('Enrollment at University of Tokyo'))
      .toMatch(/University of Tokyo/);
  });
});

describe('extractDomainsFromMessageUrls', () => {
  it('returns domains only from URLs pasted in the question — never guesses TLDs', () => {
    expect(extractDomainsFromMessageUrls('Jumlah pelajar ABC')).toEqual([]);
    expect(extractDomainsFromMessageUrls('Statistik pelajar UTM')).toEqual([]);
    expect(
      extractDomainsFromMessageUrls('See https://www.example.edu/stats for data'),
    ).toContain('example.edu');
  });

  it('does not invent country-specific domains from acronyms', () => {
    const domains = extractDomainsFromMessageUrls('Berapa pelajar UTM?');
    expect(domains.some((d) => d.endsWith('.my'))).toBe(false);
  });
});

describe('rankHitsForStatPageEnrich', () => {
  it('prefers official institution host over scribd for KPTM ask', () => {
    const ranked = rankHitsForStatPageEnrich([
      {
        title: 'KPTM Bangi Student Dress Code Survey',
        url:   'https://www.scribd.com/document/kptm-dress',
        snippet: 'KPTM survey PDF',
      },
      {
        title:   "KPTM's History - Kolej Poly-Tech MARA Official Website",
        url:     'https://www.kptm.edu.my/',
        snippet: 'official portal',
      },
    ], 'Berapa jumlah pelajar KPTM?');
    expect(ranked[0]?.url).toMatch(/kptm\.edu\.my/);
    expect(isThirdPartyAggregatorHost('https://scribd.com/x')).toBe(true);
  });
});

describe('extractInstitutionStatLinksFromHtml', () => {
  it('discovers sejarah link on institution homepage HTML', () => {
    const html = `
      <a href="/about">About</a>
      <a href="https://bangi.kptm.edu.my/sejarah-kptm-copy/">Sejarah KPTM</a>
    `;
    const links = extractInstitutionStatLinksFromHtml(html, 'https://www.kptm.edu.my/');
    expect(links.some((u) => /sejarah-kptm-copy/i.test(u))).toBe(true);
  });
});

describe('composeSamePageStatSnippet', () => {
  it('bundles enrollment + graduate sentences from full KPTM sejarah page text', async () => {
    const { composeSamePageStatSnippet } = await import('../src/adam/adam-official-source-enrich');
    const plain = [
      'KPTM merupakan institusi pendidikan tinggi swasta Bumiputera yang terbesar di Malaysia',
      'dengan seramai lebih 18,000 orang pelajar sepenuh masa di tujuh kampus;',
      'Kuala Lumpur, Bangi, Kota Bharu, Kuantan, Batu Pahat, Ipoh dan Alor Setar.',
      'Sehingga ke hari ini, KPTM telah menghasilkan seramai 62,000 orang graduan',
      'sejak penubuhannya secara rasmi pada tahun 2003.',
    ].join(' ');
    const snippet = composeSamePageStatSnippet(plain, 'Berapa jumlah pelajar KPTM?');
    expect(snippet).toMatch(/18,000/);
    expect(snippet).toMatch(/Alor Setar/);
    expect(snippet).toMatch(/62,000.*graduan/i);
    expect(snippet).toContain('\n\n');
  });

  it('enrollment excerpt starts at subject sentence — not mid-word', async () => {
    const { composeSamePageStatSnippet } = await import('../src/adam/adam-official-source-enrich');
    const plain = [
      'KPTM merupakan institusi pendidikan tinggi swasta Bumiputera yang terbesar di Malaysia',
      'dengan seramai lebih 18,000 orang pelajar sepenuh masa di tujuh kampus;',
      'Kuala Lumpur, Bangi, Kota Bharu, Kuantan, Batu Pahat, Ipoh dan Alor Setar.',
    ].join(' ');
    const snippet = composeSamePageStatSnippet(plain, 'Berapa jumlah pelajar KPTM?');
    expect(snippet).toMatch(/^KPTM merupakan institusi/i);
    expect(snippet).not.toMatch(/^ajian tinggi/i);
  });

  it('bundles graduate line when official page spells graduat (live KPTM sejarah)', async () => {
    const { composeSamePageStatSnippet } = await import('../src/adam/adam-official-source-enrich');
    const plain = [
      'KPTM merupakan institusi pendidikan tinggi swasta Bumiputera yang terbesar di Malaysia',
      'dengan seramai lebih 18,000 orang pelajar sepenuh masa di tujuh kampus;',
      'Kuala Lumpur, Bangi, Kota Bharu, Kuantan, Batu Pahat, Ipoh dan Alor Setar.',
      'Sehingga ke hari ini, KPTM telah menghasilkan seramai 62,000 orang graduat',
      'sejak penubuhannya secara rasmi pada tahun 2003.',
    ].join(' ');
    const snippet = composeSamePageStatSnippet(plain, 'Berapa jumlah pelajar KPTM?');
    expect(snippet).toMatch(/62,000.*graduat/i);
    expect(snippet).toContain('\n\n');
  });
});

describe('extractCampusNamesFromStatText', () => {
  it('parses campus list after kampus semicolon from KPTM sejarah text', async () => {
    const { extractCampusNamesFromStatText } = await import('../src/adam/adam-official-source-enrich');
    const text = 'lebih 18,000 orang pelajar sepenuh masa di tujuh kampus; Kuala Lumpur, Bangi, Kota Bharu, Kuantan, Batu Pahat, Ipoh dan Alor Setar.';
    const campuses = extractCampusNamesFromStatText(text);
    expect(campuses).toContain('Kuala Lumpur');
    expect(campuses).toContain('Alor Setar');
    expect(campuses).toHaveLength(7);
  });
});

describe('extractArticleParagraphsFromHtml', () => {
  it('extracts full sejarah article paragraphs — not stat-only window', async () => {
    const { extractArticleParagraphsFromHtml } = await import('../src/adam/adam-official-source-enrich');
    const html = [
      '<p>Kini Kolej Poly-Tech MARA (KPTM) adalah institusi milik MARA Corporation.</p>',
      '<p>Kekuatan KPTM dibina melalui penggabungan KYPM dan AIM.</p>',
      '<p>KPTM telah berkembang dengan seramai lebih 18,000 orang pelajar sepenuh masa di tujuh kampus; Kuala Lumpur, Bangi, Kota Bharu, Kuantan, Batu Pahat, Ipoh dan Alor Setar.</p>',
      '<p>Sehingga ke hari ini, KPTM telah menghasilkan seramai 62,000 orang graduat sejak 2003.</p>',
      '<p>Kolej Poly-Tech MARA Kuala Lumpur telah dinaik taraf sebagai kolej universiti pada 15 Oktober 2015.</p>',
      '<p>Komitmen kami terhadap pembelajaran sepanjang hayat melalui PPB menawarkan diploma dan ijazah.</p>',
      '<p>Laman Web : https://bangi.kptm.edu.my</p>',
    ].join('');
    const paras = extractArticleParagraphsFromHtml(html, 'Berapa jumlah pelajar KPTM?');
    expect(paras.length).toBeGreaterThanOrEqual(5);
    expect(paras.some((p) => /KYPM/.test(p))).toBe(true);
    expect(paras.some((p) => /18,000/.test(p))).toBe(true);
    expect(paras.some((p) => /62,000/.test(p))).toBe(true);
    expect(paras.some((p) => /2015/.test(p))).toBe(true);
    expect(paras.some((p) => /PPB/.test(p))).toBe(true);
    expect(paras.some((p) => /^Laman Web/i.test(p))).toBe(false);
  });
});

describe('buildAcronymInstitutionProbeUrls', () => {
  it('prioritises campus sejarah path before www homepage for KPTM', async () => {
    const { buildAcronymInstitutionProbeUrls } = await import('../src/adam/adam-official-source-enrich');
    const urls = buildAcronymInstitutionProbeUrls('Berapa jumlah pelajar KPTM?');
    expect(urls[0]).toMatch(/bangi\.kptm\.edu\.my\/sejarah-kptm-copy/);
    const wwwIndex = urls.findIndex((u) => u === 'https://www.kptm.edu.my/');
    expect(wwwIndex).toBeGreaterThan(0);
  });
});

describe('probeInstitutionStatEvidenceFromAcronym', () => {
  it('finds KPTM 18,000 via kptm.edu.my probe when search returns nothing', async () => {
    const { probeInstitutionStatEvidenceFromAcronym } = await import('../src/adam/adam-official-source-enrich');
    const homeHtml = '<html><body><a href="https://bangi.kptm.edu.my/sejarah-kptm-copy/">Sejarah</a></body></html>';
    const historyHtml = '<html><body>KPTM berkembang dengan seramai lebih 18,000 orang pelajar sepenuh masa</body></html>';
    const originalFetch = global.fetch;
    const mockFetch = jest.fn<typeof fetch>().mockImplementation((input) => {
      const url = String(input);
      if (url.includes('sejarah-kptm-copy') || url.includes('bangi.kptm.edu.my')) {
        if (url.includes('sejarah-kptm-copy')) {
          return Promise.resolve({ ok: true, text: async () => historyHtml } as Response);
        }
        return Promise.resolve({ ok: true, text: async () => homeHtml } as Response);
      }
      if (url.includes('kptm.edu.my')) {
        return Promise.resolve({ ok: true, text: async () => homeHtml } as Response);
      }
      return Promise.resolve({ ok: false, text: async () => '' } as Response);
    });
    global.fetch = mockFetch;

    try {
      const { hits, figureFound } = await probeInstitutionStatEvidenceFromAcronym(
        'Salam QA. Berapa jumlah pelajar KPTM?',
        { maxUrls: 4, timeoutMs: 5_000 },
      );
      expect(figureFound).toBe(true);
      expect(hits.some((h) => (h.snippet ?? '').includes('18,000'))).toBe(true);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('enrichSearchHitsUntilStatFigure crawl', () => {
  it('follows same-institution sejarah link when landing page has no figure', async () => {
    const homeHtml = '<html><body><a href="https://bangi.kptm.edu.my/sejarah-kptm-copy/">Sejarah</a></body></html>';
    const historyHtml = '<html><body>KPTM berkembang dengan seramai lebih 18,000 orang pelajar sepenuh masa</body></html>';
    const originalFetch = global.fetch;
    const mockFetch = jest.fn<typeof fetch>().mockImplementation((input) => {
      const url = String(input);
      if (url.includes('sejarah-kptm-copy')) {
        return Promise.resolve({ ok: true, text: async () => historyHtml } as Response);
      }
      return Promise.resolve({ ok: true, text: async () => homeHtml } as Response);
    });
    global.fetch = mockFetch;

    try {
      const { hits, figureFound } = await enrichSearchHitsUntilStatFigure(
        [{ title: 'KPTM Official', url: 'https://www.kptm.edu.my/' }],
        'Berapa pelajar KPTM?',
        { maxUrls: 2, timeoutMs: 5_000 },
      );
      expect(figureFound).toBe(true);
      expect(hits.some((h) => (h.snippet ?? '').includes('18,000'))).toBe(true);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('enrichSearchHitsUntilStatFigure — RN skills subpage', () => {
  const RN_ASK = 'What does a registered nurse do, and what skills do I need?';

  it('crawls personal-characteristics-and-skills child before generic parent body', async () => {
    const parentHtml = `<html><body>
      <a href="https://www.healthcareers.nhs.uk/explore-roles/nursing/roles-nursing/adult-nurse/personal-characteristics-and-skills-required-adult-nursing">Skills</a>
      <p>Adult nurses work in hospitals and community settings across the NHS every day of the week.</p>
      <p>They provide hands-on care and support patients through assessment, treatment, and recovery journeys.</p>
    </body></html>`;
    const skillsHtml = `<html><body>
      <p>You'll be responsible for a number of patients, each with different needs so you'll be highly organised, flexible and able to prioritise effectively.&nbsp;A good adult nurse is also highly observant, able to assess patients and take responsibility for determining the best course of action for them.&nbsp;</p>
      <p>Communication and interpersonal skills are also very important, as you will need to reassure or advise patients and their relatives or carers, sometimes in situations that they may find difficult to cope with.</p>
      <p>You'll need to reassure patients and their relatives or carers, sometimes in difficult situations.</p>
      <p>Discover the benefits of an NHS career including pay and pensions.</p>
    </body></html>`;
    const originalFetch = global.fetch;
    const mockFetch = jest.fn<typeof fetch>().mockImplementation((input) => {
      const url = String(input);
      if (url.includes('personal-characteristics-and-skills')) {
        return Promise.resolve({ ok: true, text: async () => skillsHtml } as Response);
      }
      if (url.includes('adult-nurse')) {
        return Promise.resolve({ ok: true, text: async () => parentHtml } as Response);
      }
      return Promise.resolve({ ok: false, text: async () => '' } as Response);
    });
    global.fetch = mockFetch;

    try {
      const { hits, articleFound } = await enrichSearchHitsUntilStatFigure(
        [{
          title: 'Adult nurse',
          url:   'https://www.healthcareers.nhs.uk/explore-roles/nursing/roles-nursing/adult-nurse',
          snippet: 'DashScope search snippet — must not be used as Gold Standard body.',
          pageFetched: false,
        }],
        RN_ASK,
        { maxUrls: 2, timeoutMs: 5_000 },
      );
      expect(articleFound).toBe(true);
      const enriched = hits.find(
        (h) => h.pageFetched && h.url?.includes('personal-characteristics-and-skills'),
      );
      expect(enriched).toBeDefined();
      expect(enriched!.snippet).toMatch(/highly organised, flexible/i);
      expect(enriched!.snippet).toMatch(/A good adult nurse is also highly observant/i);
      expect(enriched!.snippet!.split('\n\n').length).toBeGreaterThanOrEqual(5);
      expect(enriched!.snippet).not.toMatch(/DashScope search snippet/);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('splitCareerParagraphIntoSentenceBlocks', () => {
  it('splits NHS merged <p> into separate Gold Standard paragraphs', async () => {
    const { splitCareerParagraphIntoSentenceBlocks } = await import('../src/adam/adam-official-source-enrich');
    const merged = "You'll be responsible for a number of patients, each with different needs so you'll be highly organised, flexible and able to prioritise effectively. A good adult nurse is also highly observant, able to assess patients and take responsibility for determining the best course of action for them.";
    const blocks = splitCareerParagraphIntoSentenceBlocks(merged);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatch(/highly organised, flexible/i);
    expect(blocks[1]).toMatch(/A good adult nurse is also highly observant/i);
  });
});

describe('extractArticleParagraphsFromHtml — NHS skills page', () => {
  it('extracts one paragraph per sentence from merged NHS <p> tags', async () => {
    const { extractArticleParagraphsFromHtml } = await import('../src/adam/adam-official-source-enrich');
    const RN_ASK = 'What does a registered nurse do, and what skills do I need?';
    const html = `<html><body>
      <p>This page has information on the personal characteristics and skills needed for adult nursing.</p>
      <p>You'll be responsible for a number of patients, each with different needs so you'll be highly organised, flexible and able to prioritise effectively.&nbsp;A good adult nurse is also highly observant, able to assess patients and take responsibility for determining the best course of action for them.&nbsp;</p>
      <p>Communication and interpersonal skills are also very important, as you will need to reassure or advise patients and their relatives or carers – sometimes in situations that they may find difficult to cope with.&nbsp;</p>
      <p>You'll need to reassure patients and their relatives or carers – sometimes in difficult situations. </p>
      <p class="large-spotlight__description">Discover the benefits of an NHS career including pay and pensions.</p>
    </body></html>`;
    const paras = extractArticleParagraphsFromHtml(html, RN_ASK);
    expect(paras.length).toBeGreaterThanOrEqual(5);
    expect(paras[0]).toMatch(/highly organised, flexible/i);
    expect(paras[0]).not.toMatch(/A good adult nurse is also highly observant/i);
    expect(paras[1]).toMatch(/A good adult nurse is also highly observant/i);
    expect(paras.some((p) => /Communication and interpersonal skills/i.test(p))).toBe(true);
    expect(paras.some((p) => /Discover the benefits of an NHS career/i.test(p))).toBe(true);
  });
});

describe('snippetHasGoldStandardBody', () => {
  it('accepts two-paragraph career articles above 280 chars', async () => {
    const { snippetHasGoldStandardBody } = await import('../src/adam/adam-official-source-enrich');
    const snippet = [
      'A registered nurse provides direct patient care and coordinates with interdisciplinary teams across hospital, clinic, school, home, and public health settings every day.',
      'Essential skills include clinical competence, communication, critical thinking, resilience with self-awareness, and professional integrity guided by nursing codes of ethics.',
    ].join('\n\n');
    expect(snippetHasGoldStandardBody(snippet)).toBe(true);
  });
});

describe('buildFactualAuthoritativeProbeUrls', () => {
  const RN_ASK = 'What does a registered nurse do, and what skills do I need?';

  it('returns NHS skills subpage for registered nurse role+skills asks', async () => {
    const { buildFactualAuthoritativeProbeUrls } = await import('../src/adam/adam-official-source-enrich');
    const urls = buildFactualAuthoritativeProbeUrls(RN_ASK);
    expect(urls[0]).toMatch(/personal-characteristics-and-skills-required-adult-nursing/);
    expect(urls.some((u) => /healthcareers\.nhs\.uk/.test(u))).toBe(true);
  });
});

describe('probeFactualAuthoritativeEvidence — RN zero-hit fallback', () => {
  const RN_ASK = 'What does a registered nurse do, and what skills do I need?';

  it('fetches NHS skills page when DashScope returns 0 hits', async () => {
    const skillsHtml = `<html><body>
      <p>You'll be responsible for a number of patients, each with different needs so you'll be highly organised, flexible and able to prioritise effectively.</p>
      <p>A good adult nurse is also highly observant, able to assess patients and take responsibility for determining the best course of action for them.</p>
      <p>Communication and interpersonal skills are also very important, as you will need to reassure or advise patients and their relatives or carers, sometimes in situations that they may find difficult to cope with.</p>
    </body></html>`;
    const originalFetch = global.fetch;
    const mockFetch = jest.fn<typeof fetch>().mockImplementation((input) => {
      const url = String(input);
      if (url.includes('healthcareers.nhs.uk')) {
        return Promise.resolve({ ok: true, text: async () => skillsHtml } as Response);
      }
      return Promise.resolve({ ok: false, text: async () => '' } as Response);
    });
    global.fetch = mockFetch;

    try {
      const { probeFactualAuthoritativeEvidence } = await import('../src/adam/adam-official-source-enrich');
      const { hits, articleFound } = await probeFactualAuthoritativeEvidence(RN_ASK, {
        maxUrls: 2,
        timeoutMs: 5_000,
      });
      expect(articleFound).toBe(true);
      expect(hits.some((h) => h.pageFetched && (h.snippet ?? '').includes('highly organised'))).toBe(true);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('filterSearchHitsForMessageLocale', () => {
  const RN_ASK = 'What does a registered nurse do, and what skills do I need?';
  const hits = [
    { title: '护士', url: 'https://baike.baidu.com/item/护士/179239' },
    { title: 'RN Skills', url: 'https://www.who.int/news-room/fact-sheets/detail/nursing' },
  ];

  it('drops China-index aggregators for English global questions', () => {
    const out = filterSearchHitsForMessageLocale(hits, RN_ASK);
    expect(out).toHaveLength(1);
    expect(out[0]?.url).toMatch(/who\.int/);
    expect(isChineseWebAggregatorHost('https://baike.baidu.com/item/x')).toBe(true);
  });

  it('extracts registered nurse as subject alias', () => {
    const aliases = extractInstitutionAliasesFromMessage(RN_ASK);
    expect(aliases.some((a) => /registered nurse/i.test(a))).toBe(true);
  });
});
