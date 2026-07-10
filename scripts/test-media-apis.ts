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

  const hits = await fetchLicensedMediaFromApis({
    query:     QUERY,
    wantImage: true,
    wantVideo: true,
  });

  const images = hits.filter((h) => h.kind === 'image');
  const videos = hits.filter((h) => h.kind === 'video');

  for (const img of images) {

  }

  for (const vid of videos) {

  }

  if (images.length === 0 && videos.length === 0) {
    console.error('\nFAIL: no media hits — check API keys and network.');
    process.exit(1);
  }

}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
