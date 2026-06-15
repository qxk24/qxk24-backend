/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Greeting Fallback Test
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
import {
  buildStudentGreetingFallback,
  buildStudentGuidedPerspectiveFallback,
  isAdamContinuationDepthTurn,
  isAdamLightChatTurn,
  isAdamSimpleFactualTurn,
  isAdamSubstantiveTurn,
  isAdamTeachingDepthTurn,
  stripLeadingAdamSalutation,
} from '../src/adam/adam-response-generation';

describe('Student greeting fallback', () => {
  it('detects salam as light chat', () => {
    expect(isAdamLightChatTurn('salam')).toBe(true);
  });

  it('salam + factual ask is not light chat', () => {
    const msg = 'Salam Adam, Bagikan maklumat jumlah pelajar KPTM';
    expect(stripLeadingAdamSalutation(msg)).toMatch(/jumlah pelajar KPTM/i);
    expect(isAdamLightChatTurn(msg)).toBe(false);
    expect(isAdamSubstantiveTurn(msg)).toBe(true);
    expect(isAdamSimpleFactualTurn(msg)).toBe(true);
  });

  it('returns waalaikumussalam for salam', () => {
    const out = buildStudentGreetingFallback('salam');
    expect(out).toMatch(/Waalaikumussalam/i);
    expect(out.length).toBeGreaterThan(10);
  });

  it('personalises hello when name provided', () => {
    expect(buildStudentGreetingFallback('hello', 'Ahmad')).toMatch(/Ahmad/);
  });

  it('detects teaching depth by question shape — any subject', () => {
    expect(isAdamTeachingDepthTurn('Boleh terangkan tentang X?')).toBe(true);
    expect(isAdamTeachingDepthTurn('Apa punca Y berlaku?')).toBe(true);
    expect(isAdamTeachingDepthTurn('Tell me more about it')).toBe(true);
    expect(isAdamContinuationDepthTurn('Tell me more about it')).toBe(true);
    expect(isAdamTeachingDepthTurn('salam')).toBe(false);
    expect(isAdamTeachingDepthTurn('850cc?')).toBe(false);
  });

  it('guided perspective fallback is generic — no per-topic scripts', () => {
    const out = buildStudentGuidedPerspectiveFallback('kereta murah berkualiti');
    expect(out).toMatch(/belum dapat disusun|masih di sini/i);
    expect(out).not.toMatch(/bukan kontradiksi|keseimbangan|MAAA|RM\d/i);
  });
});
