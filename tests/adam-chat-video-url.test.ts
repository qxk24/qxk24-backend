/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Video URL Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { repairAdamChatVideoTagUrls } from '../src/adam/adam-media-guard';
import {
  extractYouTubeVideoId,
  normalizeAdamChatVideoUrl,
  resolveAdamChatVideoUrl,
  collectTrustedVideoUrls,
} from '../src/adam/adam-chat-video-url';

describe('adam-chat-video-url', () => {
  it('extracts youtube id from watch and shorts urls', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=UPBMG5EYydo')).toBe('UPBMG5EYydo');
    expect(extractYouTubeVideoId('https://youtu.be/UPBMG5EYydo')).toBe('UPBMG5EYydo');
    expect(extractYouTubeVideoId('https://www.youtube.com/shorts/UPBMG5EYydo')).toBe('UPBMG5EYydo');
  });

  it('replaces hallucinated id with search-hit video url', () => {
    const bad = '<adam-chat-video url="https://www.youtube.com/watch?v=9G7VQJtqZzU" title="Video" />';
    const hits = [{
      kind: 'video' as const,
      url: 'https://www.youtube.com/watch?v=ivRczDkilAI',
      title: 'Asid dan bes',
      source: 'web_search',
    }];
    const out = repairAdamChatVideoTagUrls(bad, 'Apa itu asid dan bes?', hits);
    expect(out).toContain('ivRczDkilAI');
    expect(out).not.toContain('9G7VQJtqZzU');
  });

  it('keeps trusted search hit video id', () => {
    const tag = '<adam-chat-video url="https://www.youtube.com/watch?v=abc12345678" title="V" />';
    const hits = [{
      kind: 'video' as const,
      url: 'https://www.youtube.com/watch?v=abc12345678',
      title: 'V',
      source: 'web_search',
    }];
    const out = repairAdamChatVideoTagUrls(tag, 'Apa itu fotosintesis?', hits);
    expect(out).toContain('abc12345678');
  });

  it('resolve drops untrusted hallucinated id without search hit', () => {
    const trusted = collectTrustedVideoUrls([]);
    const url = resolveAdamChatVideoUrl(
      'https://www.youtube.com/watch?v=9G7VQJtqZzU',
      trusted,
      null,
    );
    expect(url).toBe('');
  });

  it('normalizes vimeo and wikimedia direct video urls', () => {
    expect(normalizeAdamChatVideoUrl('https://vimeo.com/123456789')).toBe(
      'https://vimeo.com/123456789',
    );
    expect(normalizeAdamChatVideoUrl(
      'https://upload.wikimedia.org/wikipedia/commons/3/3a/Example.webm',
    )).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/3/3a/Example.webm',
    );
    expect(normalizeAdamChatVideoUrl('https://archive.org/details/acid-base-film')).toBe(
      'https://archive.org/embed/acid-base-film',
    );
  });

  it('replaces hallucinated youtube with vimeo search hit', () => {
    const bad = '<adam-chat-video url="https://www.youtube.com/watch?v=9G7VQJtqZzU" title="Video" />';
    const hits = [{
      kind: 'video' as const,
      url: 'https://vimeo.com/987654321',
      title: 'Asid dan bes',
      source: 'web_search',
    }];
    const out = repairAdamChatVideoTagUrls(bad, 'Apa itu asid dan bes?', hits);
    expect(out).toContain('vimeo.com/987654321');
    expect(out).not.toContain('9G7VQJtqZzU');
  });

  it('normalize returns canonical watch url', () => {
    expect(normalizeAdamChatVideoUrl('https://youtu.be/UPBMG5EYydo')).toBe(
      'https://www.youtube.com/watch?v=UPBMG5EYydo',
    );
  });
});
