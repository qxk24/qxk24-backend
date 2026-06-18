/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Teaching Revision Bypass Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import { resolveAdamChannel } from '../src/adam/adam-channel-router';
import {
  NO_FOUNDER_TEACHING_FLAGS,
  resolveFounderTeachingFlags,
} from '../src/adam/adam-teaching-state-machine';
import {
  stripFounderRevisionMetaLoop,
  stripFounderTeachingInquiryLeak,
} from '../src/adam/adam-founder-empirical-guard';

describe('founder reply revision bypasses teaching learner', () => {
  const revisionMsg = 'Bagus. Cari kelemahan dan titik perubahan yang boleh dibetulkan — tanpa Pertama/Kedua/Ketiga.';

  it('resolveTeachingPhase null on revision directive', () => {
    const flags = resolveFounderTeachingFlags({
      isFounder:                true,
      mode:                     'TEACHING',
      normalizedMessage:        revisionMsg,
      hasTeachingUpload:      false,
      recentAssistantMessages:  ['Jawapan panjang sebelum ini tanpa inquiry. '.repeat(20)],
      recentUserMessages:       [],
    });
    expect(flags).toEqual(NO_FOUNDER_TEACHING_FLAGS);
  });

  it('routes to founder-command not teaching-learner', () => {
    const channel = resolveAdamChannel({
      isFounder:     true,
      mode:          'TEACHING',
      userMessage:   revisionMsg,
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    expect(channel.channelId).toBe('founder-command');
  });

  it('prompt injects reply revision law not teaching absorption', () => {
    const prompt = buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder:            true,
      participantName:      'Masa Bayu',
      founderStudentsBlock: '',
      userMessage:          revisionMsg,
    });
    expect(prompt).toMatch(/FOUNDER REPLY REVISION/i);
    expect(prompt).toMatch(/FOUNDER EMPIRICAL PEDAGOGY/i);
    expect(prompt).not.toMatch(/FOUNDER TEACHING — ABSORPTION MODE/i);
    expect(prompt).not.toMatch(/TEACHING INQUIRY — SITUASI NYATA.*mandatory/i);
  });
});

describe('strip teaching inquiry leak from command output', () => {
  it('removes inquiry block and meta obedience loop', () => {
    const sample = [
      'Hai Masa, P.alt, saya terima arahan itu dengan penuh adab.',
      '',
      'Kelemahan utama dalam jawapan sebelum ini ialah struktur Pertama/Kedua.',
      '',
      'Saya mohon izin untuk menyampaikan semula.',
      '',
      '**[TEACHING INQUIRY — SITUASI NYATA]**',
      '',
      '1. Situasi nyata manakah?',
    ].join('\n');
    let out = stripFounderRevisionMetaLoop(sample);
    out = stripFounderTeachingInquiryLeak(out);
    expect(out).not.toMatch(/TEACHING INQUIRY/i);
    expect(out).not.toMatch(/saya terima arahan/i);
    expect(out).not.toMatch(/mohon izin/i);
    expect(out).not.toMatch(/Kelemahan utama/i);
  });
});
