/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Chat Stream Service
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import {
  adamWebSearchEnabled,
  getAdamWebSearchPrompt,
  getWebSearchGateReason,
} from './adam-web-search';
import { resolveAdamChatModel, resolveAdamMaxTokens, resolveQwenEnableThinking } from '../config/llm-models';
import { friendlyLlmError, isQwenDataInspectionError, llmStream, toLlmMessages } from '../llm/llm-client';
import {
  buildQwenLanguageLock,
  repairEastAsianScriptLeak,
} from './adam-language-guard';
import { repairStudentOutputLeak } from './adam-student-output-guard';
import { founderRequestsConstitutionalMirror, founderRequestsTeachingSynthesis, sanitizeFounderTeachingQuranFormat, founderTeachingStoredUserContent } from './adam-founder-teaching-prompts';
import { repairFounderTeachingOutputLeak, detectFounderTeachingOutputLeak, syncSanitizeFounderTeachingOutput } from './adam-founder-teaching-output-guard';
import { normalizeUserMessage } from './adam-context-budget';
import {
  buildTeachingContext,
  composeFounderMessage,
  composeStudentMessage,
} from './adam-upload.service';
import { withFounderLock } from '../qxk24brain/adam-concurrency.service';
import { processStudentContribution } from '../qxk24brain/qxk24brain-student.engine';
import { buildMacBridgeContextBlock } from '../agent/mac-bridge-context';
import { buildSmartContext } from '../qxk24brain/adam-context-builder';
import { prependCoreToSystem } from '../qxk24brain/adam-core';
import {
  getWorkspaceBySession,
  touchWorkspace,
} from './adam-workspace.service';
import { ADAMWorkspaceModel } from './adam-workspace.schema';
import {
  FOUNDER_USER_ID,
  type ChatParticipant,
} from './adam-student.types';
import type { ADAMChatMode, SSEEventType } from './adam.types';
import { buildAdamChatSystemPrompt } from './adam-system-prompts';
import { isAmaBrainV2Enabled } from '../lib/ama/ama-brain-integration.service';
import { resolveTamatLayer5Block } from '../lib/ama/tamat-generator';
import { getOrCreateMaster } from '../qxk24brain/qxk24brain.engine';
import { buildFounderStudentsAwarenessBlock } from './adam-student-registry.service';
import { buildStudentContinuityBridge } from './student-continuity-bridge';
import {
  fetchPlasPrescan,
  formatPlasBlockedResponse,
} from './adam-gateway-client';
import {
  ensureSession,
  generateK24Address,
  loadMessageHistory,
  saveMessage,
} from './adam-chat-session.service';
import {
  SubscriptionModel,
  SubscriptionTier,
} from '../subscriptions/subscription.schema';
import {
  buildLanguageInstruction,
  buildTesterGreeting,
  getTesterLanguage,
  isTesterAccount,
} from '../tester/alm-tester.service';
import { getLanguageByCode } from '../tester/language-config';
import { handleAdamBuilderTurn } from './adam-chat-stream-builder-turn';
import {
  enrichSystemPromptForJournalGen,
  streamAdamJournalResponse,
} from './adam-chat-stream-journal-turn';
import {
  finishAdamChatTurn,
  persistInteractiveJournalDraft,
} from './adam-chat-stream-post-turn';
import {
  founderWantsJournalDraft,
  founderWantsJournalStop,
  founderWantsJournalWrite,
  founderWantsJournalContinue,
} from './adam-chat-response-parser';
import type {
  StreamADAMChatOptions,
  AdamChatTurnShell,
  JournalGenContext,
} from './adam-chat-stream.types';

export type { StreamADAMChatOptions } from './adam-chat-stream.types';

