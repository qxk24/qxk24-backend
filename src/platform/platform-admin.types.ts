/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Platform Admin Types
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

/** Commercial operator consoles — QIUBBX Technologies (M) Sdn Bhd */
export const PLATFORM_ADMIN_MODULES = [
  'niaga',
  'subscriptions',
  'commercial',
  'rd_applied',
  'partners',
] as const;

export type PlatformAdminModule = (typeof PLATFORM_ADMIN_MODULES)[number];

export const PLATFORM_ADMIN_MODULE_ALL = 'all' as const;

export type PlatformAdminModuleGrant =
  | PlatformAdminModule
  | typeof PLATFORM_ADMIN_MODULE_ALL;

export enum PlatformAdminRole {
  OPERATOR = 'operator',
  FINANCE  = 'finance',
  SUPER    = 'super',
}

export enum PlatformAdminStatus {
  ACTIVE  = 'active',
  REVOKED = 'revoked',
}

export function normalizePlatformAdminModules(
  raw: string[] | null | undefined,
): PlatformAdminModuleGrant[] {
  if (!raw?.length) return [PLATFORM_ADMIN_MODULE_ALL];
  const normalized = raw.map((m) => m.trim().toLowerCase()).filter(Boolean);
  if (normalized.includes(PLATFORM_ADMIN_MODULE_ALL)) return [PLATFORM_ADMIN_MODULE_ALL];
  const valid = normalized.filter(
    (m): m is PlatformAdminModule =>
      (PLATFORM_ADMIN_MODULES as readonly string[]).includes(m),
  );
  return valid.length ? valid : [PLATFORM_ADMIN_MODULE_ALL];
}

export function platformAdminHasModule(
  grants: PlatformAdminModuleGrant[] | null | undefined,
  module: PlatformAdminModule,
): boolean {
  const list = grants ?? [PLATFORM_ADMIN_MODULE_ALL];
  if (list.includes(PLATFORM_ADMIN_MODULE_ALL)) return true;
  return list.includes(module);
}

export function buildModuleAccessMap(
  grants: PlatformAdminModuleGrant[] | null | undefined,
): Record<PlatformAdminModule, boolean> {
  return Object.fromEntries(
    PLATFORM_ADMIN_MODULES.map((m) => [m, platformAdminHasModule(grants, m)]),
  ) as Record<PlatformAdminModule, boolean>;
}
