/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Brain Recall Filter Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildKonvensionalRecallFromRawBlock,
  contextBlockIsAlamtologiBrainRecall,
  filterContextMessagesForKnowledgeMode,
} from '../src/adam/adam-brain-recall-filter';
import { shouldRunUniversalTeachingRecall } from '../src/adam/adam-universal-recall-router';

const HISAL_RAW = [
  '[UNIVERSAL TEACHING RECALL — episod P.alt relevan dengan soalan ini]',
  '',
  '1. 2026-01-01 · session …abc123 · Stage 3',
  '   HISAL / Penjumlahan',
  '   Episode: Angka 3 lahir dari 2 + 1 dalam HISAL',
  '   P.alt taught: Dalam ilmu HISAL, penjumlahan adalah waqf antara dua aliran.',
  '   ADAM became: Tiga epal ditambah empat epal memberi tujuh biji — jumlah mudah yang boleh dikongsi.',
  '   C uid: C-abc',
].join('\n');

describe('adam-brain-recall-filter', () => {
  it('detects alamtologi recall blocks', () => {
    expect(contextBlockIsAlamtologiBrainRecall(HISAL_RAW)).toBe(true);
    expect(contextBlockIsAlamtologiBrainRecall('[KONVENSIONAL BRAIN RECALL — universal synthesis only]')).toBe(false);
  });

  it('buildKonvensionalRecallFromRawBlock keeps universal outcome only', () => {
    const block = buildKonvensionalRecallFromRawBlock(HISAL_RAW);
    expect(block).toMatch(/KONVENSIONAL BRAIN RECALL/i);
    expect(block).toMatch(/tujuh biji/i);
    expect(block?.split('\n').filter((l) => l.startsWith('- ')).join('\n')).not.toMatch(/HISAL|waqf|2 \+ 1/i);
  });

  it('filterContextMessagesForKnowledgeMode strips HISAL recall on konvensional', () => {
    const messages = [
      { role: 'user' as const, content: 'core' },
      { role: 'assistant' as const, content: 'ack' },
      { role: 'user' as const, content: HISAL_RAW },
      { role: 'assistant' as const, content: 'P.alt, saya muat episod pengajaran relevan — saya sintesis A+B=C.' },
      { role: 'user' as const, content: 'soalan user' },
    ];
    const out = filterContextMessagesForKnowledgeMode(messages, 'konvensional');
    expect(out.some((m) => /UNIVERSAL TEACHING RECALL/i.test(m.content ?? ''))).toBe(false);
    expect(out.some((m) => /KONVENSIONAL BRAIN RECALL/i.test(m.content ?? ''))).toBe(true);
    expect(out.some((m) => /sintesis A\+B=C/i.test(m.content ?? ''))).toBe(false);
  });

  it('filterContextMessagesForKnowledgeMode keeps full recall on sintesis', () => {
    const messages = [
      { role: 'user' as const, content: HISAL_RAW },
      { role: 'assistant' as const, content: 'ack' },
    ];
    const out = filterContextMessagesForKnowledgeMode(messages, 'sintesis');
    expect(out).toHaveLength(2);
    expect(out[0]?.content).toMatch(/UNIVERSAL TEACHING RECALL/i);
  });

  it('shouldRunUniversalTeachingRecall skips α simple arithmetic', () => {
    expect(shouldRunUniversalTeachingRecall({
      message:               'Kalau saya ada 3 epal dan kawan bagi 4 lagi, berapa jumlah epal?',
      teachingFreshUpload:   false,
      bookAwareRecallLoaded: false,
    })).toBe(false);
  });
});
