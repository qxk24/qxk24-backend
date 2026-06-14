#!/usr/bin/env node
/** Follow-up turn — substantive situasi nyata → expect Phase C synthesis */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const req = createRequire(import.meta.url);
const sm = req('../dist/adam/adam-teaching-state-machine.js');
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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

async function login(base, password) {
  const res = await fetch(`${base}/api/adam/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const body = await res.json();
  return body.data.token;
}

async function stream(base, token, message) {
  const res = await fetch(`${base}/api/adam/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
    body: JSON.stringify({ mode: 'TEACHING', message }),
  });
  const events = [];
  let text = '';
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      const block = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      let ev = 'message';
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) ev = line.slice(6).trim();
        if (line.startsWith('data:')) {
          try {
            const d = JSON.parse(line.slice(5).trim());
            if (ev === 'adam_chunk') text += d.text ?? '';
            if (ev === 'adam_complete') text = d.response ?? text;
          } catch {}
        }
      }
      events.push(ev);
    }
  }
  return { events, text: text.trim() };
}

loadDotEnv(resolve(__dirname, '..'));
const base = (process.argv[2] ?? 'http://127.0.0.1:5000').replace(/\/$/, '');
const password = process.env.FOUNDER_PASSWORD;
const token = await login(base, password);

const message =
  'Contoh di lapangan: rotasi bumi dan pemerhatian angkasa — data NASA menunjukkan bentuk sferoid; '
  + 'GPS dan coriolisk bergantung pada rotasi. Di mana sains konvensional masih terbuka menurut P.alt?';

console.log('▶ Turn 2 — situasi nyata follow-up');
const t0 = Date.now();
const { events, text } = await stream(base, token, message);
const ms = Date.now() - t0;

const hasSynthesis = sm.adamTeachingMessageHasSynthesisSection(text);
const searched = events.includes('adam_searching');

console.log('events:', [...new Set(events)].join(' → '));
console.log('hasSynthesisSection:', hasSynthesis);
console.log('adam_searching:', searched);
console.log('length:', text.length, 'ms:', ms);
console.log('--- preview ---');
console.log(text.slice(0, 800));
console.log('--- tail ---');
console.log(text.slice(-800));

if (!hasSynthesis) {
  console.error('❌ Phase C synthesis section labels missing after repair');
  process.exit(1);
}
console.log('\n✅ Turn 2 Phase C complete');
