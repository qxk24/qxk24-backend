/**
 * Sweep tutor agent-price windows — switch to public USD 19 when license expired.
 * Usage: npx ts-node --transpile-only src/scripts/sweep-tutor-pricing-renewal.ts
 */

import mongoose from 'mongoose';
import { ENV } from '../config/environments';
import { sweepExpiredTutorAgentPricing } from '../adam/tutor/adam-tutor-pricing-renewal.service';

async function main(): Promise<void> {
  const uri = ENV.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI required');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const result = await sweepExpiredTutorAgentPricing(500);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
