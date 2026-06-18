/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Student Continuity Bridge Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { studentContinuityNeedsFullBridge } from '../src/adam/student-continuity-bridge.gate';

describe('student-continuity-bridge', () => {
  it('studentContinuityNeedsFullBridge escalates on continuation keywords', () => {
    expect(studentContinuityNeedsFullBridge('ingat tak soalan fotosintesis semalam?')).toBe(true);
    expect(studentContinuityNeedsFullBridge('boleh teruskan bab tadi?')).toBe(true);
    expect(studentContinuityNeedsFullBridge('sambung dari workspace aidil')).toBe(true);
    expect(studentContinuityNeedsFullBridge('continue from last time')).toBe(true);
  });

  it('studentContinuityNeedsFullBridge stays lite on fresh technical questions', () => {
    expect(studentContinuityNeedsFullBridge('Apa itu fotosintesis?')).toBe(false);
    expect(studentContinuityNeedsFullBridge('Terangkan kitar nitrogen.')).toBe(false);
    expect(studentContinuityNeedsFullBridge('')).toBe(false);
  });
});
