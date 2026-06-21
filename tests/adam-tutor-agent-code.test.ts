/**
 * ADAM Tutor — agen code format A000001, A000002, …
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  formatTutorAgentCode,
  parseTutorAgentCodeSequence,
  TUTOR_AGENT_CODE_PATTERN,
} from '../src/adam/tutor/adam-tutor-agent-code';

describe('formatTutorAgentCode', () => {
  it('formats global sequence with six digits', () => {
    expect(formatTutorAgentCode(1)).toBe('A000001');
    expect(formatTutorAgentCode(2)).toBe('A000002');
    expect(formatTutorAgentCode(42)).toBe('A000042');
    expect(formatTutorAgentCode(999_999)).toBe('A999999');
  });

  it('rejects invalid sequence', () => {
    expect(() => formatTutorAgentCode(0)).toThrow();
    expect(() => formatTutorAgentCode(1_000_000)).toThrow();
  });
});

describe('parseTutorAgentCodeSequence', () => {
  it('parses new-format codes', () => {
    expect(parseTutorAgentCodeSequence('A000001')).toBe(1);
    expect(parseTutorAgentCodeSequence('a000042')).toBe(42);
  });

  it('returns null for legacy codes', () => {
    expect(parseTutorAgentCodeSequence('TUTOR-AGEN-ADAM-TUTOR-A-001')).toBeNull();
  });
});

describe('TUTOR_AGENT_CODE_PATTERN', () => {
  it('matches canonical public codes only', () => {
    expect(TUTOR_AGENT_CODE_PATTERN.test('A000001')).toBe(true);
    expect(TUTOR_AGENT_CODE_PATTERN.test('A000002')).toBe(true);
    expect(TUTOR_AGENT_CODE_PATTERN.test('TUTOR-AGEN-X-001')).toBe(false);
  });
});
