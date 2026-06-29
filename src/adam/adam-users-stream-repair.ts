/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Stream Repair
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Student-only post-stream repair — founder path must never call this module.
 */

import type { ADAMChatMode } from './adam.types';
import type { AdamChatTurnShell } from './adam-chat-stream.types';
import type { AdamResolvedChannel } from './adam-channel-router';
import { isUsersTechnicalChannel } from './adam-channel-router';
import { isUsersTechnicalPlan } from './adam-answer-plan';
import type { AdamAnswerPlan } from './adam-answer-plan';
import type { AdamTurnGateDecision } from './turn-gate/adam-turn-gate.types';
import type { AdamMediaSearchHit } from './adam-media-search';
import { isAdamMediaSearchTurn } from './adam-media-search';
import { repairEastAsianScriptLeak } from './adam-language-guard';
import {
  isAdamLightChatTurn,
} from './adam-response-generation';
import { buildStudentGreetingFallback } from './adam-response-generation';
import { isAdamCurrentAffairsTurn, isVerifiedDataStatAsk } from './adam-web-search';
import {
  applyUsersSurfaceOutputRepair,
  resolveUsersStreamSurface,
  usersStreamBodyWasGutted,
} from './adam-users-output-guard';
import { outputHasAdamProductRedirectLeak } from './adam-response-generation';
import {
  outputHasKonvensionalFrameworkLeak,
  outputHasMediaRefusal,
  outputHasScannableListStructure,
  clampTechnicalMarkdownBold,
} from './adam-users-output-law';
import { isAdamTutorMode, buildTutorGreetingFallback, repairTutorMalaySessionLanguage } from './adam-tutor-law';
import { repairTechnicalDiagramOutput } from './adam-technical-diagram-guard';
import {
  repairTechnicalKonvensionalDisplayStructure,
  repairUsersDirectTechnicalDisplay,
} from './adam-technical-display-structure';
import { repairAdamMediaOutput } from './adam-media-guard';
import { alphaStatPersistedStreamBody } from './adam-stat-stream-preserve';
import { isArithmeticAlphaCollapsedRepair } from './adam-arithmetic-alpha-guard';
import { isAlgorithmTeachingRepairApplied } from './adam-algorithm-teaching-repair';
import { isVisualDrawCollapsedRepair } from './adam-visual-draw-guard';
import { dedupeUsersHaiGreeting, isUsersGreetingOnlyRepair } from './adam-users-constitution';
import { isAdamProseCraftTurn, isProseCraftSurfaceRepair } from './adam-prose-craft';
import type { StreamRepairResult } from './adam-chat-stream-llm';
import { ensureIslamicSalamReply } from './adam-salam-reply-guard';

