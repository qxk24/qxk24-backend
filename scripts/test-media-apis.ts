/**
 * One-shot live test for ADAM licensed media APIs.
 * Usage: npx ts-node scripts/test-media-apis.ts
 * Reads keys from .env — never prints secret values.
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import {
  fetchLicensedMediaFromApis,
  getAdamMediaApiKeys,
} from '../src/adam/adam-media-api-search';

const QUERY = 'photosynthesis';

async function main(): Promise<void> {
  const keys = getAdamMediaApiKeys();
  const configured = {
    unsplash: Boolean(keys.unsplash),
    pexels:   Boolean(keys.pexels),
    pixabay:  Boolean(keys.pixabay),
  };
  console.log('API keys configured:', configured);

  const hits = await fetchLicensedMediaFromApis({
    query:     QUERY,
    wantImage: true,
    wantVideo: true,
  });

  const images = hits.filter((h) => h.kind === 'image');
  const videos = hits.filter((h) => h.kind === 'video');

  console.log(`\nQuery: "${QUERY}"`);
  console.log(`Images found: ${images.length}`);
  for (const img of images) {
    console.log(`  [${img.source}] ${img.title.slice(0, 60)}`);
    console.log(`    ${img.url.slice(0, 80)}…`);
  }

  console.log(`Videos found: ${videos.length}`);
  for (const vid of videos) {
    console.log(`  [${vid.source}] ${vid.title.slice(0, 60)}`);
    console.log(`    ${vid.url.slice(0, 80)}…`);
  }

  if (images.length === 0 && videos.length === 0) {
    console.error('\nFAIL: no media hits — check API keys and network.');
    process.exit(1);
  }

  console.log('\nOK: licensed media APIs responding.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
