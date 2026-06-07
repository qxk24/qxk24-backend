/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Platform Settings Service
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-03
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  ADAMPlatformSettingsModel,
  PLATFORM_SETTINGS_KEY,
} from './adam-platform-settings.schema';

let studentSelfRegisterOpen = false;
let settingsLoaded = false;

export async function initPlatformSettings(): Promise<void> {
  const existing = await ADAMPlatformSettingsModel.findOne({ key: PLATFORM_SETTINGS_KEY }).lean();
  if (!existing) {
    await ADAMPlatformSettingsModel.create({
      key: PLATFORM_SETTINGS_KEY,
      studentSelfRegisterOpen: false,
    });
    studentSelfRegisterOpen = false;
  } else {
    studentSelfRegisterOpen = existing.studentSelfRegisterOpen;
  }
  settingsLoaded = true;
}

export function isPlatformSettingsLoaded(): boolean {
  return settingsLoaded;
}

/** Runtime gate for public student signup (founder toggle). Default: closed. */
export function isStudentSelfRegisterEnabled(): boolean {
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