export async function repairUsersStreamOutput(input: {
  shell: AdamChatTurnShell;
  rawModelStream: string;
  channel: AdamResolvedChannel;
  recentUserTurns: string[];
  recentAssistantTurns?: string[];
  mode: ADAMChatMode;
  answerPlan?: AdamAnswerPlan;
  turnGate?: AdamTurnGateDecision;
}): Promise<StreamRepairResult> {
  const {
    shell,
    rawModelStream,
    channel,
    recentUserTurns,
    recentAssistantTurns = [],
    mode,
    answerPlan,
    turnGate,
  } = input;
  const usersTechnical = turnGate
    ? turnGate.flags.usersTechnicalFinalize
    : answerPlan
      ? isUsersTechnicalPlan(answerPlan)
      : isUsersTechnicalChannel(channel);

  const {
    userMessage,
    participant,
    resolvedSessionId,
    onEvent,
  } = shell;

  const repairStarted = Date.now();
  let syncRepairMs = 0;
  let sanitizedRepairApplied = false;
  let arithmeticAlphaRepairApplied = false;
  let algorithmTeachingRepairApplied = false;
  let visualDrawRepairApplied = false;
  let proseCraftRepairApplied = false;
  let usersGreetingRepairApplied = false;
  let technicalMediaRepairApplied = false;
  let adamProductRedirectRepairApplied = false;

  let fullResponse = await repairEastAsianScriptLeak(rawModelStream, userMessage);

  if (isAdamTutorMode(mode)) {
    if (!fullResponse?.trim() && isAdamLightChatTurn(userMessage)) {
      fullResponse = buildTutorGreetingFallback(
        userMessage,
        participant.userName,
        shell.options.tutorProfile,
      );
    } else if (fullResponse?.trim()) {
      const tutorLangStarted = Date.now();
      fullResponse = await repairTutorMalaySessionLanguage(
        fullResponse,
        shell.options.tutorProfile,
      );
      syncRepairMs = Date.now() - tutorLangStarted;
    }
  } else {
    const syncStarted = Date.now();
    const alphaStatTurn = isVerifiedDataStatAsk(userMessage);

    if (alphaStatTurn) {
      fullResponse = alphaStatPersistedStreamBody(rawModelStream);
      syncRepairMs = Date.now() - syncStarted;
    } else {
      let surface = applyUsersSurfaceOutputRepair(
        fullResponse,
        userMessage,
        recentUserTurns,
        recentAssistantTurns,
        participant.userName,
        true,
        { usersTechnicalDirect: usersTechnical,
          gateFaithPermitted: turnGate?.flags.faithPermitted,
          gateKonvensionalSurface: turnGate?.flags.konvensionalSurface },
      );
      syncRepairMs = Date.now() - syncStarted;
      if (!surface.trim() && isAdamLightChatTurn(userMessage)) {
        surface = buildStudentGreetingFallback(userMessage, participant.userName);
      }
      const preferSanitized = isAdamCurrentAffairsTurn(userMessage);
      const forceSanitized = usersTechnical
        && (
          outputHasKonvensionalFrameworkLeak(rawModelStream)
          || outputHasMediaRefusal(rawModelStream)
        );
      const proseCraftTurn = isAdamProseCraftTurn(userMessage);
      const streamGutted = !proseCraftTurn
        && usersStreamBodyWasGutted(rawModelStream, surface, userMessage);
      if (streamGutted) {
        fullResponse = alphaStatPersistedStreamBody(rawModelStream);
      } else {
        const resolved = resolveUsersStreamSurface(rawModelStream, surface, {
          preferSanitized,
          forceSanitized,
          preserveStreamBody: false,
          userMessage,
        });
        if (isArithmeticAlphaCollapsedRepair(rawModelStream, resolved.fullResponse, userMessage)) {
          arithmeticAlphaRepairApplied = true;
          sanitizedRepairApplied = true;
        }
        if (isAlgorithmTeachingRepairApplied(rawModelStream, resolved.fullResponse, userMessage)) {
          algorithmTeachingRepairApplied = true;
          sanitizedRepairApplied = true;
        }
        if (isVisualDrawCollapsedRepair(rawModelStream, resolved.fullResponse, userMessage)) {
          visualDrawRepairApplied = true;
          sanitizedRepairApplied = true;
        }
        if (forceSanitized && resolved.streamReplace) {
          sanitizedRepairApplied = true;
        }
        const structurePreservingReplace = Boolean(
          resolved.streamReplace
          && preferSanitized
          && (
            !outputHasScannableListStructure(rawModelStream)
            || outputHasScannableListStructure(resolved.fullResponse)
          ),
        );
        const arithmeticReplace = Boolean(resolved.streamReplace && arithmeticAlphaRepairApplied);
        const algorithmTeachingReplace = Boolean(resolved.streamReplace && algorithmTeachingRepairApplied);
        const visualDrawReplace = Boolean(resolved.streamReplace && visualDrawRepairApplied);
        const technicalRepairReplace = Boolean(resolved.streamReplace && forceSanitized);
        if (isProseCraftSurfaceRepair(rawModelStream, resolved.fullResponse, userMessage)) {
          proseCraftRepairApplied = true;
          sanitizedRepairApplied = true;
        }
        const proseCraftReplace = Boolean(
          resolved.streamReplace
          && isProseCraftSurfaceRepair(rawModelStream, resolved.streamReplace, userMessage),
        );
        if (outputHasAdamProductRedirectLeak(rawModelStream) && !outputHasAdamProductRedirectLeak(resolved.fullResponse)) {
          adamProductRedirectRepairApplied = true;
          sanitizedRepairApplied = true;
          onEvent('adam_stream_done', JSON.stringify({
            sessionId:           resolvedSessionId,
            replace:               true,
            sanitizedRepair:       true,
            adamProductRedirectRepair: true,
            response:              resolved.fullResponse,
          }));
        }
        if (structurePreservingReplace || arithmeticReplace || algorithmTeachingReplace || visualDrawReplace || technicalRepairReplace || proseCraftReplace) {
          sanitizedRepairApplied = true;
          onEvent('adam_stream_done', JSON.stringify({
            sessionId:           resolvedSessionId,
            replace:               true,
            sanitizedRepair:       true,
            arithmeticAlphaRepair: arithmeticReplace,
            algorithmTeachingRepair: algorithmTeachingReplace,
            visualDrawRepair:      visualDrawReplace,
            technicalMediaRepair: technicalRepairReplace,
            proseCraftRepair:      proseCraftReplace,
            briefTier1Repair:      arithmeticReplace || visualDrawReplace || technicalRepairReplace,
            structurePreserving:   structurePreservingReplace,
            response:              resolved.streamReplace,
          }));
        }
        fullResponse = resolved.fullResponse;
        if (outputHasAdamProductRedirectLeak(rawModelStream) && outputHasAdamProductRedirectLeak(fullResponse)) {
          fullResponse = surface;
          adamProductRedirectRepairApplied = true;
          sanitizedRepairApplied = true;
        }
      }
    }
  }

  if (
    !isAdamTutorMode(mode)
    && !isAdamLightChatTurn(userMessage)
    && fullResponse?.trim()
    && isUsersGreetingOnlyRepair(rawModelStream, fullResponse)
    && !arithmeticAlphaRepairApplied
    && !visualDrawRepairApplied
  ) {
    usersGreetingRepairApplied = true;
    sanitizedRepairApplied = true;
    onEvent('adam_stream_done', JSON.stringify({
      sessionId:             resolvedSessionId,
      replace:               true,
      sanitizedRepair:       true,
      usersGreetingRepair: true,
      response:              fullResponse,
    }));
  }

  if (!fullResponse?.trim()) {
    if (isAdamLightChatTurn(userMessage)) {
      fullResponse = buildStudentGreetingFallback(userMessage, participant.userName);
    } else {
      console.warn('[adam:stream] empty student response after stream/repair', {
        sessionId: resolvedSessionId,
        mode,
        channelId: channel.channelId,
      });
    }
  }

  fullResponse = ensureIslamicSalamReply(fullResponse, userMessage, participant.userName);

  return {
    fullResponse,
    repairMs: Date.now() - repairStarted,
    syncRepairMs,
    sanitizedRepairApplied,
    arithmeticAlphaRepairApplied,
    visualDrawRepairApplied,
    proseCraftRepairApplied,
    usersGreetingRepairApplied,
    technicalMediaRepairApplied,
    adamProductRedirectRepairApplied,
  };
}

