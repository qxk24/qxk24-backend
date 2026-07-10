/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAMGuru — Kelas Chat Stream
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  resolveAdamChatModel,
  resolveAdamMaxTokens,
  resolveQwenEnableThinking,
} from '../config/llm-models';
import { toLlmMessages } from '../llm/llm-types';
import { sanitizeAdamProseDashBridges } from './adam-prose-sanitize';
import { buildAdamChatSystemPrompt } from './adam-prompt-builder';
import { createAdamUlStreamOnce } from './adam-chat-stream-ul-dialogue';
import { repairAdamStreamOutput } from './adam-chat-stream-llm';
import { NO_FOUNDER_TEACHING_FLAGS } from './adam-teaching-state-machine';
import {
  generateK24Address,
  saveMessage,
} from './adam-chat-session.service';
import { buildGuruKelasContext } from './adam-guru-context-builder';
import { appendGuruLaneTeaching } from './adam-guru-lane.service';
import {
  ADAMGURU_EDUCATION_LAW,
  ADAMGURU_SLEEP_LISTENING,
  ADAMGURU_TEACH_ABSORPTION,
} from './adam-guru-prompts';
import { isKelasAdamAwake } from './adam-guru.service';
import type { GuruKelasContext } from './adam-guru-types';
import type { ADAMChatMode, SSEEventType } from './adam.types';
import type { ChatParticipant } from './adam-student.types';

export async function streamADAMGuruKelasChat(input: {
  kelas:         GuruKelasContext;
  sessionId:     string;
  userMessage:   string;
  mode:          ADAMChatMode;
  participant:   ChatParticipant;
  isTeachTurn:   boolean;
  memberRole:    'guru' | 'student';
  onEvent:       (event: SSEEventType, data: string) => void;
}): Promise<void> {
  const {
    kelas,
    sessionId,
    userMessage,
    mode,
    participant,
    isTeachTurn,
    memberRole,
    onEvent,
  } = input;

  const normalized = userMessage.trim();
  const storedContent = `[${participant.userName}]: ${normalized || '(message)'}`;

  const messageRole = memberRole === 'guru' ? 'guru' : 'student';

  await saveMessage(
    sessionId,
    messageRole,
    storedContent,
    mode,
    undefined,
    undefined,
    kelas.guruId,
    {
      speakerId:   participant.userId,
      speakerName: participant.userName,
      sessionType: 'guru',
    },
  );

  if (!normalized) {
    onEvent('adam_complete', JSON.stringify({ sessionId, response: '' }));
    return;
  }

  if (!isKelasAdamAwake(kelas)) {
    onEvent('adam_guru_sleep', JSON.stringify({
      sessionId,
      kelasId:   kelas.kelasId,
      adamAwake: false,
      listening: true,
      message:   'ADAM is in sleep — listening silently. Message logged; ADAM will not speak until woken.',
    }));
    onEvent('adam_complete', JSON.stringify({
      sessionId,
      response:  '',
      sleeping:  true,
      listening: true,
      adamAwake: false,
      kelasId:   kelas.kelasId,
    }));
    return;
  }

  onEvent('adam_thinking', JSON.stringify({ sessionId, mode, kelasId: kelas.kelasId }));

  const contextMessages = await buildGuruKelasContext(
    kelas,
    participant.userName,
    '',
  );

  const isGuruTeaching = memberRole === 'guru' && isTeachTurn;

  let systemPrompt = buildAdamChatSystemPrompt({
    mode,
    isFounder:            false,
    participantName:      participant.userName,
    userMessage:          normalized,
    founderStudentsBlock: '',
    usersKnowledgeTier: 1,
  });

  systemPrompt = [
    systemPrompt,
    ADAMGURU_EDUCATION_LAW,
    ADAMGURU_SLEEP_LISTENING,
    isGuruTeaching ? ADAMGURU_TEACH_ABSORPTION : '',
    `Kelas: ${kelas.title}`,
    `Subject (this kelas only): ${kelas.subject || 'unspecified'}`,
    `Guru: ${kelas.guruName}`,
    'This kelas has its own teaching lane — do not mix material from other subjects or kelas.',
  ].filter(Boolean).join('\n\n');

  const modelChoice = resolveAdamChatModel({
    participant: {
      userId:      participant.userId,
      userName:    participant.userName,
      role:        'student',
      sessionType: 'guru',
    },
    mode,
    message:    normalized,
    hasUploads: false,
  });

  const llmMessages = toLlmMessages(contextMessages);
  const maxTokens = resolveAdamMaxTokens(modelChoice.tier, false, mode);
  const enableThinking = resolveQwenEnableThinking(modelChoice.tier, mode, {
    isStudent: true,
  });

  const streamOnce = createAdamUlStreamOnce({
    shell: {
      resolvedSessionId: sessionId,
      userMessage:       normalized,
      normalizedMessage: normalized,
      messageForAdam:    normalized,
      mode,
      isFounder:         false,
      isGroup:           true,
      participant,
      options:           {},
      onEvent,
      uploadIds:         [],
      teaching:          { context: '', fileNames: [], uploadIds: [] },
      userMessageId:     '',
    },
    mode,
    contextMessages: llmMessages,
    onEvent,
  });

  const streamStarted = Date.now();
  const streamResult = await streamOnce(llmMessages, false);
  const streamMs = Date.now() - streamStarted;

  const repairResult = await repairAdamStreamOutput({
    shell: {
      resolvedSessionId: sessionId,
      userMessage:       normalized,
      normalizedMessage: normalized,
      messageForAdam:    normalized,
      mode,
      isFounder:         false,
      isGroup:           true,
      participant,
      options:           {},
      onEvent,
      uploadIds:         [],
      teaching:          { context: '', fileNames: [], uploadIds: [] },
      userMessageId:     '',
    },
    rawModelStream:  streamResult.text,
    teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    recentUserTurns: [normalized],
    mode,
  });

  let fullResponse = repairResult.fullResponse;
  if (fullResponse?.trim()) {
    fullResponse = sanitizeAdamProseDashBridges(fullResponse);
  }

  if (isGuruTeaching && fullResponse?.trim()) {
    void appendGuruLaneTeaching({
      kelasId:   kelas.kelasId,
      guruName:  participant.userName,
      teaching:  normalized,
      adamEcho:  fullResponse,
    }).catch((err) => console.error('[ADAMGuru] lane append:', err));
  }

  const k24Address = await generateK24Address(mode);
  const messageId = await saveMessage(
    sessionId,
    'adam',
    fullResponse,
    mode,
    undefined,
    k24Address,
    kelas.guruId,
    {
      speakerId:   'adam',
      speakerName: 'ADAM',
      sessionType: 'guru',
    },
  );

  onEvent('adam_complete', JSON.stringify({
    sessionId,
    messageId,
    k24Address,
    response:  fullResponse,
    mode,
    model:     modelChoice.model,
    modelTier: modelChoice.tier,
    kelasId:   kelas.kelasId,
    streamMs,
  }));

}
