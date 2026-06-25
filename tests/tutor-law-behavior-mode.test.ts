/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM Tutor Law Behavior Mode Tests
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-25
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildTutorBehaviorModePrompt,
  classifyTutorBehaviorMode,
} from '../src/adam/tutor-law/tutor-law.behavior-mode';

describe('tutor-law behavior mode classifier', () => {
  it('uses teaching mode for clear school or curriculum tasks', () => {
    expect(classifyTutorBehaviorMode({
      userMessage: 'Tolong bantu soalan Matematik Tingkatan 2 ini, tunjuk jalan kerja.',
    })).toBe('teaching');

    expect(classifyTutorBehaviorMode({
      userMessage: 'I have an IGCSE chemistry worksheet on acids and bases.',
    })).toBe('teaching');
  });

  it('uses coaching mode for adult practical questions', () => {
    expect(classifyTutorBehaviorMode({
      userMessage: 'Cadangan saya Pro $19/mo, macam mana nak improve conversion?',
    })).toBe('coaching');

    expect(classifyTutorBehaviorMode({
      userMessage: 'Help me prepare for a client meeting tomorrow.',
    })).toBe('coaching');
  });

  it('defaults ambiguous general public turns to coaching', () => {
    expect(classifyTutorBehaviorMode({
      userMessage: 'Apa pendapat ADAM tentang pilihan ini?',
    })).toBe('coaching');
  });

  it('makes zero-answer strict only in teaching prompt', () => {
    expect(buildTutorBehaviorModePrompt('teaching')).toContain('Zero-answer is strict only here');
    expect(buildTutorBehaviorModePrompt('coaching')).toContain('Do not enforce strict zero-answer');
  });
});
