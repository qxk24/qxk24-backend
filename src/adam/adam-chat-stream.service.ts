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
  buildEntityCorrectionPromptBlock,
  buildFactualGroundingPromptBlock,
  extractRecentUserTurns,
  finalizeVerificationGatedOutput,
  prependSearchUnavailableNotice,
  resolveTechnicalPrecisionTurn,
  resolveUserEntityCorrectionTurn,
  shouldForceWebSearchForTechnicalTurn,
} from './adam-factual-grounding';
import { sanitizeSunomVerifiedOutput } from './adam-sunom-verification';
import { buildKmSensingPromptBlock } from './adam-sunom-km-sensing';
import { enrichSunomVerificationInput } from './adam-sunom-pipeline';
import {
  buildPrefetchedSearchContextBlock,
  runStudentSearchPrefetch,
  shouldStudentUseSearchFirstFlow,
} from './adam-search-first';
import {
  adamWebSearchEnabled,
  getAdamWebSearchPrompt,
  getWebSearchGateReason,
} from './adam-web-search';
import { resolveAdamChatModel, resolveAdamMaxTokens, resolveQwenEnableThinking } from '../config/llm-models';
import { friendlyLlmError, isQwenDataInspectionError, llmStream, toLlmMessages } from '../llm/llm-client';
import type { LlmSearchResult } from '../llm/llm-types';
import {
  buildQwenLanguageLock,
  repairEastAsianScriptLeak,
} from './adam-language-guard';
import {
  buildStudentGreetingFallback,
  buildStudentGuidedPerspectiveFallback,
  STUDENT_ENTITY_CORRECTION_FALLBACK,
  isAdamLightChatTurn,
  isAdamSubstantiveTurn,
} from './adam-response-generation';
import { repairStudentOutputLeak } from './adam-student-output-guard';
import { sanitizeAdamProseDashBridges } from './adam-prose-sanitize';
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
import { resolveStudentKnowledgeTier } from './adam-three-tier-knowledge';
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
import { isGuestUserId } from '../freemium/adam-freemium-guest.service';
import {
  founderWantsJournalDraft,
  founderWantsJournalStop,
  founderWantsJournalWrite,
  founderWantsJournalContinue,
} from './adam-chat-response-parser';
import { founderWantsJournalSectionEdit, founderWantsJournalSectionAppend, founderWantsJournalSaveAddendum } from './adam-journal-section-detect';
import { founderWantsJournalParagraphContinue } from './adam-journal-section-paragraphs';
import type {
  StreamADAMChatOptions,
  AdamChatTurnShell,
  JournalGenContext,
} from './adam-chat-stream.types';

export type { StreamADAMChatOptions } from './adam-chat-stream.types';

/** Tester language/greeting overlay — safe to fetch in parallel with context. */
async function loadTesterSystemPrefix(
  participant: ChatParticipant,
  isGreetingTurn: boolean,
): Promise<string> {
  if (participant.sessionType !== 'student') return '';
  const isTester = await isTesterAccount(participant.userId);
  if (!isTester) return '';

  const lang = await getTesterLanguage(participant.userId);
  const parts: string[] = [];
  const languageInstruction = buildLanguageInstruction(lang);
  if (languageInstruction) parts.push(languageInstruction);

  if (isGreetingTurn && lang) {
    const langOpt = getLanguageByCode(lang);
    const sub = await SubscriptionModel.findOne({
      userId: participant.userId,
      tier:   SubscriptionTier.TESTER,
    });
    const limit = (sub?.pencarianUsage?.totalMessagesLimit ?? 50)
      + (sub?.pencarianUsage?.extensionMessagesAdded ?? 0);
    parts.push(buildTesterGreeting(
      participant.userName,
      lang,
      langOpt?.nativeName ?? lang,
      limit,
    ));
  }

  return parts.filter(Boolean).join('\n\n');
}

