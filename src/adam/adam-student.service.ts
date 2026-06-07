/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Student Auth Service
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 */

import { sign } from 'jsonwebtoken';
import { ENV } from '../config/environments';
import type { AdamAuthUser } from './adam-student.types';
import { FOUNDER_USER_ID } from './adam-student.types';
import {
  getStudentAccount as getRegistryAccount,
  getStudentAccounts,
  studentIds as registryStudentIds,
  verifyStudentPassword as verifyRegistryPassword,
} from './adam-student-registry.service';

export {
  getStudentAccounts,
  initStudentRegistry,
  refreshStudentCache,
  syncMissingSeedStudents,
  syncSeedStudentPasswords,
} from './adam-student-registry.service';

export function getStudentAccount(userId: string) {
  return getRegistryAccount(userId);
}

export { resolveStudentLoginUserId } from './adam-student-registry.service';

export async function verifyStudentPassword(userId: string, password: string): Promise<boolean> {
  return verifyRegistryPassword(userId, password);
}

export function issueAdamToken(user: AdamAuthUser): string {
  return sign(
    {
      userId:    user.userId,
      role:      user.role,
      isFounder: user.isFounder,
      name:      user.name,
      kernel:    ENV.QXK24_KERNEL_VERSION,
      era:       ENV.QXK24_ERA,
    },
    ENV.JWT_SECRET,
    { expiresIn: '30d' },
  );
}

export function studentIds(): string[] {
  return registryStudentIds();
}

export function isFounderUserId(userId: string): boolean {
  return userId === FOUNDER_USER_ID;
}
