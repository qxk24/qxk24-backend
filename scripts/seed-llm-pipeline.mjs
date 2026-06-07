/**
 * Seed Formula XYZ syllabus + constitutional training examples.
 * Usage: node scripts/seed-llm-pipeline.mjs
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { initLlmPipeline } from '../dist/llm-pipeline/llm-pipeline.service.js';
import { getDatasetStats } from '../dist/llm-pipeline/training-example-generator.js';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI required');
  process.exit(1);
}

await mongoose.connect(uri);
await initLlmPipeline();
const stats = await getDatasetStats();
console.log(JSON.stringify(stats, null, 2));
await mongoose.disconnect();
