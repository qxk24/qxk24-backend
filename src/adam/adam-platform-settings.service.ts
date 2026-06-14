/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Platform Settings Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-03
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import {
  ADAMPlatformSettingsModel,
  PLATFORM_SETTINGS_KEY,
} from './adam-platform-settings.schema';

let studentSelfRegisterOpen = false;
let macBridgeRoutingOpen = false;
let settingsLoaded = false;

export async function initPlatformSettings(): Promise<void> {
  const existing = await ADAMPlatformSettingsModel.findOne({ key: PLATFORM_SETTINGS_KEY }).lean();
  if (!existing) {
    await ADAMPlatformSettingsModel.create({
      key: PLATFORM_SETTINGS_KEY,
      studentSelfRegisterOpen: false,
      macBridgeRoutingOpen:    false,
    });
    studentSelfRegisterOpen = false;
    macBridgeRoutingOpen = false;
  } else {
    studentSelfRegisterOpen = existing.studentSelfRegisterOpen;
    macBridgeRoutingOpen = existing.macBridgeRoutingOpen === true;
  }
  settingsLoaded = true;
}

export function isPlatformSettingsLoaded(): boolean {
  return settingsLoaded;
}

/** Runtime gate for public student signup — env override or founder toggle. */
export function isStudentSelfRegisterEnabled(): boolean {
  if (ENV.ADAM_STUDENT_SELF_REGISTER) return true;
  if (ENV.ADAM_FREEMIUM_ENABLED && ENV.ADAM_FREEMIUM_PUBLIC_ENABLED) return true;
  return studentSelfRegisterOpen;
}

export function getStudentRegistrationSettings(): { open: boolean } {
  return { open: studentSelfRegisterOpen };
}

export async function setStudentSelfRegisterOpen(
  open: boolean,
  updatedBy: string,
): Promise<{ open: boolean }> {
  studentSelfRegisterOpen = open;
  settingsLoaded = true;
  await ADAMPlatformSettingsModel.findOneAndUpdate(
    { key: PLATFORM_SETTINGS_KEY },
    { studentSelfRegisterOpen: open, updatedBy },
    { upsert: true, setDefaultsOnInsert: true },
  );
  return { open: studentSelfRegisterOpen };
}

export function isFounderMacBridgeRoutingOpen(): boolean {
  return macBridgeRoutingOpen;
}

export async function setMacBridgeRoutingOpen(
  open: boolean,
  updatedBy: string,
): Promise<{ open: boolean }> {
  if (!ENV.ADAM_MAC_BRIDGE_ENABLED) {
    throw new Error('Mac bridge is not enabled on this server (ADAM_MAC_BRIDGE_ENABLED).');
  }
  macBridgeRoutingOpen = open;
  settingsLoaded = true;
  await ADAMPlatformSettingsModel.findOneAndUpdate(
    { key: PLATFORM_SETTINGS_KEY },
    { macBridgeRoutingOpen: open, updatedBy },
    { upsert: true, setDefaultsOnInsert: true },
  );
  return { open: macBridgeRoutingOpen };
}
