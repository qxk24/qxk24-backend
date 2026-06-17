/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Auth Middleware
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 */

import { Context, Next } from 'hono';
import { TutorAgentStatus } from './adam-tutor-agent.schema';
import { resolveTutorAgent } from './adam-tutor-agent.service';
import type { ITutorAgent } from './adam-tutor-agent.schema';

export function getTutorAgent(c: Context): ITutorAgent | null {
  return c.get('tutorAgent') as ITutorAgent | undefined ?? null;
}

export async function requireTutorAgent(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const agentCode = c.req.header('X-Tutor-Agent-Code')?.trim();
  const portalToken = c.req.header('X-Tutor-Agent-Token')?.trim();

  if (!agentCode || !portalToken) {
    return c.json({
      success: false,
      error:   'Kod ejen dan token portal diperlukan.',
      kernel:  'ALAMTOLOGI',
    }, 401);
  }

  const agent = await resolveTutorAgent(agentCode, portalToken);
  if (!agent) {
    return c.json({
      success: false,
      error:   'Kelayakan ejen tidak sah.',
      kernel:  'ALAMTOLOGI',
    }, 403);
  }

  if (agent.status !== TutorAgentStatus.ACTIVE) {
    return c.json({
      success: false,
      error:   'Akaun ejen digantung.',
      kernel:  'ALAMTOLOGI',
    }, 403);
  }

  c.set('tutorAgent', agent);
  await next();
}
