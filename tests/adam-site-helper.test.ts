/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Site Helper Test
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
import { runSiteHelperChat } from '../src/adam/adam-site-helper.service';

describe('runSiteHelperChat', () => {
  it('rejects empty message', async () => {
    await expect(runSiteHelperChat({ message: '   ' })).rejects.toThrow('Message is required');
  });

  it('returns UL site helper reply', async () => {
    const { reply } = await runSiteHelperChat({ message: 'What is ADAM?' });
    expect(reply).toContain('ADAM');
    expect(reply).toContain('QXK24');
  });
});