export async function streamADAMChat(
  sessionId: string,
  userMessage: string,
  mode: ADAMChatMode,
  onEvent: (event: SSEEventType, data: string) => void,
  uploadIds: string[] = [],
  participant: ChatParticipant = {
    userId:      FOUNDER_USER_ID,
    userName:    'Masa Bayu',
    role:        'founder',
    sessionType: 'founder',
  },
  options: StreamADAMChatOptions = {},
): Promise<void> {
  const isFounder = participant.role === 'founder';
  const isGroup = participant.sessionType === 'group';

  const resolvedSessionId = await ensureSession(
    sessionId,
    participant.userId,
    participant.sessionType,
  );

  const workspace =
    participant.role === 'student' && !isGroup
      ? await getWorkspaceBySession(resolvedSessionId)
      : null;

  if (workspace && workspace.userId !== participant.userId) {
    throw new Error('Workspace access denied.');
  }

  if (workspace) {
    await touchWorkspace(workspace.workspaceId);
  }

  const normalizedMessage = normalizeUserMessage(userMessage);

  if (
    isFounder
    && mode === 'TEACHING'
    && !founderWantsJournalStop(normalizedMessage)
    && (
      founderWantsJournalWrite(normalizedMessage)
      || founderWantsJournalDraft(normalizedMessage)
      || founderWantsJournalContinue(normalizedMessage)
    )
  ) {
    mode = 'JOURNAL_GEN';
  }

  const teaching = uploadIds.length
    ? await buildTeachingContext(uploadIds, {
        scope:           isFounder ? 'founder' : 'student',
        studentName:     participant.userName,
        ownerUserId:     isFounder ? undefined : participant.userId,
        maxContextChars: ENV.ADAM_CHAT_TEACHING_CHARS,
      })
    : { context: '', fileNames: [], uploadIds: [] };

  const messageForAdam = isFounder
    ? composeFounderMessage(normalizedMessage, teaching.context)
    : composeStudentMessage(normalizedMessage, teaching.context, participant.userName);

  const attachmentNote = teaching.fileNames.length
    ? `[Attached: ${teaching.fileNames.join(', ')} — processed per AIDIL]`
    : '';

  const storedUserContent = isGroup
    ? [
        `[${participant.userName}]: ${normalizedMessage.trim() || (teaching.fileNames.length ? 'Shared attachment(s).' : '')}`,
        attachmentNote,
      ].filter(Boolean).join('\n')
    : isFounder && teaching.fileNames.length
      ? founderTeachingStoredUserContent(normalizedMessage, teaching.fileNames)
      : teaching.fileNames.length
        ? [
            normalizedMessage.trim() || `${participant.userName} shared attachment(s).`,
            '',
            attachmentNote,
          ].join('\n')
        : normalizedMessage.trim() || 'P.alt shared teaching material.';

  const userRole = isFounder ? 'founder' : 'student';

  let isTesterGreetingTurn = false;
  if (
    !isFounder
    && participant.sessionType === 'student'
    && normalizedMessage.trim() === ''
    && await isTesterAccount(participant.userId)
  ) {
    const histBeforeTurn = await loadMessageHistory(resolvedSessionId, 5);
    isTesterGreetingTurn = histBeforeTurn.length === 0;
  }

  const runChatTurn = async (): Promise<void> => {
    const userMessageId = await saveMessage(
      resolvedSessionId,
      userRole,
      storedUserContent,
      mode,
      undefined,
      undefined,
      isGroup ? 'group-alamtologi' : participant.userId,
      {
        speakerId:   participant.userId,
        speakerName: participant.userName,
        sessionType: participant.sessionType,
      },
    );

    if (workspace) {
      await ADAMWorkspaceModel.updateOne(
        { workspaceId: workspace.workspaceId, nucleusUid: null },
        { nucleusUid: userMessageId },
      );
    }

    const shell: AdamChatTurnShell = {
      resolvedSessionId,
      userMessage,
      normalizedMessage,
      messageForAdam,
      mode,
      isFounder,
      isGroup,
      participant,
      options,
      onEvent,
      uploadIds,
      teaching,
      userMessageId,
    };

    if (!isFounder) {
      const plasPrescan = await fetchPlasPrescan({
        input: messageForAdam,
        studentId: participant.userId,
        sessionId: resolvedSessionId,
      });

      if (plasPrescan?.shortCircuit) {
        const blockedResponse = formatPlasBlockedResponse(plasPrescan);
        const k24Address = await generateK24Address(mode);
        const messageId = await saveMessage(
          resolvedSessionId,
          'adam',
          blockedResponse,
          mode,
          'WAQF',
          k24Address,
          isGroup ? 'group-alamtologi' : participant.userId,
          {
            speakerId:   'adam',
            speakerName: 'ADAM',
            sessionType: participant.sessionType,
          },
        );

        onEvent('adam_complete', JSON.stringify({
          sessionId:      resolvedSessionId,
          messageId,
          k24Address,
          judgment:       'WAQF',
          response:       blockedResponse,
          mode,
          plasBlocked:    true,
          plasThreat:     plasPrescan.metadata?.threatCategory,
          gatewayUnavailable: plasPrescan.unavailable === true,
        }));
        return;
      }
    }

    onEvent('adam_thinking', JSON.stringify({ sessionId: resolvedSessionId, mode }));

    if (await handleAdamBuilderTurn(shell)) {
      return;
    }

    if (!isFounder && !workspace) {
      void processStudentContribution(
        participant.userId,
        participant.userName,
        messageForAdam,
      ).catch((err) => console.error('[Alamtologi Brain] Student background merge:', err));
    }

    try {
      const founderTeachingSynthesis =
        isFounder
        && mode === 'TEACHING'
        && !founderRequestsConstitutionalMirror(normalizedMessage)
        && founderRequestsTeachingSynthesis(normalizedMessage);

      const founderTeachingAbsorption =
        isFounder
        && mode === 'TEACHING'
        && !founderRequestsConstitutionalMirror(normalizedMessage)
        && !founderTeachingSynthesis;

      const founderTeachingLearnerTurn = founderTeachingAbsorption || founderTeachingSynthesis;

      const contextStarted = Date.now();
      const contextMessages = await buildSmartContext(
        resolvedSessionId,
        isGroup ? `[${participant.userName}]: ${messageForAdam}` : messageForAdam,
        participant,
        workspace,
        mode,
        {
          recallProbeMessage: normalizedMessage,
          founderTeachingAbsorption: founderTeachingLearnerTurn,
        },
      );
      const contextMs = Date.now() - contextStarted;

      const workspacePrompt = workspace
        ? `\n[AIDIL WORKSPACE: "${workspace.title}" — separate family. Do NOT mix with other books or the student's general chat.]`
        : '';

      const macBridgeBlock = isFounder ? buildMacBridgeContextBlock() : '';

      let studentContinuityBridge: string | undefined;
      if (!isFounder) {
        studentContinuityBridge = await buildStudentContinuityBridge(
          participant.userId,
          resolvedSessionId,
          participant.userName,
          messageForAdam,
        );
      }

      let amaTamatBlock: string | undefined;
      if (
        isAmaBrainV2Enabled()
        && !founderTeachingLearnerTurn
        && mode !== 'JOURNAL_GEN'
      ) {
        const tamat = await resolveTamatLayer5Block(
          messageForAdam,
          () => getOrCreateMaster(FOUNDER_USER_ID),
        );
        if (tamat) amaTamatBlock = tamat;
      }

      let systemPrompt = prependCoreToSystem(
        buildAdamChatSystemPrompt({
          mode,
          answerStyle:              options.answerStyle,
          isFounder,
          participantName:          participant.userName,
          workspacePrompt,
          founderStudentsBlock:     buildFounderStudentsAwarenessBlock(),
          studentContinuityBridge,
          founderTeachingAbsorption,
          founderTeachingSynthesis,
          amaTamatBlock,
          webSearchPrompt:          adamWebSearchEnabled() && founderTeachingSynthesis
            ? getAdamWebSearchPrompt(isFounder, { founderTeachingSynthesis: true })
            : adamWebSearchEnabled() && !founderTeachingAbsorption
              ? getAdamWebSearchPrompt(isFounder)
              : undefined,
        }),
        !isFounder || founderTeachingLearnerTurn,
      );

      if (macBridgeBlock) {
        systemPrompt = `${systemPrompt}\n\n${macBridgeBlock}`;
      }

      if (!isFounder && participant.sessionType === 'student') {
        const isTester = await isTesterAccount(participant.userId);
        if (isTester) {
          const lang = await getTesterLanguage(participant.userId);
          const languageInstruction = buildLanguageInstruction(lang);
          if (languageInstruction) {
            systemPrompt = `${languageInstruction}\n\n${systemPrompt}`;
          }

          if (isTesterGreetingTurn && lang) {
            const langOpt = getLanguageByCode(lang);
            const sub = await SubscriptionModel.findOne({
              userId: participant.userId,
              tier:   SubscriptionTier.TESTER,
            });
            const limit = (sub?.pencarianUsage?.totalMessagesLimit ?? 50)
              + (sub?.pencarianUsage?.extensionMessagesAdded ?? 0);

            const greetingInstruction = buildTesterGreeting(
              participant.userName,
              lang,
              langOpt?.nativeName ?? lang,
              limit,
            );
            systemPrompt = `${greetingInstruction}\n\n${systemPrompt}`;
          }
        }
      }

      let journal: JournalGenContext = {
        journalTopic:           null,
        journalTopicId:         undefined,
        wantsJournalWrite:      false,
        journalWriteBySections: false,
        systemPrompt,
      };

      if (isFounder && mode === 'JOURNAL_GEN') {
        journal = await enrichSystemPromptForJournalGen({
          baseSystemPrompt: systemPrompt,
          userMessage,
          contextMessages,
          options,
        });
        systemPrompt = journal.systemPrompt;
      }

      systemPrompt = `${buildQwenLanguageLock({
        journalPhase: mode === 'JOURNAL_GEN' && isFounder ? 'draft' : undefined,
      })}\n\n${systemPrompt}`;

      const modelChoice = resolveAdamChatModel({
        participant,
        mode,
        message:    userMessage,
        hasUploads: uploadIds.length > 0,
      });

      const llmMessages = toLlmMessages(contextMessages);
      const maxTokens = resolveAdamMaxTokens(modelChoice.tier, isFounder, mode);
      const enableThinking = resolveQwenEnableThinking(
        modelChoice.tier,
        mode,
        { founderTeachingAbsorption: founderTeachingLearnerTurn },
      );
      const webSearchGateReason = founderTeachingSynthesis
        ? getWebSearchGateReason(userMessage, {
          isFounder,
          hasTeachingUpload: teaching.fileNames.length > 0,
          founderTeachingSynthesis: true,
        })
        : founderTeachingAbsorption
          ? null
          : getWebSearchGateReason(userMessage, { isFounder });
      const enableWebSearch = Boolean(webSearchGateReason);

      if (enableWebSearch) {
        console.log(
          '[adam:search-gate] search ENABLED',
          JSON.stringify({
            sessionId: resolvedSessionId,
            messageLength: userMessage.length,
            preview:       userMessage.slice(0, 80),
            reason:        webSearchGateReason,
            stack:         ENV.QXK24_STACK,
            llmProvider:   ENV.LLM_PROVIDER,
            ts:            new Date().toISOString(),
          }),
        );
      }

      // Live stream for students — post-repair is sync sanitize only (no LLM rewrite).
      const bufferStreamForPostRepair = false;

      const streamOnce = async (
        messages: typeof llmMessages,
        withSearch: boolean,
      ): Promise<string> => {
        const callStream = (search: boolean) =>
          llmStream({
            model:            modelChoice.model,
            maxTokens,
            system:           systemPrompt,
            messages,
            enableWebSearch:  search,
            enableThinking,
            onEvent:          (event, data) => {
              if (bufferStreamForPostRepair && event === 'adam_chunk') return;
              onEvent(event as SSEEventType, data);
            },
          });

        const maxAttempts = 3;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            return await callStream(withSearch);
          } catch (streamErr: unknown) {
            if (withSearch && isQwenDataInspectionError(streamErr)) {
              console.warn('[adam:qwen-filter] content filter with web search — retrying without search', {
                sessionId: resolvedSessionId,
                preview:   userMessage.slice(0, 80),
              });
              return await callStream(false);
            }

            const errText = streamErr instanceof Error ? streamErr.message : String(streamErr);
            const retryable = /internal server error|overloaded|529|503|api_error/i.test(errText);
            if (!retryable || attempt === maxAttempts) throw streamErr;
            await new Promise((r) => setTimeout(r, 700 * attempt));
          }
        }
        throw new Error('ADAM stream failed after retries.');
      };

      let fullResponse: string;
      let sectionJournalComplete = false;
      let sectionDraftMap = undefined;
      let streamMs = 0;
      let repairMs = 0;

      if (mode === 'JOURNAL_GEN' && isFounder) {
        const journalResult = await streamAdamJournalResponse({
          resolvedSessionId,
          userMessage,
          mode,
          isFounder,
          journal,
          llmMessages,
          enableWebSearch,
          streamOnce,
          onEvent,
        });
        fullResponse = journalResult.fullResponse;
        sectionJournalComplete = journalResult.sectionJournalComplete;
        sectionDraftMap = journalResult.sectionDraftMap;
        streamMs = journalResult.streamMs;
        repairMs = journalResult.repairMs;
        onEvent('adam_stream_idle', JSON.stringify({ sessionId: resolvedSessionId }));
        onEvent('adam_stream_done', JSON.stringify({
          sessionId: resolvedSessionId,
          replace:   true,
          response:  fullResponse,
        }));
      } else {
        const streamStarted = Date.now();
        fullResponse = await streamOnce(llmMessages, enableWebSearch);
        streamMs = Date.now() - streamStarted;
        onEvent('adam_stream_idle', JSON.stringify({ sessionId: resolvedSessionId }));
        const repairStarted = Date.now();
        fullResponse = await repairEastAsianScriptLeak(fullResponse, userMessage);
        if (!isFounder) {
          fullResponse = await repairStudentOutputLeak(fullResponse, userMessage);
        } else if (founderTeachingLearnerTurn) {
          fullResponse = sanitizeFounderTeachingQuranFormat(fullResponse);
          fullResponse = syncSanitizeFounderTeachingOutput(fullResponse);
          const teachingGuardOptions = {
            allowConventionalSynthesis: founderTeachingSynthesis,
          };
          const teachingLeak = detectFounderTeachingOutputLeak(
            fullResponse,
            normalizedMessage,
            teaching.context,
            teachingGuardOptions,
          );
          if (teachingLeak.hasLeak) {
            fullResponse = await repairFounderTeachingOutputLeak(
              fullResponse,
              normalizedMessage,
              teaching.context,
              false,
              teachingGuardOptions,
            );
          }
        }
        repairMs = Date.now() - repairStarted;

        onEvent('adam_stream_done', JSON.stringify({
          sessionId: resolvedSessionId,
          // Send final sanitized body when repair may have adjusted streamed text.
          replace:   !isFounder && Boolean(fullResponse?.trim()),
          response:  !isFounder ? fullResponse : undefined,
        }));

        if (!fullResponse?.trim()) {
          console.warn('[adam:teaching] empty model response after stream/repair', {
            sessionId: resolvedSessionId,
            mode,
            upload: teaching.fileNames,
          });
          fullResponse = [
            'Bismillahirahmanirrahim.',
            'P.alt, maaf — pada giliran ini jawapan saya kosong.',
            'Sila hantar semula bab itu.',
          ].join(' ');
        }
      }

      console.log(
        '[adam:timing]',
        JSON.stringify({
          sessionId: resolvedSessionId,
          role:      participant.role,
          stack:     ENV.QXK24_STACK,
          mode,
          model:     modelChoice.model,
          tier:      modelChoice.tier,
          reason:    modelChoice.reason,
          contextMs,
          streamMs,
          repairMs,
          inputTurns: llmMessages.length,
        }),
      );

      sectionDraftMap = await persistInteractiveJournalDraft({
        shell,
        fullResponse,
        journal,
        sectionDraftMap,
      });

      await finishAdamChatTurn({
        shell,
        fullResponse,
        journal,
        sectionJournalComplete,
        sectionDraftMap,
        modelChoice,
        workspace,
      });
    } catch (err: unknown) {
      const message = friendlyLlmError(err);
      console.error('[ADAM] stream error:', err);
      onEvent('adam_error', JSON.stringify({
        error:  message,
        waqf:   true,
        reason: 'Constitutional stream interrupted',
      }));
      throw err;
    }
  };

  const lockOwner = isFounder
    ? FOUNDER_USER_ID
    : `student:${participant.userId}`;

  try {
    await withFounderLock(lockOwner, runChatTurn);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('memory lock')) {
      onEvent('adam_error', JSON.stringify({
        error:  message,
        waqf:   false,
        reason: 'Concurrent access — another request is being processed first',
      }));
      return;
    }
    throw err;
  }
}
