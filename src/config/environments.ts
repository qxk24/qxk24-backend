/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : Environment Config
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-28
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import path from 'path';
import fs from 'fs';

// Resolve .env (production) or .env.lab when QXK24_STACK=lab
function resolveEnvPath(): string {
  const isLab = process.env.QXK24_STACK === 'lab';
  const names = isLab ? ['.env.lab', '.env'] : ['.env'];
  for (const name of names) {
    const candidates = [
      path.resolve(process.cwd(), name),
      path.resolve(__dirname, '../../', name),
      path.resolve(__dirname, '../../../', name),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return path.resolve(process.cwd(), isLab ? '.env.lab' : '.env');
}

import dotenv from 'dotenv';
dotenv.config({ path: resolveEnvPath() });

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(
      `[QXK24] Missing required environment variable: ${key}`
    );
  }
  return value;
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

function optionalInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? fallback : parsed;
}

const UPLOAD_MAX_FILE_MB = optionalInt('UPLOAD_MAX_FILE_MB', 30);
const UPLOAD_MAX_EXTRACT_CHARS = optionalInt('UPLOAD_MAX_EXTRACT_CHARS', 120000);
/** Max characters accepted in chat JSON (truncated server-side if longer) */
const ADAM_MAX_MESSAGE_CHARS = optionalInt('ADAM_MAX_MESSAGE_CHARS', 80_000);
/** Teaching/upload text injected into a single chat turn */
const ADAM_CHAT_TEACHING_CHARS = optionalInt('ADAM_CHAT_TEACHING_CHARS', 48_000);
/** QXK24Brain summary in chat context */
const ADAM_CHAT_BRAIN_CHARS = optionalInt('ADAM_CHAT_BRAIN_CHARS', 24_000);
/** Each prior message in history */
const ADAM_CHAT_HISTORY_MSG_CHARS = optionalInt('ADAM_CHAT_HISTORY_MSG_CHARS', 4_000);

