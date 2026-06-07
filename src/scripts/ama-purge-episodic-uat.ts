#!/usr/bin/env ts-node
/**
 * Purge AMA uat entries from Kotak 3 (episodicLane).
 * Usage:
 *   npx ts-node --transpile-only src/scripts/ama-purge-episodic-uat.ts
 *   npx ts-node --transpile-only src/scripts/ama-purge-episodic-uat.ts --execute
 */

import { connectDatabase, disconnectDatabase } from '../config/database';
import { getOrCreateMaster } from '../qxk24brain/qxk24brain.engine';
import { AlamtologiBrainMasterModel } from '../qxk24brain/qxk24brain.schema';
import {
  AMA_UAT_PURGE_WINDOW,
  purgeEpisodicLaneEntries,
} from '../lib/ama/ama-episodic-purge';

const FOUNDER_ID = 'masa-bayu';
const EXECUTE = process.argv.includes('--execute');

async function main(): Promise<void> {
  await connectDatabase();
  const master = await getOrCreateMaster(FOUNDER_ID);
  const before = master.episodicLane ?? '';

  const result = purgeEpisodicLaneEntries(before, AMA_UAT_PURGE_WINDOW);

  console.log('[AMA Purge] Window:', AMA_UAT_PURGE_WINDOW);
  console.log('[AMA Purge] Before chars:', before.length);
  console.log('[AMA Purge] Removed entries:', result.removed.length);
  for (const r of result.removed) {
    console.log(`  - ${r.timestamp} | ${r.id} | ${r.body.slice(0, 70).replace(/\s+/g, ' ')}…`);
  }
  console.log('[AMA Purge] Kept entries:', result.kept.length);
  console.log('[AMA Purge] After chars:', result.rebuilt.length);

  if (!EXECUTE) {
    console.log('\nDry run — pass --execute to apply.');
    await disconnectDatabase();
    return;
  }

  if (result.removed.length === 0) {
    console.log('Nothing to purge.');
    await disconnectDatabase();
    return;
  }

  await AlamtologiBrainMasterModel.updateOne(
    { founderId: FOUNDER_ID },
    { $set: { episodicLane: result.rebuilt } },
  );

  console.log('\n✅ episodicLane updated.');
  await disconnectDatabase();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
