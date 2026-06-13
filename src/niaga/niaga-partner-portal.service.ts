/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Partner Portal Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import { NiagaPartnerLicenseModel, type INiagaPartnerLicense } from './niaga-partner-license.schema';
import { NiagaTraderStatus } from './niaga-trader-registration.schema';
import { NiagaSubscriptionModel, NiagaSubscriptionStatus } from './niaga-subscription.schema';
import {
  approveNiagaTrader,
  listNiagaTraders,
  rejectNiagaTrader,
} from './niaga-trader.service';

export interface NiagaPartnerPortalOverview {
  channelCode:      string;
  orgName:          string;
  tier:             string;
  renewalDue:       Date;
  status:           string;
  registeredTraders: number;
  activePaying:     number;
  pendingApproval:  number;
  monthCommission:  number;
}

export async function resolveNiagaPartnerLicense(
  channelCode: string,
  portalToken: string,
): Promise<INiagaPartnerLicense | null> {
  return NiagaPartnerLicenseModel.findOne({
    channelCode: channelCode.trim().toUpperCase(),
    portalToken: portalToken.trim(),
  }).lean() as unknown as INiagaPartnerLicense | null;
}

export async function getNiagaPartnerPortalOverview(
  license: INiagaPartnerLicense,
): Promise<NiagaPartnerPortalOverview> {
  const channelCode = license.channelCode;

  const [registeredTraders, pendingApproval, activePaying, activeSubs] = await Promise.all([
    import('./niaga-trader-registration.schema').then((m) =>
      m.NiagaTraderRegistrationModel.countDocuments({ channelCode }),
    ),
    import('./niaga-trader-registration.schema').then((m) =>
      m.NiagaTraderRegistrationModel.countDocuments({
        channelCode,
        status: NiagaTraderStatus.PENDING,
      }),
    ),
    NiagaSubscriptionModel.countDocuments({
      channelCode,
      status: NiagaSubscriptionStatus.ACTIVE,
    }),
    NiagaSubscriptionModel.find({
      channelCode,
      status: NiagaSubscriptionStatus.ACTIVE,
    }).lean(),
  ]);

  const monthCommission = activeSubs.reduce(
    (sum, s) => sum + (s.partnerCommissionMyr ?? 0),
    0,
  );

  return {
    channelCode,
    orgName:           license.orgName,
    tier:              license.tier,
    renewalDue:        license.renewalDue,
    status:            license.status,
    registeredTraders,
    activePaying,
    pendingApproval,
    monthCommission:   Math.round(monthCommission * 100) / 100,
  };
}

export async function listNiagaPartnerPendingTraders(channelCode: string) {
  return listNiagaTraders({ channelCode, status: NiagaTraderStatus.PENDING });
}

export async function listNiagaPartnerTraders(channelCode: string) {
  return listNiagaTraders({ channelCode });
}

export async function partnerApproveNiagaTrader(
  channelCode: string,
  registrationId: string,
): Promise<void> {
  await approveNiagaTrader(registrationId, channelCode, 'partner-portal');
}

export async function partnerRejectNiagaTrader(
  channelCode: string,
  registrationId: string,
  reason?: string,
): Promise<void> {
  await rejectNiagaTrader(registrationId, channelCode, reason, 'partner-portal');
}
