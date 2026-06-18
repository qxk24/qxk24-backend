/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Media Default Technical Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 */

/// <reference types="jest" />

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import {
  capAdamMediaHits,
  extractMediaFromSearchHits,
  isAdamMediaSearchTurn,
  runAdamMediaSearch,
  userWantsVideoMedia,
} from '../src/adam/adam-media-search';
import { isAdamScienceNatureSynthesisTurn } from '../src/adam/adam-response-generation';

describe('adam-media-search — universal extraction', () => {
  it('does not treat light chat as media search', () => {
    expect(isAdamMediaSearchTurn('salam')).toBe(false);
    expect(userWantsVideoMedia('salam')).toBe(false);
  });

  it('treats acid/base science ask as media search turn', () => {
    const ask = 'Apa itu asid dan bes?';
    expect(isAdamScienceNatureSynthesisTurn(ask)).toBe(true);
    expect(isAdamMediaSearchTurn(ask)).toBe(true);
  });

  it('treats science synthesis ask as media search turn', () => {
    const ask = 'Apa itu fotosintesis?';
    expect(isAdamScienceNatureSynthesisTurn(ask)).toBe(true);
    expect(isAdamMediaSearchTurn(ask)).toBe(true);
  });

  it('treats explicit media ask as media search turn', () => {
    const ask = 'Tunjuk gambar dan video tentang asid dan bes';
    expect(isAdamMediaSearchTurn(ask)).toBe(true);
    expect(userWantsVideoMedia(ask)).toBe(true);
  });

  it('extracts youtube from search snippet corpus', () => {
    const hits = extractMediaFromSearchHits([
      {
        title: 'Asid dan bes — video pendidikan',
        url:   'https://www.britannica.com/science/acid-base-reaction',
        snippet: 'Tonton https://www.youtube.com/watch?v=ivRczDkilAI untuk penjelasan pH dan peneutralan.',
      },
      {
        title: 'Skala pH',
        url:   'https://en.wikipedia.org/wiki/PH',
        snippet: 'Rajah: https://upload.wikimedia.org/wikipedia/commons/f/fc/PH_Scale.png',
      },
    ]);
    expect(hits.some((h) => h.kind === 'video' && h.url.includes('ivRczDkilAI'))).toBe(true);
    expect(hits.some((h) => h.kind === 'image' && h.url.includes('PH_Scale'))).toBe(true);
  });

  it('extracts vimeo and wikimedia direct video from search corpus', () => {
    const hits = extractMediaFromSearchHits([
      {
        title: 'Photosynthesis animation',
        url:   'https://vimeo.com/123456789',
        snippet: 'Educational clip on chloroplasts.',
      },
      {
        title: 'Commons file',
        url:   'https://commons.wikimedia.org/wiki/File:Example.webm',
        snippet: 'Direct: https://upload.wikimedia.org/wikipedia/commons/3/3a/Example.webm',
      },
    ]);
    expect(hits.some((h) => h.kind === 'video' && h.url.includes('vimeo.com/123456789'))).toBe(true);
    expect(hits.some((h) => h.kind === 'video' && h.url.includes('Example.webm'))).toBe(true);
  });

  it('prefers wikimedia diagram over unsplash stock photo', () => {
    const capped = capAdamMediaHits([
      {
        kind:   'image',
        url:    'https://images.unsplash.com/photo-booth',
        title:  'Photo booth',
        source: 'unsplash',
      },
      {
        kind:   'image',
        url:    'https://upload.wikimedia.org/wikipedia/commons/5/55/Photosynthesis_en.svg',
        title:  'Photosynthesis diagram',
        source: 'wikimedia_commons',
      },
    ], false);
    expect(capped[0]?.url).toContain('Photosynthesis_en.svg');
  });

  it('prefers youtube over archive or stock video', () => {
    const capped = capAdamMediaHits([
      {
        kind:   'video',
        url:    'https://archive.org/embed/fotosintesis',
        title:  'Archive',
        source: 'internet_archive',
      },
      {
        kind:   'video',
        url:    'https://videos.pexels.com/video-files/1/sample.mp4',
        title:  'Stock',
        source: 'pexels',
      },
      {
        kind:   'video',
        url:    'https://www.youtube.com/watch?v=UPBMG5EYydo',
        title:  'Fotosintesis',
        source: 'youtube',
      },
    ], true);
    const video = capped.find((h) => h.kind === 'video');
    expect(video?.url).toContain('UPBMG5EYydo');
  });

  it('skips pdf ebook urls when picking chat image', () => {
    const capped = capAdamMediaHits([
      {
        kind:   'image',
        url:    'https://example.com/ebook-fotosintesis.pdf',
        title:  'E-book',
        source: 'web_search',
      },
      {
        kind:   'image',
        url:    'https://upload.wikimedia.org/wikipedia/commons/5/55/Photosynthesis_en.svg',
        title:  'Rajah',
        source: 'wikimedia_commons',
      },
    ], false);
    expect(capped[0]?.url).toContain('Photosynthesis_en.svg');
  });
});

describe('adam-media-search — youtube discovery for educational turns', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('adds youtube video for technical turn without youtube in web snippets', async () => {
    global.fetch = jest.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/search')) {
        return new Response(JSON.stringify([
          { type: 'video', title: 'Pengertian Fotosintesis', videoId: 'UPBMG5EYydo' },
        ]), { status: 200 });
      }
      if (url.includes('wikimedia.org/w/api.php')) {
        return new Response(JSON.stringify({
          query: {
            pages: {
              '1': {
                title: 'File:Photosynthesis_en.svg',
                imageinfo: [{
                  url:  'https://upload.wikimedia.org/wikipedia/commons/5/55/Photosynthesis_en.svg',
                  mime: 'image/svg+xml',
                }],
              },
            },
          },
        }), { status: 200 });
      }
      if (url.includes('api.openverse.org')) {
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      }
      if (url.includes('archive.org/advancedsearch.php')) {
        return new Response(JSON.stringify({ response: { docs: [] } }), { status: 200 });
      }
      return new Response('{}', { status: 200 });
    }) as typeof fetch;

    const hits = await runAdamMediaSearch({
      userMessage: 'Senarai langkah-langkah proses fotosintesis',
      searchHits:  [{
        title:   'Photosynthesis',
        url:     'https://en.wikipedia.org/wiki/Photosynthesis',
        snippet: 'Proses biokimia pada tumbuhan hijau.',
      }],
    });

    expect(hits.some((h) => h.kind === 'image')).toBe(true);
    expect(hits.some((h) => h.kind === 'video' && h.url.includes('UPBMG5EYydo'))).toBe(true);
  });
});
