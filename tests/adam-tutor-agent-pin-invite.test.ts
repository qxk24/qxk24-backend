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
    APP_URL:           'https://www.alamtologi.com',
    ADAM_WEB_BASE_URL: 'https://www.alamtologi.com',
    RESEND_API_KEY:    '',
    MAIL_FROM:         '',
  },
}));

import { buildTutorRegisterLoginUrl } from '../src/adam/tutor/adam-tutor-agent-pin-invite.service';

describe('buildTutorRegisterLoginUrl', () => {
  it('builds login URL with encoded register path and PIN', () => {
    const url = buildTutorRegisterLoginUrl('tutor-menengah-ab12');
    expect(url).toBe(
      'https://www.alamtologi.com/login?next=%2Fadam%2Ftutor%2Fdaftar%3Fpin%3DTUTOR-MENENGAH-AB12',
    );
  });

  it('normalizes whitespace in PIN', () => {
    const url = buildTutorRegisterLoginUrl('  tutor-rendah-x9y8  ');
    expect(url).toContain('pin%3DTUTOR-RENDAH-X9Y8');
  });
});
