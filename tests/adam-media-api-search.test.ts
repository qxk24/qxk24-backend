/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Media API Search Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 */

/// <reference types="jest" />

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  fetchLicensedMediaFromApis,
  formatUnsplashImageAttribution,
  getAdamMediaApiKeys,
  triggerUnsplashDownload,
} from '../src/adam/adam-media-api-search';

const originalFetch = global.fetch;

describe('adam-media-api-search', () => {
  beforeEach(() => {
    delete process.env.ADAM_PEXELS_API_KEY;
    delete process.env.ADAM_PIXABAY_API_KEY;
    delete process.env.ADAM_UNSPLASH_ACCESS_KEY;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('reads optional API keys from env', () => {
    process.env.ADAM_PEXELS_API_KEY = 'pexels-key';
    process.env.ADAM_PIXABAY_API_KEY = 'pixabay-key';
    process.env.ADAM_UNSPLASH_ACCESS_KEY = 'unsplash-key';
    expect(getAdamMediaApiKeys()).toEqual({
      pexels:   'pexels-key',
      pixabay:  'pixabay-key',
      unsplash: 'unsplash-key',
    });
  });

  it('fetches openverse images and internet archive videos without API keys', async () => {
    global.fetch = jest.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes('api.openverse.org')) {
        return new Response(JSON.stringify({
          results: [
            {
              title:     'Flickr blocked',
              url:       'https://live.staticflickr.com/3323/3429490435_3c010ec1ac_b.jpg',
              license:   'cc0',
            },
            {
              title:     'Photosynthesis en',
              url:       'https://upload.wikimedia.org/wikipedia/commons/5/55/Photosynthesis_en.svg',
              license:   'cc0',
            },
          ],
        }), { status: 200 });
      }
      if (url.includes('archive.org/advancedsearch.php')) {
        return new Response(JSON.stringify({
          response: {
            docs: [{ identifier: 'acid-base-film', title: 'Acid and Base' }],
          },
        }), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    }) as typeof fetch;

    const hits = await fetchLicensedMediaFromApis({
      query:     'acid base',
      wantImage: true,
      wantVideo: true,
    });

    expect(hits.some((h) => h.kind === 'image' && h.source === 'openverse'
      && h.url.includes('Photosynthesis_en.svg'))).toBe(true);
    expect(hits.some((h) => h.url.includes('staticflickr'))).toBe(false);
    expect(hits.some((h) =>
      h.kind === 'video'
      && h.source === 'internet_archive'
      && h.url.includes('archive.org/embed/acid-base-film'),
    )).toBe(true);
  });

  it('fetches pexels and pixabay when keys are set', async () => {
    process.env.ADAM_PEXELS_API_KEY = 'pexels-key';
    process.env.ADAM_PIXABAY_API_KEY = 'pixabay-key';

    global.fetch = jest.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes('api.pexels.com/v1/search')) {
        return new Response(JSON.stringify({
          photos: [{ alt: 'Lab', src: { large: 'https://images.pexels.com/photos/1/lab.jpg' } }],
        }), { status: 200 });
      }
      if (url.includes('api.pexels.com/videos/search')) {
        return new Response(JSON.stringify({
          videos: [{
            video_files: [{ link: 'https://videos.pexels.com/video-files/1/sample.mp4', quality: 'hd' }],
          }],
        }), { status: 200 });
      }
      if (url.includes('pixabay.com/api/videos')) {
        return new Response(JSON.stringify({
          hits: [{ tags: 'science', videos: { large: { url: 'https://cdn.pixabay.com/video/1.mp4' } } }],
        }), { status: 200 });
      }
      if (url.includes('pixabay.com/api/?')) {
        return new Response(JSON.stringify({
          hits: [{ tags: 'chemistry', largeImageURL: 'https://cdn.pixabay.com/photo/1.jpg' }],
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ results: [] }), { status: 200 });
    }) as typeof fetch;

    const hits = await fetchLicensedMediaFromApis({
      query:     'chemistry',
      wantImage: true,
      wantVideo: true,
    });

    expect(hits.some((h) => h.source === 'pexels' && h.kind === 'image')).toBe(true);
    expect(hits.some((h) => h.source === 'pexels' && h.kind === 'video')).toBe(true);
    expect(hits.some((h) => h.source === 'pixabay' && h.kind === 'video')).toBe(true);
  });

  it('skips stock APIs on educational turns', async () => {
    process.env.ADAM_UNSPLASH_ACCESS_KEY = 'unsplash-key';
    process.env.ADAM_PEXELS_API_KEY = 'pexels-key';

    global.fetch = jest.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes('api.unsplash.com') || url.includes('api.pexels.com') || url.includes('pixabay.com')) {
        return new Response(JSON.stringify({ results: [], photos: [], hits: [] }), { status: 200 });
      }
      if (url.includes('api.openverse.org')) {
        return new Response(JSON.stringify({
          results: [{
            title:   'Photosynthesis',
            url:     'https://upload.wikimedia.org/wikipedia/commons/5/55/Photosynthesis_en.svg',
            license: 'cc0',
          }],
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ results: [] }), { status: 200 });
    }) as typeof fetch;

    const hits = await fetchLicensedMediaFromApis({
      query:       'photosynthesis',
      wantImage:   true,
      wantVideo:   true,
      educational: true,
    });

    expect(hits.some((h) => h.url.includes('wikimedia.org'))).toBe(true);
    expect(hits.some((h) => h.source === 'unsplash' || h.source === 'pexels')).toBe(false);
    expect(hits.some((h) => h.kind === 'video')).toBe(false);
  });

  it('fetches unsplash via search/photos and triggers download_location', async () => {
    process.env.ADAM_UNSPLASH_ACCESS_KEY = 'unsplash-key';
    const fetchCalls: string[] = [];

    global.fetch = jest.fn(async (input: string | URL) => {
      const url = String(input);
      fetchCalls.push(url);
      if (url.includes('api.unsplash.com/search/photos')) {
        expect(url).toContain('order_by=relevant');
        expect(url).toContain('orientation=landscape');
        return new Response(JSON.stringify({
          results: [{
            id:              'photo-abc',
            alt_description: 'Chemistry lab',
            urls:            { regular: 'https://images.unsplash.com/photo-1?w=1080' },
            links:           { download_location: 'https://api.unsplash.com/photos/photo-abc/download' },
            user:            { name: 'Jane Doe' },
          }],
        }), { status: 200 });
      }
      if (url.includes('/photos/photo-abc/download')) {
        return new Response(JSON.stringify({
          url: 'https://images.unsplash.com/photo-1?w=1080',
        }), { status: 200 });
      }
      return new Response('{}', { status: 200 });
    }) as typeof fetch;

    const hits = await fetchLicensedMediaFromApis({
      query:     'chemistry',
      wantImage: true,
      wantVideo: false,
    });

    expect(hits.some((h) =>
      h.source === 'unsplash'
      && h.url.includes('images.unsplash.com')
      && h.title.includes('Jane Doe'),
    )).toBe(true);
    expect(fetchCalls.some((u) => u.includes('/photos/photo-abc/download'))).toBe(true);
  });

  it('formats unsplash attribution and triggers download in helper', () => {
    const title = formatUnsplashImageAttribution({
      alt_description: 'Test tube',
      user:            { name: 'Ali' },
    }, 'chemistry');
    expect(title).toContain('Test tube');
    expect(title).toContain('Ali');
    expect(title).toContain('Unsplash');

    const calls: string[] = [];
    global.fetch = jest.fn(async (input: string | URL) => {
      calls.push(String(input));
      return new Response(JSON.stringify({ url: 'https://images.unsplash.com/x' }), { status: 200 });
    }) as typeof fetch;
    triggerUnsplashDownload('https://api.unsplash.com/photos/x/download', 'key');
    expect(calls[0]).toContain('/photos/x/download');
  });
});
