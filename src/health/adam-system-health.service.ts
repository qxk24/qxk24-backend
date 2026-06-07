/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM System Health (Pulse + Memory Ops)
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose from 'mongoose';
import { withMongoRetry } from '../config/database';
import { ENV } from '../config/environments';
import { FOUNDER_USER_ID } from '../adam/adam-student.types';
import { ADAMFounderSessionModel, ADAMMessageModel } from '../adam/adam.schema';
import { AdamTeachingRecordModel } from '../qxk24brain/adam-teaching-record.schema';
import { AdamUnresolvedHoldingModel } from '../qxk24brain/adam-unresolved.schema';
import { getContinuityBridgeRecord } from '../qxk24brain/adam-continuity.service';
import {
  checkMemoryHealthCached,
  resolvePrimaryFounderSessionId,
} from '../qxk24brain/adam-health.service';

export interface HealthCheck {
  status:    'ok' | 'warn' | 'fail';
  latencyMs: number;
  detail:    string;
}

export interface MemoryHealthReport {
  timestamp: string;
  overall:   'healthy' | 'degraded' | 'critical';
  checks: {
    mongodb:            HealthCheck;
    teachingRecords:    HealthCheck;
    continuityBridge:   HealthCheck;
    relationalArc:      HealthCheck;
    unresolvedHoldings: HealthCheck;
    sessionMemory:      HealthCheck;
  };
  pulse: {
    activeFounderSessions: number;
    teachingRecordsCount:  number;
    holdingsActive:        number;
    lastTransformation:    string | null;
    memoryLatencyMs:       number;
    constitutionalScore:   number | null;
    constitutionalStatus:  string | null;
  };
}

export interface SystemPulse {
  alive:     boolean;
  ts:        number;
  era:       string;
  memory:    string;
  voice:     string;
  providers: string[];
  stack:     string;
  kernel:    string;
  version:   string;
}

export function getSystemPulse(): SystemPulse {
  return {
    alive:     true,
    ts:        Date.now(),
    era:       ENV.QXK24_ERA,
    memory:    'live',
    voice:     'active',
    providers: ['qwen'],
    stack:     ENV.QXK24_STACK,
    kernel:    'ALAMTOLOGI',
    version:   ENV.QXK24_KERNEL_VERSION,
  };
}

async function checkMongoDB(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await withMongoRetry(async () => {
      const state = mongoose.connection.readyState;
      if (state !== 1) {
        throw new Error(`MongoDB readyState: ${state}`);
      }
      await mongoose.connection.db?.admin().ping();
    });
    return { status: 'ok', latencyMs: Date.now() - start, detail: 'MongoDB connected and responsive' };
  } catch (err) {
    return { status: 'fail', latencyMs: Date.now() - start, detail: `MongoDB error: ${(err as Error).message}` };
  }
}

async function checkTeachingRecords(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const count = await AdamTeachingRecordModel.estimatedDocumentCount();
    const latencyMs = Date.now() - start;
    return {
      status: count > 0 ? 'ok' : 'warn',
      latencyMs,
      detail: `${count} teaching records found`,
    };
  } catch (err) {
    return { status: 'fail', latencyMs: Date.now() - start, detail: `Teaching records error: ${(err as Error).message}` };
  }
}

async function checkContinuityBridge(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const { updatedAt } = await getContinuityBridgeRecord(FOUNDER_USER_ID);
    const latencyMs = Date.now() - start;
    if (!updatedAt) {
      return {
        status:    'warn',
        latencyMs,
        detail:    'not_initialized — optional Layer 7 continuity bridge (does not downgrade /health/memory HTTP)',
      };
    }
    const ageMin = Math.round((Date.now() - updatedAt.getTime()) / 60000);
    return {
      status: ageMin < 1440 ? 'ok' : 'warn',
      latencyMs,
      detail: `Last bridge update: ${ageMin} minutes ago`,
    };
  } catch (err) {
    return { status: 'fail', latencyMs: Date.now() - start, detail: `Continuity bridge error: ${(err as Error).message}` };
  }
}