/** Student technical channel — diagram, ### structure, media (never founder). */
export function finalizeUsersTechnicalDisplay(input: {
  fullResponse: string;
  userMessage: string;
  channel: AdamResolvedChannel;
  participantName?: string;
  mediaHits: AdamMediaSearchHit[];
  answerPlan?: AdamAnswerPlan;
}): { fullResponse: string; technicalMediaRepairApplied: boolean } {
  const { userMessage, channel, participantName, mediaHits, answerPlan } = input;
  let fullResponse = input.fullResponse;
  let technicalMediaRepairApplied = false;

  const usersTechnical = answerPlan
    ? isUsersTechnicalPlan(answerPlan)
    : isUsersTechnicalChannel(channel);

  if (!usersTechnical && !isAdamMediaSearchTurn(userMessage, false)) {
    return { fullResponse, technicalMediaRepairApplied };
  }

  const before = fullResponse;
  if (usersTechnical) {
    fullResponse = repairTechnicalDiagramOutput(fullResponse, userMessage);
    fullResponse = answerPlan && isUsersTechnicalPlan(answerPlan)
      ? repairUsersDirectTechnicalDisplay(fullResponse, userMessage, answerPlan)
      : repairTechnicalKonvensionalDisplayStructure(fullResponse, userMessage, { answerPlan });
    fullResponse = clampTechnicalMarkdownBold(fullResponse);
  }
  if (isAdamMediaSearchTurn(userMessage, false)) {
    fullResponse = repairAdamMediaOutput(fullResponse, userMessage, mediaHits);
  }
  fullResponse = dedupeUsersHaiGreeting(fullResponse, participantName);
  if (fullResponse !== before) {
    technicalMediaRepairApplied = true;
  }
  return { fullResponse, technicalMediaRepairApplied };
}
