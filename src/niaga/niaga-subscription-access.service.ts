/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Niaga Subscription Access
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-13
 * ============================================================
 */

import { ENV } from '../config/environments';
import { getStripeGatewayStatus } from '../subscriptions/stripe-gateway.service';
import { isFounderPayload } from '../middleware/auth.middleware';
import type { QXK24TokenPayload } from '../middleware/auth.middleware';
import { NiagaSubscriptionModel, NiagaSubscriptionStatus } from './niaga-subscription.schema';
import { NiagaTraderStatus } from './niaga-trader-registration.schema';
import { getNiagaTraderByUser } from './niaga-trader.service';
import { NIAGA_RETAIL_MONTHLY_MYR } from './niaga.constants';
import { getNiagaUsageSnapshot, type NiagaUsageSnapshot } from './niaga-usage.service';

export interface NiagaSubscriptionAccess {
  canChat:        boolean;
  active:         boolean;
  status:         string;
  registrationId: string | null;
  channelCode:    string | null;
  businessName:   string | null;
  message?:       string;
  upgradeUrl?:    string;
  registerUrl?:   string;
  code?:          string;
  monthlyMYR?:    number;
  usage?:         NiagaUsageSnapshot;
}

function niagaUpgradeUrl(): string {
  const base = (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://qxk24.com').replace(/\/$/, '');
  return `${base}/niaga/daftar`;
}

function niagaRegisterUrl(): string {
  const base = (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://qxk24.com').replace(/\/$/, '');
  return `${base}/niaga/daftar`;
}

function niagaChatUrl(): string {
  const base = (ENV.APP_URL || ENV.ADAM_WEB_BASE_URL || 'https://qxk24.com').replace(/\/$/, '');
  return `${base}/niaga/chat`;
}

export function isNiagaBillingEnforced(): boolean {
  if (!ENV.ADAM_NIAGA_BILLING_REQUIRED) return false;
  const stripe = getStripeGatewayStatus();
  return ENV.STRIPE_ENABLED && stripe.configured;
}

export async function resolveNiagaSubscriptionAccess(
  user: QXK24TokenPayload,
): Promise<NiagaSubscriptionAccess> {
  const usageEmpty = await getNiagaUsageSnapshot(user.userId, null);

  if (isFounderPayload(user)) {
    return {
      canChat:        true,
      active:         true,
      status:         'FOUNDER',
      registrationId: null,
      channelCode:    null,
      businessName:   null,
      usage:          usageEmpty,
    };
  }

  const reg = await getNiagaTraderByUser(user.userId);
  if (!reg) {
    return {
      canChat:        false,
      active:         false,
      status:         'NO_REGISTRATION',
      registrationId: null,
      channelCode:    null,
      businessName:   null,
      code:           'NIAGA_REGISTRATION_REQUIRED',
      message:        'Daftar sebagai peniaga ADAM Niaga dengan kod saluran rakan anda.',
      registerUrl:    niagaRegisterUrl(),
      monthlyMYR:     NIAGA_RETAIL_MONTHLY_MYR,
      usage:          usageEmpty,
    };
  }

  const base = {
    registrationId: reg.registrationId,
    channelCode:    reg.channelCode,
    businessName:   reg.businessName,
    monthlyMYR:     NIAGA_RETAIL_MONTHLY_MYR,
  };

  if (reg.status === NiagaTraderStatus.PENDING) {
    return {
      ...base,
      canChat:     false,
      active:      false,
      status:      'PENDING_PARTNER',
      code:        'NIAGA_PENDING_APPROVAL',
      message:     'Permohonan anda menunggu kelulusan rakan saluran.',
      registerUrl: niagaRegisterUrl(),
      usage:       await getNiagaUsageSnapshot(user.userId, null),
    };
  }

  if (reg.status === NiagaTraderStatus.REJECTED) {
    return {
      ...base,
      canChat:     false,
      active:      false,
      status:      'REJECTED',
      code:        'NIAGA_REGISTRATION_REJECTED',
      message:     reg.rejectReason ?? 'Pendaftaran ditolak. Hubungi rakan saluran anda.',
      registerUrl: niagaRegisterUrl(),
      usage:       await getNiagaUsageSnapshot(user.userId, null),
    };
  }

  if (reg.status === NiagaTraderStatus.SUSPENDED) {
    return {
      ...base,
      canChat:     false,
      active:      false,
      status:      'SUSPENDED',
      code:        'NIAGA_SUSPENDED',
      message:     'Akaun ADAM Niaga digantung. Hubungi rakan saluran atau QIUBBX.',
      usage:       await getNiagaUsageSnapshot(user.userId, null),
    };
  }

  const sub = await NiagaSubscriptionModel.findOne({
    registrationId: reg.registrationId,
    status:         NiagaSubscriptionStatus.ACTIVE,
  }).lean();

  const billingEnforced = isNiagaBillingEnforced();

  if (!sub && billingEnforced) {
    return {
      ...base,
      canChat:     false,
      active:      false,
      status:      reg.status === NiagaTraderStatus.APPROVED ? 'AWAITING_PAYMENT' : 'NO_SUBSCRIPTION',
      code:        'NIAGA_SUBSCRIPTION_REQUIRED',
      message:     'Bayar RM49.90/bulan untuk aktifkan ADAM Niaga.',
      upgradeUrl:  niagaUpgradeUrl(),
      usage:       await getNiagaUsageSnapshot(user.userId, null),
    };
  }

  if (!sub && !billingEnforced && reg.status === NiagaTraderStatus.APPROVED) {
    const usage = await getNiagaUsageSnapshot(user.userId, null);
    return {
      ...base,
      canChat:     true,
      active:      true,
      status:      'OPEN_LAB',
      message:     'Lab mode — billing belum enforced. Chat dibuka selepas kelulusan rakan.',
      upgradeUrl:  niagaUpgradeUrl(),
      usage,
    };
  }

  if (!sub) {
    return {
      ...base,
      canChat:     false,
      active:      false,
      status:      'NO_SUBSCRIPTION',
      code:        'NIAGA_SUBSCRIPTION_REQUIRED',
      message:     'Langganan ADAM Niaga diperlukan.',
      upgradeUrl:  niagaUpgradeUrl(),
      usage:       await getNiagaUsageSnapshot(user.userId, null),
    };
  }

  const usage = await getNiagaUsageSnapshot(user.userId, sub.subscriptionId);
  if (usage.monthlyLimitReached) {
    return {
      ...base,
      canChat:     false,
      active:      true,
      status:      'MONTHLY_CAP',
      code:        'NIAGA_MONTHLY_CAP',
      message:     `Had ${usage.messagesMonthlyCap} mesej/bulan dicapai. Tempoh seterusnya selepas ${usage.usageMonthKey}.`,
      upgradeUrl:  niagaChatUrl(),
      usage,
    };
  }

  return {
    ...base,
    canChat:  true,
    active:   true,
    status:   'ACTIVE',
    upgradeUrl: niagaChatUrl(),
    usage,
  };
}
