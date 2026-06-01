/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : HAWA Pre-flight (Tier A)
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
 * Mirrors qxk24-mcp preflight rules for HAWA witness layer.
 */

const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; reason: string; tsOnly?: boolean }> = [
  {
    pattern: /@nestjs\//,
    reason:  'LAW 1: NestJS import — Hono stack only',
  },
  {
    pattern: /@Injectable\s*\(\s*\)/,
    reason:  'LAW 1: @Injectable() forbidden',
  },
  {
    pattern: /@InjectModel\s*\(/,
    reason:  'LAW 1: @InjectModel() forbidden',
  },
  {
    pattern: /@Module\s*\(/,
    reason:  'LAW 1: @Module() forbidden',
  },
  {
    pattern: /@Controller\s*\(/,
    reason:  'LAW 1: @Controller() forbidden',
  },
  {
    pattern: /export\s+class\s+\w+Service\b/,
    reason:  'LAW 1: Class-based services forbidden',
    tsOnly:  true,
  },
  {
    pattern: /new\s+AlamtologiValidator\s*\(\s*\)/,
    reason:  'LAW 2: Use plain validator functions',
  },
  {
    pattern: /(?:Qwen is|Claude is|DashScope|Anthropic).{0,40}(?:thinking|deciding|error)/i,
    reason:  'LAW 9: No LLM vendor names in user-facing strings',
  },
];

const SECRET_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /sk-ant-[a-zA-Z0-9_-]{20,}/,
    reason:  'HAWA: Possible API secret in proposed content',
  },
  {
    pattern: /sk-[a-zA-Z0-9]{20,}/,
    reason:  'HAWA: Possible API key in proposed content',
  },
  {
    pattern: /DASHSCOPE_API_KEY\s*=\s*['"][^'"]+['"]/,
    reason:  'HAWA: Hard-coded DashScope key in source',
  },
];

function isTypeScriptPath(filePath: string): boolean {
  return /\.tsx?$/i.test(filePath);
}

function checkRelativeJsExtensions(content: string, filePath: string): string[] {
  if (!isTypeScriptPath(filePath)) return [];

  const violations: string[] = [];
  const importRe = /from\s+['"](\.[^'"]+)['"]/g;
  let match: RegExpExecArray | null;

  while ((match = importRe.exec(content)) !== null) {
    const spec = match[1];
    if (spec.endsWith('.js') || spec.endsWith('.json') || spec.endsWith('.css')) continue;
    violations.push(
      `LAW 5: Relative import "${spec}" must end with .js`,
    );
  }

  return violations;
}

function checkMongooseModelSafety(content: string, filePath: string): string[] {
  if (!isTypeScriptPath(filePath)) return [];
  if (!/mongoose\.model\s*\(/.test(content)) return [];
  if (/mongoose\.models\s*\[/.test(content)) return [];

  return [
    'LAW 4: Use mongoose.models[\'Name\'] ?? mongoose.model(...) — never bare mongoose.model()',
  ];
}

export function hawaValidateProposedContent(content: string, filePath: string): string[] {
  const violations: string[] = [];

  for (const { pattern, reason, tsOnly } of FORBIDDEN_PATTERNS) {
    if (tsOnly && !isTypeScriptPath(filePath)) continue;
    if (pattern.test(content)) violations.push(reason);
  }

  for (const { pattern, reason } of SECRET_PATTERNS) {
    if (pattern.test(content)) violations.push(reason);
  }

  violations.push(...checkRelativeJsExtensions(content, filePath));
  violations.push(...checkMongooseModelSafety(content, filePath));

  return [...new Set(violations)];
}
