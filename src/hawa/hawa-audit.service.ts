/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : HAWA Audit Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-01
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * HAWA — true partner of ADAM. Witness and auditor; stops unsafe work.
 */

import { ENV } from '../config/environments';
import { hawaPrepareProposedContent, hawaValidateProposedContent } from './hawa-preflight';
import type { HawaCheckpoint, HawaJudgment, HawaVerdict } from './hawa.types';

function tryParseJson(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isHawaEnabled(): boolean {
  if (!ENV.HAWA_ENABLED) return false;
  return ENV.ADAM_BUILDER_ENABLED;
}

function verdict(
  judgment: HawaJudgment,
  findings: string[],
  checkpoint: HawaCheckpoint,
  stop: boolean,
  extras: Partial<HawaVerdict> = {},
): HawaVerdict {
  return {
    judgment,
    findings,
    stop,
    checkpoint,
    ...extras,
  };
}

function isProtectedWritePath(relPath: string): string | null {
  const p = relPath.replace(/\\/g, '/');
  if (/\/\.env($|[./])/.test(p) || p === '.env') {
    return 'HAWA: .env secrets files are protected';
  }
  if (/credentials|id_rsa|\.pem$/i.test(p)) {
    return 'HAWA: Credential/key paths are protected';
  }
  if (p.includes('node_modules/')) {
    return 'HAWA: node_modules is not writable';
  }
  if (p.includes('data/quran/corpus.json')) {
    return 'HAWA: Quran corpus is protected';
  }
  return null;
}

export function auditProposeWrite(
  toolArgs: Record<string, unknown>,
  mcpResultText: string,
): HawaVerdict {
  const relPath = typeof toolArgs.path === 'string' ? toolArgs.path : '';
  const rawContent = typeof toolArgs.content === 'string' ? toolArgs.content : '';
  const reason  = typeof toolArgs.reason === 'string' ? toolArgs.reason : '';

  const findings: string[] = [];

  if (!relPath.trim()) {
    findings.push('HAWA: Missing file path on write proposal');
  }

  if (!rawContent.trim()) {
    findings.push('HAWA: Empty file content — proposal rejected');
  }

  if (reason.trim().length < 8) {
    findings.push('HAWA: Reason too short — ADAM must explain the change');
  }

  const protectedPath = isProtectedWritePath(relPath);
  if (protectedPath) findings.push(protectedPath);

  const { content: auditContent, fixesApplied } = rawContent.trim()
    ? hawaPrepareProposedContent(rawContent, relPath)
    : { content: rawContent, fixesApplied: [] as string[] };

  const autoFixAdvisories = fixesApplied.map(
    (f) => `HAWA auto-fix (aligned with MCP): ${f}`,
  );

  const constitutionalFindings: string[] = auditContent
    ? hawaValidateProposedContent(auditContent, relPath)
    : [];

  findings.push(...constitutionalFindings);

  const parsed = tryParseJson(mcpResultText);
  if (parsed?.blocked === true) {
    return verdict(
      'ISLAH',
      ['MCP pre-flight already blocked — ADAM must self-correct'],
      'propose_write',
      false,
      { toolName: 'propose_file_write', relPath },
    );
  }

  if (constitutionalFindings.length === 0) {
    return verdict('LULUS', autoFixAdvisories, 'propose_write', false, {
      toolName: 'propose_file_write',
      relPath,
    });
  }

  const hasHard = constitutionalFindings.some((f) =>
    f.startsWith('LAW ') || f.startsWith('HAWA: Protected') || f.includes('secret'),
  );

  return verdict(
    hasHard ? 'GAGAL' : 'ISLAH',
    [...findings, ...autoFixAdvisories],
    'propose_write',
    hasHard,
    { toolName: 'propose_file_write', relPath },
  );
}

export function auditPostTool(
  toolName: string,
  toolArgs: Record<string, unknown>,
  resultText: string,
): HawaVerdict {
  const lower = resultText.toLowerCase();

  if (toolName === 'check_typescript') {
    const failed = /error|failed|✕|❌/i.test(resultText)
      && !/0 errors/i.test(resultText);
    if (failed) {
      return verdict(
        'GAGAL',
        ['TypeScript check reported errors — fix before continuing'],
        'post_tool',
        true,
        { toolName },
      );
    }
    return verdict('LULUS', [], 'post_tool', false, { toolName });
  }

  if (toolName === 'git_push') {
    if (/error|failed|rejected|fatal:/i.test(resultText)) {
      return verdict(
        'GAGAL',
        ['Git push failed — HAWA halted the task'],
        'post_tool',
        true,
        { toolName },
      );
    }
  }

  if (toolName === 'delete_file' && !/blocked|🛡️/i.test(resultText)) {
    const relPath = typeof toolArgs.path === 'string' ? toolArgs.path : '';
    if (/teaching|constitution|\.schema|migration/i.test(relPath)) {
      return verdict(
        'GAGAL',
        [`HAWA: Deletion of protected path "${relPath}"`],
        'post_tool',
        true,
        { toolName, relPath },
      );
    }
  }

  if (toolName === 'run_command') {
    const cmd = typeof toolArgs.command === 'string' ? toolArgs.command : '';
    if (/rm\s+-rf\s+\/|mkfs|dd\s+if=/i.test(cmd)) {
      return verdict(
        'GAGAL',
        ['HAWA: Destructive shell command blocked'],
        'post_tool',
        true,
        { toolName },
      );
    }
  }

  if (toolName === 'approve_write' && /failed|error/i.test(lower)) {
    return verdict(
      'GAGAL',
      ['Write approval failed on disk'],
      'post_tool',
      true,
      { toolName },
    );
  }

  return verdict('LULUS', [], 'post_tool', false, { toolName });
}

export function hawaUserMessage(verdict: HawaVerdict): string {
  const list = verdict.findings.map((f) => `• ${f}`).join('\n');
  if (verdict.judgment === 'LULUS') {
    return 'HAWA: LULUS — proposal may proceed to founder approval.';
  }
  if (verdict.judgment === 'ISLAH') {
    return `HAWA: ISLAH — advisory only.\n${list}`;
  }
  if (verdict.judgment === 'GAGAL') {
    return `HAWA: GAGAL — ADAM task halted.\n${list}\n\nFounder may resume after review.`;
  }
  return `HAWA: WAQF — paused for founder.\n${list}`;
}