async function checkRelationalArc(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const count = await AdamTeachingRecordModel.countDocuments({
      founderId: FOUNDER_USER_ID,
      'relationalTags.0': { $exists: true },
    });
    return { status: 'ok', latencyMs: Date.now() - start, detail: `${count} records with relational tags` };
  } catch (err) {
    return { status: 'fail', latencyMs: Date.now() - start, detail: `Relational arc error: ${(err as Error).message}` };
  }
}

async function checkUnresolvedHoldings(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const count = await AdamUnresolvedHoldingModel.countDocuments({
      founderId: FOUNDER_USER_ID,
      status:    'active',
    });
    return { status: 'ok', latencyMs: Date.now() - start, detail: `${count} active unresolved holdings` };
  } catch (err) {
    return { status: 'fail', latencyMs: Date.now() - start, detail: `Holdings error: ${(err as Error).message}` };
  }
}

async function checkSessionMemory(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [sessions, messages] = await Promise.all([
      ADAMFounderSessionModel.countDocuments({ updatedAt: { $gte: since } }),
      ADAMMessageModel.countDocuments({ createdAt: { $gte: since } }),
    ]);
    return {
      status: 'ok',
      latencyMs: Date.now() - start,
      detail: `${sessions} founder sessions, ${messages} messages in last hour`,
    };
  } catch (err) {
    return { status: 'fail', latencyMs: Date.now() - start, detail: `Session memory error: ${(err as Error).message}` };
  }
}

const CORE_MEMORY_CHECKS: Array<keyof MemoryHealthReport['checks']> = [
  'mongodb',
  'teachingRecords',
  'sessionMemory',
];

/** feat_004 Policy B — bridge-only warn must not force HTTP 207. */
function deriveMemoryOverall(checks: MemoryHealthReport['checks']): MemoryHealthReport['overall'] {
  const entries = Object.entries(checks) as Array<[keyof typeof checks, HealthCheck]>;
  const statuses = entries.map(([, c]) => c.status);

  if (statuses.includes('fail')) return 'critical';

  const coreUnhealthy = CORE_MEMORY_CHECKS.some((key) => {
    const s = checks[key].status;
    return s === 'fail' || s === 'warn';
  });
  if (coreUnhealthy) return 'degraded';

  const nonBridgeWarns = entries.filter(
    ([key, c]) => key !== 'continuityBridge' && c.status === 'warn',
  ).length;
  if (nonBridgeWarns >= 2) return 'degraded';

  return 'healthy';
}

export async function runOperationalMemoryHealth(): Promise<MemoryHealthReport> {
  const start = Date.now();

  const [mongodb, teachingRecords, continuityBridge, relationalArc, unresolvedHoldings, sessionMemory] =
    await Promise.all([
      checkMongoDB(),
      checkTeachingRecords(),
      checkContinuityBridge(),
      checkRelationalArc(),
      checkUnresolvedHoldings(),
      checkSessionMemory(),
    ]);

  const checks = { mongodb, teachingRecords, continuityBridge, relationalArc, unresolvedHoldings, sessionMemory };
  const overall = deriveMemoryOverall(checks);

  const sinceHour = new Date(Date.now() - 3600000);
  const [teachingRecordsCount, holdingsActive, lastRecord, activeFounderSessions, constitutional] =
    await Promise.all([
      AdamTeachingRecordModel.estimatedDocumentCount(),
      AdamUnresolvedHoldingModel.countDocuments({ founderId: FOUNDER_USER_ID, status: 'active' }),
      AdamTeachingRecordModel.findOne({ founderId: FOUNDER_USER_ID })
        .sort({ masa_recorded: -1 })
        .select('masa_recorded')
        .lean(),
      ADAMFounderSessionModel.countDocuments({ updatedAt: { $gte: sinceHour } }),
      (async () => {
        const sessionId = await resolvePrimaryFounderSessionId(FOUNDER_USER_ID);
        if (!sessionId) return null;
        return checkMemoryHealthCached(FOUNDER_USER_ID, sessionId);
      })(),
    ]);

  return {
    timestamp: new Date().toISOString(),
    overall,
    checks,
    pulse: {
      activeFounderSessions,
      teachingRecordsCount,
      holdingsActive,
      lastTransformation: lastRecord?.masa_recorded?.toISOString() ?? null,
      memoryLatencyMs:      Date.now() - start,
      constitutionalScore:  constitutional?.score ?? null,
      constitutionalStatus: constitutional?.status ?? null,
    },
  };
}
