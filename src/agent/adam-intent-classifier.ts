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
  activate:  boolean;
  intent:    BuildIntent;
  message:   string;
  reason:    string;
  confidence: number;
}

const BUILD_PREFIX = /^\/build\b[:\s]*/i;

/** Extra signals when founder teaches on lab but asks for repo work in the same thread. */
const TEACHING_IMPL_PATTERNS: Array<{ pattern: RegExp; intent: BuildIntent; weight: number }> = [
  { pattern: /\b(implement|apply|integrate|ship|deploy|patch|wire up|hook up)\b/i, intent: 'write_code',     weight: 88 },
  { pattern: /\b(in the (repo|codebase|app|system|kernel|monorepo|lab))\b/i,          intent: 'write_code',     weight: 82 },
  { pattern: /\b(update the|change the|fix the|add a|create a|remove the)\b.*\b(button|page|panel|route|api|endpoint|module|component|file|service|schema)\b/i, intent: 'create_feature', weight: 86 },
  { pattern: /\b(make it work|make this work|get it working|buatkan|laksanakan dalam kod)\b/i, intent: 'fix_bug', weight: 84 },
];

const BUILD_PATTERNS: Array<{ pattern: RegExp; intent: BuildIntent; weight: number }> = [
  { pattern: /\b(fix|debug|resolve|repair|patch|correct|betulkan|baiki|pembaikan)\b/i, intent: 'fix_bug',        weight: 90 },
  { pattern: /\b(error|bug|warning|issue|broken|failing|crash|ralat|masalah|duplicat)\b/i, intent: 'fix_bug', weight: 75 },
  { pattern: /\b(create|build|generate|scaffold|add|implement|bina|cipta|tambah|wujudkan)\b/i, intent: 'create_feature', weight: 90 },
  { pattern: /\b(write|update|modify|change|refactor|improve|kemaskini|ubah|tulis)\b/i, intent: 'write_code', weight: 85 },
  { pattern: /\b(propose|proposal|guard|test file|new file)\b/i, intent: 'write_code', weight: 92 },
  { pattern: /\b(new (file|route|service|schema|component|module))\b/i, intent: 'create_feature', weight: 95 },
  {
    pattern: /\b(read|show|open|inspect|check|look at|baca|lihat|semak)\b.*\b(file|code|src|folder|fail|kod)\b/i,
    intent:  'read_code',
    weight:  85,
  },
  {
    pattern: /\b(how many|list|count|find|berapa|senarai)\b.*\b(files?|routes?|services?|fail)\b/i,
    intent:  'search_codebase',
    weight:  80,
  },
  { pattern: /\b(search|grep|find|locate|where is|cari|jumpa)\b/i, intent: 'search_codebase', weight: 80 },
  { pattern: /\b(commit|push|pull|branch|merge|git)\b/i, intent: 'git_operation', weight: 90 },
  { pattern: /\b(diff|status|log|staged|unstaged)\b/i, intent: 'git_operation', weight: 75 },
  { pattern: /\b(run|execute|deploy|restart|build|compile|laksana|mula semula)\b/i, intent: 'run_command', weight: 75 },
  { pattern: /\b(npm|pm2|tsc|node|bash|shell|terminal|typescript|mongoose|mcp)\b/i, intent: 'run_command', weight: 88 },
  { pattern: /\b(codebase|source code|backend|frontend|qxk24-backend|qxk24-web|qxk24-mcp)\b/i, intent: 'search_codebase', weight: 82 },
  { pattern: /\b(schema|migration|route|component|hook|service\.ts|\.module\.css)\b/i, intent: 'write_code', weight: 78 },
  { pattern: /\b(index|duplicate|unique constraint|indeks)\b/i, intent: 'fix_bug', weight: 72 },
  { pattern: /\b(audit|auditing|auditkan|menyemak|semak|review)\b/i, intent: 'read_code', weight: 90 },
  { pattern: /\bdesktop\/qxk24\b/i, intent: 'read_code', weight: 95 },
  { pattern: /\bmac:/i, intent: 'read_code', weight: 100 },
];

