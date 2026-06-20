/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor QA Enrollment Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { isTutorQaBypassUser } from '../src/adam/adam-tutor-subscription.service';
import { resolveTutorEnrollmentAccess } from '../src/adam/tutor/adam-tutor-enrollment.service';

describe('adam-tutor QA enrollment bypass', () => {
  it('recognises pelajar-test as QA bypass', () => {
    expect(isTutorQaBypassUser('pelajar-test')).toBe(true);
    expect(isTutorQaBypassUser('PELAJAR-TEST')).toBe(true);
    expect(isTutorQaBypassUser('random-user')).toBe(false);
  });

  it('resolveTutorEnrollmentAccess skips PIN for pelajar-test', async () => {
    const access = await resolveTutorEnrollmentAccess('pelajar-test');
    expect(access).toEqual({ required: false, complete: true, enrollment: null });
  });
});
