/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Chat Stream Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-30
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import {
  founderWebSearchEnabled,
  getFounderWebSearchPrompt,
  getWebSearchGateReason,
} from './adam-web-search';
import { resolveAdamChatModel, resolveAdamMaxTokens, resolveQwenEnableThinking } from '../config/llm-models';
import { friendlyLlmError, isQwenDataInspectionError, llmStream, toLlmMessages } from '../llm/llm-client';
import {
  buildQwenLanguageLock,
  repairEastAsianScriptLeak,
  sanitizeEastAsianScriptLeaks,
} from './adam-language-guard';
import { detectLanguage } from './adam-language-mirror.service';
import type { LlmMessage } from '../llm/llm-types';
import { normalizeUserMessage } from './adam-context-budget';
import {
  buildTeachingContext,
  composeFounderMessage,
  composeStudentMessage,
  deleteTeachingUploads,
} from './adam-upload.service';
import { withFounderLock } from '../qxk24brain/adam-concurrency.service';
import { triggerBrainTransformation } from '../qxk24brain/qxk24brain.engine';
import { buildMacBridgeContextBlock } from '../agent/mac-bridge-context';
import { buildSmartContext } from '../qxk24brain/adam-context-builder';
import { prependCoreToSystem } from '../qxk24brain/adam-core';
import { checkMemoryHealthCached } from '../qxk24brain/adam-health.service';
import { updateSessionSummary } from '../qxk24brain/adam-anchor.service';
import { processStudentContribution } from '../qxk24brain/qxk24brain-student.engine';
import {
  appendWorkspaceUnderstanding,
  getWorkspaceBySession,
  touchWorkspace,
} from './adam-workspace.service';
import { ADAMWorkspaceModel } from './adam-workspace.schema';
import {
  createConsultFlag,
  markConsultDeliveredToFounder,
} from './adam-consult.service';
import {
  FOUNDER_USER_ID,
  type ChatParticipant,
} from './adam-student.types';
import type { ADAMChatMode, SSEEventType } from './adam.types';
import {
  buildAdamChatSystemPrompt,
  CONSULT_PHRASE,
} from './adam-system-prompts';
import { buildFounderStudentsAwarenessBlock } from './adam-student-registry.service';
import {
  founderWantsStudentRelay,
  founderWantsJournalSeal,
  adamDeclinesJournalSeal,
  hasSubstantiveManuscriptProse,
  parseBroadcastBlocks,
  parseConsultBlock,
  parseJournalSealBlocks,
  parseJudgmentBlock,
  parseToFounderBlocks,
  journalTurnNeedsContinuation,
  studentWantsFounderRelay,
} from './adam-chat-response-parser';
import { processFounderJournalSeal, gatherFounderJournalCorpus } from './adam-journal.service';
import {
  ensureSession,
  generateK24Address,
  saveMessage,
} from './adam-chat-session.service';
import {
  relayFounderMessageToStudents,
  relayStudentMessageToFounder,
} from './adam-chat-relay.service';
import { resolveBuilderActivation } from '../agent/adam-intent-classifier';
import { resolveBuilderAccess } from '../middleware/builder-access.middleware';
import {
  formatBuilderTranscript,
  runBuilderChatSession,
  builderSessionIdForChat,
  type BuilderChatEvent,
} from '../agent/adam-builder-chat.service';
import {
  createBuilderAbortController,
  releaseBuilderAbort,
} from '../agent/adam-builder-abort.store';

