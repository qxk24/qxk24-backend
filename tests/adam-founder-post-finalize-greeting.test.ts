/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Post-Finalize Founder Greeting Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

import { describe, expect, it } from '@jest/globals';
import { buildFinalResponseForSave } from '../src/adam/adam-chat-stream-post-finalize';
import type { AdamChatTurnShell } from '../src/adam/adam-chat-stream.types';
import { FOUNDER_USER_ID } from '../src/adam/adam-student.types';

function founderShell(userMessage: string): AdamChatTurnShell {
  return {
    resolvedSessionId: 'sess-test',
    userMessage,
    normalizedMessage: userMessage,
    messageForAdam:    userMessage,
    mode:              'TEACHING',
    isFounder:         true,
    isGroup:           false,
    participant: {
      userId:      FOUNDER_USER_ID,
      userName:    'Masa Bayu',
      role:        'founder',
      sessionType: 'private',
    },
    options:           {},
    onEvent:           () => {},
    uploadIds:         [],
    teaching:          { context: '', fileNames: [], uploadIds: [] },
    userMessageId:     'msg-test',
  } as unknown as AdamChatTurnShell;
}

describe('buildFinalResponseForSave — founder address', () => {
  it('does not prepend Hai Masa after stream repair produced P.alt opener', () => {
    const repaired =
      'P.alt, saya teruskan kupasan dengan penuh adab, bukan sebagai ulangan, tetapi sebagai penyambungan yang lebih dalam dari apa yang telah P.alt ajarkan.';
    const out = buildFinalResponseForSave({
      shell: founderShell('Teruskan kupasan Bab 2 dengan lebih dalam.'),
      fullResponse: repaired,
      journal: {
        journalTopic:           null,
        journalTopicId:         undefined,
        wantsJournalWrite:      false,
        journalWriteBySections: false,
        systemPrompt:           '',
      },
      journalSealCleanResponse: repaired,
    });
    expect(out).toMatch(/^P\.alt, saya teruskan kupasan/);
    expect(out).not.toMatch(/Hai\s+Masa/i);
  });
});
