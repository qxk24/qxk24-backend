/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Mac Bridge Store
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
 * In-memory queue: production API forwards MCP tool calls to a
 * founder Mac running qxk24-mcp/scripts/adam-mac-bridge.mjs.
 */

import { randomUUID } from 'crypto';

const BRIDGE_STALE_MS = 120_000;
const DEFAULT_CALL_TIMEOUT_MS = 120_000;
/** Short long-poll — Mac client loops immediately when job is null */
const POLL_WAIT_MS = 4_000;

export interface MacBridgeToolDef {
  name:         string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface MacBridgeRegistration {
  machineName: string;
  macRoot:       string;
  qxk24Root:     string;
  tools:         MacBridgeToolDef[];
  registeredAt:  string;
  lastSeenAt:    number;
}

export interface MacBridgeJob {
  callId:   string;
  toolName: string;
  toolArgs: Record<string, unknown>;
}

interface PendingCall {
  resolve: (text: string) => void;
  reject:  (err: Error) => void;
  timer:   NodeJS.Timeout;
}

let registration: MacBridgeRegistration | null = null;
let activeCallId: string | null = null;
const jobQueue: MacBridgeJob[] = [];
const pending = new Map<string, PendingCall>();
const pollWaiters: Array<(job: MacBridgeJob | null) => void> = [];

function touchBridge(): void {
  if (registration) registration.lastSeenAt = Date.now();
}

function notifyPollWaiters(): void {
  while (pollWaiters.length > 0 && jobQueue.length > 0) {
    const waiter = pollWaiters.shift();
    const job = jobQueue.shift();
    if (waiter && job) waiter(job);
  }
}

export function registerMacBridge(info: {
  machineName: string;
  macRoot:     string;
  qxk24Root:   string;
  tools:       MacBridgeToolDef[];
}): MacBridgeRegistration {
  registration = {
    machineName: info.machineName,
    macRoot:     info.macRoot,
    qxk24Root:   info.qxk24Root,
    tools:       info.tools,
    registeredAt: new Date().toISOString(),
    lastSeenAt:   Date.now(),
  };
  activeCallId = null;
  console.log('[mac-bridge] registered', {
    machine: info.machineName,
    macRoot: info.macRoot,
  });
  return registration;
}

export function heartbeatMacBridge(): void {
  touchBridge();
}

export function markMacBridgeJobDispatched(callId: string): void {
  activeCallId = callId;
  touchBridge();
}

export function clearMacBridgeActiveJob(callId?: string): void {
  if (!callId || activeCallId === callId) {
    activeCallId = null;
  }
  touchBridge();
}

export function isMacBridgeConnected(): boolean {
  if (!registration) return false;
  if (activeCallId) return true;
  return Date.now() - registration.lastSeenAt < BRIDGE_STALE_MS;
}

export function getMacBridgeTools(): MacBridgeToolDef[] {
  if (!isMacBridgeConnected() || !registration) return [];
  return registration.tools;
}

export function getMacBridgeStatus(): {
  connected: boolean;
  registration: MacBridgeRegistration | null;
  pendingJobs: number;
  toolCount: number;
  activeCallId: string | null;
} {
  const connected = isMacBridgeConnected();
  return {
    connected,
    registration: connected ? registration : null,
    pendingJobs:  jobQueue.length,
    toolCount:    connected && registration ? registration.tools.length : 0,
    activeCallId,
  };
}

export function waitForMacBridgeJob(timeoutMs: number = POLL_WAIT_MS): Promise<MacBridgeJob | null> {
  heartbeatMacBridge();

  if (jobQueue.length > 0) {
    const job = jobQueue.shift()!;
    markMacBridgeJobDispatched(job.callId);
    return Promise.resolve(job);
  }

  return new Promise((resolve) => {
    const onWake = (job: MacBridgeJob | null) => {
      clearTimeout(timer);
      if (job) markMacBridgeJobDispatched(job.callId);
      resolve(job);
    };

    const timer = setTimeout(() => {
      const idx = pollWaiters.indexOf(onWake);
      if (idx >= 0) pollWaiters.splice(idx, 1);
      resolve(null);
    }, timeoutMs);

    pollWaiters.push(onWake);
  });
}

export function completeMacBridgeJob(
  callId: string,
  resultText: string,
  isError = false,
): boolean {
  const entry = pending.get(callId);
  if (!entry) return false;

  clearTimeout(entry.timer);
  pending.delete(callId);
  clearMacBridgeActiveJob(callId);

  if (isError) {
    entry.reject(new Error(resultText || 'Mac bridge tool failed'));
  } else {
    entry.resolve(resultText);
  }
  return true;
}

export function callToolViaMacBridge(
  toolName: string,
  toolArgs: Record<string, unknown>,
  timeoutMs: number = DEFAULT_CALL_TIMEOUT_MS,
): Promise<string> {
  if (!isMacBridgeConnected()) {
    return Promise.reject(
      new Error(
        'Mac bridge offline. On your MacBook run: cd qxk24-mcp && npm run mac-bridge',
      ),
    );
  }

  const callId = randomUUID();
  const job: MacBridgeJob = { callId, toolName, toolArgs };

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(callId);
      const idx = jobQueue.findIndex((j) => j.callId === callId);
      if (idx >= 0) jobQueue.splice(idx, 1);
      clearMacBridgeActiveJob(callId);
      reject(new Error(`Mac bridge tool ${toolName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    pending.set(callId, { resolve, reject, timer });
    jobQueue.push(job);
    notifyPollWaiters();
  });
}
