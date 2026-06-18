/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Channel Router Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  isFounderChannel,
  isUsersTechnicalChannel,
  resolveAdamChannel,
} from '../src/adam/adam-channel-router';
import { NO_FOUNDER_TEACHING_FLAGS } from '../src/adam/adam-teaching-state-machine';

const TEACHING_FLAGS = {
  ...NO_FOUNDER_TEACHING_FLAGS,
  founderTeachingLearnerTurn: true,
};

describe('resolveAdamChannel', () => {
  it('routes founder command away from student technical', () => {
    const ask = 'Apa yang telah Adam pelajari setakat ini?';
    const channel = resolveAdamChannel({
      isFounder: true,
      mode: 'TEACHING',
      userMessage: ask,
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    expect(isFounderChannel(channel)).toBe(true);
    expect(channel.channelId).toBe('founder-command');
    expect(isUsersTechnicalChannel(channel)).toBe(false);
  });

  it('routes student kenal saya to relational not technical', () => {
    const ask = 'Adam kenal saya tak?';
    const channel = resolveAdamChannel({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: ask,
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    expect(channel.channelId).toBe('users-relational');
    expect(isUsersTechnicalChannel(channel)).toBe(false);
  });

  it('routes student mitosis to technical', () => {
    const ask = 'Bezakan mitosis dan meiosis.';
    const channel = resolveAdamChannel({
      isFounder: false,
      mode: 'TEACHING',
      userMessage: ask,
      teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    });
    expect(channel.channelId).toBe('users-technical');
  });

  it('routes founder teaching learner separately', () => {
    const channel = resolveAdamChannel({
      isFounder: true,
      mode: 'TEACHING',
      userMessage: 'Terangkan bab ini.',
      teachingFlags: TEACHING_FLAGS,
    });
    expect(channel.channelId).toBe('founder-teaching-learner');
  });
});
