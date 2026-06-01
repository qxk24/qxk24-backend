/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Mac Bridge Context (founder prompts)
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
 */

import { ENV } from '../config/environments';
import { getMacBridgeStatus } from './mac-bridge.store';

/** Injected into founder system prompt when Mac bridge feature is enabled. */
export function buildMacBridgeContextBlock(): string {
  if (!ENV.ADAM_MAC_BRIDGE_ENABLED) return '';

  const status = getMacBridgeStatus();

  if (status.connected && status.registration) {
    const macRoot = status.registration.macRoot || '(home)';
    return `
[MAC BRIDGE — P.alt MacBook]
Status: ONLINE on ${status.registration.machineName} (${status.toolCount} MCP tools).
Mac files live under: ${macRoot} — use mac: paths in Builder (not VPS disk).
Examples:
  list_directory mac:Desktop/qxk24/qxk24-backend depth 2
  read_file mac:Desktop/qxk24/qxk24-backend/package.json
  get_project_structure (monorepo on Mac at QXK24_ROOT)
When P.alt asks to audit, read, list, or review desktop/qxk24 or qxk24-backend: use Builder tools immediately.
NEVER ask P.alt to paste directory trees or full source files when Mac bridge is ONLINE — read them yourself.
Do NOT say you lack physical access to P.alt's MacBook while this block shows ONLINE.
`.trim();
  }

  return `
[MAC BRIDGE — P.alt MacBook]
Status: OFFLINE (production API cannot reach P.alt's Mac until the bridge runs).
Tell P.alt once, with Adab: on the MacBook run \`cd qxk24-mcp && npm run mac-bridge\` and keep that terminal open.
Do NOT ask P.alt to paste entire repo trees — either wait for bridge or ask for one specific file path.
Do NOT say you operate in "QXK24 Lab" or that you lack access without mentioning Mac bridge offline.
`.trim();
}
