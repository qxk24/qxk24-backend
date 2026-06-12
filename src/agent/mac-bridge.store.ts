/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Mac Bridge Store
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-01
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Per-user in-memory queue: API forwards MCP tool calls to a
 * local daemon (alm-mcp/scripts/adam-mac-bridge.mjs) per account.
 */

import { randomUUID } from 'crypto';

const BRIDGE_STALE_MS = 120_000;
const DEFAULT_CALL_TIMEOUT_MS = 120_000;
/** Short long-poll — client loops immediately when job is null */
const POLL_WAIT_MS = 4_000;

export interface MacBridgeToolDef {
  name:         string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface MacBridgeRegistration {
  userId:       string;
  machineName:  string;
  macRoot:      string;
  qxk24Root:    string;
  tools:        MacBridgeToolDef[];
  registeredAt: string;
  lastSeenAt:   number;
}

export interface MacBridgeJob {
  callId:   string;
  userId:   string;
  toolName: string;
  toolArgs: Record<string, unknown>;
}

interface PendingCall {
  resolve: (text: string) => void;
  reject:  (err: Error) => void;
  timer:   NodeJS.Timeout;
}

interface UserBridgeState {
  registration: MacBridgeRegistration | null;
  activeCallId: string | null;
  jobQueue:     MacBridgeJob[];
  pending:      Map<string, PendingCall>;
  pollWaiters:  Array<(job: MacBridgeJob | null) => void>;
}

const bridges = new Map<string, UserBridgeState>();

function getState(userId: string): UserBridgeState {
  let state = bridges.get(userId);
  if (!state) {
    state = {
      registration: null,
      activeCallId: null,
      jobQueue:     [],
      pending:      new Map(),
      pollWaiters:  [],
    };
    bridges.set(userId, state);
  }
  return state;
}

function touchBridge(state: UserBridgeState): void {
  if (state.registration) state.registration.lastSeenAt = Date.now();
}

function notifyPollWaiters(state: UserBridgeState): void {
  while (state.pollWaiters.length > 0 && state.jobQueue.length > 0) {
    const waiter = state.pollWaiters.shift();
    const job = state.jobQueue.shift();
    if (waiter && job) waiter(job);
  }
}

export function registerMacBridge(
  userId: string,
  info: {
    machineName: string;
    macRoot:     string;
    qxk24Root:   string;
    tools:       MacBridgeToolDef[];
  },
): MacBridgeRegistration {
  const state = getState(userId);
  state.registration = {
    userId,
    machineName: info.machineName,
    macRoot:     info.macRoot,
    qxk24Root:   info.qxk24Root,
    tools:       info.tools,
    registeredAt: new Date().toISOString(),
    lastSeenAt:   Date.now(),
  };
  state.activeCallId = null;
  console.log('[mac-bridge] registered', {
    userId,
    machine: info.machineName,
    macRoot: info.macRoot,
  });
  return state.registration;
}

export function heartbeatMacBridge(userId: string): void {
  touchBridge(getState(userId));
}

function markMacBridgeJobDispatched(userId: string, callId: string): void {
  const state = getState(userId);
  state.activeCallId = callId;
  touchBridge(state);
}

function clearMacBridgeActiveJob(userId: string, callId?: string): void {
  const state = getState(userId);
  if (!callId || state.activeCallId === callId) {
    state.activeCallId = null;
  }
  touchBridge(state);
}

export function isMacBridgeConnected(userId: string): boolean {
  const state = getState(userId);
  if (!state.registration) return false;
  if (state.activeCallId) return true;
  return Date.now() - state.registration.lastSeenAt < BRIDGE_STALE_MS;
}

export function getMacBridgeTools(userId: string): MacBridgeToolDef[] {
  if (!isMacBridgeConnected(userId)) return [];
  const state = getState(userId);
  return state.registration?.tools ?? [];
}

export function getMacBridgeStatus(userId: string): {
  connected: boolean;
  registration: MacBridgeRegistration | null;
  pendingJobs: number;
  toolCount: number;
  activeCallId: string | null;
} {
  const state = getState(userId);
  const connected = isMacBridgeConnected(userId);
  return {
    connected,
    registration: connected ? state.registration : null,
    pendingJobs:  state.jobQueue.length,
    toolCount:    connected && state.registration ? state.registration.tools.length : 0,
    activeCallId: state.activeCallId,
  };
}

export function waitForMacBridgeJob(
  userId: string,
  timeoutMs: number = POLL_WAIT_MS,
): Promise<MacBridgeJob | null> {
  const state = getState(userId);
  heartbeatMacBridge(userId);

  if (state.jobQueue.length > 0) {
    const job = state.jobQueue.shift()!;
    markMacBridgeJobDispatched(userId, job.callId);
    return Promise.resolve(job);
  }

  return new Promise((resolve) => {
    const onWake = (job: MacBridgeJob | null) => {
      clearTimeout(timer);
      if (job) markMacBridgeJobDispatched(userId, job.callId);
      resolve(job);
    };

    const timer = setTimeout(() => {
      const idx = state.pollWaiters.indexOf(onWake);
      if (idx >= 0) state.pollWaiters.splice(idx, 1);
      resolve(null);
    }, timeoutMs);

    state.pollWaiters.push(onWake);
  });
}

export function completeMacBridgeJob(
  userId: string,
  callId: string,
  resultText: string,
  isError = false,
): boolean {
  const state = getState(userId);
  const entry = state.pending.get(callId);
  if (!entry) return false;

  clearTimeout(entry.timer);
  state.pending.delete(callId);
  clearMacBridgeActiveJob(userId, callId);

  if (isError) {
    entry.reject(new Error(resultText || 'Mac bridge tool failed'));
  } else {
    entry.resolve(resultText);
  }
  return true;
}

export function callToolViaMacBridge(
  userId: string,
  toolName: string,
  toolArgs: Record<string, unknown>,
  timeoutMs: number = DEFAULT_CALL_TIMEOUT_MS,
): Promise<string> {
  if (!isMacBridgeConnected(userId)) {
    return Promise.reject(
      new Error(
        'Mac bridge offline. On your computer run: cd alm-mcp && npm run mac-bridge',
      ),
    );
  }

  const state = getState(userId);
  const callId = randomUUID();
  const job: MacBridgeJob = { callId, userId, toolName, toolArgs };

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      state.pending.delete(callId);
      const idx = state.jobQueue.findIndex((j) => j.callId === callId);
      if (idx >= 0) state.jobQueue.splice(idx, 1);
      clearMacBridgeActiveJob(userId, callId);
      reject(new Error(`Mac bridge tool ${toolName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    state.pending.set(callId, { resolve, reject, timer });
    state.jobQueue.push(job);
    notifyPollWaiters(state);
  });
}
