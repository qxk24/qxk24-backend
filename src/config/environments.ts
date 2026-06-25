/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
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

function optionalFloat(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const UPLOAD_MAX_FILE_MB = optionalInt('UPLOAD_MAX_FILE_MB', 50);
const UPLOAD_MAX_EXTRACT_CHARS = optionalInt('UPLOAD_MAX_EXTRACT_CHARS', 120000);
/** Cap PDF pages parsed in-process (prevents pdf.js heap blow-ups on scan-heavy PDFs). */
const UPLOAD_PDF_MAX_PAGES = optionalInt('UPLOAD_PDF_MAX_PAGES', 8);
/** DOCX/PPTX mammoth/JSZip parse above this size in RAM often OOMs — reject with a clear message. */
const UPLOAD_OFFICE_PARSE_MAX_MB = optionalInt('UPLOAD_OFFICE_PARSE_MAX_MB', 50);
/** PDF text extraction ceiling in child process (fail fast before pdf.js allocates). */
const UPLOAD_PDF_PARSE_MAX_MB = optionalInt('UPLOAD_PDF_PARSE_MAX_MB', 40);
/** Max characters accepted in chat JSON (truncated server-side if longer) */
const ADAM_MAX_MESSAGE_CHARS = optionalInt('ADAM_MAX_MESSAGE_CHARS', 80_000);
/** Teaching/upload text injected into a single chat turn */
const ADAM_CHAT_TEACHING_CHARS = optionalInt('ADAM_CHAT_TEACHING_CHARS', 48_000);
/** Alamtologi Brain summary in chat context */
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
    'mongodb://localhost:27017/alamtologi'
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
    'https://alamtologi.com,https://www.alamtologi.com,https://qxk24.com,https://www.qxk24.com,https://qiubbx.com,https://api.qiubbx.com',
  ),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS:   optionalInt('RATE_LIMIT_WINDOW_MS', 60000),
  RATE_LIMIT_MAX_REQUESTS: optionalInt('RATE_LIMIT_MAX_REQUESTS', 100),

  // Upload / request body size
  UPLOAD_MAX_FILE_MB,
  UPLOAD_MAX_FILE_BYTES: UPLOAD_MAX_FILE_MB * 1024 * 1024,
  UPLOAD_MAX_EXTRACT_CHARS,
  UPLOAD_PDF_MAX_PAGES,
  UPLOAD_PDF_PARSE_MAX_MB,
  UPLOAD_PDF_PARSE_MAX_BYTES: UPLOAD_PDF_PARSE_MAX_MB * 1024 * 1024,
  UPLOAD_OFFICE_PARSE_MAX_MB,
  UPLOAD_OFFICE_PARSE_MAX_BYTES: UPLOAD_OFFICE_PARSE_MAX_MB * 1024 * 1024,
  ADAM_MAX_MESSAGE_CHARS,
  ADAM_CHAT_TEACHING_CHARS,
  ADAM_CHAT_BRAIN_CHARS,
  ADAM_CHAT_HISTORY_MSG_CHARS,
  /** malay | english — default voice language when the speaker's language is unclear */
  ADAM_DEFAULT_LANGUAGE: optional('ADAM_DEFAULT_LANGUAGE', 'english'),
  /** Allow public POST /api/adam/student/register */
  ADAM_STUDENT_SELF_REGISTER: optional('ADAM_STUDENT_SELF_REGISTER', 'true') === 'true',
  /** When set, self-register requires this code */
  ADAM_STUDENT_REGISTER_CODE: optional('ADAM_STUDENT_REGISTER_CODE', ''),
  ADAM_STUDENT_REGISTER_MAX:  optionalInt('ADAM_STUDENT_REGISTER_MAX', 200),

  /** VIP tester cohort cap (active TESTER subscriptions) */
  ADAM_TESTER_COHORT_MAX:   optionalInt('ADAM_TESTER_COHORT_MAX', 100),
  /** Public POST /api/adam/tester/apply */
  ADAM_TESTER_APPLY_ENABLED: optional('ADAM_TESTER_APPLY_ENABLED', 'false') === 'true',

  /** Google Sign-In (students) — same client ID as web NEXT_PUBLIC_GOOGLE_CLIENT_ID */
  GOOGLE_OAUTH_CLIENT_ID:       optional('GOOGLE_OAUTH_CLIENT_ID', ''),
  ADAM_GOOGLE_SIGNIN_ENABLED:   optional('ADAM_GOOGLE_SIGNIN_ENABLED', 'false') === 'true',
  GOOGLE_ALLOWED_EMAIL_DOMAINS: optional('GOOGLE_ALLOWED_EMAIL_DOMAINS', ''),

  /** Password reset email (Resend) */
  RESEND_API_KEY:                 optional('RESEND_API_KEY', ''),
  MAIL_FROM:                        optional('MAIL_FROM', 'Alamtologi <info@alamtologi.com>'),
  MAIL_REPLY_TO:                    optional('MAIL_REPLY_TO', 'info@alamtologi.com'),
  ADAM_WEB_BASE_URL:                optional('ADAM_WEB_BASE_URL', 'https://alamtologi.com'),
  /** Public web URL for subscription checkout redirects */
  APP_URL:                          optional('APP_URL', optional('ADAM_WEB_BASE_URL', 'https://alamtologi.com')),
  ADAM_PASSWORD_RESET_ENABLED:      optional('ADAM_PASSWORD_RESET_ENABLED', 'true') === 'true',
  ADAM_PASSWORD_RESET_TTL_MINUTES:  optionalInt('ADAM_PASSWORD_RESET_TTL_MINUTES', 60),

  ADAM_UPLOAD_DIR: optional('ADAM_UPLOAD_DIR', 'uploads/adam'),

  // Cloudflare R2 (ADAM knowledge base)
  CLOUDFLARE_ACCOUNT_ID: optional('CLOUDFLARE_ACCOUNT_ID'),
  R2_ACCESS_KEY_ID:      optional('R2_ACCESS_KEY_ID'),
  R2_SECRET_ACCESS_KEY:  optional('R2_SECRET_ACCESS_KEY'),
  R2_BUCKET_NAME:        optional('R2_BUCKET_NAME', 'qxk24-adam-knowledge'),
  /** Optional public CDN base for generated media (else served via /api/adam/media/generated). */
  R2_PUBLIC_BASE_URL:    optional('R2_PUBLIC_BASE_URL', ''),

  // Cloudinary — founder blog media (images + video)
  CLOUDINARY_CLOUD_NAME:   optional('CLOUDINARY_CLOUD_NAME', ''),
  CLOUDINARY_API_KEY:      optional('CLOUDINARY_API_KEY', ''),
  CLOUDINARY_API_SECRET:   optional('CLOUDINARY_API_SECRET', ''),
  CLOUDINARY_BLOG_FOLDER:  optional('CLOUDINARY_BLOG_FOLDER', 'alamtologi/blog'),
  BLOG_IMAGE_MAX_MB:       optionalInt('BLOG_IMAGE_MAX_MB', 15),
  BLOG_VIDEO_MAX_MB:       optionalInt('BLOG_VIDEO_MAX_MB', 100),

  // Stack identity (production + lab — both Qwen; separate DB/brain per stack)
  QXK24_STACK: optional('QXK24_STACK', 'production'),
  /** Qwen / DashScope only — single LLM engine for all stacks */
  LLM_PROVIDER: 'qwen' as const,

  // Monitoring
  SENTRY_DSN: optional('SENTRY_DSN'),

  /** Lab DB URI — production stack only; for POST /api/adam/students/import-lab-memory */
  LAB_MONGODB_URI: optional('LAB_MONGODB_URI'),

  // Qwen / DashScope — ADAM engine (production + lab)
  DASHSCOPE_API_KEY: optional('DASHSCOPE_API_KEY'),
  QWEN_API_BASE:     optional(
    'QWEN_API_BASE',
    'https://dashscope.aliyuncs.com/compatible-mode/v1',
  ),
  QWEN_MODEL_DEEP: optional('QWEN_MODEL_DEEP', 'qwen-plus'),
  QWEN_MODEL_FAST: optional('QWEN_MODEL_FAST', 'qwen-turbo'),
  QWEN_MODEL_VISION: optional('QWEN_MODEL_VISION', 'qwen-vl-max'),

  /** Student messages at or above this length use deep model (default 400) */
  ADAM_DEEP_MESSAGE_MIN_CHARS: optionalInt('ADAM_DEEP_MESSAGE_MIN_CHARS', 400),

  // ─── ADAM memory & output tokens — NEVER CHANGE THE SETTING (Founder approval only) ───
  // See .cursor/rules/adam-memory-sacred-settings.mdc
  /** Max output tokens — full journal manuscripts (IMRaD + seal JSON) */
  ADAM_JOURNAL_MAX_TOKENS: optionalInt('ADAM_JOURNAL_MAX_TOKENS', 8192),
  /** Max output tokens — founder deep / teaching turns */
  ADAM_FOUNDER_DEEP_MAX_TOKENS: optionalInt('ADAM_FOUNDER_DEEP_MAX_TOKENS', 8192),
  /** Max output tokens — student deep turns */
  /** Default 8192 — deep Users turns use ADAM_FOUNDER_DEEP_MAX_TOKENS in resolveAdamMaxTokens */
  ADAM_STUDENT_DEEP_MAX_TOKENS: optionalInt('ADAM_STUDENT_DEEP_MAX_TOKENS', 8192),
  /** Qwen turbo — minimum 4096; never reduce for “speed” (robotic truncated replies) */
  ADAM_QWEN_FAST_MAX_TOKENS: optionalInt('ADAM_QWEN_FAST_MAX_TOKENS', 4096),
  QXK24_SUCCESSION_ENCRYPTION_KEY: optional('QXK24_SUCCESSION_ENCRYPTION_KEY'),

  /**
   * Legacy telemetry flag — student factual turns always use search-first prefetch
   * when the web-search gate is open (see adam-search-first.ts). Does not change
   * memory or output token limits.
   */
  ADAM_STUDENT_INLINE_SEARCH: optional('ADAM_STUDENT_INLINE_SEARCH', 'false') === 'true',
  /** Unified transform engine — inquiry channel grows Brain C from student questions */
  ADAM_UNIFIED_TRANSFORM: optional('ADAM_UNIFIED_TRANSFORM', 'true') === 'true',
  ADAM_INQUIRY_TRANSFORM: optional('ADAM_INQUIRY_TRANSFORM', 'true') === 'true',
  /** P4 — gated audit merge of inquiry C into master.unifiedUnderstanding (default off) */
  ADAM_INQUIRY_MASTER_MERGE: optional('ADAM_INQUIRY_MASTER_MERGE', 'false') === 'true',

  /** DashScope web search (agent = model decides when to search) */
  QWEN_ENABLE_SEARCH: optional('QWEN_ENABLE_SEARCH', 'true') === 'true',
  QWEN_SEARCH_STRATEGY: optional('QWEN_SEARCH_STRATEGY', 'agent'),
  QWEN_SEARCH_ENABLE_CITATION: optional('QWEN_SEARCH_ENABLE_CITATION', 'true') === 'true',
  /**
   * Optional native DashScope host for prefetch search only (not chat completions).
   * Example: https://dashscope.aliyuncs.com or https://dashscope-intl.aliyuncs.com
   */
  QWEN_SEARCH_NATIVE_HOST: optional('QWEN_SEARCH_NATIVE_HOST', ''),
  /** Second native host to try when primary returns 0 search hits (region-scoped API keys). */
  QWEN_SEARCH_FALLBACK_NATIVE_HOST: optional('QWEN_SEARCH_FALLBACK_NATIVE_HOST', ''),
  /** Native SSE prefetch — prepend_search_result surfaces hits in first SSE chunk. */
  QWEN_SEARCH_PREPEND_RESULTS: optional('QWEN_SEARCH_PREPEND_RESULTS', 'true') === 'true',
  /** Hybrid Qwen models — false skips reasoning phase for much faster replies */
  QWEN_ENABLE_THINKING: optional('QWEN_ENABLE_THINKING', 'false') === 'true',

  /**
   * Optional DashScope content-inspection override (requires Alibaba account whitelist).
   * Example: {"input":"disable","output":"disable"} or {"input":"cip","output":"cip"}
   */
  QWEN_DATA_INSPECTION: optional('QWEN_DATA_INSPECTION', ''),

  /** Verified Quran ayat corpus (Rasm Uthmani + Pickthall EN, no tafsir) */
  QURAN_CORPUS_ENABLED: optional('QURAN_CORPUS_ENABLED', 'true') === 'true',
  QURAN_CORPUS_PATH:      optional('QURAN_CORPUS_PATH', ''),

  /** Curated BM Malaysia lexicon — on-demand prompt injection + post-stream guard */
  BM_LEXICON_ENABLED: optional('BM_LEXICON_ENABLED', 'true') === 'true',
  BM_LEXICON_PATH:      optional('BM_LEXICON_PATH', ''),

  // ─── Subscriptions & Payments (optional until provider keys are set) ───
  /** Stripe — sole payment gateway (Founder policy) */
  STRIPE_SECRET_KEY:        optional('STRIPE_SECRET_KEY', ''),
  STRIPE_PUBLISHABLE_KEY:   optional('STRIPE_PUBLISHABLE_KEY', ''),
  STRIPE_WEBHOOK_SECRET:    optional('STRIPE_WEBHOOK_SECRET', ''),
  /** Flip to true when Stripe keys and price IDs are set in .env */
  STRIPE_ENABLED:           optional('STRIPE_ENABLED', 'false') === 'true',

  /** Pro — $19 USD/month (public name). Prefer STRIPE_PRICE_ID_PRO_* over legacy PELAJAR keys. */
  STRIPE_PRICE_ID_PRO_MONTHLY:         optional('STRIPE_PRICE_ID_PRO_MONTHLY', ''),
  STRIPE_PRICE_ID_PRO_ANNUAL:          optional('STRIPE_PRICE_ID_PRO_ANNUAL', ''),
  /** @deprecated use STRIPE_PRICE_ID_PRO_MONTHLY */
  STRIPE_PRICE_ID_PELAJAR_MONTHLY:     optional('STRIPE_PRICE_ID_PELAJAR_MONTHLY', ''),
  /** @deprecated use STRIPE_PRICE_ID_PRO_ANNUAL */
  STRIPE_PRICE_ID_PELAJAR_ANNUAL:      optional('STRIPE_PRICE_ID_PELAJAR_ANNUAL', ''),
  /** Premium — $75 USD/month (maps to PROFESIONAL tier) */
  STRIPE_PRICE_ID_PROFESIONAL_MONTHLY: optional('STRIPE_PRICE_ID_PROFESIONAL_MONTHLY', ''),
  /** Profesional annual — RM 4500/year MYR */
  STRIPE_PRICE_ID_PROFESIONAL_ANNUAL:  optional('STRIPE_PRICE_ID_PROFESIONAL_ANNUAL', ''),

  /** ADAMGuru Layer 2 — MYR monthly (create in Stripe → paste price_… IDs) */
  STRIPE_PRICE_ID_GURU_STARTER_MONTHLY:      optional('STRIPE_PRICE_ID_GURU_STARTER_MONTHLY', ''),
  STRIPE_PRICE_ID_GURU_PROFESSIONAL_MONTHLY: optional('STRIPE_PRICE_ID_GURU_PROFESSIONAL_MONTHLY', ''),
  STRIPE_PRICE_ID_GURU_INSTITUTION_MONTHLY:  optional('STRIPE_PRICE_ID_GURU_INSTITUTION_MONTHLY', ''),
  STRIPE_PRICE_ID_GURU_STUDENT_KELAS_MONTHLY: optional('STRIPE_PRICE_ID_GURU_STUDENT_KELAS_MONTHLY', ''),
  /** ADAM Tutor — school level monthly (Stripe price_… IDs) */
  STRIPE_PRICE_ID_TUTOR_PRIMARY_PUBLIC_MONTHLY:    optional('STRIPE_PRICE_ID_TUTOR_PRIMARY_PUBLIC_MONTHLY', ''),
  STRIPE_PRICE_ID_TUTOR_SECONDARY_PUBLIC_MONTHLY:  optional('STRIPE_PRICE_ID_TUTOR_SECONDARY_PUBLIC_MONTHLY', ''),
  STRIPE_PRICE_ID_TUTOR_UNIVERSITY_PUBLIC_MONTHLY: optional('STRIPE_PRICE_ID_TUTOR_UNIVERSITY_PUBLIC_MONTHLY', ''),
  STRIPE_PRICE_ID_TUTOR_PRIMARY_AGENT_MONTHLY:    optional('STRIPE_PRICE_ID_TUTOR_PRIMARY_AGENT_MONTHLY', ''),
  STRIPE_PRICE_ID_TUTOR_SECONDARY_AGENT_MONTHLY:  optional('STRIPE_PRICE_ID_TUTOR_SECONDARY_AGENT_MONTHLY', ''),
  STRIPE_PRICE_ID_TUTOR_UNIVERSITY_AGENT_MONTHLY: optional('STRIPE_PRICE_ID_TUTOR_UNIVERSITY_AGENT_MONTHLY', ''),
  /** @deprecated Agent channel — use STRIPE_PRICE_ID_TUTOR_*_AGENT_MONTHLY */
  STRIPE_PRICE_ID_TUTOR_PRIMARY_MONTHLY:    optional('STRIPE_PRICE_ID_TUTOR_PRIMARY_MONTHLY', ''),
  STRIPE_PRICE_ID_TUTOR_SECONDARY_MONTHLY:  optional('STRIPE_PRICE_ID_TUTOR_SECONDARY_MONTHLY', ''),
  STRIPE_PRICE_ID_TUTOR_UNIVERSITY_MONTHLY: optional('STRIPE_PRICE_ID_TUTOR_UNIVERSITY_MONTHLY', ''),
  /** Legacy — maps to secondary agent if STRIPE_PRICE_ID_TUTOR_SECONDARY_AGENT unset */
  STRIPE_PRICE_ID_TUTOR_MONTHLY: optional('STRIPE_PRICE_ID_TUTOR_MONTHLY', ''),
  /** ADAM Tutor ejen wholesale — one-time MYR package (12 prices: 3 bands × 4 tiers) */
  STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_SILVER:     optional('STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_SILVER', ''),
  STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_GOLD:       optional('STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_GOLD', ''),
  STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_DIAMOND:    optional('STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_DIAMOND', ''),
  STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_PLATINUM:  optional('STRIPE_PRICE_ID_TUTOR_EJEN_PRIMARY_PLATINUM', ''),
  STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_SILVER:   optional('STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_SILVER', ''),
  STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_GOLD:     optional('STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_GOLD', ''),
  STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_DIAMOND:  optional('STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_DIAMOND', ''),
  STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_PLATINUM: optional('STRIPE_PRICE_ID_TUTOR_EJEN_SECONDARY_PLATINUM', ''),
  STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_SILVER:   optional('STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_SILVER', ''),
  STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_GOLD:     optional('STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_GOLD', ''),
  STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_DIAMOND:  optional('STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_DIAMOND', ''),
  STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_PLATINUM: optional('STRIPE_PRICE_ID_TUTOR_EJEN_UNIVERSITY_PLATINUM', ''),
  /** R&D Eksklusif & Applied Science — annual USD (docs/STRIPE_RD_APPLIED_PRICES.md) */
  STRIPE_PRICE_ID_RD_IND_SOLO_ANNUAL:        optional('STRIPE_PRICE_ID_RD_IND_SOLO_ANNUAL', ''),
  STRIPE_PRICE_ID_RD_GRAD_SOLO_ANNUAL:       optional('STRIPE_PRICE_ID_RD_GRAD_SOLO_ANNUAL', ''),
  STRIPE_PRICE_ID_RD_GRAD_EDU_ANNUAL:        optional('STRIPE_PRICE_ID_RD_GRAD_EDU_ANNUAL', ''),
  STRIPE_PRICE_ID_RD_LAB_5_ANNUAL:           optional('STRIPE_PRICE_ID_RD_LAB_5_ANNUAL', ''),
  STRIPE_PRICE_ID_AS_IND_SOLO_ANNUAL:        optional('STRIPE_PRICE_ID_AS_IND_SOLO_ANNUAL', ''),
  STRIPE_PRICE_ID_AS_LAB_5_ANNUAL:           optional('STRIPE_PRICE_ID_AS_LAB_5_ANNUAL', ''),
  STRIPE_PRICE_ID_BUNDLE_IND_AS_SOLO_ANNUAL: optional('STRIPE_PRICE_ID_BUNDLE_IND_AS_SOLO_ANNUAL', ''),
  STRIPE_PRICE_ID_BUNDLE_IND_AS_LAB_ANNUAL:  optional('STRIPE_PRICE_ID_BUNDLE_IND_AS_LAB_ANNUAL', ''),
  /** ADAM Niaga trader seat — MYR monthly / annual */
  STRIPE_PRICE_ID_NIAGA_SEAT_MONTHLY: optional('STRIPE_PRICE_ID_NIAGA_SEAT_MONTHLY', ''),
  STRIPE_PRICE_ID_NIAGA_SEAT_ANNUAL:  optional('STRIPE_PRICE_ID_NIAGA_SEAT_ANNUAL', ''),
  /** When false, Niaga chat works without paid sub after partner approval (lab / pre-Stripe). */
  ADAM_NIAGA_BILLING_REQUIRED: optional('ADAM_NIAGA_BILLING_REQUIRED', 'false') === 'true',
  /** When false, tutor chat works without paid sub (lab / pre-Stripe). Production: true when Stripe live. */
  ADAM_TUTOR_BILLING_REQUIRED: optional('ADAM_TUTOR_BILLING_REQUIRED', 'false') === 'true',
  /** When geo headers are missing — default PPP region (production: MY). */
  ADAM_DEFAULT_PRICING_REGION: optional('ADAM_DEFAULT_PRICING_REGION', 'MY'),

  /** @deprecated Legacy — not used; Stripe is sole gateway */
  RAZORPAY_KEY_ID:              optional('RAZORPAY_KEY_ID', ''),
  RAZORPAY_KEY_SECRET:          optional('RAZORPAY_KEY_SECRET', ''),
  RAZORPAY_WEBHOOK_SECRET:      optional('RAZORPAY_WEBHOOK_SECRET', ''),
  RAZORPAY_PLAN_ID_PELAJAR:     optional('RAZORPAY_PLAN_ID_PELAJAR', ''),
  RAZORPAY_PLAN_ID_PROFESIONAL: optional('RAZORPAY_PLAN_ID_PROFESIONAL', ''),

  /** @deprecated Legacy — not used */
  XENDIT_SECRET_KEY:     optional('XENDIT_SECRET_KEY', ''),
  XENDIT_CALLBACK_TOKEN: optional('XENDIT_CALLBACK_TOKEN', ''),

  /** @deprecated Legacy — not used */
  PAYSTACK_SECRET_KEY: optional('PAYSTACK_SECRET_KEY', ''),

  /** @deprecated Legacy — not used */
  PADDLE_API_KEY: optional('PADDLE_API_KEY', ''),

  /** Freemium — guest lifetime + rolling/daily caps (MY timezone where applicable) */
  ADAM_FREEMIUM_ENABLED:        optional('ADAM_FREEMIUM_ENABLED', 'true') === 'true',
  ADAM_FREEMIUM_PUBLIC_ENABLED: optional('ADAM_FREEMIUM_PUBLIC_ENABLED', 'true') === 'true',
  ADAM_FREEMIUM_GUEST_LIMIT:    optionalInt('ADAM_FREEMIUM_GUEST_LIMIT', 3),
  /** @deprecated Use ADAM_FREEMIUM_FREE_ROLLING — Basic tier is rolling 5-hour window */
  ADAM_FREEMIUM_FREE_DAILY:     optionalInt('ADAM_FREEMIUM_FREE_DAILY', 20),
  /** Basic (free registered) — questions per rolling window */
  ADAM_FREEMIUM_FREE_ROLLING:   optionalInt('ADAM_FREEMIUM_FREE_ROLLING', 4),
  /** Rolling window length (hours) — Claude-style pacing for Basic & Profesional */
  ADAM_FREEMIUM_ROLLING_WINDOW_HOURS: optionalInt('ADAM_FREEMIUM_ROLLING_WINDOW_HOURS', 5),
  /** @deprecated Premium uses monthly quota — see ADAM_FREEMIUM_PELAJAR_MONTHLY */
  ADAM_FREEMIUM_PELAJAR_DAILY:  optionalInt('ADAM_FREEMIUM_PELAJAR_DAILY', 100),
  /** Premium — included questions per calendar month (MY timezone) */
  ADAM_FREEMIUM_PELAJAR_MONTHLY: optionalInt('ADAM_FREEMIUM_PELAJAR_MONTHLY', 50),
  /** Premium — max included questions per calendar day (pace cap; wallet credits bypass) */
  ADAM_FREEMIUM_PELAJAR_DAILY_SOFT: optionalInt('ADAM_FREEMIUM_PELAJAR_DAILY_SOFT', 5),
  /** Profesional — questions per rolling window */
  ADAM_FREEMIUM_PROFESIONAL_ROLLING: optionalInt('ADAM_FREEMIUM_PROFESIONAL_ROLLING', 18),
  ADAM_FREEMIUM_CREDIT_PACK_SIZE: optionalInt('ADAM_FREEMIUM_CREDIT_PACK_SIZE', 25),
  ADAM_FREEMIUM_TIMEZONE:       optional('ADAM_FREEMIUM_TIMEZONE', 'Asia/Kuala_Lumpur'),
  /** Consumer plan — Free 20/day, Pro 100/day + USD wallet */
  ADAM_CONSUMER_DAILY_PLAN:     optional('ADAM_CONSUMER_DAILY_PLAN', 'true') === 'true',
  ADAM_FREEMIUM_PRO_DAILY:      optionalInt('ADAM_FREEMIUM_PRO_DAILY', 100),
  ADAM_EXTRA_MESSAGE_COST_CENTS: optionalInt('ADAM_EXTRA_MESSAGE_COST_CENTS', 12),
  ADAM_PRO_MONTHLY_USD:         optionalInt('ADAM_PRO_MONTHLY_USD', 19),
  ADAM_PRO_ANNUAL_USD:          optionalInt('ADAM_PRO_ANNUAL_USD', 200),
  ADAM_PREMIUM_MONTHLY_USD:     optionalInt('ADAM_PREMIUM_MONTHLY_USD', 75),
  ADAM_PREMIUM_ANNUAL_USD:      optionalInt('ADAM_PREMIUM_ANNUAL_USD', 800),
  /** ADAM Tutor public checkout — USD monthly by school level */
  ADAM_TUTOR_PRIMARY_PUBLIC_MONTHLY_USD:    optionalInt('ADAM_TUTOR_PRIMARY_PUBLIC_MONTHLY_USD', 25),
  ADAM_TUTOR_SECONDARY_PUBLIC_MONTHLY_USD:  optionalInt('ADAM_TUTOR_SECONDARY_PUBLIC_MONTHLY_USD', 33),
  ADAM_TUTOR_UNIVERSITY_PUBLIC_MONTHLY_USD: optionalInt('ADAM_TUTOR_UNIVERSITY_PUBLIC_MONTHLY_USD', 45),
  /** ADAM Tutor agent/kod-daftar — flat USD/month (all bands). Override per band only if needed. */
  ADAM_TUTOR_AGENT_MONTHLY_USD:            optionalFloat('ADAM_TUTOR_AGENT_MONTHLY_USD', 15.90),
  ADAM_TUTOR_PRIMARY_AGENT_MONTHLY_USD:    optionalFloat('ADAM_TUTOR_PRIMARY_AGENT_MONTHLY_USD', 0),
  ADAM_TUTOR_SECONDARY_AGENT_MONTHLY_USD:  optionalFloat('ADAM_TUTOR_SECONDARY_AGENT_MONTHLY_USD', 0),
  ADAM_TUTOR_UNIVERSITY_AGENT_MONTHLY_USD: optionalFloat('ADAM_TUTOR_UNIVERSITY_AGENT_MONTHLY_USD', 0),
  /** @deprecated Use ADAM_TUTOR_*_PUBLIC_MONTHLY_USD — legacy alias for public */
  ADAM_TUTOR_PRIMARY_MONTHLY_USD:    optionalInt('ADAM_TUTOR_PRIMARY_MONTHLY_USD', 0),
  ADAM_TUTOR_SECONDARY_MONTHLY_USD:  optionalInt('ADAM_TUTOR_SECONDARY_MONTHLY_USD', 0),
  ADAM_TUTOR_UNIVERSITY_MONTHLY_USD: optionalInt('ADAM_TUTOR_UNIVERSITY_MONTHLY_USD', 0),
  /** USD → MYR display rate for closed Tutor channel (Malaysia) */
  ADAM_USD_MYR_RATE: optionalFloat('ADAM_USD_MYR_RATE', 0),
  /** Cache TTL for live USD/MYR fetch (ms). Default 15 min. */
  ADAM_USD_MYR_CACHE_MS: optionalInt('ADAM_USD_MYR_CACHE_MS', 900_000),
  STRIPE_PRICE_ID_CREDITS_50:   optional('STRIPE_PRICE_ID_CREDITS_50', ''),
  STRIPE_PRICE_ID_CREDITS_250:  optional('STRIPE_PRICE_ID_CREDITS_250', ''),
  STRIPE_PRICE_ID_CREDITS_1000: optional('STRIPE_PRICE_ID_CREDITS_1000', ''),

  /**
   * Layer 2 — ADAM Jurnal / Kod servers.
   * false = Lapisan 1 chat-only fully open; server output gated (testing).
   * true  = open server subscriptions after full QA (Founder enables on VPS).
   */
  ADAM_LAYER2_ENABLED: optional('ADAM_LAYER2_ENABLED', 'false') === 'true',

  // ADAM Builder (lab stack — Qwen + qxk24-mcp)
  ADAM_BUILDER_ENABLED: optional('ADAM_BUILDER_ENABLED', 'false') === 'true',
  /** Monorepo root on the host running lab PM2 (for MCP child process) */
  QXK24_ROOT: optional('QXK24_ROOT', ''),
  /** Override path to qxk24-mcp/build/index.js */
  ADAM_BUILDER_MCP_PATH: optional('ADAM_BUILDER_MCP_PATH', ''),
  ADAM_BUILDER_API_URL: optional('ADAM_BUILDER_API_URL', ''),
  ADAM_BUILDER_ALLOWED_WRITE_DIRS: optional(
    'ADAM_BUILDER_ALLOWED_WRITE_DIRS',
    'qxk24-backend/src,qxk24-web/app,qxk24-web/components,qxk24-web/hooks,qxk24-web/lib,docs,qxk24-mcp/src',
  ),
  /** HOME for MCP git child (credential store lives here) */
  ADAM_GIT_HOME: optional('ADAM_GIT_HOME', '/root'),
  /** Optional SSH deploy key path for git_push */
  ADAM_GIT_SSH_KEY: optional('ADAM_GIT_SSH_KEY', ''),

  /** HAWA — ADAM's auditor partner (lab builder checkpoints) */
  HAWA_ENABLED: optional('HAWA_ENABLED', 'true') === 'true',

  /** ADAM Gateway (qxk24-adam) — Plas Point-1 prescan for production chat */
  ADAM_GATEWAY_URL: optional('ADAM_GATEWAY_URL', 'http://127.0.0.1:4010'),
  ADAM_GATEWAY_PLAS_ENABLED: optional('ADAM_GATEWAY_PLAS_ENABLED', 'false') === 'true',
  ADAM_GATEWAY_TIMEOUT_MS: optionalInt('ADAM_GATEWAY_TIMEOUT_MS', 8000),
  /** When true, block Users turns if gateway prescan is unreachable */
  ADAM_GATEWAY_PLAS_FAIL_CLOSED: optional('ADAM_GATEWAY_PLAS_FAIL_CLOSED', 'false') === 'true',

  /** Device Bridge — route Builder MCP through subscriber local daemon (alm-mcp mac-bridge) */
  ADAM_MAC_BRIDGE_ENABLED: optional('ADAM_MAC_BRIDGE_ENABLED', 'false') === 'true',

  /** Licensed stock / archive media APIs for ADAM technical chat (optional keys). */
  ADAM_PEXELS_API_KEY:      optional('ADAM_PEXELS_API_KEY', ''),
  ADAM_PIXABAY_API_KEY:     optional('ADAM_PIXABAY_API_KEY', ''),
  ADAM_UNSPLASH_ACCESS_KEY: optional('ADAM_UNSPLASH_ACCESS_KEY', ''),

  /** AI image/video generation (Wanx / DashScope) — off until ADAM_MEDIA_GENERATION_ENABLED=true on VPS */
  ADAM_MEDIA_GENERATION_ENABLED: optional('ADAM_MEDIA_GENERATION_ENABLED', 'false') === 'true',
  ADAM_WANX_IMAGE_MODEL:          optional('ADAM_WANX_IMAGE_MODEL', 'wanx2.1-t2i-turbo'),
  ADAM_WANX_VIDEO_MODEL:          optional('ADAM_WANX_VIDEO_MODEL', 'wan2.6-t2v'),
  ADAM_MEDIA_IMAGE_COST_CENTS:    optionalInt('ADAM_MEDIA_IMAGE_COST_CENTS', 25),
  ADAM_MEDIA_VIDEO_SECOND_COST_CENTS: optionalInt('ADAM_MEDIA_VIDEO_SECOND_COST_CENTS', 15),
  ADAM_MEDIA_MAX_VIDEO_SECONDS:   optionalInt('ADAM_MEDIA_MAX_VIDEO_SECONDS', 10),
  ADAM_MEDIA_IMAGE_MONTHLY_GUEST:       optionalInt('ADAM_MEDIA_IMAGE_MONTHLY_GUEST', 0),
  ADAM_MEDIA_IMAGE_MONTHLY_FREE:        optionalInt('ADAM_MEDIA_IMAGE_MONTHLY_FREE', 0),
  ADAM_MEDIA_IMAGE_MONTHLY_PRO:         optionalInt('ADAM_MEDIA_IMAGE_MONTHLY_PRO', 10),
  ADAM_MEDIA_IMAGE_MONTHLY_TUTOR:       optionalInt('ADAM_MEDIA_IMAGE_MONTHLY_TUTOR', 15),
  ADAM_MEDIA_IMAGE_MONTHLY_PROFESIONAL: optionalInt('ADAM_MEDIA_IMAGE_MONTHLY_PROFESIONAL', 25),
  ADAM_MEDIA_IMAGE_MONTHLY_ENTERPRISE:  optionalInt('ADAM_MEDIA_IMAGE_MONTHLY_ENTERPRISE', 100),
  ADAM_MEDIA_VIDEO_SECONDS_MONTHLY_GUEST:       optionalInt('ADAM_MEDIA_VIDEO_SECONDS_MONTHLY_GUEST', 0),
  ADAM_MEDIA_VIDEO_SECONDS_MONTHLY_FREE:        optionalInt('ADAM_MEDIA_VIDEO_SECONDS_MONTHLY_FREE', 0),
  ADAM_MEDIA_VIDEO_SECONDS_MONTHLY_PRO:         optionalInt('ADAM_MEDIA_VIDEO_SECONDS_MONTHLY_PRO', 15),
  ADAM_MEDIA_VIDEO_SECONDS_MONTHLY_TUTOR:       optionalInt('ADAM_MEDIA_VIDEO_SECONDS_MONTHLY_TUTOR', 30),
  ADAM_MEDIA_VIDEO_SECONDS_MONTHLY_PROFESIONAL: optionalInt('ADAM_MEDIA_VIDEO_SECONDS_MONTHLY_PROFESIONAL', 60),
  ADAM_MEDIA_VIDEO_SECONDS_MONTHLY_ENTERPRISE:  optionalInt('ADAM_MEDIA_VIDEO_SECONDS_MONTHLY_ENTERPRISE', 120),

  // Derived
  IS_PRODUCTION:  process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV !== 'production'
} as const;

export type AppEnvironment = typeof ENV;