/** Last resort when no salvage path applies — prefer buildStudentGuidedPerspectiveFallback. */
const STUDENT_EMPTY_TURN_FALLBACK =
  'Maaf — jawapan tidak tersedia pada giliran ini. Sila hantar semula.';

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
  const isGuestTrial = isGuestUserId(participant.userId);

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
      || founderWantsJournalSectionEdit(normalizedMessage)
      || founderWantsJournalSectionAppend(normalizedMessage)
      || founderWantsJournalSaveAddendum(normalizedMessage)
      || founderWantsJournalParagraphContinue(normalizedMessage)
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

    onEvent('adam_thinking', JSON.stringify({ sessionId: resolvedSessionId, mode }));

    if (!isFounder && !isGuestTrial) {
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

    if (await handleAdamBuilderTurn(shell)) {
      return;
    }

    if (!isFounder && !workspace && !isGuestTrial) {
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
      const needContinuity = !isFounder && !isGuestTrial;
      const needTamat = isAmaBrainV2Enabled()
        && !founderTeachingLearnerTurn
        && mode !== 'JOURNAL_GEN'
        && !isGuestTrial;
      const needTesterPrefix = !isFounder && participant.sessionType === 'student';

      const earlyWebSearchReason =
        !isFounder && adamWebSearchEnabled()
          ? getWebSearchGateReason(messageForAdam, { isFounder: false })
          : null;
      let searchPrefetchParallel = false;
      let searchPrefetchPromise: ReturnType<typeof runStudentSearchPrefetch> | null = null;
      if (earlyWebSearchReason) {
        searchPrefetchParallel = true;
        searchPrefetchPromise = runStudentSearchPrefetch({
          userMessage,
          recentUserMessages: [],
          onSearching: () => {
            onEvent(
              'adam_searching',
              JSON.stringify({ query: userMessage.slice(0, 80) || 'Mencari data sebenar…' }),
            );
          },
          onSearchDone: () => {
            onEvent('adam_search_done', JSON.stringify({ query: '' }));
          },
        });
      }

      const [
        contextMessages,
        studentContinuityBridge,
        amaTamatBlock,
        testerSystemPrefix,
      ] = await Promise.all([
        buildSmartContext(
          resolvedSessionId,
          isGroup ? `[${participant.userName}]: ${messageForAdam}` : messageForAdam,
          participant,
          workspace,
          mode,
          {
            recallProbeMessage: normalizedMessage,
            founderTeachingAbsorption: founderTeachingLearnerTurn,
          },
        ),
        needContinuity
          ? buildStudentContinuityBridge(
            participant.userId,
            resolvedSessionId,
            participant.userName,
            messageForAdam,
          )
          : Promise.resolve(undefined),
        needTamat
          ? resolveTamatLayer5Block(
            messageForAdam,
            () => getOrCreateMaster(FOUNDER_USER_ID),
          ).then((t) => t ?? undefined)
          : Promise.resolve(undefined),
        needTesterPrefix
          ? loadTesterSystemPrefix(participant, isTesterGreetingTurn)
          : Promise.resolve(''),
      ]);
      const contextMs = Date.now() - contextStarted;

      const workspacePrompt = workspace
        ? `\n[AIDIL WORKSPACE: "${workspace.title}" — separate family. Do NOT mix with other books or the student's general chat.]`
        : '';

      const macBridgeBlock = isFounder ? buildMacBridgeContextBlock() : '';

      const recentUserTurns = extractRecentUserTurns(contextMessages);
      const precisionTurn = resolveTechnicalPrecisionTurn(messageForAdam, recentUserTurns);
      const entityCorrectionTurn = resolveUserEntityCorrectionTurn(messageForAdam, recentUserTurns);

      const factualGroundingPrompt = !isFounder
        ? [
          buildFactualGroundingPromptBlock(messageForAdam, {
            recentUserMessages: recentUserTurns,
          }),
          buildEntityCorrectionPromptBlock(messageForAdam, recentUserTurns),
          buildKmSensingPromptBlock(messageForAdam, recentUserTurns),
        ].filter(Boolean).join('\n\n') || undefined
        : undefined;

      const webSearchEnabledThisTurn = adamWebSearchEnabled() && !founderTeachingAbsorption;

      const webSearchGateReason = founderTeachingSynthesis
        ? getWebSearchGateReason(userMessage, {
          isFounder,
          hasTeachingUpload: teaching.fileNames.length > 0,
          founderTeachingSynthesis: true,
        })
        : founderTeachingAbsorption
          ? null
          : getWebSearchGateReason(userMessage, {
            isFounder,
            technicalFollowUp: precisionTurn.isFollowUp,
          });
      const enableWebSearch = Boolean(webSearchGateReason);
      const studentSearchFirst = shouldStudentUseSearchFirstFlow(!isFounder, webSearchGateReason);
      const studentKnowledgeTier = !isFounder
        ? resolveStudentKnowledgeTier(messageForAdam, recentUserTurns)
        : undefined;

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
          factualGroundingPrompt,
          studentKnowledgeTier,
          webSearchPrompt:          webSearchEnabledThisTurn && founderTeachingSynthesis
            ? getAdamWebSearchPrompt(isFounder, {
              founderTeachingSynthesis: true,
              userMessage: messageForAdam,
              recentUserMessages: recentUserTurns,
            })
            : webSearchEnabledThisTurn
              ? getAdamWebSearchPrompt(isFounder, {
                userMessage: messageForAdam,
                recentUserMessages: recentUserTurns,
                searchPrefetched: studentSearchFirst,
              })
              : undefined,
        }),
        !isFounder || founderTeachingLearnerTurn,
      );

      if (macBridgeBlock) {
        systemPrompt = `${systemPrompt}\n\n${macBridgeBlock}`;
      }

      if (testerSystemPrefix) {
        systemPrompt = `${testerSystemPrefix}\n\n${systemPrompt}`;
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
          sessionId:      resolvedSessionId,
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
        {
          founderTeachingAbsorption: founderTeachingLearnerTurn,
          isStudent:                 !isFounder,
        },
      );
      const forceWebSearch = enableWebSearch
        && !isFounder
        && !studentSearchFirst
        && shouldForceWebSearchForTechnicalTurn(userMessage, {
          recentUserMessages: recentUserTurns,
        });

      if (enableWebSearch) {
        console.log(
          '[adam:search-gate] search ENABLED',
          JSON.stringify({
            sessionId: resolvedSessionId,
            messageLength: userMessage.length,
            preview:       userMessage.slice(0, 80),
            reason:        webSearchGateReason,
            forced:        forceWebSearch,
            searchFirst:   studentSearchFirst,
            technicalFollowUp: precisionTurn.isFollowUp,
            guestTrial:    isGuestTrial,
            stack:         ENV.QXK24_STACK,
            llmProvider:   ENV.LLM_PROVIDER,
            ts:            new Date().toISOString(),
          }),
        );
      }

      let searchPrefetchMs = 0;
      let prefetchedSearchResults: LlmSearchResult[] = [];
      let prefetchedSearchUsed = false;
      let prefetchedSearchDropped = false;

      if (studentSearchFirst) {
        const prefetchStarted = Date.now();
        const prefetch = searchPrefetchPromise
          ? await searchPrefetchPromise
          : await runStudentSearchPrefetch({
            userMessage,
            recentUserMessages: llmMessages,
            onSearching: () => {
              onEvent(
                'adam_searching',
                JSON.stringify({ query: userMessage.slice(0, 80) || 'Mencari data sebenar…' }),
              );
            },
            onSearchDone: () => {
              onEvent('adam_search_done', JSON.stringify({ query: '' }));
            },
          });
        searchPrefetchMs = searchPrefetchPromise
          ? Date.now() - prefetchStarted
          : prefetch.prefetchMs;
        prefetchedSearchResults = prefetch.searchResults;
        prefetchedSearchUsed = prefetch.searchUsed;
        prefetchedSearchDropped = prefetch.searchDroppedByFilter;
        if (prefetchedSearchDropped) {
          onEvent(
            'adam_search_unavailable',
            JSON.stringify({
              sessionId: resolvedSessionId,
              reason:    'content_filter',
              message:   'Carian web tidak tersedia pada giliran ini. ADAM akan menjawab tanpa data carian.',
            }),
          );
        }
        systemPrompt = `${systemPrompt}\n\n${buildPrefetchedSearchContextBlock(
          prefetchedSearchResults,
          { searchDropped: prefetchedSearchDropped },
        )}`;
        console.log('[adam:search-first] prefetch complete', JSON.stringify({
          sessionId: resolvedSessionId,
          hits:      prefetchedSearchResults.length,
          dropped:   prefetchedSearchDropped,
          ms:        searchPrefetchMs,
          parallel:  searchPrefetchParallel && Boolean(searchPrefetchPromise),
          waitedMs:  searchPrefetchPromise ? Date.now() - prefetchStarted : prefetch.prefetchMs,
        }));
      }

      // Live stream for students — post-repair is sync sanitize only (no LLM rewrite).
      const bufferStreamForPostRepair = false;

      const streamOnce = async (
        messages: typeof llmMessages,
        withSearch: boolean,
      ): Promise<{
        text: string;
        searchUsed: boolean;
        searchDroppedByFilter: boolean;
        searchResults: LlmSearchResult[];
      }> => {
        const callStream = (search: boolean) =>
          llmStream({
            model:            modelChoice.model,
            maxTokens,
            system:           systemPrompt,
            messages,
            enableWebSearch:  search,
            forceWebSearch:   search && forceWebSearch,
            enableThinking,
            onEvent:          (event, data) => {
              if (bufferStreamForPostRepair && event === 'adam_chunk') return;
              onEvent(event as SSEEventType, data);
            },
          });

        const maxAttempts = 3;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const result = await callStream(withSearch);
            return {
              text:                    result.text,
              searchUsed:              withSearch,
              searchDroppedByFilter:   false,
              searchResults:           result.searchResults,
            };
          } catch (streamErr: unknown) {
            if (withSearch && isQwenDataInspectionError(streamErr)) {
              console.warn('[adam:qwen-filter] content filter with web search — retrying without search', {
                sessionId: resolvedSessionId,
                preview:   userMessage.slice(0, 80),
                technicalTurn: precisionTurn.isActive,
              });
              onEvent(
                'adam_search_unavailable',
                JSON.stringify({
                  sessionId: resolvedSessionId,
                  reason:    'content_filter',
                  message:   'Carian web tidak tersedia pada giliran ini. ADAM akan menjawab tanpa data carian.',
                }),
              );
              const result = await callStream(false);
              return {
                text:                    result.text,
                searchUsed:              false,
                searchDroppedByFilter:   true,
                searchResults:           [],
              };
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
      let sunomMs = 0;

      if (mode === 'JOURNAL_GEN' && isFounder) {
        const journalResult = await streamAdamJournalResponse({
          resolvedSessionId,
          userMessage,
          mode,
          isFounder,
          journal,
          llmMessages,
          enableWebSearch,
          streamOnce: async (messages, withSearch) => {
            const result = await streamOnce(messages, withSearch);
            return result.text;
          },
          onEvent,
        });
        fullResponse = journalResult.fullResponse;
        sectionJournalComplete = journalResult.sectionJournalComplete;
        sectionDraftMap = journalResult.sectionDraftMap;
        streamMs = journalResult.streamMs;
        repairMs = journalResult.repairMs;
        onEvent('adam_stream_idle', JSON.stringify({ sessionId: resolvedSessionId }));
      } else {
        const streamStarted = Date.now();
        const synthesisWithSearch = enableWebSearch && !studentSearchFirst;
        const streamResult = await streamOnce(llmMessages, synthesisWithSearch);
        if (studentSearchFirst) {
          streamResult.searchResults = prefetchedSearchResults;
          streamResult.searchUsed = prefetchedSearchUsed;
          streamResult.searchDroppedByFilter = prefetchedSearchDropped;
        }
        const rawModelStream = streamResult.text;
        fullResponse = rawModelStream;
        streamMs = Date.now() - streamStarted;
        onEvent('adam_stream_idle', JSON.stringify({ sessionId: resolvedSessionId }));
        const repairStarted = Date.now();
        const sunomEnrichStarted = Date.now();
        const runStudentSuNom = !isFounder && precisionTurn.isActive;
        const sunomEnrichPromise = runStudentSuNom
          ? enrichSunomVerificationInput({
            userMessage,
            recentUserMessages: recentUserTurns,
            searchResults:      streamResult.searchResults,
            searchUsed:         streamResult.searchUsed,
            searchDropped:      streamResult.searchDroppedByFilter,
          })
          : null;

        fullResponse = await repairEastAsianScriptLeak(fullResponse, userMessage);
        const rawForSunomVerification = fullResponse;
        if (!isFounder) {
          fullResponse = await repairStudentOutputLeak(
            fullResponse,
            userMessage,
            recentUserTurns,
          );
          if (runStudentSuNom) {
            fullResponse = prependSearchUnavailableNotice(fullResponse, {
              technicalTurn:    precisionTurn.isActive,
              searchWasDropped: streamResult.searchDroppedByFilter,
            });
            const sunomInput = await sunomEnrichPromise!;
            sunomMs = Date.now() - sunomEnrichStarted;
            if (sunomInput.fingerFetched && sunomInput.fingerFetched > 0) {
              console.log('[adam:sunom-fingers]', JSON.stringify({
                sessionId: resolvedSessionId,
                fetched:   sunomInput.fingerFetched,
                ms:        sunomInput.fingerFetchMs,
                km:        sunomInput.kmSensing?.peringkat,
              }));
            }
            fullResponse = sanitizeSunomVerifiedOutput(fullResponse, {
              ...sunomInput,
              rawOutputText: rawForSunomVerification,
            });
            fullResponse = finalizeVerificationGatedOutput(
              fullResponse,
              userMessage,
              recentUserTurns,
            );
          } else {
            const repairedBeforeFinalize = fullResponse;
            const finalized = finalizeVerificationGatedOutput(
              fullResponse,
              userMessage,
              recentUserTurns,
            );
            const searchBackedTurn = streamResult.searchUsed
              && !streamResult.searchDroppedByFilter;
            if (finalized.trim()) {
              fullResponse = finalized;
            } else if (!entityCorrectionTurn.isActive && !searchBackedTurn) {
              fullResponse = repairedBeforeFinalize;
            } else {
              fullResponse = '';
            }
          }
          if (!fullResponse?.trim() && rawModelStream.trim()) {
            const recovered = await repairStudentOutputLeak(
              rawModelStream,
              userMessage,
              recentUserTurns,
            );
            const recoveredFinal = finalizeVerificationGatedOutput(
              recovered,
              userMessage,
              recentUserTurns,
            );
            fullResponse = recoveredFinal.trim() ? recoveredFinal : '';
          }
          if (!fullResponse?.trim() && !precisionTurn.isActive) {
            if (isAdamLightChatTurn(userMessage)) {
              fullResponse = buildStudentGreetingFallback(
                userMessage,
                participant.userName,
              );
            } else if (entityCorrectionTurn.isActive) {
              fullResponse = STUDENT_ENTITY_CORRECTION_FALLBACK;
            } else if (isAdamSubstantiveTurn(userMessage)) {
              fullResponse = buildStudentGuidedPerspectiveFallback(userMessage);
            } else {
              fullResponse = STUDENT_EMPTY_TURN_FALLBACK;
            }
          }
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

        if (!isFounder) {
          onEvent('adam_stream_done', JSON.stringify({
            sessionId: resolvedSessionId,
            replace:   true,
            response:  fullResponse ?? '',
            silentGate: precisionTurn.isActive && !fullResponse?.trim(),
          }));
        }

        if (!fullResponse?.trim()) {
          if (isFounder) {
            console.warn('[adam:stream] empty founder response after stream/repair', {
              sessionId: resolvedSessionId,
              mode,
              upload: teaching.fileNames,
            });
            fullResponse = [
              'Bismillahirahmanirrahim.',
              'P.alt, maaf — pada giliran ini jawapan saya kosong.',
              'Sila hantar semula bab itu.',
            ].join(' ');
          } else {
            console.warn('[adam:stream] student silent gate — empty after verification strip', {
              sessionId: resolvedSessionId,
              mode,
            });
          }
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
          searchPrefetchMs,
          searchPrefetchParallel: searchPrefetchParallel && Boolean(searchPrefetchPromise),
          streamMs,
          repairMs,
          sunomMs,
          inputTurns: llmMessages.length,
        }),
      );

      if (fullResponse?.trim()) {
        fullResponse = sanitizeAdamProseDashBridges(fullResponse);
      }

      const persistResult = await persistInteractiveJournalDraft({
        shell,
        fullResponse,
        journal,
        sectionDraftMap,
      });
      if (persistResult?.sections) {
        sectionDraftMap = persistResult.sections;
      }
      if (persistResult?.mergedDisplay) {
        fullResponse = persistResult.mergedDisplay;
      }
      if (isFounder && fullResponse?.trim()) {
        onEvent('adam_stream_done', JSON.stringify({
          sessionId: resolvedSessionId,
          replace:   true,
          response:  fullResponse,
        }));
      }

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
