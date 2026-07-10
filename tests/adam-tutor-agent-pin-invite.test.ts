/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent PIN Invite Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it, jest } from '@jest/globals';

jest.mock('../src/config/environments', () => ({
  ENV: {
    APP_URL:                'https://www.alamtologi.com',
    ADAM_WEB_BASE_URL:      'https://www.alamtologi.com',
    ADAM_DEFAULT_LANGUAGE:  'english',
    RESEND_API_KEY:         '',
    MAIL_FROM:              '',
  },
}));

import { buildTutorRegisterLoginUrl } from '../src/adam/tutor/adam-tutor-agent-pin-invite.service';

describe('buildTutorRegisterLoginUrl', () => {
  it('builds direct register URL with normalized PIN', () => {
    const url = buildTutorRegisterLoginUrl('tutor-menengah-ab12');
    expect(url).toBe(
      'https://www.alamtologi.com/adam/tutor/daftar?pin=TUTOR-MENENGAH-AB12',
    );
  });

  it('normalizes whitespace in PIN', () => {
    const url = buildTutorRegisterLoginUrl('  tutor-rendah-x9y8  ');
    expect(url).toBe(
      'https://www.alamtologi.com/adam/tutor/daftar?pin=TUTOR-RENDAH-X9Y8',
    );
  });
});
