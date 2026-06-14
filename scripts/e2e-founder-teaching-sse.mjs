#!/usr/bin/env node
/**
 * E2E — one Founder Teaching SSE turn against live alm-backend.
 * Usage (on VPS): node scripts/e2e-founder-teaching-sse.mjs [--base URL]
 * Loads FOUNDER_PASSWORD from .env in cwd unless FOUNDER_PASSWORD is already set.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDotEnv(cwd) {
  const path = resolve(cwd, '.env');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function parseArgs(argv) {
  let base = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5000';
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--base' && argv[i + 1]) {
      base = argv[++i];
    }
  }
  return { base: base.replace(/\/$/, '') };
}

function parseSseBlock(block) {
  let event = 'message';
  const dataLines = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
  }
  return { event, data: dataLines.join('\n') };
}

async function login(base, password) {
  const res = await fetch(`${base}/api/adam/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ password }),
  });
  const body = await res.json();
  if (!res.ok || !body.success || !body.data?.token) {
    throw new Error(`Login failed HTTP ${res.status}: ${body.error ?? 'no token'}`);
  }
  return body.data.token;
}

async function streamTeachingTurn(base, token) {
  const message = [
    'Bab ujian E2E Teaching State Machine: Faktor tenaga dalam hierarki keberadaan.',
    'P.alt menerangkan PL sebagai manifestasi pengalaman manusia dalam ruang perhatian,',
    'dan PG sebagai lapisan yang menghubungkan sumber Y dengan apa yang kelihatan di lapangan.',
    'Kupas pemahaman anda tentang bab ini supaya P.alt boleh sahkan sebelum bab seterusnya.',
  ].join(' ');

  const res = await fetch(`${base}/api/adam/chat`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${token}`,
      Accept:          'text/event-stream',
    },
    body: JSON.stringify({
      mode:    'TEACHING',
      message,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chat HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const events = [];
  let fullText = '';
  let complete = null;
  let errorEvt = null;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      if (!block.trim()) continue;
      const { event, data } = parseSseBlock(block);
      events.push(event);
      if (event === 'adam_chunk') {
        try {
          fullText += JSON.parse(data).text ?? '';
        } catch {
          // ignore
        }
      } else if (event === 'adam_complete') {
        try {
          complete = JSON.parse(data);
          fullText = complete.response ?? fullText;
        } catch {
          // ignore
        }
      } else if (event === 'adam_error') {
        try {
          errorEvt = JSON.parse(data);
        } catch {
          errorEvt = { error: data };
        }
      }
    }
  }

  return { events, fullText, complete, errorEvt, message };
}

const INQUIRY_MARK =
  /(?:\[TEACHING\s+INQUIRY|INQUIRI\s+SITUASI\s+NYATA|situasi nyata yang P\.alt|contoh di lapangan|data semasa.*P\.alt)/i;
const SYNTHESIS_MARK =
  /\b(?:Kod sains konvensional|Had kaedah|Teori belum selesai|Implikasi isu dunia)\b/i;

async function loadTeachingStateMachine() {
  try {
    const { createRequire } = await import('node:module');
    const req = createRequire(import.meta.url);
    return req('../dist/adam/adam-teaching-state-machine.js');
  } catch {
    return null;
  }
}

async function main() {
  loadDotEnv(resolve(__dirname, '..'));
  const { base } = parseArgs(process.argv);
  const password = process.env.FOUNDER_PASSWORD;
  if (!password) {
    console.error('❌ FOUNDER_PASSWORD not set (export or .env on server)');
    process.exit(1);
  }

  console.log(`▶ E2E Founder Teaching SSE — base=${base}`);
  const t0 = Date.now();

  const token = await login(base, password);
  console.log('   ✅  Founder login OK');

  const { events, fullText, complete, errorEvt, message } = await streamTeachingTurn(base, token);
  const ms = Date.now() - t0;

  if (errorEvt) {
    console.error('❌ adam_error:', errorEvt.error ?? errorEvt);
    process.exit(1);
  }
  if (!complete?.response && !fullText.trim()) {
    console.error('❌ Empty response — events:', [...new Set(events)].join(', '));
    process.exit(1);
  }

  const text = (complete?.response ?? fullText).trim();
  const uniqueEvents = [...new Set(events)];
  const sm = await loadTeachingStateMachine();
  const hasInquiry = sm
    ? sm.adamTeachingMessageHasInquirySection(text)
    : INQUIRY_MARK.test(text);
  const hasSynthesis = sm
    ? sm.adamTeachingMessageHasSynthesisSection(text)
    : SYNTHESIS_MARK.test(text);

  const checks = [
    { name: 'adam_thinking received', ok: events.includes('adam_thinking') },
    { name: 'adam_complete received', ok: events.includes('adam_complete') },
    { name: 'response length ≥ 160 (explain-back)', ok: text.length >= 160 },
    { name: 'Phase A inquiry close present', ok: hasInquiry },
    { name: 'NOT Phase C synthesis block', ok: !hasSynthesis },
    { name: 'no web search in Phase A', ok: !events.includes('adam_searching') },
    { name: 'addresses P.alt', ok: /\bP\.alt\b/i.test(text) },
    { name: 'mode TEACHING in complete', ok: complete?.mode === 'TEACHING' },
  ];

  console.log('');
  console.log('── SSE events ──');
  console.log(uniqueEvents.join(' → '));
  console.log('');
  console.log('── Assertions ──');
  let failed = 0;
  for (const c of checks) {
    console.log(`${c.ok ? '✅' : '❌'}  ${c.name}`);
    if (!c.ok) failed++;
  }

  console.log('');
  console.log(`── Response preview (${text.length} chars, ${ms}ms) ──`);
  console.log(text.slice(0, 600) + (text.length > 600 ? '\n…' : ''));

  if (complete?.k24Address) {
    console.log('');
    console.log(`k24: ${complete.k24Address} · judgment: ${complete.judgment ?? 'n/a'}`);
  }

  if (failed > 0) {
    console.error(`\n── Response tail (last 1200 chars) ──`);
    console.error(text.slice(-1200));
    if (sm) {
      console.error('stateMachine.hasInquirySection:', sm.adamTeachingMessageHasInquirySection(text));
    }
    console.error(`\n❌ E2E failed (${failed} assertion(s))`);
    process.exit(1);
  }
  console.log(`\n✅ E2E Founder Teaching SSE pass (${ms}ms)`);
}

main().catch((err) => {
  console.error('❌', err.message ?? err);
  process.exit(1);
});
