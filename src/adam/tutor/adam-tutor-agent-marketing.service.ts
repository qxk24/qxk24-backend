/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Demo Access
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
 * Each agent gets unlimited ADAM Tutor demo inside the ejen portal.
 * Not a pelajar account — chat uses agent portal credentials only.
 */

import {
  TutorAgentModel,
  TutorAgentStatus,
  type ITutorAgent,
} from './adam-tutor-agent.schema';
import { agentDemoChatUserId } from './adam-tutor-agent-demo-chat.service';

export const TUTOR_AGENT_MARKETING_REGISTER_PREFIX = 'MARKETING-';

export function agentMarketingStudentUserId(agentId: string): string {
  return agentDemoChatUserId(agentId);
}

export function tutorAgentMarketingRegisterCode(agentId: string): string {
  return `${TUTOR_AGENT_MARKETING_REGISTER_PREFIX}${agentId}`;
}

export function isTutorAgentMarketingRegisterCode(registerCode: string | null | undefined): boolean {
  return Boolean(registerCode?.startsWith(TUTOR_AGENT_MARKETING_REGISTER_PREFIX));
}

export function marketingEnrollmentFilter() {
  return { registerCode: { $not: { $regex: `^${TUTOR_AGENT_MARKETING_REGISTER_PREFIX}` } } };
}

export interface TutorAgentMarketingStudentPublic {
  userId:       string;
  loginHint:    string;
  passwordHint: string;
  allBands:     true;
  unlimited:    true;
  tutorUrl:     string;
  loginUrl:     string;
}

export function serializeAgentMarketingStudent(agent: ITutorAgent): TutorAgentMarketingStudentPublic {
  return {
    userId:       agent.agentId,
    loginHint:    'Demo ADAM Tutor in the agen portal — Demo ADAM tab.',
    passwordHint: 'Use Agen Code + Portal Token (not student login).',
    allBands:     true,
    unlimited:    true,
    tutorUrl:     '/adam/tutor/agen',
    loginUrl:     '/adam/tutor/agen',
  };
}

export {
  agentMarketingTutorProfile,
  isAgentMarketingTutorProfile,
  AGENT_MARKETING_LOCALE_NOTE,
} from './adam-tutor-agent-marketing.constants';

/** @deprecated Legacy name — demo is agent portal chat, not pelajar login. */
export async function isTutorAgentMarketingStudent(_userId: string): Promise<boolean> {
  return false;
}

/** Mark agent as demo-ready (chat identity only — no pelajar row). */
export async function ensureAgentMarketingStudent(
  agent: ITutorAgent,
): Promise<{ userId: string; action: 'created' | 'updated' }> {
  const demoUserId = agentDemoChatUserId(agent.agentId);
  const action = agent.marketingStudentUserId === demoUserId ? 'updated' : 'created';

  if (agent.marketingStudentUserId !== demoUserId) {
    agent.marketingStudentUserId = demoUserId;
    await agent.save();
  }

  return { userId: agent.agentId, action };
}

/** @deprecated Portal token rotation no longer syncs a pelajar password. */
export async function syncAgentMarketingStudentPassword(agent: ITutorAgent): Promise<void> {
  await ensureAgentMarketingStudent(agent);
}

export async function backfillAllAgentMarketingStudents(): Promise<{
  processed: number;
  created:   number;
  updated:   number;
}> {
  const agents = await TutorAgentModel.find({ status: TutorAgentStatus.ACTIVE });
  let created = 0;
  let updated = 0;

  for (const agent of agents) {
    const result = await ensureAgentMarketingStudent(agent);
    if (result.action === 'created') created += 1;
    else updated += 1;
  }

  return { processed: agents.length, created, updated };
}
