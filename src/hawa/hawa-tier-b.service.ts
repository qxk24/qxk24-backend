/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : HAWA Tier B — LLM Semantic Audit
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

import { ENV } from '../config/environments';
import type { HawaJudgment } from './hawa.types';

export interface HawaTierBResult {
  judgment:  HawaJudgment;
  findings:  string[];
  summary?:  string;
  skipped?:  boolean;
}

const HAWA_TIER_B_PROMPT = `You are HAWA — the constitutional auditor of QXK24.
You are reviewing a proposed file change submitted by ADAM (the builder agent).
Your task: audit the proposed content for semantic constitutional violations.

Alamtologi Constitutional Laws (binding):
- LAW 1: No NestJS imports, decorators, or patterns (@nestjs/*, @Module, @Controller, @Injectable)
- LAW 2: No class instantiation of plain-function modules (AlamtologiValidator, AdamMemoryService, etc.)
- LAW 3: MCP default path must be /var/www/qxk24/qxk24-mcp/build/index.js
- LAW 4: All internal imports must end in .js
- LAW 5: Plain Mongoose + Hono + TypeScript ESM — REQUIRED stack (import mongoose, Schema, models, mongoose.connection ping in health checks are ALLOWED). GAGAL only for Prisma, TypeORM, Sequelize, Drizzle, or @nestjs/mongoose — never for plain mongoose in *.service.ts / health / *.schema.ts
- LAW 6: Read before write — never overwrite without reading first
- LAW 7: One file at a time — never batch-write multiple files
- LAW 8: Always run check_typescript after every write
- LAW 9: Never expose LLM provider names (Qwen, Claude, GPT) in user-facing strings
- LAW 10: Never touch payment provider code without explicit founder instruction

Audit the following proposed file and respond in this exact JSON format:
{
  "verdict": "LULUS" | "ISLAH" | "GAGAL",
  "findings": ["finding 1", "finding 2"],
  "summary": "one sentence explanation"
}

Rules for your verdict:
- LULUS: content is constitutionally sound, no violations found
- ISLAH: minor issues found that should be noted but do not halt the build
- GAGAL: serious constitutional violation found — build must halt

Respond with JSON only. No markdown. No explanation outside the JSON.`;

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

export async function runHawaTierB(
  content:  string,
  filePath: string,
  reason:   string,
): Promise<HawaTierBResult> {
  const apiKey = ENV.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return {
      judgment: 'LULUS',
      findings: ['Tier B skipped — DASHSCOPE_API_KEY not configured'],
      skipped:  true,
    };
  }

  const userMessage = `FILE PATH: ${filePath}
REASON FOR CHANGE: ${reason}

PROPOSED CONTENT:
\`\`\`typescript
${content.slice(0, 3000)}${content.length > 3000 ? '\n[...truncated]' : ''}
\`\`\``;

  try {
    const res = await fetch(`${ENV.QWEN_API_BASE}/chat/completions`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:           ENV.QWEN_MODEL_FAST,
        messages: [
          { role: 'system', content: HAWA_TIER_B_PROMPT },
          { role: 'user',   content: userMessage },
        ],
        temperature:     0.1,
        max_tokens:      512,
        enable_thinking: false,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        judgment: 'ISLAH',
        findings: [`Tier B API error: ${res.status} — ${errText.slice(0, 100)}`],
      };
    }

    const data = await res.json() as { choices: { message: { content: string } }[] };
    const raw  = data.choices?.[0]?.message?.content?.trim() ?? '';
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let parsed: { verdict: HawaJudgment; findings: string[]; summary?: string };
    try {
      parsed = JSON.parse(cleaned) as typeof parsed;
    } catch {
      return {
        judgment: 'ISLAH',
        findings: [`Tier B parse error — raw response: ${raw.slice(0, 200)}`],
      };
    }

    const rawFindings = parsed.findings ?? [];
    const findings = sanitizeTierBFindings(rawFindings, filePath);
    let judgment = parsed.verdict ?? 'ISLAH';
    if (judgment === 'GAGAL' && rawFindings.length > 0 && findings.length === 0) {
      judgment = 'LULUS';
    } else if (judgment === 'GAGAL' && findings.length < rawFindings.length) {
      judgment = findings.length > 0 ? 'ISLAH' : 'LULUS';
    }

    return {
      judgment,
      findings,
      summary: parsed.summary,
    };
  } catch (err) {
    return {
      judgment: 'ISLAH',
      findings: [`Tier B timeout or network error — ${(err as Error).message}`],
    };
  }
}