export interface StreamADAMChatOptions {
  founderToken?:      string;
  /** BUILDER or AUDIT mode — always run builder when enabled */
  forceBuilder?:      boolean;
  /** Client asked backend to run builder (builderMode in POST body) */
  clientBuilderMode?: boolean;
  /** Client believes this turn may need builder (explicit /build, BUILDER mode, code signals) */
  builderEvaluate?:   boolean;
}

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
      ? [
          normalizedMessage.trim() || 'Founder shared teaching data for constitutional absorption.',
          '',
          `[Teaching absorbed: ${teaching.fileNames.join(', ')} — raw upload erased per AIDIL; energy in QXK24Brain]`,
        ].join('\n')
      : teaching.fileNames.length
        ? [
            normalizedMessage.trim() || `${participant.userName} shared attachment(s).`,
            '',
            attachmentNote,
          ].join('\n')
        : normalizedMessage.trim();

  const userRole = isFounder ? 'founder' : 'student';

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

    onEvent('adam_thinking', JSON.stringify({ sessionId: resolvedSessionId, mode }));

    const builderEnabled = ENV.ADAM_BUILDER_ENABLED;
    const clientWantsBuilder = options.clientBuilderMode === true
      || options.forceBuilder === true
      || mode === 'BUILDER';
    const wantsBuilder = clientWantsBuilder || mode === 'AUDIT';

    async function emitBuilderUnavailable(reason: string, response: string): Promise<void> {
      const adamMessageId = await saveMessage(
        resolvedSessionId,
        'adam',
        response,
        mode,
        'WAQF',
        undefined,
        isGroup ? 'group-alamtologi' : participant.userId,
      );
      onEvent('adam_builder_status', JSON.stringify({
        sessionId: resolvedSessionId,
        available: false,
        reason,
        message:   response,
      }));
      onEvent('adam_complete', JSON.stringify({
        sessionId:   resolvedSessionId,
        messageId:   adamMessageId,
        response,
        judgment:    'WAQF',
        builderMode: false,
      }));
    }

    if (wantsBuilder && !builderEnabled) {
      await emitBuilderUnavailable(
        'builder_disabled',
        'ADAM Builder is not enabled on this server. Set ADAM_BUILDER_ENABLED=true and QXK24_ROOT on the API.',
      );
      return;
    }

    if (clientWantsBuilder && builderEnabled && !options.founderToken) {
      await emitBuilderUnavailable(
        'no_founder_token',
        'Builder could not start — missing founder auth token on this request. Sign in again on the command board.',
      );
      return;
    }

    const founderTeachingOnLab = isFounder
      && builderEnabled
      && (mode === 'TEACHING' || mode === 'CONSTITUTIONAL' || mode === 'JOURNAL_GEN');
    const hasUploads = uploadIds.length > 0;
    const forceBuilderTurn = options.forceBuilder === true
      || mode === 'BUILDER'
      || mode === 'AUDIT'
      || clientWantsBuilder;

    if (builderEnabled && options.founderToken) {
      const access = await resolveBuilderAccess(participant);
      const activation = resolveBuilderActivation(normalizedMessage, {
        forceBuilder: forceBuilderTurn,
      });

      const strongCodeTurn = activation.confidence >= 80
        || forceBuilderTurn;
      const allowBuilderWithUploads = hasUploads && (founderTeachingOnLab || clientWantsBuilder) && strongCodeTurn;
      const canStartBuilder = activation.activate
        && access.hasAccess
        && (!hasUploads || allowBuilderWithUploads || forceBuilderTurn);

      if (canStartBuilder) {
        onEvent('adam_builder_status', JSON.stringify({
          sessionId: resolvedSessionId,
          available: true,
          reason:    activation.reason,
          intent:    activation.intent,
        }));
        const builderEvents: BuilderChatEvent[] = [];
        let pendingApproval = false;
        const builderSessionId = builderSessionIdForChat(resolvedSessionId);
        const abortController = createBuilderAbortController(
          builderSessionId,
          [resolvedSessionId],
        );

        console.log(
          `[ADAM Builder] Chat activation — reason=${activation.reason} intent=${activation.intent} confidence=${activation.confidence}`,
        );

        try {
          const builderMessage = isFounder
            ? composeFounderMessage(activation.message, teaching.context)
            : composeStudentMessage(
                activation.message,
                teaching.context,
                participant.userName,
              );

          for await (const event of runBuilderChatSession(
            builderMessage,
            activation.intent === 'none' ? 'write_code' : activation.intent,
            resolvedSessionId,
            options.founderToken,
            abortController.signal,
          )) {
            if (event.type === 'heartbeat') continue;
            builderEvents.push(event);
            onEvent('builder', JSON.stringify(event));

            if (event.type === 'approval_needed' || event.type === 'proposal') {
              pendingApproval = true;
            }
          }
        } finally {
          releaseBuilderAbort(builderSessionId);
        }

        const transcript = formatBuilderTranscript(builderEvents);
        const adamMessageId = await saveMessage(
          resolvedSessionId,
          'adam',
          transcript || 'Builder session finished.',
          mode,
          'ISLAH',
          undefined,
          isGroup ? 'group-alamtologi' : participant.userId,
        );

        onEvent('adam_complete', JSON.stringify({
          sessionId:       resolvedSessionId,
          messageId:       adamMessageId,
          response:        transcript,
          judgment:        'ISLAH',
          builderMode:     true,
          builderPending:  pendingApproval,
          builderSessionId: `build_${resolvedSessionId}`,
          intent:          activation.intent === 'none' ? 'write_code' : activation.intent,
        }));
        return;
      }

      if (clientWantsBuilder || mode === 'AUDIT') {
        let skipReason = 'no_intent';
        let skipMessage = 'Builder did not activate. Start with Build: … or /build …, or select the BUILDER mode chip.';

        if (!access.hasAccess) {
          skipReason = 'access_denied';
          skipMessage = 'Builder requires founder lab access.';
        } else if (hasUploads && !allowBuilderWithUploads && !forceBuilderTurn) {
          skipReason = 'uploads_blocking';
          skipMessage = 'Builder cannot run with file uploads on the same turn. Send the code task without attachments, or use BUILDER mode.';
        } else if (!activation.activate) {
          skipReason = activation.reason;
        }

        await emitBuilderUnavailable(skipReason, skipMessage);
        return;
      }

      if (isFounder && !activation.activate) {
        console.log(
          `[ADAM Builder] Skipped — reason=${activation.reason} confidence=${activation.confidence} hasAccess=${access.hasAccess}`,
        );
      }
    }

    if (!isFounder && !workspace) {
      void processStudentContribution(
        participant.userId,
        participant.userName,
        messageForAdam,
      ).catch((err) => console.error('[QXK24Brain] Student background merge:', err));
    }

    try {
      const contextStarted = Date.now();
      const contextMessages = await buildSmartContext(
        resolvedSessionId,
        isGroup ? `[${participant.userName}]: ${messageForAdam}` : messageForAdam,
        participant,
        workspace,
        mode,
      );
      const contextMs = Date.now() - contextStarted;

      const workspacePrompt = workspace
        ? `\n[AIDIL WORKSPACE: "${workspace.title}" — separate family. Do NOT mix with other books or the student's general chat.]`
        : '';

      const macBridgeBlock = isFounder ? buildMacBridgeContextBlock() : '';

      let systemPrompt = prependCoreToSystem(
        buildAdamChatSystemPrompt({
          mode,
          isFounder,
          participantName:      participant.userName,
          workspacePrompt,
          founderStudentsBlock: buildFounderStudentsAwarenessBlock(),
          webSearchPrompt:      isFounder && founderWebSearchEnabled()
            ? getFounderWebSearchPrompt()
            : undefined,
        }),
      );

      if (macBridgeBlock) {
        systemPrompt = `${systemPrompt}\n\n${macBridgeBlock}`;
      }

      systemPrompt = `${buildQwenLanguageLock()}\n\n${systemPrompt}`;

      const modelChoice = resolveAdamChatModel({
        participant,
        mode,
        message:    userMessage,
        hasUploads: uploadIds.length > 0,
      });

      const llmMessages = toLlmMessages(contextMessages);
      const maxTokens = resolveAdamMaxTokens(modelChoice.tier, isFounder, mode);
      const enableThinking = resolveQwenEnableThinking(modelChoice.tier, mode);
      const webSearchGateReason = isFounder ? getWebSearchGateReason(userMessage) : null;
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

      const streamOnce = async (
        messages: LlmMessage[],
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
            onEvent:          (event, data) => onEvent(event as SSEEventType, data),
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

      const JOURNAL_CONTINUE_PROMPT =
        'Continue exactly where you stopped — same manuscript, same voice. Do not repeat earlier sections. ' +
        'If <adam_journal_seal> is open, complete the JSON and close </adam_journal_seal>. ' +
        'Finish the current IMRaD section before starting the next.';

      let fullResponse: string;
      const streamStarted = Date.now();
      fullResponse = await streamOnce(llmMessages, enableWebSearch);
      const streamMs = Date.now() - streamStarted;
      let repairMs = 0;

      const maxJournalContinuations =
        isFounder && mode === 'JOURNAL_GEN' ? 2 : 0;

      for (let cont = 0; cont < maxJournalContinuations; cont++) {
        if (!journalTurnNeedsContinuation(fullResponse, userMessage)) break;

        console.log(
          '[adam:journal-continue]',
          JSON.stringify({
            sessionId: resolvedSessionId,
            continuation: cont + 1,
            charsSoFar: fullResponse.length,
            ts: new Date().toISOString(),
          }),
        );

        onEvent(
          'adam_chunk',
          JSON.stringify({ text: '\n\n— continuing manuscript —\n\n' }),
        );

        const continued = await streamOnce(
          [
            ...llmMessages,
            { role: 'assistant', content: fullResponse },
            { role: 'user', content: JOURNAL_CONTINUE_PROMPT },
          ],
          false,
        );
        fullResponse += continued;
      }

      const JOURNAL_WRITE_THEN_SEAL_PROMPT =
        'P.alt tapped Save for review. Write the COMPLETE IMRaD manuscript from this entire session ' +
        '(cover letter topics, Alamtologi seven principles, Hukum Z). ' +
        'Then emit valid <adam_journal_seal> JSON with every field filled. ' +
        'Do not apologize. Do not ask P.alt to paste. Do not refuse.';

      if (
        isFounder &&
        mode === 'JOURNAL_GEN' &&
        founderWantsJournalSeal(userMessage) &&
        !/<\/adam_journal_seal>/.test(fullResponse)
      ) {
        const corpus = await gatherFounderJournalCorpus(resolvedSessionId, fullResponse);
        const hasDraft =
          hasSubstantiveManuscriptProse(corpus) || hasSubstantiveManuscriptProse(fullResponse);
        const needsWrite =
          !hasDraft || adamDeclinesJournalSeal(fullResponse) || fullResponse.length < 2200;

        if (needsWrite) {
          const maxWriteSeal = 2;
          for (let w = 0; w < maxWriteSeal; w++) {
            console.log(
              '[adam:journal-write-seal]',
              JSON.stringify({
                sessionId: resolvedSessionId,
                pass: w + 1,
                charsSoFar: fullResponse.length,
                ts: new Date().toISOString(),
              }),
            );

            onEvent(
              'adam_chunk',
              JSON.stringify({ text: '\n\n— writing IMRaD manuscript for seal —\n\n' }),
            );

            const continued = await streamOnce(
              [
                ...llmMessages,
                { role: 'assistant', content: fullResponse },
                { role: 'user', content: JOURNAL_WRITE_THEN_SEAL_PROMPT },
              ],
              false,
            );
            fullResponse += continued;
            if (/<\/adam_journal_seal>/.test(fullResponse)) break;
          }
        }
      }

      const repairStarted = Date.now();
      fullResponse = await repairEastAsianScriptLeak(fullResponse, userMessage);
      repairMs = Date.now() - repairStarted;

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

      const {
        judgment,
        tahapAkal,
        healthScore,
        principleApplied,
        cleanResponse: judgedResponse,
      } = parseJudgmentBlock(fullResponse);

      const consult = parseConsultBlock(judgedResponse);
      const broadcast = parseBroadcastBlocks(consult.cleanResponse);
      const toFounder = parseToFounderBlocks(broadcast.cleanResponse);
      const journalSeal = parseJournalSealBlocks(toFounder.cleanResponse);
      const speakerLocale = detectLanguage(userMessage).detectedLocale;
      let finalResponse = sanitizeEastAsianScriptLeaks(
        journalSeal.cleanResponse,
        speakerLocale,
      );

      let sealedJournals: { id: string; title: string }[] = [];
      let sealErrors: string[] = [];
      if (isFounder) {
        const sealResult = await processFounderJournalSeal({
          sessionId:      resolvedSessionId,
          userMessage,
          fullResponse,
          finalResponse,
          sealsFromReply: journalSeal.seals,
        });
        sealedJournals = sealResult.sealedJournals;
        sealErrors = sealResult.sealErrors;
      }

      let relayedToStudents = 0;
      if (isFounder) {
        const attachmentIds = teaching.uploadIds;
        const broadcasts =
          broadcast.broadcasts.length > 0
            ? broadcast.broadcasts
            : attachmentIds.length && founderWantsStudentRelay(userMessage)
              ? [{
                  message: userMessage.trim() || 'Founder shared teaching data for you.',
                  target:  'all',
                }]
              : [];

        for (const b of broadcasts) {
          const result = await relayFounderMessageToStudents(b, mode, attachmentIds);
          relayedToStudents += result.privateCount + (result.groupId ? 1 : 0);
        }
      }

      let relayedToFounder = false;
      if (!isFounder) {
        const relayNote = consult.reason || undefined;

        const deliverToFounder = async (text: string) => {
          await relayStudentMessageToFounder({
            studentId:   participant.userId,
            studentName: participant.userName,
            message:     text,
            adamNote:    relayNote,
            mode,
          });
          relayedToFounder = true;
        };

        for (const r of toFounder.relays) {
          await deliverToFounder(r.message);
        }

        if (consult.needsConsult) {
          if (!finalResponse.includes(CONSULT_PHRASE)) {
            finalResponse = `${CONSULT_PHRASE}.\n\n${finalResponse}`.trim();
          }
          const consultRecord = await createConsultFlag({
            studentId:      participant.userId,
            studentName:    participant.userName,
            sessionId:      resolvedSessionId,
            sessionType:    isGroup ? 'group' : 'student',
            studentMessage: userMessage,
            adamSummary:    consult.reason || finalResponse.slice(0, 500),
          });
          if (!toFounder.relays.length) {
            const relayBody = teaching.fileNames.length
              ? [
                  userMessage.trim() || '(attachment only)',
                  '',
                  `Files: ${teaching.fileNames.join(', ')}`,
                ].join('\n')
              : userMessage.trim();
            await deliverToFounder(relayBody);
          }
          await markConsultDeliveredToFounder(consultRecord.id);
        } else if (!relayedToFounder && studentWantsFounderRelay(userMessage)) {
          const relayBody = teaching.fileNames.length
            ? [
                userMessage.trim() || '(attachment only)',
                '',
                `Files: ${teaching.fileNames.join(', ')}`,
              ].join('\n')
            : userMessage.trim();
          await deliverToFounder(relayBody);
        }
      }

      const k24Address = await generateK24Address(mode);
      const messageId = await saveMessage(
        resolvedSessionId,
        'adam',
        finalResponse,
        mode,
        judgment,
        k24Address,
        isGroup ? 'group-alamtologi' : participant.userId,
        {
          speakerId:    'adam',
          speakerName:  'ADAM',
          sessionType:  participant.sessionType,
          needsConsult: consult.needsConsult && !isFounder,
        },
      );

      let memoryHealth: Awaited<ReturnType<typeof checkMemoryHealthCached>> | undefined;
      let healthBadge: string | undefined;
      if (isFounder) {
        memoryHealth = await checkMemoryHealthCached(FOUNDER_USER_ID, resolvedSessionId);
        const emoji = memoryHealth.status === 'HEALTHY' ? '🟢'
          : memoryHealth.status === 'WARNING' ? '🟡'
            : '🔴';
        healthBadge = `${emoji} Memory: ${memoryHealth.status} (${memoryHealth.score}/100)`;
      }

      onEvent('adam_complete', JSON.stringify({
        sessionId:        resolvedSessionId,
        messageId,
        k24Address,
        judgment,
        tahapAkal,
        healthScore,
        principleApplied,
        response:       finalResponse,
        mode,
        needsConsult:   consult.needsConsult && !isFounder,
        model:          modelChoice.model,
        modelTier:      modelChoice.tier,
        modelReason:    modelChoice.reason,
        relayedToStudents: isFounder ? relayedToStudents : undefined,
        relayedToFounder:  !isFounder ? relayedToFounder : undefined,
        sealedJournals:    sealedJournals.length > 0 ? sealedJournals : undefined,
        sealErrors:          sealErrors.length > 0 ? sealErrors : undefined,
        workspaceId:    workspace?.workspaceId,
        memoryHealth,
        healthBadge,
      }));

      if (isFounder) {
        void triggerBrainTransformation(messageForAdam, FOUNDER_USER_ID, resolvedSessionId, {
          founderMessageId: userMessageId,
        })
          .catch((err) => console.error('[QXK24Brain] Founder transformation:', err));
        void updateSessionSummary(resolvedSessionId, FOUNDER_USER_ID).catch(() => {});
      }

      if (workspace) {
        void appendWorkspaceUnderstanding(
          workspace.workspaceId,
          participant.userName,
          userMessage,
          finalResponse,
        ).catch((err) => console.error('[ADAM Workspace] understanding update:', err));
      }

      if (teaching.uploadIds.length) {
        try {
          await deleteTeachingUploads(teaching.uploadIds);
        } catch (eraseErr: unknown) {
          const msg = eraseErr instanceof Error ? eraseErr.message : String(eraseErr);
          console.error('[QXK24Brain] Upload erasure error:', msg);
        }
      }
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
