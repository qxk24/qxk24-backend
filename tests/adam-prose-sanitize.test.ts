/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Prose Sanitize Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { sanitizeAdamProseDashBridges } from '../src/adam/adam-prose-sanitize';

describe('adam-prose-sanitize', () => {
  it('replaces em dash bridges with comma', () => {
    expect(sanitizeAdamProseDashBridges('Hello — world')).toBe('Hello, world');
  });

  it('collapses duplicate commas', () => {
    expect(sanitizeAdamProseDashBridges('A — B — C')).toBe('A, B, C');
  });
});
