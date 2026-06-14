/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Teaching Upload Extract (child process)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Spawned by saveTeachingUpload so PDF/DOCX parse OOM cannot kill alm-backend.
 */

import { extractTextFromPath } from '../adam/adam-file-extract.service';

async function main(): Promise<void> {
  const filePath = process.env.ALM_EXTRACT_PATH?.trim();
  const mimeType = process.env.ALM_EXTRACT_MIME ?? '';
  const fileName = process.env.ALM_EXTRACT_NAME ?? 'upload';
  const role = process.env.ALM_EXTRACT_ROLE === 'student' ? 'student' : 'founder';

  if (!filePath) {
    process.stdout.write(JSON.stringify({ ok: false, error: 'Missing ALM_EXTRACT_PATH' }));
    process.exit(1);
  }

  try {
    const text = await extractTextFromPath(filePath, mimeType, fileName, { uploaderRole: role });
    process.stdout.write(JSON.stringify({ ok: true, text }));
    process.exit(0);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Extraction failed';
    process.stdout.write(JSON.stringify({ ok: false, error: message }));
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : 'Extraction failed';
  process.stdout.write(JSON.stringify({ ok: false, error: message }));
  process.exit(1);
});
