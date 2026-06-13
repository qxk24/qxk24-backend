/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Platform Admin Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import crypto from 'crypto';
import { ADAMStudentAccountModel } from '../adam/adam-student.schema';
import {
  LegacyNiagaPlatformAdminModel,
  PlatformAdminModel,
  type IPlatformAdmin,
} from './platform-admin.schema';
import {
  PlatformAdminRole,
  PlatformAdminStatus,
  buildModuleAccessMap,
  normalizePlatformAdminModules,
  platformAdminHasModule,
  PLATFORM_ADMIN_MODULE_ALL,
  type PlatformAdminModule,
  type PlatformAdminModuleGrant,
} from './platform-admin.types';

export interface PlatformAdminAccess {
  canAccess:       boolean;
  isFounder:       boolean;
  isPlatformAdmin: boolean;
  role:            PlatformAdminRole | 'founder' | null;
  adminId:         string | null;
  modules:         PlatformAdminModuleGrant[];
  moduleAccess:    Record<PlatformAdminModule, boolean>;
}

export interface PlatformAdminRow {
  adminId:    string;
  userId:     string;
  email:      string | null;
  name:       string;
  role:       PlatformAdminRole;
  modules:    PlatformAdminModuleGrant[];
  status:     PlatformAdminStatus;
  createdBy:  string;
  createdAt:  Date;
  revokedAt:  Date | null;
}

