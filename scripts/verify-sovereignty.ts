#!/usr/bin/env npx tsx
/**
 * ADAM Sovereignty Seal — fails CI if external LLM provider imports reappear.
 * Run: npm run verify:sovereignty
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(__dirname, '..');
const SCAN_ROOTS = ['src', 'scripts'];
const EXT = /\.(ts|tsx|js|jsx)$/i;

const BANNED_IMPORT_PATTERNS: RegExp[] = [
  /from\s+['"][^'"]*dashscope[^'"]*['"]/i,
  /from\s+['"][^'"]*openai[^'"]*['"]/i,
  /from\s+['"][^'"]*wanx[^'"]*['"]/i,
  /require\s*\(\s*['"][^'"]*dashscope[^'"]*['"]\s*\)/i,
  /require\s*\(\s*['"][^'"]*openai[^'"]*['"]\s*\)/i,
  /require\s*\(\s*['"][^'"]*wanx[^'"]*['"]\s*\)/i,
  /import\s*\(\s*['"][^'"]*dashscope[^'"]*['"]\s*\)/i,
  /import\s*\(\s*['"][^'"]*openai[^'"]*['"]\s*\)/i,
  /import\s*\(\s*['"][^'"]*wanx[^'"]*['"]\s*\)/i,
];

const ALLOWLIST = new Set([
  'src/llm/ul-compat.ts',
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const st = statSync(abs);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      walk(abs, out);
    } else if (EXT.test(entry)) {
      out.push(abs);
    }
  }
  return out;
}

function scanFile(relPath: string, source: string): string[] {
  if (ALLOWLIST.has(relPath)) return [];
  const hits: string[] = [];
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) continue;
    for (const pattern of BANNED_IMPORT_PATTERNS) {
      if (pattern.test(line)) {
        hits.push(`${relPath}:${i + 1}: ${line.trim()}`);
        break;
      }
    }
  }
  return hits;
}

function main(): void {
  const files: string[] = [];
  for (const root of SCAN_ROOTS) {
    walk(join(ROOT, root), files);
  }

  const violations: string[] = [];
  for (const abs of files) {
    const rel = relative(ROOT, abs).replace(/\\/g, '/');
    const source = readFileSync(abs, 'utf8');
    violations.push(...scanFile(rel, source));
  }

  if (violations.length > 0) {
    console.error('SOVEREIGNTY SEAL FAILED — external LLM provider imports detected:\n');
    for (const v of violations) console.error(`  ${v}`);
    console.error(`\n${violations.length} violation(s). ADAM must stay 100% local UL.`);
    process.exit(1);
  }

  console.log(`SOVEREIGNTY SEAL OK — ${files.length} files scanned, 0 external LLM imports.`);
}

main();
