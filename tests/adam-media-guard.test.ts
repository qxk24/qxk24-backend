/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Media Guard Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  repairAdamMediaOutput,
  wrapAdamChatImageTag,
  stashAdamChatMediaBlocks,
  restoreAdamChatMediaBlocks,
} from '../src/adam/adam-media-guard';
import { extractMediaFromSearchHits } from '../src/adam/adam-media-search';

describe('adam-media-guard', () => {
  it('extracts youtube and trusted image URLs from search hits', () => {
    const hits = extractMediaFromSearchHits([
      {
        title: 'Fotosintesis video',
        url:   'https://www.youtube.com/watch?v=abc12345678',
      },
      {
        title: 'Diagram',
        url:   'https://upload.wikimedia.org/wikipedia/commons/a/ab/Leaf.jpg',
      },
    ]);
    expect(hits.some((h) => h.kind === 'video')).toBe(true);
    expect(hits.some((h) => h.kind === 'image')).toBe(true);
  });

  it('injects image tag when missing on media turn', () => {
    const out = repairAdamMediaOutput(
      'Fotosintesis ialah proses tumbuhan.\n\n### Bahan',
      'Apa itu fotosintesis?',
      [{
        kind:   'image',
        url:    'https://upload.wikimedia.org/wikipedia/commons/a/ab/Leaf.jpg',
        title:  'Daun hijau',
        source: 'wikimedia_commons',
      }],
    );
    expect(out).toMatch(/<adam-chat-image\b[^>]*url="/);
    expect(out).toMatch(/Daun hijau/);
  });

  it('stash and restore media tags', () => {
    const tag = wrapAdamChatImageTag('https://example.com/a.jpg', 'A');
    const vault = stashAdamChatMediaBlocks(`Intro\n\n${tag}`);
    expect(vault.prose).toContain('\x00ADAM_MEDIA_0\x00');
    expect(restoreAdamChatMediaBlocks(vault.prose, vault.blocks)).toContain(tag);
  });
});