function newAdminId(): string {
  return `PLT-ADM-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

async function resolveAdamAccount(identifier: string): Promise<{
  userId: string;
  name:   string;
  email:  string | null;
}> {
  const raw = identifier.trim();
  if (!raw) throw new Error('userId or email is required.');

  const byUserId = await ADAMStudentAccountModel.findOne({ userId: raw }).lean();
  if (byUserId) {
    if (!byUserId.active) throw new Error('ADAM account is inactive.');
    return {
      userId: byUserId.userId,
      name:   byUserId.name,
      email:  byUserId.email ?? null,
    };
  }

  const email = raw.toLowerCase();
  if (!email.includes('@')) {
    throw new Error('Provide a valid ADAM userId or email.');
  }

  const byEmail = await ADAMStudentAccountModel.findOne({ email }).lean();
  if (!byEmail) {
    throw new Error('No ADAM account found for that email. Create the account first.');
  }
  if (!byEmail.active) throw new Error('ADAM account is inactive.');

  return {
    userId: byEmail.userId,
    name:   byEmail.name,
    email:  byEmail.email ?? null,
  };
}

function toRow(doc: IPlatformAdmin): PlatformAdminRow {
  return {
    adminId:   doc.adminId,
    userId:    doc.userId,
    email:     doc.email,
    name:      doc.name,
    role:      doc.role,
    modules:   normalizePlatformAdminModules(doc.modules),
    status:    doc.status,
    createdBy: doc.createdBy,
    createdAt: doc.createdAt,
    revokedAt: doc.revokedAt,
  };
}

async function findActiveAdminRecord(userId: string): Promise<IPlatformAdmin | null> {
  const primary = await PlatformAdminModel.findOne({
    userId: userId.trim(),
    status: PlatformAdminStatus.ACTIVE,
  }).lean() as unknown as IPlatformAdmin | null;

  if (primary) return primary;

  const legacy = await LegacyNiagaPlatformAdminModel.findOne({
    userId: userId.trim(),
    status: 'active',
  }).lean() as {
    adminId?: string;
    userId?: string;
    email?: string | null;
    name?: string;
    role?: string;
  } | null;

  if (!legacy?.userId) return null;

  return {
    adminId:   legacy.adminId ?? newAdminId(),
    userId:    legacy.userId,
    email:     legacy.email ?? null,
    name:      legacy.name ?? legacy.userId,
    role:      (legacy.role as PlatformAdminRole) ?? PlatformAdminRole.OPERATOR,
    modules:   [PLATFORM_ADMIN_MODULE_ALL],
    status:    PlatformAdminStatus.ACTIVE,
    createdBy: 'legacy:niaga_platform_admins',
    revokedBy: null,
    revokedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as IPlatformAdmin;
}

export async function getActivePlatformAdmin(
  userId: string,
): Promise<IPlatformAdmin | null> {
  return findActiveAdminRecord(userId);
}

export async function isActivePlatformAdmin(userId: string): Promise<boolean> {
  return Boolean(await findActiveAdminRecord(userId));
}

export async function platformAdminCanAccessModule(
  userId: string,
  module: PlatformAdminModule,
): Promise<boolean> {
  const admin = await findActiveAdminRecord(userId);
  if (!admin) return false;
  return platformAdminHasModule(normalizePlatformAdminModules(admin.modules), module);
}

export async function resolvePlatformAdminAccess(input: {
  userId:    string;
  isFounder: boolean;
  module?:   PlatformAdminModule;
}): Promise<PlatformAdminAccess> {
  if (input.isFounder) {
    const modules = [PLATFORM_ADMIN_MODULE_ALL] as PlatformAdminModuleGrant[];
    return {
      canAccess:       true,
      isFounder:       true,
      isPlatformAdmin: false,
      role:            'founder',
      adminId:         null,
      modules,
      moduleAccess:    buildModuleAccessMap(modules),
    };
  }

  const admin = await findActiveAdminRecord(input.userId);
  if (!admin) {
    const emptyModules: PlatformAdminModuleGrant[] = [];
    return {
      canAccess:       false,
      isFounder:       false,
      isPlatformAdmin: false,
      role:            null,
      adminId:         null,
      modules:         emptyModules,
      moduleAccess:    buildModuleAccessMap(emptyModules),
    };
  }

  const modules = normalizePlatformAdminModules(admin.modules);
  const moduleAccess = buildModuleAccessMap(modules);
  const canAccess = input.module
    ? platformAdminHasModule(modules, input.module)
    : true;

  return {
    canAccess,
    isFounder:       false,
    isPlatformAdmin: true,
    role:            admin.role,
    adminId:         admin.adminId,
    modules,
    moduleAccess,
  };
}

export async function listPlatformAdmins(): Promise<PlatformAdminRow[]> {
  const rows = await PlatformAdminModel.find()
    .sort({ status: 1, createdAt: -1 })
    .lean() as unknown as IPlatformAdmin[];

  return rows.map(toRow);
}

export async function invitePlatformAdmin(input: {
  identifier: string;
  role?:      PlatformAdminRole;
  modules?:   PlatformAdminModuleGrant[];
  createdBy:  string;
}): Promise<PlatformAdminRow> {
  const account = await resolveAdamAccount(input.identifier);
  const role = input.role ?? PlatformAdminRole.OPERATOR;
  const modules = normalizePlatformAdminModules(input.modules);

  const existing = await PlatformAdminModel.findOne({ userId: account.userId });
  if (existing) {
    if (existing.status === PlatformAdminStatus.ACTIVE) {
      throw new Error(`${account.userId} is already an active platform admin.`);
    }
    existing.status = PlatformAdminStatus.ACTIVE;
    existing.role = role;
    existing.modules = modules;
    existing.name = account.name;
    existing.email = account.email;
    existing.createdBy = input.createdBy;
    existing.revokedBy = null;
    existing.revokedAt = null;
    await existing.save();
    return toRow(existing);
  }

  const doc = await PlatformAdminModel.create({
    adminId:   newAdminId(),
    userId:    account.userId,
    email:     account.email,
    name:      account.name,
    role,
    modules,
    status:    PlatformAdminStatus.ACTIVE,
    createdBy: input.createdBy,
  });

  return toRow(doc);
}

export async function revokePlatformAdmin(
  adminId: string,
  revokedBy: string,
): Promise<void> {
  const doc = await PlatformAdminModel.findOne({ adminId: adminId.trim() });
  if (!doc) throw new Error('Platform admin not found.');
  if (doc.status === PlatformAdminStatus.REVOKED) {
    throw new Error('Platform admin is already revoked.');
  }
  doc.status = PlatformAdminStatus.REVOKED;
  doc.revokedBy = revokedBy;
  doc.revokedAt = new Date();
  await doc.save();
}
