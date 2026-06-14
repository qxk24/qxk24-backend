/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Concurrent Access Guard (Layer 8)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Redis distributed lock — Mac + phone simultaneously: one waits, both process in order.
 */

import { AsyncLocalStorage } from 'async_hooks';
import { createClient, type RedisClientType } from 'redis';
import { ENV } from '../config/environments';
import { transformWithSnapshot } from './adam-snapshot.service';
import type { TeachingTransformContext } from './adam-teaching-record.service';

const lockDepth = new AsyncLocalStorage<{ founderId: string }>();

const LOCK_TIMEOUT_MS = parseInt(process.env.ADAM_LOCK_TIMEOUT_MS ?? '30000', 10) || 30_000;
const LOCK_POLL_MS = parseInt(process.env.ADAM_LOCK_POLL_MS ?? '100', 10) || 100;
const LOCK_MAX_ATTEMPTS = parseInt(process.env.ADAM_LOCK_MAX_ATTEMPTS ?? '50', 10) || 50;

let redisClient: RedisClientType | null = null;
let redisReady = false;
let redisInitAttempted = false;

interface MemoryLock {
  value:   string;
  expires: number;
}

const memoryLocks = new Map<string, MemoryLock>();

function lockKey(founderId: string): string {
  return `adam:lock:${founderId}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tryAcquireMemoryLock(key: string, value: string, timeoutMs: number): boolean {
  const now = Date.now();
  const existing = memoryLocks.get(key);
  if (existing && existing.expires > now && existing.value !== value) {
    return false;
  }
  memoryLocks.set(key, { value, expires: now + timeoutMs });
  return true;
}

function releaseMemoryLock(key: string, value: string): void {
  const existing = memoryLocks.get(key);
  if (existing?.value === value) {
    memoryLocks.delete(key);
  }
}

export async function connectConcurrencyRedis(): Promise<void> {
  if (redisInitAttempted) return;
  redisInitAttempted = true;

  if (!ENV.REDIS_URL) {
    console.warn('[ADAM Concurrency] REDIS_URL not set — using in-process lock (single instance only)');
    return;
  }

  try {
    redisClient = createClient({ url: ENV.REDIS_URL });
    redisClient.on('error', (err) => {
      console.error('[ADAM Concurrency] Redis error:', err.message);
      redisReady = false;
    });
    await redisClient.connect();
    redisReady = true;
    console.log('[ADAM Concurrency] Redis lock client connected');
  } catch (err) {
    console.error('[ADAM Concurrency] Redis connect failed — falling back to in-process lock:', err);
    redisClient = null;
    redisReady = false;
  }
}

export async function disconnectConcurrencyRedis(): Promise<void> {
  if (redisClient?.isOpen) {
    await redisClient.quit();
  }
  redisClient = null;
  redisReady = false;
}

async function acquireLock(
  founderId: string,
  lockValue: string,
  timeoutMs: number,
): Promise<boolean> {
  const key = lockKey(founderId);

  if (redisReady && redisClient?.isOpen) {
    const result = await redisClient.set(key, lockValue, { NX: true, PX: timeoutMs });
    return result === 'OK';
  }

  return tryAcquireMemoryLock(key, lockValue, timeoutMs);
}

async function releaseLock(founderId: string, lockValue: string): Promise<void> {
  const key = lockKey(founderId);

  if (redisReady && redisClient?.isOpen) {
    const currentValue = await redisClient.get(key);
    if (currentValue === lockValue) {
      await redisClient.del(key);
    }
    return;
  }

  releaseMemoryLock(key, lockValue);
}

async function runWithLock<T>(
  founderId: string,
  operation: () => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const lockValue = `${Date.now()}-${Math.random()}`;
  let acquired = false;
  let attempts = 0;

  while (!acquired && attempts < LOCK_MAX_ATTEMPTS) {
    acquired = await acquireLock(founderId, lockValue, timeoutMs);
    if (!acquired) {
      await sleep(LOCK_POLL_MS);
      attempts++;
    }
  }

  if (!acquired) {
    throw new Error(
      'Could not acquire memory lock — system is busy. Please try again.',
    );
  }

  try {
    return await lockDepth.run({ founderId }, operation);
  } finally {
    await releaseLock(founderId, lockValue);
  }
}

export async function withFounderLock<T>(
  founderId: string,
  operation: () => Promise<T>,
  timeoutMs = LOCK_TIMEOUT_MS,
): Promise<T> {
  if (lockDepth.getStore()?.founderId === founderId) {
    return operation();
  }
  return runWithLock(founderId, operation, timeoutMs);
}

export async function safeTransform(
  founderMessage: string,
  founderId = 'masa-bayu',
  context: TeachingTransformContext = {},
): Promise<Awaited<ReturnType<typeof transformWithSnapshot>>> {
  return withFounderLock(founderId, () => transformWithSnapshot(founderMessage, founderId, context));
}

export function getConcurrencyStatus(): {
  layer:           'LAYER_8_CONCURRENCY';
  redisConfigured: boolean;
  redisConnected:  boolean;
  lockTimeoutMs:   number;
  lockMaxWaitMs:   number;
} {
  return {
    layer:           'LAYER_8_CONCURRENCY',
    redisConfigured: Boolean(ENV.REDIS_URL),
    redisConnected:  redisReady,
    lockTimeoutMs:   LOCK_TIMEOUT_MS,
    lockMaxWaitMs:   LOCK_MAX_ATTEMPTS * LOCK_POLL_MS,
  };
}
