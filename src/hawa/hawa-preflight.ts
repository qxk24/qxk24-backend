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

const MCP_PATH_DEFAULT = '/var/www/qxk24/qxk24-mcp/build/index.js';

/** Mechanical fixes — mirrors qxk24-mcp preflight-auto-fix (HAWA must audit MCP-corrected content). */
export function hawaAutoFixProposedContent(
  content: string,
  filePath: string,
): { content: string; fixesApplied: string[] } {
  let fixed = content;
  const fixesApplied: string[] = [];

  if (fixed.includes('/usr/local/bin/')) {
    fixed = fixed.replace(/\/usr\/local\/bin\/[^\s'"]+/g, MCP_PATH_DEFAULT);
    fixesApplied.push('LAW 3: Replaced /usr/local/bin/ MCP path with canonical default');
  }

  const providerFixes: Array<[RegExp, string]> = [
    [/Qwen is deciding the next step…/gi, 'ADAM is thinking…'],
    [/Qwen is thinking…/gi, 'ADAM is thinking…'],
    [/Qwen error:/gi, 'ADAM builder error:'],
    [/Claude is thinking…/gi, 'ADAM is thinking…'],
    [/\bQwen · ERA_1\b/g, 'ADAM Builder · ERA_1'],
  ];
  for (const [pattern, replacement] of providerFixes) {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, replacement);
      fixesApplied.push('LAW 9: Replaced LLM provider name with ADAM in user-facing text');
      break;
    }
  }

  if (/\.tsx?$/i.test(filePath)) {
    const before = fixed;
    fixed = fixed.replace(
      /from\s+(['"])(\.[^'"]+?)\1/g,
      (match, quote: string, spec: string) => {
        if (spec.endsWith('.js') || spec.endsWith('.json') || spec.endsWith('.css')) {
          return match;
        }
        return `from ${quote}${spec}.js${quote}`;
      },
    );
    if (fixed !== before) {
      fixesApplied.push('LAW 5: Appended .js to relative import paths');
    }
  }

  return { content: fixed, fixesApplied: [...new Set(fixesApplied)] };
}

/** Content MCP would store after auto-fix — use for Tier A/B instead of raw ADAM tool args. */
export function hawaPrepareProposedContent(
  content: string,
  filePath: string,
): { content: string; fixesApplied: string[] } {
  let working = content;
  const allFixes: string[] = [];

  for (let pass = 0; pass < 3; pass += 1) {
    const check = hawaValidateProposedContent(working, filePath);
    if (check.length === 0) {
      return { content: working, fixesApplied: [...new Set(allFixes)] };
    }
    const { content: fixed, fixesApplied } = hawaAutoFixProposedContent(working, filePath);
    if (fixesApplied.length === 0 || fixed === working) {
      return { content: working, fixesApplied: [...new Set(allFixes)] };
    }
    allFixes.push(...fixesApplied);
    working = fixed;
  }

  return { content: working, fixesApplied: [...new Set(allFixes)] };
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
