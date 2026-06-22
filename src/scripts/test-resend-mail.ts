/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Resend Mail Smoke Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Usage (from alm-backend root):
 *   npm run test:resend-mail -- --dry-run
 *   npm run test:resend-mail
 *   npm run test:resend-mail -- --to=you@example.com
 */

import 'dotenv/config';
import { isMailConfigured, sendMail } from '../adam/adam-mail.service';
import { ENV } from '../config/environments';

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit?.slice(prefix.length).trim() || undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main(): Promise<void> {
  const dryRun = hasFlag('dry-run');
  const to = readArg('to')
    || process.env.RESEND_TEST_TO?.trim()
    || process.env.MAIL_TEST_TO?.trim()
    || 'info@alamtologi.com';

  console.log('[resend:test] mail configured:', isMailConfigured());
  console.log('[resend:test] from:', ENV.MAIL_FROM.trim() || '(missing)');
  console.log('[resend:test] reply-to:', ENV.MAIL_REPLY_TO.trim() || '(default)');

  if (!isMailConfigured()) {
    console.error('[resend:test] FAIL — set RESEND_API_KEY and MAIL_FROM in .env');
    process.exit(1);
  }

  if (dryRun) {
    console.log('[resend:test] OK — config only (--dry-run)');
    console.log('[resend:test] would send to:', to);
    return;
  }

  const stamp = new Date().toISOString();
  const result = await sendMail({
    to,
    subject: `ADAM Lab · Resend smoke test (${stamp})`,
    html: `
<p>Assalamualaikum,</p>
<p>This is an automated Resend smoke test from <strong>alm-backend</strong>.</p>
<p>Timestamp: ${stamp}</p>
<p>— Alamtologi · ADAM Lab</p>
    `.trim(),
    text: `Resend smoke test from alm-backend at ${stamp}`,
  });

  if (!result.sent) {
    console.error('[resend:test] FAIL —', result.error ?? 'Resend API rejected the send');
    process.exit(1);
  }

  console.log(`[resend:test] OK — test email sent to ${to} (id=${result.id ?? 'unknown'})`);
}

main().catch((err) => {
  console.error('[resend:test] ERROR', err);
  process.exit(1);
});
