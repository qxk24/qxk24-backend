/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Teaching Upload Extract (isolated child)
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { spawn } from 'child_process';
import path from 'path';

const EXTRACT_TIMEOUT_MS = 180_000;
const CHILD_HEAP_MB = 1536;

function childScriptPath(): string {
  return path.join(__dirname, '../scripts/extract-teaching-upload.js');
}

export function extractTeachingTextInChild(
  filePath: string,
  mimeType: string,
  fileName: string,
  uploaderRole: 'founder' | 'student',
): Promise<string> {
  return new Promise((resolve, reject) => {
    const script = childScriptPath();
    const child = spawn(
      process.execPath,
      [`--max-old-space-size=${CHILD_HEAP_MB}`, script],
      {
        env: {
          ...process.env,
          ALM_EXTRACT_PATH: filePath,
          ALM_EXTRACT_MIME: mimeType,
          ALM_EXTRACT_NAME: fileName,
          ALM_EXTRACT_ROLE: uploaderRole,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('File text extraction timed out. Try a smaller PDF or paste an excerpt in chat.'));
    }, EXTRACT_TIMEOUT_MS);

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const line = stdout.trim().split('\n').filter(Boolean).pop() ?? '';
      try {
        const parsed = JSON.parse(line) as { ok?: boolean; text?: string; error?: string };
        if (parsed.ok && typeof parsed.text === 'string') {
          resolve(parsed.text);
          return;
        }
        reject(new Error(parsed.error ?? (stderr.trim() || 'File text extraction failed.')));
      } catch {
        if (code === 0 && stdout.trim()) {
          resolve(stdout.trim());
          return;
        }
        const oom = stderr.includes('heap out of memory') || stderr.includes('Allocation failed');
        reject(new Error(
          oom
            ? 'This file has very dense internal content (common with large Word documents saved as small DOCX). '
              + 'Try File → Save As → PDF, export a shorter chapter, or paste key sections as text.'
            : stderr.trim() || `File text extraction failed (exit ${code ?? '?'}).`,
        ));
      }
    });
  });
}
