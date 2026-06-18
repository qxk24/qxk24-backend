/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Brain River Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  beginAdamBrainRiver,
  resolveBrainRiverBranchPolicy,
  buildHeadwatersContextOptions,
  isFounderOceanSink,
  isStudentOceanSink,
  oceanSinkAcceptsBrainTransform,
} from '../src/adam/adam-brain-river';

const EMPTY_TEACHING = {
  phase:                      null,
  founderTeachingLearnerTurn: false,
  founderTeachingAbsorption:  false,
  founderTeachingInquiry:     false,
  founderTeachingSynthesis:   false,
};

describe('adam-brain-river — headwaters, branch, ocean', () => {
  it('founder substantive → founder-command, no student streamline', () => {
    const river = beginAdamBrainRiver({
      isFounder:    true,
      mode:         'TEACHING',
      userMessage:  'Apa yang telah Adam pelajari setakat ini?',
      teachingFlags: EMPTY_TEACHING,
    });
    expect(river.channel.channelId).toBe('founder-command');

    const policy = resolveBrainRiverBranchPolicy(river.channel, {
      knowledgeMode: 'sintesis',
      isGuestTrial:  false,
      isFounder:     true,
      userMessage:   'Apa yang telah Adam pelajari setakat ini?',
    });
    expect(policy.studentStreamlined).toBe(false);
    expect(policy.bufferStreamUntilRepair).toBe(false);
    expect(policy.usersTechnicalFinalize).toBe(false);
    expect(isFounderOceanSink(policy.oceanSink)).toBe(true);

    const headwaters = buildHeadwatersContextOptions({
      channel:                    river.channel,
      answerPlan:                 river.answerPlan,
      teachingFlags:              EMPTY_TEACHING,
      knowledgeMode:              'sintesis',
      founderTeachingFreshUpload: false,
      recallProbeMessage:         'Apa yang telah Adam pelajari setakat ini?',
    });
    expect(headwaters.studentStreamlined).toBe(false);
  });

  it('users fotosintesis → users-technical channel, technical plan finalize', () => {
    const river = beginAdamBrainRiver({
      isFounder:    false,
      mode:         'TEACHING',
      userMessage:  'Apa itu fotosintesis?',
      teachingFlags: EMPTY_TEACHING,
    });
    expect(river.channel.channelId).toBe('users-technical');
    expect(river.answerPlan.usersMode).toBe('technical');
    expect(river.gate.eq.lane).toBe('users');
    expect(river.gate.iq.domainFacet).toBe('science');

    const policy = resolveBrainRiverBranchPolicy(river.channel, {
      knowledgeMode: 'konvensional',
      isGuestTrial:  false,
      isFounder:     false,
      userMessage:   'Apa itu fotosintesis?',
      answerPlan:    river.answerPlan,
    });
    expect(policy.studentStreamlined).toBe(false);
    expect(policy.usersTechnicalFinalize).toBe(true);
    expect(policy.bufferStreamUntilRepair).toBe(false);
    expect(isStudentOceanSink(policy.oceanSink)).toBe(true);
    expect(oceanSinkAcceptsBrainTransform(policy.oceanSink)).toBe(true);
  });

  it('general geography → users-general channel, prose plan (no technical finalize)', () => {
    const river = beginAdamBrainRiver({
      isFounder:    false,
      mode:         'TEACHING',
      userMessage:  'Apakah sungai terpanjang di dunia?',
      teachingFlags: EMPTY_TEACHING,
    });
    expect(river.channel.channelId).toBe('users-general');
    expect(river.answerPlan.usersMode).toBe('general');
    expect(river.gate.iq.domainFacet).toBe('geography');
    expect(river.gate.flags.usersTechnicalFinalize).toBe(false);
    expect(river.gate.flags.konvensionalSurface).toBe(true);

    const policy = resolveBrainRiverBranchPolicy(river.channel, {
      knowledgeMode: 'konvensional',
      isGuestTrial:  false,
      isFounder:     false,
      userMessage:   'Apakah sungai terpanjang di dunia?',
      answerPlan:    river.answerPlan,
    });
    expect(policy.usersTechnicalFinalize).toBe(false);
  });

  it('student light chat → streamlined headwaters, no technical finalize', () => {
    const river = beginAdamBrainRiver({
      isFounder:    false,
      mode:         'TEACHING',
      userMessage:  'salam',
      teachingFlags: EMPTY_TEACHING,
    });
    expect(river.channel.channelId).toBe('users-light');

    const policy = resolveBrainRiverBranchPolicy(river.channel, {
      knowledgeMode: 'konvensional',
      isGuestTrial:  false,
      isFounder:     false,
      userMessage:   'salam',
    });
    expect(policy.studentStreamlined).toBe(true);
    expect(policy.usersTechnicalFinalize).toBe(false);
  });

  it('founder teaching learner → separate branch, same ocean', () => {
    const teachingFlags = {
      ...EMPTY_TEACHING,
      founderTeachingLearnerTurn: true,
      founderTeachingAbsorption:  true,
    };
    const river = beginAdamBrainRiver({
      isFounder:    true,
      mode:         'TEACHING',
      userMessage:  'Terangkan bab ini',
      teachingFlags,
    });
    expect(river.channel.channelId).toBe('founder-teaching-learner');

    const policy = resolveBrainRiverBranchPolicy(river.channel, {
      knowledgeMode: 'sintesis',
      isGuestTrial:  false,
      isFounder:     true,
      userMessage:   'Terangkan bab ini',
    });
    expect(policy.needFounderTamat).toBe(false);
    expect(isFounderOceanSink(policy.oceanSink)).toBe(true);
  });
});
