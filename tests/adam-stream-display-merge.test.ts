/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Stream Display Merge Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { resolveAdamTurnDisplayForSave } from '../src/adam/adam-stream-display-merge';

describe('resolveAdamTurnDisplayForSave', () => {
  it('keeps repaired body when konvensional video tag was injected', () => {
    const streamed = [
      'Hai QA, fotosintesis ialah proses biokimia di mana tumbuhan hijau menghasilkan glukosa.',
      '',
      '<adam-technical-diagram>flowchart LR\nA-->B\n</adam-technical-diagram>',
      '',
      '<adam-chat-image url="https://upload.wikimedia.org/wikipedia/commons/8/84/Fotosintesis.jpg" alt="Fotosintesis" />',
      '',
      'Cahaya matahari bukan sekadar sumber tenaga fizikal.',
      '',
      'Mahu saya jelaskan lebih lanjut?',
    ].join('\n');
    const repaired = streamed.replace(
      /(<adam-chat-image\b[^>]*\/?>)/i,
      '$1\n\n<adam-chat-video url="https://www.youtube.com/watch?v=53v-bKx53Lo" title="Fotosintesis" />',
    );
    const out = resolveAdamTurnDisplayForSave(streamed, repaired, {
      userMessage: 'Apa itu fotosintesis?',
    });
    expect(out).toMatch(/<adam-chat-video\b[^>]*53v-bKx53Lo/i);
  });
});
