/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent PIN Auto-Mint
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { TutorAgentPackageStatus } from './adam-tutor-agent-package.config';
import { getTutorAgentById } from './adam-tutor-agent.service';
import type { ITutorAgent } from './adam-tutor-agent.schema';
import { generateTutorRegisterCodes } from './adam-tutor-register-code.service';

/** Mint all remaining package PIN credits as register codes (idempotent when balance is 0). */
export async function mintTutorAgentRegisterPinsForPackage(
  agentId: string,
  createdBy: string,
): Promise<number> {
  const agent = await getTutorAgentById(agentId);
  if (!agent) return 0;
  if (agent.packageStatus !== TutorAgentPackageStatus.ACTIVE) return 0;
  if (agent.pinBalance <= 0) return 0;

  const count = agent.pinBalance;
  const codes = await generateTutorRegisterCodes({
    count,
    agentId:   agent.agentId,
    createdBy,
  });
  return codes.length;
}

/** Backfill PINs when package is active but credits were not minted yet (legacy agents). */
export async function ensureAgentPackagePinsMinted(
  agent: ITutorAgent,
  createdBy = 'portal:auto-mint',
): Promise<ITutorAgent> {
  if (agent.packageStatus !== TutorAgentPackageStatus.ACTIVE) return agent;
  if (agent.pinBalance <= 0) return agent;

  await mintTutorAgentRegisterPinsForPackage(agent.agentId, createdBy);
  const refreshed = await getTutorAgentById(agent.agentId);
  return refreshed ?? agent;
}
