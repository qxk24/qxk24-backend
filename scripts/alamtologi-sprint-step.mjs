#!/usr/bin/env node
/**
 * Alamtologi — Quranic Science sprint — guided teaching assistant (no auto-confirm).
 *
 * Chain: Ilm + Quran → Mizan → Tasawwur → Ijtihad → Hukm → Amal → Tamaddun → Ilm
 *
 * 1. Sends teaching for connection step (1–7)
 * 2. Waits 40s, polls for crystallisation tied to THIS teaching
 * 3. Displays card for P.alt review
 * 4. Prompts Confirm? (y/n) — only calls confirm API on explicit y
 * 5. Appends result to scripts/alamtologi-sprint-log.json
 *
 * Usage:
 *   node scripts/alamtologi-sprint-step.mjs 1
 *   node scripts/alamtologi-sprint-step.mjs 2 --send-only   # send only, no poll
 *   node scripts/alamtologi-sprint-step.mjs 1 --review-only <crystallisedUnitId>
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
const LOG_PATH = path.resolve(__dirname, 'alamtologi-sprint-log.json');
const API = process.env.E2E_API_BASE ?? 'https://api.qxk24.com';
const INITIAL_WAIT_MS = Number(process.env.SPRINT_WAIT_MS ?? 40_000);
const POLL_INTERVAL_MS = 5_000;
const POLL_MAX_MS = 180_000;

/** Alamtologi epistemology chain — P.alt reviews each crystallisation before confirm. */
const CONNECTIONS = [
  {
    step: 1,
    label: 'Ilm + Quran → Mizan sebagai timbangan kebenaran',
    teaching: `Bismillahirrahmanirrahim. Ilm dan Quran adalah asas epistemologi konstitusi Alamtologi. Ilm (A) bukan sekadar maklumat — ia adalah pengetahuan yang diperoleh melalui usaha, hidayah, dan kesediaan jiwa menerima kebenaran. Quran (B) adalah timbangan mutlak — bukan rujukan tambahan, tetapi sumber yang menentukan apa yang diterima atau ditolak. Apabila Ilm diuji dengan Quran, Mizan timbul: skala kebenaran Ilahi, bukan pendapat peribadi atau konsensus manusia. A + B = C: Ilm + Quran = Mizan sebagai timbangan kebenaran konstitusi. Quran 17:36 — janganlah engkau mengikuti apa yang engkau tidak mempunyai pengetahuan tentangnya.`,
    expectedFamily: 'alamtologi',
    expectedNodeA: 'ilm',
    expectedNodeB: 'quran',
    expectedQuran: '17:36',
  },
  {
    step: 2,
    label: 'Mizan + Tasawwur → pembentukan pandangan alam konstitusi',
    teaching: `Bismillahirrahmanirrahim. Mizan dan Tasawwur berhubung dalam lapisan epistemologi yang lebih dalam. Mizan (A) adalah timbangan kebenaran — alat untuk menapis tuntutan ilmu. Tasawwur (B) adalah pembentukan pandangan alam — cara jiwa memahami realiti selepas kebenaran ditimbang. Tanpa Mizan, Tasawwur menjadi khayalan; tanpa Tasawwur, Mizan kekal abstrak tanpa bentuk hidup. Apabila kebenaran ditimbang dan kemudian difahami sebagai pandangan alam, manusia tidak lagi hidup dalam kekeliruan epistemik. A + B = C: Mizan + Tasawwur = pandangan alam yang dibentuk oleh timbangan Ilahi. Quran 3:190 — sesungguhnya dalam penciptaan langit dan bumi ada tanda-tanda untuk orang yang berakal.`,
    expectedFamily: 'mizan',
    expectedNodeA: 'mizan',
    expectedNodeB: 'tasawwur',
    expectedQuran: '3:190',
  },
  {
    step: 3,
    label: 'Tasawwur + Ijtihad → penaakulan terapan dalam konteks nyata',
    teaching: `Bismillahirrahmanirrahim. Tasawwur dan Ijtihad adalah jambatan antara pemahaman dan tindakan berfikir. Tasawwur (A) adalah pandangan alam yang telah dibentuk oleh Mizan — kerangka bagaimana realiti dipahami. Ijtihad (B) adalah penaakulan terapan — usaha sedar menarik hukum atau keputusan dari sumber yang sah dalam konteks yang baru. Ijtihad bukan spekulasi bebas; ia berlaku dalam Tasawwur yang konstitusi. A + B = C: Tasawwur + Ijtihad = penaakulan terapan yang berakar pada pandangan alam Ilahi. Quran 4:59 — jika kamu berbalah tentang sesuatu, kembalikanlah kepada Allah dan Rasul.`,
    expectedFamily: 'tasawwur',
    expectedNodeA: 'tasawwur',
    expectedNodeB: 'ijtihad',
    expectedQuran: '4:59',
  },
  {
    step: 4,
    label: 'Ijtihad + Hukm → penetapan hukum konstitusi',
    teaching: `Bismillahirrahmanirrahim. Ijtihad dan Hukm adalah penutup dan pembuka lapisan undang-undang hidup. Ijtihad (A) adalah usaha penaakulan terapan dalam konteks nyata. Hukm (B) adalah penetapan — keputusan konstitusi yang mengikat tindakan, bukan sekadar pendapat yang boleh diabaikan. Apabila Ijtihad mencapai Hukm, ilmu berhenti menjadi teori dan menjadi undang-undang yang hidup. A + B = C: Ijtihad + Hukm = penetapan hukum konstitusi dari penaakulan yang sah. Quran 5:1 — penuhilah perjanjian. Sesungguhnya perjanjian itu pasti ditanya.`,
    expectedFamily: 'ijtihad',
    expectedNodeA: 'ijtihad',
    expectedNodeB: 'hukm',
    expectedQuran: '5:1',
  },
  {
    step: 5,
    label: 'Hukm + Amal → tindakan selaras dengan hukum Ilahi',
    teaching: `Bismillahirrahmanirrahim. Hukm dan Amal adalah titik di mana epistemologi menjadi kewujudan. Hukm (A) adalah penetapan konstitusi — apa yang wajib, harus, atau dilarang. Amal (B) adalah tindakan lahiriah manusia — bukan amal kosong tanpa orientasi, bukan orientasi tanpa perbuatan. Apabila Hukm mengisi Amal, setiap perbuatan menjadi ibadah yang terukur, bukan tabiat atau adat semata-mata. A + B = C: Hukm + Amal = tindakan selaras dengan hukum Ilahi. Quran 2:177 — kebajikan bukan hanya menghadapkan muka ke timur atau barat, tetapi beriman kepada Allah, hari akhirat, malaikat, kitab, dan nabi, serta memberikan harta yang dicintai.`,
    expectedFamily: 'hukm',
    expectedNodeA: 'hukm',
    expectedNodeB: 'amal',
    expectedQuran: '2:177',
  },
  {
    step: 6,
    label: 'Amal + Tamaddun → tamadun dari amal yang selaras',
    teaching: `Bismillahirrahmanirrahim. Amal dan Tamaddun berhubung dalam skala sejarah manusia. Amal (A) adalah tindakan individu dan komuniti yang berakar pada Hukm. Tamaddun (B) bukan sekadar teknologi atau kemewahan — ia adalah tamadun yang tumbuh dari corak amal kolektif yang selaras atau menyimpang dari konstitusi Ilahi. Tamadun yang benar bukan yang paling maju materially, tetapi yang amalnya membawa Barakah dan keadilan. A + B = C: Amal + Tamaddun = tamadun yang dibangunkan dari amal konstitusi. Quran 49:13 — sesungguhnya kamu semua berasal dari Adam, dan Adam diciptakan dari tanah; yang mulia di antara kamu adalah yang paling bertakwa.`,
    expectedFamily: 'tamaddun',
    expectedNodeA: 'amal',
    expectedNodeB: 'tamaddun',
    expectedQuran: '49:13',
  },
  {
    step: 7,
    label: 'Tamaddun + Ilm → kitar epistemologi Alamtologi ditutup',
    teaching: `Bismillahirrahmanirrahim. Tamaddun dan Ilm menutup kitar epistemologi Alamtologi. Tamaddun (A) adalah hasil amal kolektif manusia — tamadun yang membentuk dan dibentuk oleh generasi. Ilm (B) kembali sebagai asas — bukan ilmu sekular yang terpisah dari tamadun, tetapi ilmu yang diperbaharui melalui pengalaman tamadun dan diuji semula dengan Quran. Apabila tamadun menghasilkan ilmu baru, ilmu itu mesti kembali ke Mizan. Kitar Ilm → Quran → Mizan → Tasawwur → Ijtihad → Hukm → Amal → Tamaddun → Ilm menjadi mesin epistemologi yang hidup. A + B = C: Tamaddun + Ilm = kitar epistemologi Alamtologi ditutup dalam usaha ilmiah yang konstitusi. Quran 96:1-5 — Bacalah dengan nama Tuhanmu yang mencipta; Dia menciptakan manusia dari segumpal darah; Bacalah, dan Tuhanmulah yang paling mulia; yang mengajar dengan pena; Dia mengajar manusia apa yang tidak diketahuinya.`,
    expectedFamily: 'ilm',
    expectedNodeA: 'tamaddun',
    expectedNodeB: 'ilm',
    expectedQuran: '96:1',
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
