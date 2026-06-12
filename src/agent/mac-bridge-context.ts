/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Mac Bridge Context (prompts)
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
 */

import { ENV } from '../config/environments';
import { isMacBridgeRoutingActive } from '../adam/adam-mac-bridge-settings.service';
import { getMacBridgeStatus } from './mac-bridge.store';

/** Injected into system prompt when Mac bridge feature is enabled for this user. */
export async function buildMacBridgeContextBlock(
  userId: string,
  isFounder: boolean,
): Promise<string> {
  if (!ENV.ADAM_MAC_BRIDGE_ENABLED) return '';

  if (!(await isMacBridgeRoutingActive(userId, isFounder))) {
    const who = isFounder ? 'P.alt' : 'the subscriber';
    return `
[LOCAL FILE BRIDGE]
Status: OFF (routing disabled on command board). ${who} can turn it ON from the Bridge switch.
Do NOT ask to run mac-bridge or paste full repo trees while routing is OFF.
`.trim();
  }

  const status = getMacBridgeStatus(userId);

  if (status.connected && status.registration) {
    const macRoot = status.registration.macRoot || '(home)';
    return `
[LOCAL FILE BRIDGE — ONLINE]
Status: ONLINE on ${status.registration.machineName} (${status.toolCount} MCP tools).
Local files live under: ${macRoot} — use mac: paths in Builder (not VPS disk).
Examples:
  list_directory mac:Desktop/alamtologi/alm-backend depth 2
  read_file mac:Desktop/notes.txt
When the user asks to audit, read, list, or review local project files: use Builder tools immediately.
NEVER ask the user to paste directory trees or full source files while bridge is ONLINE — read them yourself.
`.trim();
  }

  return `
[LOCAL FILE BRIDGE]
Status: OFFLINE (API cannot reach the local computer until the bridge daemon runs).
Tell the user once: on their machine run \`cd alm-mcp && npm run mac-bridge\` and keep that terminal open, then ensure Bridge is ON on the command board.
Do NOT ask the user to paste entire repo trees — either wait for bridge or ask for one specific file path.
`.trim();
}
