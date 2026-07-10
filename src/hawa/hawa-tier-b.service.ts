/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : HAWA Tier B — Deterministic Constitutional Audit
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
 */

import type { HawaJudgment } from './hawa.types';

export interface HawaTierBResult {
  judgment:  HawaJudgment;
  findings:  string[];
  summary?:  string;
  skipped?:  boolean;
}

interface ConstitutionalLawCheck {
  law:     number;
  pattern: RegExp;
  message: string;
  severity: 'GAGAL' | 'ISLAH';
}

const CONSTITUTIONAL_LAW_CHECKS: ConstitutionalLawCheck[] = [
  {
    law: 1, severity: 'GAGAL',
    pattern: /@nestjs\/|@Module\b|@Controller\b|@Injectable\b/,
    message: 'LAW 1: NestJS imports, decorators, or patterns forbidden',
  },
  {
    law: 2, severity: 'GAGAL',
    pattern: /new\s+(AlamtologiValidator|AdamMemoryService|QXK24Brain)\s*\(/,
    message: 'LAW 2: Plain-function modules must not be class-instantiated',
  },
  {
    law: 3, severity: 'ISLAH',
    pattern: /qxk24-mcp\/build\/index\.js/,
    message: 'LAW 3: Verify MCP default path is /var/www/qxk24/qxk24-mcp/build/index.js',
  },
  {
    law: 4, severity: 'ISLAH',
    pattern: /from\s+['"][^'"]+['"](?!.*\.js['"])/,
    message: 'LAW 4: Internal imports should end in .js (ESM)',
  },
  {
    law: 5, severity: 'GAGAL',
    pattern: /@prisma\/|typeorm|sequelize|drizzle-orm|@nestjs\/mongoose/,
    message: 'LAW 5: Forbidden ORM — use plain Mongoose + Hono + TypeScript ESM',
  },
  {
    law: 9, severity: 'ISLAH',
    pattern: /\b(Qwen|Claude|GPT-4|OpenAI|DashScope)\b/,
    message: 'LAW 9: Do not expose LLM provider names in user-facing strings',
  },
  {
    law: 10, severity: 'GAGAL',
    pattern: /stripe\.(Secret|Webhook)|STRIPE_SECRET_KEY/,
    message: 'LAW 10: Payment provider code requires explicit founder instruction',
  },
];

/** Tier B sometimes misreads LAW 5 — strip false "mongoose is ORM" findings on allowed paths. */
export function sanitizeTierBFindings(findings: string[], filePath: string): string[] {
  const p = filePath.replace(/\\/g, '/');
  const mongooseAllowed =
    /\/health\//.test(p)
    || /\.schema\.ts$/i.test(p)
    || /\/config\/database\.ts$/.test(p);

  if (!mongooseAllowed) return findings;

  return findings.filter((f) => {
    const lower = f.toLowerCase();
    const targetsMongoose =
      lower.includes('import mongoose')
      || lower.includes('mongoose.connection');
    const claimsLaw5OrOrm =
      lower.includes('law 5')
      || lower.includes('orm')
      || lower.includes('forbidden')
      || lower.includes('violates');
    return !(targetsMongoose && claimsLaw5OrOrm);
  });
}

function runDeterministicAudit(content: string): string[] {
  const findings: string[] = [];
  for (const check of CONSTITUTIONAL_LAW_CHECKS) {
    if (check.pattern.test(content)) {
      findings.push(check.message);
    }
  }
  return findings;
}

function resolveJudgment(findings: string[]): HawaJudgment {
  if (findings.some((f) => CONSTITUTIONAL_LAW_CHECKS.find(
    (c) => c.message === f && c.severity === 'GAGAL',
  ))) {
    return 'GAGAL';
  }
  if (findings.length > 0) return 'ISLAH';
  return 'LULUS';
}

export async function runHawaTierB(
  content:  string,
  filePath: string,
  reason:   string,
): Promise<HawaTierBResult> {
  void reason;

  const rawFindings = runDeterministicAudit(content.slice(0, 3000));
  const findings = sanitizeTierBFindings(rawFindings, filePath);
  let judgment = resolveJudgment(rawFindings);

  if (judgment === 'GAGAL' && rawFindings.length > 0 && findings.length === 0) {
    judgment = 'LULUS';
  } else if (judgment === 'GAGAL' && findings.length < rawFindings.length) {
    judgment = findings.length > 0 ? 'ISLAH' : 'LULUS';
  }

  return {
    judgment,
    findings,
    summary: judgment === 'LULUS'
      ? 'Deterministic UL audit — no constitutional violations detected.'
      : `Deterministic UL audit — ${findings.length} finding(s) on ${filePath}.`,
  };
}
