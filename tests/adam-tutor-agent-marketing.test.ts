/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Marketing Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  TUTOR_AGENT_MARKETING_REGISTER_PREFIX,
  agentMarketingStudentUserId,
  isTutorAgentMarketingRegisterCode,
  tutorAgentMarketingRegisterCode,
} from '../src/adam/tutor/adam-tutor-agent-marketing.service';
import {
  AGENT_MARKETING_LOCALE_NOTE,
  agentMarketingTutorProfile,
  isAgentMarketingTutorProfile,
} from '../src/adam/tutor/adam-tutor-agent-marketing.constants';

describe('adam-tutor-agent-marketing.service', () => {
  it('maps agent id to demo chat identity', () => {
    expect(agentMarketingStudentUserId('TUTOR-AGT-123-abc')).toBe('tutor-agent-demo:tutor-agt-123-abc');
  });

  it('builds unique marketing register codes per agent', () => {
    const code = tutorAgentMarketingRegisterCode('TUTOR-AGT-123-abc');
    expect(code).toBe(`${TUTOR_AGENT_MARKETING_REGISTER_PREFIX}TUTOR-AGT-123-abc`);
    expect(isTutorAgentMarketingRegisterCode(code)).toBe(true);
    expect(isTutorAgentMarketingRegisterCode('TUTOR-MENENGAH-001')).toBe(false);
  });

  it('uses all-bands marketing tutor profile', () => {
    const profile = agentMarketingTutorProfile();
    expect(profile.localeNote).toBe(AGENT_MARKETING_LOCALE_NOTE);
    expect(isAgentMarketingTutorProfile(profile)).toBe(true);
  });
});
