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
  // On CI / standalone checkouts the sibling monorepo (alm-adam) is absent.
  // The vendor snapshot is committed to the repo, so build can proceed as-is.
  if (fs.existsSync(target)) {
    console.warn(
      `[sync-teaching-bridge] Source missing (${source}); using committed vendor snapshot at ${target}.`,
    );
    process.exit(0);
  }
  console.error(
    `[sync-teaching-bridge] Missing source and no committed vendor snapshot: ${source}`,
  );
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });
fs.cpSync(source, target, { recursive: true });
console.log(`[sync-teaching-bridge] ${source} → ${target}`);
