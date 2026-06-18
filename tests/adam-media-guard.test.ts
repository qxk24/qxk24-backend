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
  wrapAdamChatVideoTag,
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

  it('injects video tag after existing image when model omitted video', () => {
    const imageTag = wrapAdamChatImageTag(
      'https://upload.wikimedia.org/wikipedia/commons/5/55/Photosynthesis_en.svg',
      'Rajah fotosintesis',
    );
    const body = `Fotosintesis ialah proses tumbuhan.\n\n${imageTag}\n\n### Bahan`;
    const out = repairAdamMediaOutput(body, 'Apa itu fotosintesis?', [
      {
        kind:   'image',
        url:    'https://upload.wikimedia.org/wikipedia/commons/5/55/Photosynthesis_en.svg',
        title:  'Rajah fotosintesis',
        source: 'wikimedia_commons',
      },
      {
        kind:   'video',
        url:    'https://www.youtube.com/watch?v=UPBMG5EYydo',
        title:  'Video fotosintesis',
        source: 'youtube',
      },
    ]);
    expect(out).toMatch(/<adam-chat-image\b/i);
    expect(out).toMatch(/<adam-chat-video\b[^>]*UPBMG5EYydo/i);
    expect(out.indexOf('<adam-chat-video')).toBeGreaterThan(out.indexOf('<adam-chat-image'));
  });

  it('injects video after image when diagram precedes image block', () => {
    const diagram = [
      '<adam-technical-diagram>',
      'flowchart LR',
      '  A[Cahaya] --> B[Glukosa]',
      '</adam-technical-diagram>',
    ].join('\n');
    const imageTag = wrapAdamChatImageTag(
      'https://upload.wikimedia.org/wikipedia/commons/8/84/Fotosintesis.jpg',
      'Fotosintesis',
    );
    const body = [
      'Hai QA, fotosintesis ialah proses biokimia.',
      '',
      diagram,
      '',
      imageTag,
      '',
      'Cahaya matahari bukan sekadar sumber tenaga fizikal.',
    ].join('\n');
    const out = repairAdamMediaOutput(body, 'Apa itu fotosintesis?', [
      {
        kind:   'image',
        url:    'https://upload.wikimedia.org/wikipedia/commons/8/84/Fotosintesis.jpg',
        title:  'Fotosintesis',
        source: 'wikimedia_commons',
      },
      {
        kind:   'video',
        url:    'https://www.youtube.com/watch?v=53v-bKx53Lo',
        title:  'PENGERTIAN FOTOSINTESIS',
        source: 'youtube',
      },
    ]);
    expect(out).toMatch(/<adam-chat-image\b/i);
    expect(out).toMatch(/<adam-chat-video\b[^>]*53v-bKx53Lo/i);
    expect(out.indexOf('<adam-chat-video')).toBeGreaterThan(out.indexOf('<adam-chat-image'));
  });

  it('dedupes duplicate video tags with the same YouTube URL', () => {
    const video = wrapAdamChatVideoTag(
      'https://www.youtube.com/watch?v=53v-bKx53Lo',
      'Proses Fotosintesis Pada Tumbuhan',
    );
    const imageTag = wrapAdamChatImageTag(
      'https://upload.wikimedia.org/wikipedia/commons/8/84/Fotosintesis.jpg',
      'Fotosintesis',
    );
    const diagram = [
      '<adam-technical-diagram>',
      'flowchart LR',
      '  A --> B',
      '</adam-technical-diagram>',
    ].join('\n');
    const body = [
      'Hai QA, fotosintesis ialah proses biokimia.',
      '',
      diagram,
      '',
      imageTag,
      '',
      video,
      '',
      'Cahaya matahari bukan sekadar sumber tenaga fizikal.',
      '',
      video,
    ].join('\n');
    const out = repairAdamMediaOutput(body, 'Apa itu fotosintesis?', [
      {
        kind:   'image',
        url:    'https://upload.wikimedia.org/wikipedia/commons/8/84/Fotosintesis.jpg',
        title:  'Fotosintesis',
        source: 'wikimedia_commons',
      },
      {
        kind:   'video',
        url:    'https://www.youtube.com/watch?v=53v-bKx53Lo',
        title:  'Proses Fotosintesis Pada Tumbuhan',
        source: 'youtube',
      },
    ]);
    expect((out.match(/<adam-chat-video\b/gi) ?? []).length).toBe(1);
  });

  it('stash and restore media tags', () => {
    const tag = wrapAdamChatImageTag('https://example.com/a.jpg', 'A');
    const vault = stashAdamChatMediaBlocks(`Intro\n\n${tag}`);
    expect(vault.prose).toContain('\x00ADAM_MEDIA_0\x00');
    expect(restoreAdamChatMediaBlocks(vault.prose, vault.blocks)).toContain(tag);
  });
});
