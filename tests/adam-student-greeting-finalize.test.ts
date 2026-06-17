/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Greeting Finalize Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { buildFinalResponseForSave } from '../src/adam/adam-chat-stream-post-finalize';
import type { AdamChatTurnShell, JournalGenContext } from '../src/adam/adam-chat-stream.types';

const SKY_ASK = 'Kenapa langit kelihatan biru pada siang hari?';
const SKY_BODY = [
  'Langit kelihatan biru pada siang hari bukan kerana langit itu sendiri berwarna biru, tetapi kerana cara cahaya matahari berinteraksi dengan atmosfera Bumi.',
  'Apabila cahaya matahari memasuki atmosfera, ia berlanggar dengan zarah-zarah kecil — fenomena penghamburan Rayleigh.',
  'Mahu saya jelaskan lebih lanjut?',
].join('\n\n');

function studentShell(): AdamChatTurnShell {
  return {
    resolvedSessionId: 'test-session',
    userMessage:       SKY_ASK,
    normalizedMessage: SKY_ASK,
    messageForAdam:    SKY_ASK,
    mode:              'TEACHING',
    isFounder:         false,
    isGroup:           false,
    participant: {
      userId:      'ahmad',
      userName:    'Ahmad bin Ali',
      role:        'student',
      sessionType: 'student',
    },
    options:       {},
    onEvent:       () => {},
    uploadIds:     [],
    teaching:      { context: '', fileNames: [], uploadIds: [] },
    userMessageId: 'user-1',
  };
}

const emptyJournal: JournalGenContext = {
  journalTopic:           null,
  journalTopicId:         undefined,
  wantsJournalWrite:      false,
  journalWriteBySections: false,
  systemPrompt:           '',
};

describe('buildFinalResponseForSave — Hai + name last mile', () => {
  it('prepends Hai + name before DB save on substantive science reply', () => {
    const out = buildFinalResponseForSave({
      shell:                    studentShell(),
      fullResponse:             SKY_BODY,
      journal:                  emptyJournal,
      journalSealCleanResponse: SKY_BODY,
    });
    expect(out).toMatch(/^Hai Ahmad,/i);
    expect(out).toMatch(/penghamburan Rayleigh/i);
    expect(out).toMatch(/Mahu saya jelaskan lebih lanjut/i);
  });
});
