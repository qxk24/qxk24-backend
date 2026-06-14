/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Database Config
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

import mongoose from 'mongoose';
import { ENV } from './environments';
import { isStaleTopologyError } from './mongo-topology';

let isConnected = false;
let listenersRegistered = false;
let reconnectPromise: Promise<void> | null = null;

const MONGO_OPTIONS = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  family: 4 as const,
  /** BSON/UTF-8 — Arabic Quranic rasm and Malay prose stored natively (no manual Buffer). */
};

function registerConnectionListeners(): void {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[Alamtologi:DB] Disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.log('[Alamtologi:DB] Reconnected.');
  });

  mongoose.connection.on('error', (err) => {
    isConnected = false;
    console.error('[Alamtologi:DB] Error:', err.message);
    if (isStaleTopologyError(err)) {
      void reconnectDatabase().catch((e) => {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[Alamtologi:DB] Auto-reconnect after stale topology failed:', msg);
      });
    }
  });
}

async function openMongoConnection(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(ENV.MONGODB_URI, MONGO_OPTIONS);
  isConnected = true;
  console.log(
    `[Alamtologi:DB] Connected — ${ENV.QXK24_KERNEL_VERSION} | ${ENV.QXK24_ERA}`,
  );
}

/** Drop pool and reconnect — used after Atlas migration / election mismatch. */
export async function reconnectDatabase(): Promise<void> {
  if (reconnectPromise) return reconnectPromise;

  reconnectPromise = (async () => {
    console.warn('[Alamtologi:DB] Stale topology detected — disconnecting and reconnecting...');
    await mongoose.disconnect().catch(() => undefined);
    isConnected = false;
    await openMongoConnection();
    console.log('[Alamtologi:DB] Reconnected after stale topology := 1');
  })().finally(() => {
    reconnectPromise = null;
  });

  return reconnectPromise;
}

export async function connectDatabase(options?: { force?: boolean }): Promise<void> {
  const live = mongoose.connection.readyState === 1;
  if (!options?.force && isConnected && live) {
    return;
  }

  if (options?.force || live === false) {
    await mongoose.disconnect().catch(() => undefined);
    isConnected = false;
  }

  try {
    registerConnectionListeners();
    await openMongoConnection();
  } catch (error) {
    isConnected = false;
    const msg = error instanceof Error ? error.message : String(error);
    if (isStaleTopologyError(error)) {
      console.warn('[Alamtologi:DB] Connect failed with stale topology — retrying once...');
      await reconnectDatabase();
      return;
    }
    console.error('[Alamtologi:DB] Connection failed:', msg);
    throw error;
  }
}

/** Retry once after reconnect when Atlas electionId / setVersion drifts. */
export async function withMongoRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isStaleTopologyError(error)) throw error;
    await reconnectDatabase();
    return await fn();
  }
}

export function getDatabaseStatus(): {
  connected: boolean;
  state: string;
} {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized',
  };

  return {
    connected: isConnected && mongoose.connection.readyState === 1,
    state: states[mongoose.connection.readyState] ?? 'unknown',
  };
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    isConnected = false;
    return;
  }
  await mongoose.disconnect();
  isConnected = false;
  console.log('[Alamtologi:DB] Disconnected cleanly.');
}

export { isStaleTopologyError } from './mongo-topology';
