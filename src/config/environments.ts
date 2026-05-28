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

// Resolve .env from repo root or from inside qxk24-backend
function resolveEnvPath(): string {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env')
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return path.resolve(process.cwd(), '.env');
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

  // Monitoring
  SENTRY_DSN: optional('SENTRY_DSN'),
  ANTHROPIC_API_KEY: optional('ANTHROPIC_API_KEY'),
  ANTHROPIC_MODEL: optional('ANTHROPIC_MODEL', 'claude-sonnet-4-6'),
  QXK24_SUCCESSION_ENCRYPTION_KEY: optional('QXK24_SUCCESSION_ENCRYPTION_KEY'),

  // Derived
  IS_PRODUCTION:  process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV !== 'production'
} as const;

export type AppEnvironment = typeof ENV;