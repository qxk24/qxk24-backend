/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Mail Service Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 */

/// <reference types="jest" />

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockEnv = {
  RESEND_API_KEY:    're_test_key',
  MAIL_FROM:         'Alamtologi <info@alamtologi.com>',
  MAIL_REPLY_TO:     'info@alamtologi.com',
  ADAM_PASSWORD_RESET_TTL_MINUTES: 60,
};

jest.mock('../src/config/environments', () => ({
  ENV: mockEnv,
}));

import {
  isMailConfigured,
  sendMail,
  sendPasswordResetEmail,
} from '../src/adam/adam-mail.service';

describe('adam-mail.service', () => {
  const fetchMock = jest.fn<typeof fetch>();

  beforeEach(() => {
    mockEnv.RESEND_API_KEY = 're_test_key';
    mockEnv.MAIL_FROM = 'Alamtologi <info@alamtologi.com>';
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('isMailConfigured', () => {
    it('returns true when API key and from address are set', () => {
      expect(isMailConfigured()).toBe(true);
    });

    it('returns false when API key is missing', () => {
      mockEnv.RESEND_API_KEY = '';
      expect(isMailConfigured()).toBe(false);
    });

    it('returns false when from address is missing', () => {
      mockEnv.MAIL_FROM = '';
      expect(isMailConfigured()).toBe(false);
    });
  });

  describe('sendMail', () => {
    it('returns false without calling Resend when mail is not configured', async () => {
      mockEnv.RESEND_API_KEY = '';
      const result = await sendMail({
        to:      'student@example.com',
        subject: 'Test',
        html:    '<p>Hi</p>',
      });
      expect(result.sent).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('POSTs to Resend with bearer auth and reply_to fallback', async () => {
      fetchMock.mockResolvedValue({
        ok:   true,
        text: async () => '{"id":"email_123"}',
      } as Response);

      const result = await sendMail({
        to:      'student@example.com',
        subject: 'Smoke test',
        html:    '<p>OK</p>',
        text:    'OK',
      });

      expect(result.sent).toBe(true);
      expect(result.id).toBe('email_123');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.resend.com/emails');

      const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
      expect(init.method).toBe('POST');
      expect(init.headers).toMatchObject({
        Authorization:  'Bearer re_test_key',
        'Content-Type': 'application/json',
      });

      const body = JSON.parse(String(init.body));
      expect(body).toEqual({
        from:     'Alamtologi <info@alamtologi.com>',
        to:       ['student@example.com'],
        reply_to: 'info@alamtologi.com',
        subject:  'Smoke test',
        html:     '<p>OK</p>',
        text:     'OK',
      });
    });

    it('returns false when Resend responds with an error', async () => {
      fetchMock.mockResolvedValue({
        ok:   false,
        status: 403,
        text: async () => '{"message":"domain not verified"}',
      } as Response);

      const result = await sendMail({
        to:      'student@example.com',
        subject: 'Fail test',
        html:    '<p>Fail</p>',
      });

      expect(result.sent).toBe(false);
      expect(result.error).toContain('domain not verified');
    });
    it('aligns mismatched env reply-to to FROM domain', async () => {
      mockEnv.MAIL_FROM = 'ADAM Tutor <info@updates.alamtologi.com>';
      mockEnv.MAIL_REPLY_TO = 'info@alamtologi.com';
      fetchMock.mockResolvedValue({
        ok:   true,
        text: async () => '{"id":"email_subdomain"}',
      } as Response);

      await sendMail({
        to:      'student@example.com',
        subject: 'Subdomain test',
        html:    '<p>OK</p>',
      });

      const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
      const body = JSON.parse(String(init.body));
      expect(body.reply_to).toBe('info@updates.alamtologi.com');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('sends reset link with configured TTL in body', async () => {
      fetchMock.mockResolvedValue({
        ok:   true,
        text: async () => '{"id":"email_reset"}',
      } as Response);

      const ok = await sendPasswordResetEmail(
        'student@example.com',
        'https://alamtologi.com/reset?token=abc',
        'Ahmad',
      );

      expect(ok).toBe(true);
      const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
      const body = JSON.parse(String(init.body));
      expect(body.subject).toBe('Reset your ADAM Lab password');
      expect(body.html).toContain('Ahmad');
      expect(body.html).toContain('https://alamtologi.com/reset?token=abc');
      expect(body.html).toContain('60 minutes');
      expect(body.reply_to).toBe('info@alamtologi.com');
    });
  });
});
