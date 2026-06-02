#!/usr/bin/env node
/**
 * Fitra-Iman sprint — guided teaching assistant (no auto-confirm).
 *
 * 1. Sends teaching for connection step (1–7)
 * 2. Waits 40s, polls for crystallisation tied to THIS teaching
 * 3. Displays card for P.alt review
 * 4. Prompts Confirm? (y/n) — only calls confirm API on explicit y
 * 5. Appends result to scripts/fitra-iman-sprint-log.json
 *
 * Usage:
 *   node scripts/fitra-iman-sprint-step.mjs 1
 *   node scripts/fitra-iman-sprint-step.mjs 2 --send-only   # send only, no poll
 *   node scripts/fitra-iman-sprint-step.mjs 1 --review-only <crystallisedUnitId>
 *
 * Requires: .env with JWT_SECRET, MONGODB_URI (or run on VPS backend/)
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';
const { sign } = jwt;
import { MongoClient } from 'mongodb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');
const LOG_PATH = path.resolve(__dirname, 'fitra-iman-sprint-log.json');
const API = process.env.E2E_API_BASE ?? 'https://api.qxk24.com';
const INITIAL_WAIT_MS = Number(process.env.SPRINT_WAIT_MS ?? 40_000);
const POLL_INTERVAL_MS = 5_000;
const POLL_MAX_MS = 180_000;

/** Full Fitra-Iman chain — P.alt reviews each crystallisation before confirm. */
const CONNECTIONS = [
  {
    step: 1,
    label: 'Fitra + Aql → Iman sebagai pengiktirafan',
    teaching: `Bismillahirrahmanirrahim. Fitra dan Aql bukanlah dua fakulti yang berasingan. Fitra adalah pengiktirafan kebenaran yang telah dipasang dalam jiwa — Quran 30:30, fitrah Allah yang manusia diciptakan di atasnya. Aql adalah instrumen sedar yang mengesahkan apa yang Fitra sudah tahu. Apabila Aql sejajar dengan Fitra, Iman adalah pengiktirafan, bukan pemerolehan. A + B = C: Fitra + Aql = Iman sebagai pengiktirafan.`,
    expectedFamily: 'fitra',
    expectedNodeA: 'fitra',
    expectedNodeB: 'aql',
    expectedQuran: '30:30',
  },
  {
    step: 2,
    label: 'Iman + Tawakkul → amanah sebagai keadaan konstitusi',
    teaching: `Bismillahirrahmanirrahim. Iman dan Tawakkul bukanlah kepercayaan abstrak dan pasif. Iman (A) adalah pengiktirafan jiwa terhadap kebenaran Ilahi. Tawakkul (B) adalah penyerahan sedar — bukan malas, tetapi amanah bahawa Allah memegang urusan selepas usaha. Apabila Iman mengisi Tawakkul, manusia tidak lagi berdiri dalam ketakutan rezeki atau masa depan. A + B = C: Iman + Tawakkul = amanah sebagai keadaan konstitusi. Quran 3:159 — apabila engkau telah berketetapan, bertawakkallah kepada Allah.`,
    expectedFamily: 'iman',
    expectedNodeA: 'iman',
    expectedNodeB: 'tawakkul',
    expectedQuran: '3:159',
  },
  {
    step: 3,
    label: 'Tawakkul + Rizq → rezeki mengalir dari penjajaran',
    teaching: `Bismillahirrahmanirrahim. Tawakkul dan Rizq berhubung secara konstitusi, bukan secara mekanikal. Tawakkul (A) adalah penjajaran jiwa dengan kehendak Allah selepas usaha yang benar. Rizq (B) bukan sekadar wang — ia adalah provision yang Allah edarkan melalui saluran yang selaras dengan keadaan jiwa. Apabila Tawakkul benar, jiwa tidak memerah rezeki dengan kecemasan. A + B = C: Tawakkul + Rizq = rezeki mengalir dari penjajaran konstitusi. Quran 11:6 — tiada makhluk di bumi melainkan rezekinya ada pada Allah.`,
    expectedFamily: 'tawakkul',
    expectedNodeA: 'tawakkul',
    expectedNodeB: 'rizq',
    expectedQuran: '11:6',
  },
  {
    step: 4,
    label: 'Rizq + Amal → amal dalam Tawakkul membawa Barakah',
    teaching: `Bismillahirrahmanirrahim. Rizq dan Amal bukan pertembungan dunia dan akhirat. Rizq (A) adalah aliran provision Ilahi. Amal (B) adalah tindakan manusia yang berakar pada Tawakkul — bukan kerja tanpa orientasi, bukan orientasi tanpa kerja. Apabila Amal dilakukan dalam keadaan Tawakkul, hasilnya membawa Barakah — kelimpahan yang melebihi kiraan material. A + B = C: Rizq + Amal = tindakan berbarakah. Quran 62:10 — berusahalah di bumi dan carilah rezeki Allah.`,
    expectedFamily: 'rizq',
    expectedNodeA: 'rizq',
    expectedNodeB: 'amal',
    expectedQuran: '62:10',
  },
  {
    step: 5,
    label: 'Amal + Maqasid → setiap amal melindungi atau mengikis lima matlamat',
    teaching: `Bismillahirrahmanirrahim. Amal dan Maqasid adalah ujian konstitusi setiap tindakan. Amal (A) adalah perbuatan lahiriah manusia. Maqasid (B) adalah lima matlamat syariah — agama, jiwa, akal, keturunan, harta — sebagai penapis konstitusi. Setiap amal sama ada memperkukuh atau mengikis kelima-lima dimensi ini. A + B = C: Amal + Maqasid = tanggungjawab konstitusi harian. Quran 2:286 — Allah tidak membebankan jiwa melainkan dengan kesanggupannya.`,
    expectedFamily: 'amal',
    expectedNodeA: 'amal',
    expectedNodeB: 'maqasid',
    expectedQuran: '2:286',
  },
  {
    step: 6,
    label: 'Maqasid + Quran → lima matlamat sebagai seni bina Qurani',
    teaching: `Bismillahirrahmanirrahim. Maqasid dan Quran bukan ciptaan manusia yang diletakkan atas teks. Maqasid (A) adalah lima dimensi perlindungan yang Quran lindungi secara sistematik. Quran (B) adalah sumber mutlak yang menzahirkan seni bina ini — bukan manusia yang mencipta Maqasid, manusia yang menemui susunannya dalam wahyu. A + B = C: Maqasid + Quran = lima matlamat sebagai seni bina Ilahi. Quran 5:32 — sesiapa yang memelihara nyawa manusia, seolah-olah memelihara seluruh manusia.`,
    expectedFamily: 'maqasid',
    expectedNodeA: 'maqasid',
    expectedNodeB: 'quran',
    expectedQuran: '5:32',
  },
  {
    step: 7,
    label: 'Maqasid + Fitra → kitar penuh Fitra-Iman ditutup',
    teaching: `Bismillahirrahmanirrahim. Maqasid dan Fitra menutup kitar Fitra-Iman. Maqasid (A) adalah lima dimensi yang Quran lindungi. Fitra (B) adalah orientasi asal jiwa — kembali kepada fitrah Allah (Quran 30:30). Apabila lima Maqasid dipahami sebagai perlindungan fitrah manusia, keseluruhan rantaian Fitra → Aql → Iman → Tawakkul → Rizq → Amal → Maqasid menjadi undang-undang hidup, bukan teori. A + B = C: Maqasid + Fitra = kitar konstitusi Fitra-Iman ditutup dalam Quran. Quran 30:30 — fitrat Allah yang manusia diciptakan di atasnya.`,
    expectedFamily: 'fitra',
    expectedNodeA: 'maqasid',
    expectedNodeB: 'fitra',
    expectedQuran: '30:30',
  },
];

