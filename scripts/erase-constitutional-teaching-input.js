#!/usr/bin/env node
/**
 * One-off: erase constitutional teaching priming from stored chat messages.
 * Run on VPS: node scripts/erase-constitutional-teaching-input.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const FOUNDER_STUB = 'P.alt shared teaching material.';
const ADAM_OMIT =
  '[Prior ADAM reply omitted — it used invented framework notation. Learn only from P.alt\'s teaching material in plain Malay.]';
const LEAKED_ADAM =
  /\bqadari\b|waqf\s+qadari|tanda\s+waqf|bekas\s+qadari|ritme\s+`a1|pengembalian\s+ke\s+`a1/i;

function eraseFounderContent(content) {
  return content
    .replace(/Founder shared teaching data for constitutional absorption\./gi, FOUNDER_STUB)
    .replace(
      /\[Teaching absorbed: ([^\]]+) — raw upload erased per AIDIL; energy in Alamtologi Brain\]/gi,
      '[Files: $1 — raw upload erased per AIDIL]',
    )
    .replace(/energy in Alamtologi Brain/gi, 'AIDIL');
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const col = mongoose.connection.collection('adam_messages');

  const founder = await col
    .find({ role: 'founder', content: /constitutional absorption|Teaching absorbed:/i })
    .toArray();

  let founderUpdated = 0;
  for (const doc of founder) {
    const next = eraseFounderContent(doc.content);
    if (next !== doc.content) {
      await col.updateOne({ _id: doc._id }, { $set: { content: next } });
      founderUpdated += 1;
    }
  }

  const adam = await col.find({ role: 'adam', content: LEAKED_ADAM }).toArray();
  let adamUpdated = 0;
  for (const doc of adam) {
    await col.updateOne({ _id: doc._id }, { $set: { content: ADAM_OMIT } });
    adamUpdated += 1;
  }

  console.log(JSON.stringify({ founderScanned: founder.length, founderUpdated, adamUpdated }));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
