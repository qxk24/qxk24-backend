#!/usr/bin/env node
/**
 * Copies canonical Teaching Bridge sources from qxk24-adam into backend src
 * so standalone qxk24-backend deploys compile without a sibling repo on VPS.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const source = path.join(repoRoot, 'alm-adam', 'teaching-bridge', 'src');
const target = path.join(__dirname, '..', 'src', 'teaching-bridge', 'vendor');

if (!fs.existsSync(source)) {
  console.error(`[sync-teaching-bridge] Missing source: ${source}`);
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });
fs.cpSync(source, target, { recursive: true });
console.log(`[sync-teaching-bridge] ${source} → ${target}`);
