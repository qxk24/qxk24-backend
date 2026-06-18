/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM User Relational Brain Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  shouldSkipStudentInquiryRecall,
  shouldSkipUserRelationalCBlock,
} from '../src/adam/adam-user-brain.gate';

describe('adam-user-brain', () => {
  it('shouldSkipUserRelationalCBlock without studentId', () => {
    expect(shouldSkipUserRelationalCBlock('')).toBe(true);
    expect(shouldSkipUserRelationalCBlock('   ')).toBe(true);
    expect(shouldSkipUserRelationalCBlock('student-1')).toBe(false);
  });

  it('shouldSkipStudentInquiryRecall on short probes', () => {
    expect(shouldSkipStudentInquiryRecall('student-1', 'a')).toBe(true);
    expect(shouldSkipStudentInquiryRecall('', 'fotosintesis')).toBe(true);
    expect(shouldSkipStudentInquiryRecall('student-1', 'fotosintesis')).toBe(false);
  });
});
