/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Mac Bridge Settings
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import { getMacBridgeStatus } from '../agent/mac-bridge.store';
import { ADAMStudentAccountModel } from './adam-student.schema';
import {
  isFounderMacBridgeRoutingOpen,
  setMacBridgeRoutingOpen,
} from './adam-platform-settings.service';
import { userHasMacBridgeTier } from './adam-mac-bridge-access.service';

async function getUserMacBridgeRoutingOpen(userId: string): Promise<boolean> {
  const doc = await ADAMStudentAccountModel.findOne({ userId })
    .select({ macBridgeRoutingOpen: 1 })
    .lean();
  return doc?.macBridgeRoutingOpen === true;
}

export async function isMacBridgeRoutingActive(
  userId: string,
  isFounder: boolean,
): Promise<boolean> {
  if (!ENV.ADAM_MAC_BRIDGE_ENABLED) return false;
  if (isFounder) return isFounderMacBridgeRoutingOpen();
  if (!(await userHasMacBridgeTier(userId))) return false;
  return getUserMacBridgeRoutingOpen(userId);
}

export async function getMacBridgeDashboardSettings(
  userId: string,
  isFounder: boolean,
): Promise<{
  serverEnabled: boolean;
  eligible:      boolean;
  open:          boolean;
  connected:     boolean;
  machineName?:  string;
  toolCount:     number;
}> {
  const status = getMacBridgeStatus(userId);
  const eligible = isFounder || await userHasMacBridgeTier(userId);
  const open = isFounder
    ? isFounderMacBridgeRoutingOpen()
    : eligible && await getUserMacBridgeRoutingOpen(userId);

  return {
    serverEnabled: ENV.ADAM_MAC_BRIDGE_ENABLED,
    eligible,
    open,
    connected:   status.connected,
    machineName: status.registration?.machineName,
    toolCount:   status.toolCount,
  };
}

export async function setMacBridgeRoutingForUser(
  userId: string,
  isFounder: boolean,
  open: boolean,
  updatedBy: string,
): Promise<{ open: boolean }> {
  if (!ENV.ADAM_MAC_BRIDGE_ENABLED) {
    throw new Error('Mac bridge is not enabled on this server (ADAM_MAC_BRIDGE_ENABLED).');
  }

  if (isFounder) {
    const result = await setMacBridgeRoutingOpen(open, updatedBy);
    return { open: result.open };
  }

  if (!(await userHasMacBridgeTier(userId))) {
    throw new Error('Mac bridge requires an active Profesional or Enterprise subscription.');
  }

  await ADAMStudentAccountModel.findOneAndUpdate(
    { userId },
    { macBridgeRoutingOpen: open },
    { upsert: false },
  );

  return { open };
}
