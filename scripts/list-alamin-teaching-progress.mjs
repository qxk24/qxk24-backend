#!/usr/bin/env node
/**
 * List ALAMIN-related A+B=C teaching records from adam_teaching_records.
 * Run on VPS/lab where MONGODB_URI is set:
 *   node alm-backend/scripts/list-alamin-teaching-progress.mjs
 *   node alm-backend/scripts/list-alamin-teaching-progress.mjs --founder masa-bayu
 */

import { MongoClient } from 'mongodb';

const ALAMIN_KEYWORDS = [
  'alamin',
  'komunikasi alamtologi',
  'pesa', 'pedu', 'pega', 'pepa', 'pema', 'pena', 'petu',
  'faktor pola alamin',
  'faktor kadar alamin',
  'faktor pasangan alamin',
  'faktor keseimbangan alamin',
  'teori alamin',
  'prolog alamin',
  'sains komunikasi alamtologi',
];

const SYLLABUS_MARKERS = [
  { id: 'prolog', re: /prolog|perjalanan pendidikan|icns|menemukan alamin|menekuni belajar/i },
  { id: 'bab-1', re: /bab 1.*alamin|dasar pemikiran|pengenalan alamin|asas alamin|definisi alamin/i },
  { id: 'bab-2.1', re: /faktor pola|pesa|pedu|pega|pepa|pema|pena|petu/i },
  { id: 'bab-2.2', re: /faktor kadar|batas ruang|isi ruang|nukleus|pelengkap nukleus|kadar masa|kadar tenaga/i },
  { id: 'bab-2.3', re: /faktor pasangan|mula dan tamat|gerakan asas|persamaan/i },
  { id: 'bab-2.4', re: /faktor keseimbangan|keperluan|kapasiti/i },
  { id: 'bab-3', re: /falsafah alamin|ontologi.*alamin|epistemologi.*alamin|aksiologi/i },
  { id: 'bab-4', re: /formula alamin/i },
];

function inferTopic(text) {
  const hits = SYLLABUS_MARKERS.filter((m) => m.re.test(text));
  return hits.length ? hits[hits.length - 1].id : 'unknown-alamin';
}

function parseArgs(argv) {
  const founderIdx = argv.indexOf('--founder');
  return {
    founderId: founderIdx >= 0 ? argv[founderIdx + 1] : 'masa-bayu',
  };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set — run on VPS/lab or export connection string.');
    process.exit(1);
  }

  const { founderId } = parseArgs(process.argv.slice(2));
  const client = new MongoClient(uri);
  await client.connect();
  const col = client.db().collection('adam_teaching_records');

  const regex = new RegExp(ALAMIN_KEYWORDS.join('|'), 'i');
  const rows = await col
    .find({
      founderId,
      status: 'active',
      $or: [
        { teachingIntent: regex },
        { episodeSummary: regex },
        { outcomeSummary: regex },
        { relationalTags: regex },
      ],
    })
    .sort({ masa_recorded: 1 })
    .project({
      masa_recorded: 1,
      teachingIntent: 1,
      episodeSummary: 1,
      family: 1,
      principle: 1,
    })
    .toArray();

  console.log(`Founder: ${founderId}`);
  console.log(`ALAMIN-related teaching records: ${rows.length}\n`);

  if (rows.length === 0) {
    console.log('No ALAMIN A+B=C records found.');
    console.log('Resume teaching from: Prolog ALAMIN (first item in syllabus).');
    console.log('Note: meterai files were NOT brain learning — only live Teaching sessions count.');
    await client.close();
    return;
  }

  const topics = new Set();
  for (const row of rows) {
    const blob = [row.teachingIntent, row.episodeSummary].filter(Boolean).join(' ');
    const topic = inferTopic(blob);
    topics.add(topic);
    const date = row.masa_recorded instanceof Date
      ? row.masa_recorded.toISOString().slice(0, 10)
      : String(row.masa_recorded);
    console.log(`[${date}] ${topic}`);
    console.log(`  intent: ${(row.teachingIntent || '').slice(0, 120)}`);
    console.log('');
  }

  const order = SYLLABUS_MARKERS.map((m) => m.id);
  const learned = order.filter((id) => topics.has(id));
  const last = learned[learned.length - 1];
  const nextIdx = last ? order.indexOf(last) + 1 : 0;
  const resume = order[nextIdx] ?? 'complete-through-bab-4';

  console.log('---');
  console.log(`Topics with evidence: ${learned.join(', ') || '(none matched syllabus markers)'}`);
  console.log(`Suggested resume: ${resume}`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
