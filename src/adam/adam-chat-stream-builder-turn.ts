/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Chat Stream — Builder Turn
 * Platform : Backend (TypeScript)
 * ALAMTOLOGI : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
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
import { composeFounderMessage, composeStudentMessage } from './adam-upload.service';
import { saveMessage } from './adam-chat-session.service';
import type { AdamChatTurnShell } from './adam-chat-stream.types';

/** Returns true when the turn was fully handled by the builder path. */
export async function handleAdamBuilderTurn(shell: AdamChatTurnShell): Promise<boolean> {
  const {
    resolvedSessionId,
    normalizedMessage,
    messageForAdam,
    mode,
    isFounder,
    isGroup,
    participant,
    options,
    onEvent,
    teaching,
  } = shell;

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
    return true;
  }

  if (clientWantsBuilder && builderEnabled && !options.founderToken) {
    await emitBuilderUnavailable(
      'no_founder_token',
      'Builder could not start — missing founder auth token on this request. Sign in again on the command board.',
    );
    return true;
  }

  const founderTeachingOnLab = isFounder
    && builderEnabled
    && (mode === 'TEACHING' || mode === 'CONSTITUTIONAL' || mode === 'JOURNAL_GEN');
  const hasUploads = shell.uploadIds.length > 0;
  const forceBuilderTurn = options.forceBuilder === true
    || mode === 'BUILDER'
    || mode === 'AUDIT'
    || clientWantsBuilder;

  if (!builderEnabled || !options.founderToken) {
    return false;
  }

  const access = await resolveBuilderAccess(participant);
  const activation = resolveBuilderActivation(normalizedMessage, {
    forceBuilder: forceBuilderTurn,
  });

  const strongCodeTurn = activation.confidence >= 80 || forceBuilderTurn;
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
    return true;
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
    return true;
  }

  if (isFounder && !activation.activate) {
    console.log(
      `[ADAM Builder] Skipped — reason=${activation.reason} confidence=${activation.confidence} hasAccess=${access.hasAccess}`,
    );
  }

  return false;
}
