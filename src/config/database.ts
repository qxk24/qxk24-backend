/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
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

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    console.log('[QXK24:DB] Already connected.');
    return;
  }

  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(ENV.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    });

    isConnected = true;

    console.log(
      `[QXK24:DB] Connected — ` +
      `${ENV.QXK24_KERNEL_VERSION} | ${ENV.QXK24_ERA}`
    );

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('[QXK24:DB] Disconnected.');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      console.log('[QXK24:DB] Reconnected.');
    });

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      console.error('[QXK24:DB] Error:', err.message);
    });

  } catch (error) {
    isConnected = false;
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[QXK24:DB] Connection failed:', msg);
    throw error;
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
    99: 'uninitialized'
  };

  return {
    connected: isConnected,
    state: states[mongoose.connection.readyState] ?? 'unknown'
  };
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[QXK24:DB] Disconnected cleanly.');
}