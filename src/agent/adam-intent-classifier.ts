/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Intent Classifier
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Builder activation: BUILDER/AUDIT mode, /build, or leading keyword "Build" only.
 * After activation, classifyIntent() picks MCP task type from the instruction text.
 */

export type BuildIntent =
  | 'read_code'
  | 'write_code'
  | 'fix_bug'
  | 'create_feature'
  | 'search_codebase'
  | 'git_operation'
  | 'run_command'
  | 'none';

export interface IntentResult {
  isBuildIntent: boolean;
  intent:        BuildIntent;
  confidence:    number;
}

export interface BuilderActivation {
  activate:   boolean;
  intent:     BuildIntent;
  message:    string;
  reason:     string;
  confidence: number;
}

const BUILD_PREFIX = /^\/build\b[:\s]*/i;
const BUILD_KEYWORD = /^Build(?:[:\s]+|$)/;

const TASK_PATTERNS: Array<{ pattern: RegExp; intent: BuildIntent; weight: number }> = [
  { pattern: /\b(fix|debug|resolve|repair|patch|correct|betulkan|baiki)\b/i, intent: 'fix_bug', weight: 90 },
  { pattern: /\b(error|bug|broken|failing|crash|ralat)\b/i, intent: 'fix_bug', weight: 75 },
  { pattern: /\b(create|generate|scaffold|add|implement|bina|cipta|tambah)\b/i, intent: 'create_feature', weight: 88 },
  { pattern: /\b(write|update|modify|refactor|propose|kemaskini)\b/i, intent: 'write_code', weight: 85 },
  { pattern: /\b(new (file|route|service|schema|component|module))\b/i, intent: 'create_feature', weight: 95 },
  {
    pattern: /\b(read|show|open|inspect|list|audit|baca|lihat|semak)\b.*\b(file|code|src|folder|fail|repo)\b/i,
    intent:  'read_code',
    weight:  88,
  },
  { pattern: /\b(search|grep|find|cari)\b/i, intent: 'search_codebase', weight: 80 },
  { pattern: /\b(commit|push|pull|branch|merge|git)\b/i, intent: 'git_operation', weight: 90 },
  { pattern: /\b(run|execute|deploy|restart|npm|pm2|tsc|mcp)\b/i, intent: 'run_command', weight: 85 },
  { pattern: /\b(qxk24-backend|qxk24-web|qxk24-mcp|mac:|desktop\/qxk24)\b/i, intent: 'search_codebase', weight: 82 },
];

export function hasExplicitBuildActivation(message: string): boolean {
  const t = message.trim();
  return BUILD_PREFIX.test(t) || BUILD_KEYWORD.test(t);
}

/** Strip /build or leading Build keyword; return whether builder was explicitly requested. */
export function stripBuilderActivationPrefix(message: string): {
  message:   string;
  activated: boolean;
} {
  const trimmed = message.trim();
  if (BUILD_PREFIX.test(trimmed)) {
    const rest = trimmed.replace(BUILD_PREFIX, '').trim();
    return { message: rest || trimmed, activated: true };
  }
  if (BUILD_KEYWORD.test(trimmed)) {
    const rest = trimmed.replace(BUILD_KEYWORD, '').trim();
    return { message: rest || trimmed, activated: true };
  }
  return { message: trimmed, activated: false };
}

/** Infer MCP task type from instruction (only after builder is already activated). */
export function classifyIntent(message: string): IntentResult {
  let highestWeight = 0;
  let detectedIntent: BuildIntent = 'none';

  for (const { pattern, intent, weight } of TASK_PATTERNS) {
    if (pattern.test(message) && weight > highestWeight) {
      highestWeight = weight;
      detectedIntent = intent;
    }
  }

  if (/(?:^|[\s"'`(])[\w.-]+\.(?:tsx?|jsx?|mjs)\b/i.test(message) && highestWeight < 75) {
    highestWeight = 75;
    detectedIntent = 'write_code';
  }

  return {
    isBuildIntent: highestWeight >= 70,
    intent:        detectedIntent,
    confidence:    highestWeight,
  };
}

export function resolveBuilderActivation(
  rawMessage: string,
  options: {
    forceBuilder?: boolean;
  } = {},
): BuilderActivation {
  const { message, activated } = stripBuilderActivationPrefix(rawMessage);
  const intentResult = classifyIntent(message);

  if (options.forceBuilder || activated) {
    return {
      activate:   true,
      intent:     intentResult.intent === 'none' ? 'write_code' : intentResult.intent,
      message,
      reason:     activated
        ? (BUILD_PREFIX.test(rawMessage.trim()) ? 'build_prefix' : 'build_keyword')
        : 'builder_mode_flag',
      confidence: 100,
    };
  }

  return {
    activate:   false,
    intent:     'none',
    message,
    reason:     'normal_chat',
    confidence: intentResult.confidence,
  };
}
