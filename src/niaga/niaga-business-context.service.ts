/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Business Context
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import type { AdamNiagaBusinessProfile } from '../adam/adam-niaga-law';
import { NiagaPartnerLicenseModel } from './niaga-partner-license.schema';
import { NiagaSubscriptionModel, NiagaSubscriptionStatus } from './niaga-subscription.schema';
import { getNiagaTraderByUser } from './niaga-trader.service';

export async function loadNiagaBusinessProfile(
  userId: string,
): Promise<AdamNiagaBusinessProfile | null> {
  const reg = await getNiagaTraderByUser(userId);
  if (!reg) return null;

  const license = await NiagaPartnerLicenseModel.findOne({ channelCode: reg.channelCode }).lean();

  return {
    businessName:  reg.businessName,
    businessType:  reg.businessType,
    state:         reg.state,
    channelCode:   reg.channelCode,
    businessBrief: reg.businessBrief,
    partnerOrg:    license?.orgName ?? null,
  };
}

export async function resolveNiagaSubscriptionId(userId: string): Promise<string | null> {
  const reg = await getNiagaTraderByUser(userId);
  if (!reg) return null;
  const sub = await NiagaSubscriptionModel.findOne({
    registrationId: reg.registrationId,
    status:         NiagaSubscriptionStatus.ACTIVE,
  }).lean();
  return sub?.subscriptionId ?? null;
}