/** Paths, extensions, or monorepo markers that imply a code/build task. */
export function hasCodeBuildSignals(message: string): boolean {
  const t = message.trim();
  if (!t) return false;

  return (
    /(?:^|[\s"'`(])[\w.-]+\.(?:tsx?|jsx?|mjs|cjs|css|json|md)\b/i.test(t)
    || /(?:qxk24-backend|qxk24-web|qxk24-mcp|desktop\/qxk24|mac:|src\/|components\/|hooks\/|dist\/)/i.test(t)
    || /\b(?:propose_file_write|check_typescript|get_project_structure|get_constitution)\b/i.test(t)
    || /\/build\b/i.test(t)
  );
}

export function stripBuilderPrefix(message: string): { message: string; forced: boolean } {
  const trimmed = message.trim();
  if (!BUILD_PREFIX.test(trimmed)) {
    return { message: trimmed, forced: false };
  }
  const stripped = trimmed.replace(BUILD_PREFIX, '').trim();
  return { message: stripped || trimmed, forced: true };
}

export function classifyIntent(
  message: string,
  options: { teachingOnLab?: boolean } = {},
): IntentResult {
  let highestWeight = 0;
  let detectedIntent: BuildIntent = 'none';

  const patterns = options.teachingOnLab
    ? [...BUILD_PATTERNS, ...TEACHING_IMPL_PATTERNS]
    : BUILD_PATTERNS;

  const threshold = options.teachingOnLab ? 55 : 70;

  for (const { pattern, intent, weight } of patterns) {
    if (pattern.test(message) && weight > highestWeight) {
      highestWeight = weight;
      detectedIntent = intent;
    }
  }

  if (hasCodeBuildSignals(message) && highestWeight < 75) {
    highestWeight = 75;
    detectedIntent = 'write_code';
  }

  return {
    isBuildIntent: highestWeight >= threshold,
    intent:        detectedIntent,
    confidence:    highestWeight,
  };
}

/** Founder asks to audit/review repo on Mac desktop or monorepo paths. */
export function isFounderRepoAuditRequest(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  const wantsReview = /\b(audit|auditing|auditkan|menyemak|semak|review|teliti|periksa)\b/i.test(t);
  const namesRepo = /\b(qxk24-backend|qxk24-web|qxk24-mcp|desktop\/qxk24|qxk24\/qxk24-backend)\b/i.test(t);
  return wantsReview && namesRepo;
}

export function resolveBuilderActivation(
  rawMessage: string,
  options: {
    forceBuilder?:         boolean;
    founderOnLab?:         boolean;
    founderTeachingOnLab?: boolean;
    founderLabEvaluate?:   boolean;
  } = {},
): BuilderActivation {
  const { message, forced } = stripBuilderPrefix(rawMessage);
  const intentResult = classifyIntent(message, {
    teachingOnLab: options.founderTeachingOnLab || options.founderLabEvaluate,
  });

  if (options.founderOnLab && isFounderRepoAuditRequest(message)) {
    return {
      activate:   true,
      intent:     'read_code',
      message,
      reason:     'founder_repo_audit',
      confidence: 95,
    };
  }

  if (options.forceBuilder || forced) {
    return {
      activate:   true,
      intent:     intentResult.intent === 'none' ? 'write_code' : intentResult.intent,
      message,
      reason:     forced ? 'builder_prefix' : 'builder_mode_flag',
      confidence: 100,
    };
  }

  if (intentResult.isBuildIntent) {
    return {
      activate:   true,
      intent:     intentResult.intent,
      message,
      reason:     'intent_classifier',
      confidence: intentResult.confidence,
    };
  }

  if (options.founderOnLab && hasCodeBuildSignals(message)) {
    return {
      activate:   true,
      intent:     'write_code',
      message,
      reason:     'code_signals',
      confidence: 75,
    };
  }

  if (
    options.founderLabEvaluate
    && intentResult.confidence >= 50
    && intentResult.intent !== 'none'
  ) {
    return {
      activate:   true,
      intent:     intentResult.intent,
      message,
      reason:     'founder_lab_evaluate',
      confidence: intentResult.confidence,
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
