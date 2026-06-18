/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM YouTube Educational Search Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import {
  extractInnerTubeVideoIds,
  extractYouTubeHitsFromSearchCorpus,
  fetchYouTubeEducationalVideos,
} from '../src/adam/adam-youtube-search';

const originalFetch = global.fetch;

describe('adam-youtube-search', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('extracts youtube ids from search corpus rows', () => {
    const hits = extractYouTubeHitsFromSearchCorpus([
      {
        title:   'Fotosintesis',
        url:     'https://en.wikipedia.org/wiki/Photosynthesis',
        snippet: 'Video: https://www.youtube.com/watch?v=UPBMG5EYydo',
      },
    ]);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.url).toContain('UPBMG5EYydo');
    expect(hits[0]?.source).toBe('youtube');
  });

  it('extracts video ids from innertube json payload', () => {
    const ids = extractInnerTubeVideoIds({
      contents: {
        section: [{ videoRenderer: { videoId: 'UPBMG5EYydo', title: { runs: [{ text: 'A' }] } } }],
      },
    });
    expect(ids).toEqual(['UPBMG5EYydo']);
  });

  it('fetches educational youtube hits via innertube first', async () => {
    global.fetch = jest.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes('youtubei/v1/search')) {
        return new Response(JSON.stringify({
          contents: { videoRenderer: { videoId: 'UPBMG5EYydo' } },
        }), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    }) as typeof fetch;

    const hits = await fetchYouTubeEducationalVideos('fotosintesis');
    expect(hits).toHaveLength(1);
    expect(hits[0]?.url).toBe('https://www.youtube.com/watch?v=UPBMG5EYydo');
    expect(String((global.fetch as jest.Mock).mock.calls[0]?.[0])).toContain('youtubei/v1/search');
  });

  it('falls back to invidious when innertube returns no ids', async () => {
    global.fetch = jest.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes('youtubei/v1/search')) {
        return new Response(JSON.stringify({ contents: [] }), { status: 200 });
      }
      if (url.includes('/api/v1/search')) {
        return new Response(JSON.stringify([
          { type: 'video', title: 'Perlembagaan', videoId: 'f7ukOpCYs0s' },
        ]), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    }) as typeof fetch;

    const hits = await fetchYouTubeEducationalVideos('Perlembagaan Malaysia');
    expect(hits).toHaveLength(1);
    expect(hits[0]?.url).toBe('https://www.youtube.com/watch?v=f7ukOpCYs0s');
  });
});
