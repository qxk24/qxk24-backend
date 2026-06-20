/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Demo Chat
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Agents demo ADAM Tutor from the ejen portal — no pelajar account.
 */

import {
  createNewChatSession,
  listUserChatSessions,
  loadMessageHistory,
  resolveTutorChatSession,
} from '../adam-chat.service';
import { ADAMFounderSessionModel } from '../adam.schema';
import type { ITutorAgent } from './adam-tutor-agent.schema';

export function agentDemoChatUserId(agentId: string): string {
  return `tutor-agent-demo:${agentId.trim().toLowerCase()}`;
}

export function agentDemoDisplayName(agent: Pick<ITutorAgent, 'orgName' | 'contactName'>): string {
  return agent.contactName?.trim() || agent.orgName?.trim() || 'Agen ADAM Tutor';
}

export async function resolveAgentDemoChatSession(agent: ITutorAgent): Promise<string> {
  return resolveTutorChatSession(agentDemoChatUserId(agent.agentId));
}

export async function createAgentDemoChatSession(agent: ITutorAgent): Promise<string> {
  return createNewChatSession(agentDemoChatUserId(agent.agentId), 'tutor');
}

export async function listAgentDemoChatSessions(agent: ITutorAgent, limit = 30) {
  return listUserChatSessions(agentDemoChatUserId(agent.agentId), 'tutor', limit);
}

export async function assertAgentDemoOwnsSession(
  agent: ITutorAgent,
  sessionId: string,
): Promise<boolean> {
  if (!sessionId.trim()) return false;
  const session = await ADAMFounderSessionModel.findOne({ sessionId }).lean();
  if (!session) return false;
  return (
    session.founderId === agentDemoChatUserId(agent.agentId)
    && session.sessionType === 'tutor'
  );
}

export async function loadAgentDemoChatHistory(
  agent: ITutorAgent,
  sessionId: string,
  limit = 100,
) {
  const allowed = await assertAgentDemoOwnsSession(agent, sessionId);
  if (!allowed) throw new Error('Session access denied.');
  return loadMessageHistory(sessionId, limit);
}
