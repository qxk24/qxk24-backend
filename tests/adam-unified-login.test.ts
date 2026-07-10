/// <reference types="jest" />

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { attemptUnifiedAdamLogin } from '../src/adam/adam-unified-login.service';
import * as studentService from '../src/adam/adam-student.service';

const ORIGINAL_FOUNDER_PASSWORD = process.env.FOUNDER_PASSWORD;

afterEach(() => {
  jest.restoreAllMocks();
  if (ORIGINAL_FOUNDER_PASSWORD === undefined) {
    delete process.env.FOUNDER_PASSWORD;
  } else {
    process.env.FOUNDER_PASSWORD = ORIGINAL_FOUNDER_PASSWORD;
  }
});

describe('attemptUnifiedAdamLogin', () => {
  it('returns founder token when password matches (username optional)', async () => {
    process.env.FOUNDER_PASSWORD = 'founder-secret-123';
    const result = await attemptUnifiedAdamLogin('', 'founder-secret-123');
    expect(result.kind).toBe('founder');
    if (result.kind !== 'founder') return;
    expect(result.userId).toBe('masa-bayu');
    expect(result.role).toBe('founder');
    expect(result.token).toEqual(expect.any(String));
  });

  it('accepts founder password pasted with trailing newline', async () => {
    process.env.FOUNDER_PASSWORD = 'founder-secret-123';
    const result = await attemptUnifiedAdamLogin('', 'founder-secret-123\n');
    expect(result.kind).toBe('founder');
  });

  it('does not return founder token when username is filled (student desk)', async () => {
    process.env.FOUNDER_PASSWORD = 'founder-secret-123';
    jest.spyOn(studentService, 'resolveStudentLoginUserIdAsync').mockResolvedValue(null);
    const result = await attemptUnifiedAdamLogin('unknown-student-xyz', 'founder-secret-123');
    expect(result.kind).not.toBe('founder');
    expect(result.kind).toBe('failure');
  });

  it('rejects blank username when password is not founder', async () => {
    process.env.FOUNDER_PASSWORD = 'founder-secret-123';
    const result = await attemptUnifiedAdamLogin('', 'wrong-password');
    expect(result.kind).toBe('failure');
  });
});