export const ENV = {
  // Server
  NODE_ENV:     optional('NODE_ENV', 'development'),
  PORT:         optionalInt('PORT', 5000),
  APP_BASE_URL: optional('APP_BASE_URL', 'http://localhost:5000'),

  // Database
  MONGODB_URI: required(
    'MONGODB_URI',
    'mongodb://localhost:27017/qxk24'
  ),
  REDIS_URL: optional('REDIS_URL', ''),

  // JWT
  JWT_SECRET:     required('JWT_SECRET', 'qxk24_dev_secret_change_in_prod'),
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '7d'),

  // QXK24 Kernel Identity
  QXK24_ERA:            optional('QXK24_ERA', 'ERA_1'),
  QXK24_KERNEL_VERSION: optional('QXK24_KERNEL_VERSION', 'v1.7.0'),
  QXK24_ERA_NAME:       optional('QXK24_ERA_NAME', 'The_Teaching_Era'),

  // Auth
  FOUNDER_SECRET_KEY:           optional('FOUNDER_SECRET_KEY'),
  QXK24_SERVICE_TOKEN:          optional('QXK24_SERVICE_TOKEN'),
  QXK24_PRODUCTION_BEARER_TOKEN: optional('QXK24_PRODUCTION_BEARER_TOKEN'),

  // Timeouts
  QXK24_SERVICE_TIMEOUT_MS: optionalInt('QXK24_SERVICE_TIMEOUT_MS', 5000),

  // CORS
  CORS_ORIGINS: optional(
    'CORS_ORIGINS',
    'https://qxk24.com,https://qiubbx.com,https://api.qiubbx.com'
  ),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS:   optionalInt('RATE_LIMIT_WINDOW_MS', 60000),
  RATE_LIMIT_MAX_REQUESTS: optionalInt('RATE_LIMIT_MAX_REQUESTS', 100),

  // Upload / request body size
  UPLOAD_MAX_FILE_MB,
  UPLOAD_MAX_FILE_BYTES: UPLOAD_MAX_FILE_MB * 1024 * 1024,
  UPLOAD_MAX_EXTRACT_CHARS,
  ADAM_MAX_MESSAGE_CHARS,
  ADAM_CHAT_TEACHING_CHARS,
  ADAM_CHAT_BRAIN_CHARS,
  ADAM_CHAT_HISTORY_MSG_CHARS,
  /** malay | english — default voice language when the speaker's language is unclear */
  ADAM_DEFAULT_LANGUAGE: optional('ADAM_DEFAULT_LANGUAGE', 'malay'),
  ADAM_UPLOAD_DIR: optional('ADAM_UPLOAD_DIR', 'uploads/adam'),

  // Cloudflare R2 (ADAM knowledge base)
  CLOUDFLARE_ACCOUNT_ID: optional('CLOUDFLARE_ACCOUNT_ID'),
  R2_ACCESS_KEY_ID:      optional('R2_ACCESS_KEY_ID'),
  R2_SECRET_ACCESS_KEY:  optional('R2_SECRET_ACCESS_KEY'),
  R2_BUCKET_NAME:        optional('R2_BUCKET_NAME', 'qxk24-adam-knowledge'),

  // Stack identity (production = Claude backup, lab = Qwen pilot)
  QXK24_STACK: optional('QXK24_STACK', 'production'),
  /** anthropic = production Claude | qwen = DashScope Lab */
  LLM_PROVIDER: optional('LLM_PROVIDER', 'anthropic') as 'anthropic' | 'qwen',

  // Monitoring
  SENTRY_DSN: optional('SENTRY_DSN'),
  ANTHROPIC_API_KEY: optional('ANTHROPIC_API_KEY'),
  /** @deprecated Use ANTHROPIC_MODEL_DEEP — kept for backward compatibility */
  ANTHROPIC_MODEL: optional('ANTHROPIC_MODEL', 'claude-sonnet-4-6'),
  ANTHROPIC_MODEL_DEEP: optional(
    'ANTHROPIC_MODEL_DEEP',
    optional('ANTHROPIC_MODEL', 'claude-sonnet-4-6'),
  ),
  ANTHROPIC_MODEL_FAST: optional('ANTHROPIC_MODEL_FAST', 'claude-haiku-4-5'),

  // Qwen / DashScope (Lab stack — same A, different engine)
  DASHSCOPE_API_KEY: optional('DASHSCOPE_API_KEY'),
  QWEN_API_BASE:     optional(
    'QWEN_API_BASE',
    'https://dashscope.aliyuncs.com/compatible-mode/v1',
  ),
  QWEN_MODEL_DEEP: optional('QWEN_MODEL_DEEP', 'qwen-plus'),
  QWEN_MODEL_FAST: optional('QWEN_MODEL_FAST', 'qwen-turbo'),
  QWEN_MODEL_VISION: optional('QWEN_MODEL_VISION', 'qwen-vl-max'),

  /** Student messages at or above this length use Sonnet (default 400) */
  ADAM_DEEP_MESSAGE_MIN_CHARS: optionalInt('ADAM_DEEP_MESSAGE_MIN_CHARS', 400),
  QXK24_SUCCESSION_ENCRYPTION_KEY: optional('QXK24_SUCCESSION_ENCRYPTION_KEY'),

  /** Qwen — DashScope web search (agent = model decides when, like Claude) */
  QWEN_ENABLE_SEARCH: optional('QWEN_ENABLE_SEARCH', 'true') === 'true',
  QWEN_SEARCH_STRATEGY: optional('QWEN_SEARCH_STRATEGY', 'agent'),
  QWEN_SEARCH_ENABLE_CITATION: optional('QWEN_SEARCH_ENABLE_CITATION', 'true') === 'true',
  /** Hybrid Qwen models — false skips reasoning phase for much faster replies */
  QWEN_ENABLE_THINKING: optional('QWEN_ENABLE_THINKING', 'false') === 'true',

  /** Verified Quran ayat corpus (Rasm Uthmani + MS + EN, no tafsir) */
  QURAN_CORPUS_ENABLED: optional('QURAN_CORPUS_ENABLED', 'true') === 'true',
  QURAN_CORPUS_PATH:      optional('QURAN_CORPUS_PATH', ''),

  // Derived
  IS_PRODUCTION:  process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV !== 'production'
} as const;

export type AppEnvironment = typeof ENV;