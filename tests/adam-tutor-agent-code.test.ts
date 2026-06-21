/**
 * ADAM Tutor — agen code format A00000001, A00000002, …
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  formatTutorAgentCode,
  isValidTutorAgentLoginCode,
  LEGACY_TUTOR_AGENT_CODE_PATTERN,
  parseTutorAgentCodeSequence,
  TUTOR_AGENT_CODE_PATTERN,
} from '../src/adam/tutor/adam-tutor-agent-code';

describe('formatTutorAgentCode', () => {
  it('formats global sequence with eight digits', () => {
    expect(formatTutorAgentCode(1)).toBe('A00000001');
    expect(formatTutorAgentCode(2)).toBe('A00000002');
    expect(formatTutorAgentCode(42)).toBe('A00000042');
    expect(formatTutorAgentCode(99_999_999)).toBe('A99999999');
  });

  it('rejects invalid sequence', () => {
    expect(() => formatTutorAgentCode(0)).toThrow();
    expect(() => formatTutorAgentCode(100_000_000)).toThrow();
  });
});

describe('parseTutorAgentCodeSequence', () => {
  it('parses canonical eight-digit codes', () => {
    expect(parseTutorAgentCodeSequence('A00000001')).toBe(1);
    expect(parseTutorAgentCodeSequence('a00000042')).toBe(42);
  });

  it('parses transitional six-digit codes', () => {
    expect(parseTutorAgentCodeSequence('A000002')).toBe(2);
  });

  it('returns null for legacy slug codes', () => {
    expect(parseTutorAgentCodeSequence('TUTOR-AGEN-ADAM-TUTOR-A-001')).toBeNull();
  });
});

describe('TUTOR_AGENT_CODE_PATTERN', () => {
  it('matches canonical public codes only', () => {
    expect(TUTOR_AGENT_CODE_PATTERN.test('A00000001')).toBe(true);
    expect(TUTOR_AGENT_CODE_PATTERN.test('A00000002')).toBe(true);
    expect(LEGACY_TUTOR_AGENT_CODE_PATTERN.test('A000002')).toBe(true);
    expect(TUTOR_AGENT_CODE_PATTERN.test('A000002')).toBe(false);
    expect(TUTOR_AGENT_CODE_PATTERN.test('TUTOR-AGEN-X-001')).toBe(false);
  });
});

describe('isValidTutorAgentLoginCode', () => {
  it('accepts canonical and transitional codes for portal login', () => {
    expect(isValidTutorAgentLoginCode('A00000001')).toBe(true);
    expect(isValidTutorAgentLoginCode('A00000002')).toBe(true);
    expect(isValidTutorAgentLoginCode('A000002')).toBe(true);
    expect(isValidTutorAgentLoginCode('TUTOR-AGEN-ADAM-TUTOR-A-001')).toBe(true);
    expect(isValidTutorAgentLoginCode('ABC')).toBe(false);
  });
});
