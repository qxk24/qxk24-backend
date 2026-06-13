/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Platform Admin Service Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
  PlatformAdminModel,
} from '../src/platform/platform-admin.schema';
import {
  PlatformAdminRole,
  PlatformAdminStatus,
} from '../src/platform/platform-admin.types';
import { resolvePlatformAdminAccess } from '../src/platform/platform-admin.service';

describe('resolvePlatformAdminAccess', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('grants founder access to all modules', async () => {
    const access = await resolvePlatformAdminAccess({
      userId:    'masa-bayu',
      isFounder: true,
    });
    expect(access.canAccess).toBe(true);
    expect(access.isFounder).toBe(true);
    expect(access.moduleAccess.niaga).toBe(true);
    expect(access.moduleAccess.commercial).toBe(true);
  });

  it('grants invited staff module access', async () => {
    jest.spyOn(PlatformAdminModel, 'findOne').mockReturnValue({
      lean: () => Promise.resolve({
        adminId: 'PLT-ADM-1',
        role:    PlatformAdminRole.OPERATOR,
        modules: ['all'],
      }),
    } as ReturnType<typeof PlatformAdminModel.findOne>);

    const access = await resolvePlatformAdminAccess({
      userId:    'qiubbx-ops',
      isFounder: false,
      module:    'niaga',
    });
    expect(access.canAccess).toBe(true);
    expect(access.isPlatformAdmin).toBe(true);
    expect(access.moduleAccess.niaga).toBe(true);
    expect(PlatformAdminModel.findOne).toHaveBeenCalledWith({
      userId: 'qiubbx-ops',
      status: PlatformAdminStatus.ACTIVE,
    });
  });

  it('denies module when not granted', async () => {
    jest.spyOn(PlatformAdminModel, 'findOne').mockReturnValue({
      lean: () => Promise.resolve({
        adminId: 'PLT-ADM-2',
        role:    PlatformAdminRole.OPERATOR,
        modules: ['niaga'],
      }),
    } as ReturnType<typeof PlatformAdminModel.findOne>);

    const access = await resolvePlatformAdminAccess({
      userId:    'ops-niaga-only',
      isFounder: false,
      module:    'commercial',
    });
    expect(access.canAccess).toBe(false);
    expect(access.moduleAccess.commercial).toBe(false);
  });
});