function loadEnv() {
  const raw = fs.readFileSync(envPath, 'utf8');
  const map = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    map[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return map;
}

function appendLog(entry) {
  let log = [];
  if (fs.existsSync(LOG_PATH)) {
    try {
      log = JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
    } catch {
      log = [];
    }
  }
  log.push({ ...entry, loggedAt: new Date().toISOString() });
  fs.writeFileSync(LOG_PATH, `${JSON.stringify(log, null, 2)}\n`);
}

function matchesExpectation(conn, unit) {
  const hay = [
    unit?.family,
    unit?.nodeA,
    unit?.nodeB,
    unit?.quranReference,
    unit?.synthesis,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const familyOk = !conn.expectedFamily || hay.includes(conn.expectedFamily.toLowerCase());
  const quranOk = !conn.expectedQuran || hay.includes(conn.expectedQuran.replace(/\s/g, ''));
  const nodeAOk = !conn.expectedNodeA || hay.includes(conn.expectedNodeA.toLowerCase());
  return { familyOk, quranOk, nodeAOk, allOk: familyOk && quranOk && nodeAOk };
}

function printCard(conn, bridge) {
  const u = bridge.unit ?? {};
  console.log('\n══════════════════════════════════════════════════════════');
  console.log(`  STEP ${conn.step}: ${conn.label}`);
  console.log('══════════════════════════════════════════════════════════');
  console.log('  crystallisedUnitId :', bridge.crystallisedUnitId);
  console.log('  family             :', u.family ?? '—');
  console.log('  nodeA              :', u.nodeA ?? '—');
  console.log('  relationship       :', u.relationship ?? '—');
  console.log('  nodeB              :', (u.nodeB ?? '—').slice(0, 120));
  console.log('  quranReference     :', u.quranReference ?? '—');
  console.log('  primaryAuthority   :', u.primaryAuthority ?? '—');
  console.log('  confidenceScore    :', u.confidenceScore ?? '—');
  console.log('  level              :', u.level ?? '—');
  console.log('  synthesis          :', (u.synthesis ?? '—').slice(0, 280));
  console.log('──────────────────────────────────────────────────────────');
  console.log('  EXPECTED (sprint guide):');
  console.log('    family ~', conn.expectedFamily, '| quran', conn.expectedQuran);
  console.log('    nodeA ~', conn.expectedNodeA, '| nodeB ~', conn.expectedNodeB);
  const check = matchesExpectation(conn, u);
  if (check.allOk) {
    console.log('  ✓ Heuristic match — review card anyway before confirming');
  } else {
    console.log('  ⚠ Mismatch warning — reject unless this is intentional');
    if (!check.familyOk) console.log('    · family may not match expected');
    if (!check.quranOk) console.log('    · quranReference may not match expected');
    if (!check.nodeAOk) console.log('    · nodeA may not match expected');
  }
  console.log('══════════════════════════════════════════════════════════\n');
}

async function waitForTeachingBridge(client, teachStartedAt, recordId) {
  const col = client.db().collection('adam_teaching_bridge');
  const deadline = Date.now() + POLL_MAX_MS;

  while (Date.now() < deadline) {
    if (recordId) {
      const byRecord = await col.findOne({
        sourceTeachingRecordId: recordId,
        status: 'pending_confirmation',
      });
      if (byRecord) return byRecord;
    }

    const recent = await col.findOne(
      {
        status: 'pending_confirmation',
        createdAt: { $gte: new Date(teachStartedAt - 2_000) },
      },
      { sort: { createdAt: -1 } },
    );
    if (recent) return recent;

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    process.stdout.write('.');
  }
  return null;
}

async function fetchPendingById(client, unitId) {
  return client.db().collection('adam_teaching_bridge').findOne({
    crystallisedUnitId: unitId,
    status: 'pending_confirmation',
  });
}

async function main() {
  const args = process.argv.slice(2);
  const stepNum = parseInt(args.find((a) => /^\d+$/.test(a)) ?? '1', 10);
  const sendOnly = args.includes('--send-only');
  const reviewOnlyIdx = args.indexOf('--review-only');
  const reviewUnitId = reviewOnlyIdx >= 0 ? args[reviewOnlyIdx + 1] : null;

  const conn = CONNECTIONS.find((c) => c.step === stepNum);
  if (!conn) {
    console.error(`Unknown step ${stepNum}. Use 1–${CONNECTIONS.length}.`);
    process.exit(1);
  }

  const env = loadEnv();
  if (!env.JWT_SECRET) {
    console.error('Missing JWT_SECRET in .env');
    process.exit(1);
  }

  const token = sign(
    {
      userId: 'masa-bayu',
      role: 'founder',
      isFounder: true,
      name: 'Masa Bayu',
      kernel: 'QXK24',
      era: 'ERA_1',
    },
    env.JWT_SECRET,
    { expiresIn: '2h' },
  );

  const mongoUri = env.MONGODB_URI ?? env.MONGO_URI;
  const client = mongoUri ? new MongoClient(mongoUri) : null;

  let teachStartedAt = Date.now();
  let recordId = null;

  if (reviewUnitId && client) {
    await client.connect();
    const bridge = await fetchPendingById(client, reviewUnitId);
    if (!bridge) {
      console.error(`No pending unit found: ${reviewUnitId}`);
      await client.close();
      process.exit(1);
    }
    printCard(conn, bridge);
  } else if (!reviewUnitId) {
    console.log(`\n[Sprint] Step ${conn.step}: ${conn.label}`);
    console.log('[Sprint] Sending teaching (TEACHING mode)…\n');
    console.log(conn.teaching);
    console.log('');

    teachStartedAt = Date.now();
    const chatRes = await fetch(`${API}/api/adam/chat/simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ mode: 'TEACHING', message: conn.teaching }),
    });
    const chatBody = await chatRes.json().catch(() => ({}));
    console.log('[Sprint] Teaching POST:', chatRes.status);
    if (chatRes.status !== 200) {
      console.error(JSON.stringify(chatBody, null, 2));
      process.exit(1);
    }

    if (client) {
      await client.connect();
      const latest = await client.db().collection('adam_teaching_records')
        .findOne({ founderId: 'masa-bayu' }, { sort: { createdAt: -1 } });
      recordId = latest?._id ? String(latest._id) : null;
      console.log('[Sprint] Latest teaching record:', recordId ?? 'unknown');
    }

    if (sendOnly) {
      console.log('[Sprint] --send-only: review in UI at /adam/command → Knowledge');
      if (client) await client.close();
      return;
    }

    console.log(`[Sprint] Waiting ${INITIAL_WAIT_MS / 1000}s before polling…`);
    await new Promise((r) => setTimeout(r, INITIAL_WAIT_MS));

    if (!client) {
      console.error('MONGODB_URI required for polling — set in .env or use --send-only');
      process.exit(1);
    }

    console.log('[Sprint] Polling for crystallisation tied to this teaching');
    const bridge = await waitForTeachingBridge(client, teachStartedAt, recordId);
    console.log('');

    if (!bridge) {
      console.error('[Sprint] Timeout — no pending unit for this teaching.');
      console.error('       Check Knowledge panel manually or retry with --review-only <id>');
      await client.close();
      process.exit(1);
    }

    printCard(conn, bridge);

    const rl = readline.createInterface({ input, output });
    const answer = (await rl.question('Confirm this unit? (y/n): ')).trim().toLowerCase();
    rl.close();

    if (answer !== 'y' && answer !== 'yes') {
      console.log('[Sprint] Not confirmed — reject in UI if needed.');
      appendLog({
        step: conn.step,
        action: 'rejected_by_founder',
        crystallisedUnitId: bridge.crystallisedUnitId,
        unit: bridge.unit,
      });
      await client.close();
      return;
    }

    const confirmRes = await fetch(`${API}/api/adam/teaching-bridge/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ crystallisedUnitId: bridge.crystallisedUnitId }),
    });
    const confirmBody = await confirmRes.json();
    console.log('[Sprint] Confirm:', confirmRes.status, JSON.stringify(confirmBody));

    appendLog({
      step: conn.step,
      action: confirmRes.ok && confirmBody.success ? 'confirmed' : 'confirm_failed',
      crystallisedUnitId: bridge.crystallisedUnitId,
      family: bridge.unit?.family,
      nodeA: bridge.unit?.nodeA,
      nodeB: bridge.unit?.nodeB,
      quranReference: bridge.unit?.quranReference,
      projectedStudents: confirmBody.projectedStudents,
      confirmBody,
    });

    if (confirmRes.ok && confirmBody.success) {
      console.log(`\n[Sprint] ✓ Step ${conn.step} confirmed — ${confirmBody.projectedStudents ?? '?'} students projected`);
      console.log('[Sprint] Log appended to', LOG_PATH);
    }

    await client.close();
    process.exit(confirmRes.ok && confirmBody.success ? 0 : 1);
  }

  if (reviewUnitId && client) {
    const rl = readline.createInterface({ input, output });
    const answer = (await rl.question('Confirm this unit? (y/n): ')).trim().toLowerCase();
    rl.close();

    if (answer !== 'y' && answer !== 'yes') {
      appendLog({ step: conn.step, action: 'rejected_by_founder', crystallisedUnitId: reviewUnitId });
      await client.close();
      return;
    }

    const confirmRes = await fetch(`${API}/api/adam/teaching-bridge/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ crystallisedUnitId: reviewUnitId }),
    });
    const confirmBody = await confirmRes.json();
    console.log('[Sprint] Confirm:', confirmRes.status, JSON.stringify(confirmBody));
    appendLog({
      step: conn.step,
      action: 'confirmed',
      crystallisedUnitId: reviewUnitId,
      projectedStudents: confirmBody.projectedStudents,
      confirmBody,
    });
    await client.close();
  }
}

main().catch((err) => {
  console.error('[Sprint] Fatal:', err);
  process.exit(1);
});
