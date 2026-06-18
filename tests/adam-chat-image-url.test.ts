/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Image URL Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { repairAdamChatImageTagUrls } from '../src/adam/adam-media-guard';
import {
  imageUrlLooksBroken,
  isDisplayableChatImageUrl,
  normalizeAdamChatImageUrl,
  wikimediaThumbToDirectUrl,
} from '../src/adam/adam-chat-image-url';

describe('adam-chat-image-url', () => {
  it('converts wikimedia thumb to direct file url', () => {
    const thumb = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Photosynthesis_en.svg/800px-Photosynthesis_en.svg.png';
    expect(wikimediaThumbToDirectUrl(thumb)).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/5/55/Photosynthesis_en.svg',
    );
  });

  it('repairs broken thumb using search-hit image url', () => {
    const bad = '<adam-chat-image url="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Photosynthesis.png/800px-Photosynthesis.png" alt="Rajah" />';
    const hits = [{
      kind: 'image' as const,
      url: 'https://upload.wikimedia.org/wikipedia/commons/5/55/Photosynthesis_en.svg',
      title: 'Rajah fotosintesis',
      source: 'wikimedia_commons',
    }];
    const out = repairAdamChatImageTagUrls(bad, 'Apa itu fotosintesis?', hits);
    expect(out).toContain('Photosynthesis_en.svg');
    expect(out).not.toContain('/thumb/');
  });

  it('normalize passes through direct urls', () => {
    const direct = 'https://upload.wikimedia.org/wikipedia/commons/5/55/Photosynthesis_en.svg';
    expect(normalizeAdamChatImageUrl(direct)).toBe(direct);
    expect(imageUrlLooksBroken(direct)).toBe(false);
  });

  it('rejects pdf and youtube thumbnail urls for chat images', () => {
    const pdf = 'https://example.com/ebook-fotosintesis.pdf';
    const ytThumb = 'https://i.ytimg.com/vi/UPBMG5EYydo/hqdefault.jpg';
    expect(isDisplayableChatImageUrl(pdf)).toBe(false);
    expect(isDisplayableChatImageUrl(ytThumb)).toBe(false);
    expect(imageUrlLooksBroken(pdf)).toBe(true);
  });
});
