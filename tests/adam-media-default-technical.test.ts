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

import { describe, expect, it } from '@jest/globals';
import type { AdamMediaSearchHit } from '../src/adam/adam-media-search';
import {
  capAdamMediaHits,
  extractMediaFromSearchHits,
  isAdamMediaSearchTurn,
  userWantsVideoMedia,
} from '../src/adam/adam-media-search';

describe('adam-media-search — universal extraction', () => {
  it('treats acid/base ask as media search turn without explicit gambar/video', () => {
    const ask = 'Apa itu asid dan bes?';
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
});
