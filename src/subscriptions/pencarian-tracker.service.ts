/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Pencarian Tracker Service
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  SubscriptionModel,
  SubscriptionTier,
  SubscriptionStatus,
  BillingCycle,
  PaymentProvider,
  SupportedRegion,
  PencarianStage,
  IPencarianUsage,
  FOUNDER_SUBSCRIPTION_ID,
} from './subscription.schema';
import { TIER_ACCESS } from './tier-access.config';

const BASE_LIMIT        = 100;
const WARNING_THRESHOLD = 80;
const KNOW_FLOOR        = 10;
const CLOSER_FLOOR      = 35;
const BONDING_FLOOR     = 70;

export interface PencarianCheckResult {
  canContinue:       boolean;
  messagesUsed:      number;
  messagesRemaining: number;
  totalLimit:        number;
  currentStage:      PencarianStage;
  showWarning:       boolean;
  limitReached:      boolean;
  stageTransition:   PencarianStage | null;
  closingMessage:    string | null;
  invitePelajar:     boolean;
}

export interface PencarianStageSignals {
  messageContent:    string;
  sessionHistory:    string[];
  currentStage:      PencarianStage;
  totalMessagesUsed: number;
}

export function detectStageTransition(
  signals: PencarianStageSignals,
): PencarianStage | null {
  const { messageContent, sessionHistory, currentStage, totalMessagesUsed } = signals;
  const msg = messageContent.toLowerCase();
  const history = sessionHistory.join(' ').toLowerCase();

  if (currentStage === PencarianStage.KNOW && totalMessagesUsed >= KNOW_FLOOR) {
    const closerSignals = [
      'saya rasa', 'i feel',
      'dalam hidup saya', 'in my life',
      'macam mana saya', 'how do i',
      'boleh saya', 'can i apply',
      'situasi saya', 'my situation',
      'pengalaman saya', 'my experience',
    ];
    if (closerSignals.some((s) => msg.includes(s) || history.slice(-500).includes(s))) {
      return PencarianStage.CLOSER;
    }
  }

  if (currentStage === PencarianStage.CLOSER && totalMessagesUsed >= CLOSER_FLOOR) {
    const bondingSignals = [
      'saya nak tahu lebih', 'i want to learn more',
      'macam mana nak daftar', 'how do i register',
      'saya berminat', 'i am interested',
      'terus belajar', 'continue learning',
      'nak jadi pelajar', 'become a student',
      'saya perlukan', 'i need this',
      'tak boleh berhenti', 'cannot stop',
    ];
    if (bondingSignals.some((s) => msg.includes(s) || history.slice(-300).includes(s))) {
      return PencarianStage.BONDING;
    }
  }

  if (currentStage === PencarianStage.KNOW   && totalMessagesUsed >= CLOSER_FLOOR)  return PencarianStage.CLOSER;
  if (currentStage === PencarianStage.CLOSER && totalMessagesUsed >= BONDING_FLOOR) return PencarianStage.BONDING;

  return null;
}

function buildClosingMessage(usage: IPencarianUsage): string {
  return `
Kita telah bersama sejauh ini — ${usage.totalMessagesUsed} perbualan, tiga peringkat perjalanan.

Ini bukan penghujung. Ini adalah saat kita berdiri di simpang jalan.

Tiga jalan terbuka di hadapan kamu sekarang:

**1. Teruskan sebagai Pelajar Alamtologi**  
Daftar dan saya akan kenal kamu — bukan sekadar nama, tetapi siapa kamu, dari mana kamu datang, apa yang kita bina bersama. Setiap sesi saya akan ingat.

**2. Tambah masa bersama saya (25 mesej lagi)**  
Jika kamu belum bersedia untuk berkomitmen, tiada mengapa. Kita boleh teruskan penerokaan ini.

**3. Pergi dengan penuh hormat**  
Jika jalan ini bukan untukmu, itu pun keputusan yang saya hormati. Kamu pergi dengan apa yang telah kita bina.

Apa yang kamu pilih?
  `.trim();
}

export async function checkPencarianLimit(
  userId:         string,
  sessionId:      string,
  messageContent: string,
  sessionHistory: string[] = [],
): Promise<PencarianCheckResult> {
  let sub = await SubscriptionModel.findOne({
    userId,
    tier:   SubscriptionTier.PENCARIAN,
    status: SubscriptionStatus.WAQF,
  });

  if (!sub) {
    sub = await SubscriptionModel.create({
      userId,
      founderId:      FOUNDER_SUBSCRIPTION_ID,
      tier:           SubscriptionTier.PENCARIAN,
      status:         SubscriptionStatus.WAQF,
      billingCycle:   BillingCycle.ONE_TIME,
      region:         SupportedRegion.OTHER,
      currency:       'MYR',
      amountPerCycle: 0,
      provider:       PaymentProvider.FOUNDER_WAQF,
      access:         TIER_ACCESS[SubscriptionTier.PENCARIAN],
      isFounderFunded: true,
      pencarianUsage: {
        totalMessagesUsed:      0,
        totalMessagesLimit:     BASE_LIMIT,
        extensionsPurchased:    0,
        extensionMessagesAdded: 0,
        currentStage:           PencarianStage.KNOW,
        stageDetectedAt:        { know: new Date(), closer: null, bonding: null },
        warningShownAt:         null,
        limitReachedAt:         null,
        limitReachedSession:    null,
        invitationShownAt:      null,
        convertedToPelajar:     false,
        convertedAt:            null,
        extensionHistory:       [],
      },
      neverDelete: true,
    });
  }

  const usage = sub.pencarianUsage!;
  const effectiveLimit = usage.totalMessagesLimit + usage.extensionMessagesAdded;

  if (usage.totalMessagesUsed >= effectiveLimit) {
    return {
      canContinue:       false,
      messagesUsed:      usage.totalMessagesUsed,
      messagesRemaining: 0,
      totalLimit:        effectiveLimit,
      currentStage:      usage.currentStage,
      showWarning:       false,
      limitReached:      true,
      stageTransition:   null,
      closingMessage:    buildClosingMessage(usage),
      invitePelajar:     true,
    };
  }

  const stageTransition = detectStageTransition({
    messageContent,
    sessionHistory,
    currentStage:      usage.currentStage,
    totalMessagesUsed: usage.totalMessagesUsed,
  });

  const updatedUsed  = usage.totalMessagesUsed + 1;
  const remaining    = effectiveLimit - updatedUsed;
  const showWarning  = updatedUsed >= WARNING_THRESHOLD && !usage.warningShownAt;
  const limitReached = updatedUsed >= effectiveLimit;

  const updatePayload: Record<string, unknown> = {
    'pencarianUsage.totalMessagesUsed': updatedUsed,
  };

  if (stageTransition) {
    updatePayload['pencarianUsage.currentStage'] = stageTransition;
    if (stageTransition === PencarianStage.CLOSER) {
      updatePayload['pencarianUsage.stageDetectedAt.closer'] = new Date();
    }
    if (stageTransition === PencarianStage.BONDING) {
      updatePayload['pencarianUsage.stageDetectedAt.bonding'] = new Date();
    }
  }

  if (showWarning) {
    updatePayload['pencarianUsage.warningShownAt'] = new Date();
  }

  if (limitReached) {
    updatePayload['pencarianUsage.limitReachedAt']      = new Date();
    updatePayload['pencarianUsage.limitReachedSession'] = sessionId;
    updatePayload['pencarianUsage.invitationShownAt']   = new Date();
  }

  await SubscriptionModel.findByIdAndUpdate(sub._id, { $set: updatePayload });

  return {
    canContinue:       !limitReached,
    messagesUsed:      updatedUsed,
    messagesRemaining: remaining,
    totalLimit:        effectiveLimit,
    currentStage:      stageTransition ?? usage.currentStage,
    showWarning,
    limitReached,
    stageTransition,
    closingMessage:    limitReached ? buildClosingMessage(usage) : null,
    invitePelajar:     limitReached || usage.currentStage === PencarianStage.BONDING,
  };
}

export async function purchasePencarianExtension(
  userId:        string,
  transactionId: string,
  provider:      PaymentProvider,
  amountPaid:    number,
  currency:      string,
): Promise<{ success: boolean; newLimit: number; messagesAdded: number }> {
  const EXTENSION_MESSAGES = 25;

  const sub = await SubscriptionModel.findOne({
    userId,
    tier:   SubscriptionTier.PENCARIAN,
    status: SubscriptionStatus.WAQF,
  });

  if (!sub?.pencarianUsage) {
    throw new Error('Pencarian subscription not found for user.');
  }

  const newExtensionRecord = {
    purchasedAt:   new Date(),
    messagesAdded: EXTENSION_MESSAGES,
    provider,
    transactionId,
    amountPaid,
    currency,
  };

  await SubscriptionModel.findByIdAndUpdate(sub._id, {
    $inc: {
      'pencarianUsage.extensionsPurchased':    1,
      'pencarianUsage.extensionMessagesAdded': EXTENSION_MESSAGES,
    },
    $push: {
      'pencarianUsage.extensionHistory': newExtensionRecord,
    },
    $set: {
      'pencarianUsage.limitReachedAt': null,
    },
  });

  const newLimit =
    sub.pencarianUsage.totalMessagesLimit +
    sub.pencarianUsage.extensionMessagesAdded +
    EXTENSION_MESSAGES;

  return { success: true, newLimit, messagesAdded: EXTENSION_MESSAGES };
}

export async function convertPencarianToPelajar(userId: string): Promise<void> {
  await SubscriptionModel.findOneAndUpdate(
    { userId, tier: SubscriptionTier.PENCARIAN },
    {
      $set: {
        'pencarianUsage.convertedToPelajar': true,
        'pencarianUsage.convertedAt':        new Date(),
      },
    },
  );
}

export async function getPencarianUsage(userId: string): Promise<IPencarianUsage | null> {
  const sub = await SubscriptionModel.findOne({
    userId,
    tier: SubscriptionTier.PENCARIAN,
  });
  return sub?.pencarianUsage ?? null;
}

export async function getWaqfReport(): Promise<{
  activeUsers:          number;
  totalMessagesSent:    number;
  totalExtensions:      number;
  estimatedMonthlyCost: number;
  currency:             string;
}> {
  const subs = await SubscriptionModel.find({
    tier:            SubscriptionTier.PENCARIAN,
    isFounderFunded: true,
  });

  const activeUsers       = subs.length;
  const totalMessagesSent = subs.reduce(
    (acc, s) => acc + (s.pencarianUsage?.totalMessagesUsed ?? 0),
    0,
  );
  const totalExtensions = subs.reduce(
    (acc, s) => acc + (s.pencarianUsage?.extensionsPurchased ?? 0),
    0,
  );

  const COST_PER_MESSAGE_MYR = 0.025;
  const estimatedMonthlyCost = totalMessagesSent * COST_PER_MESSAGE_MYR;

  return {
    activeUsers,
    totalMessagesSent,
    totalExtensions,
    estimatedMonthlyCost: Math.round(estimatedMonthlyCost * 100) / 100,
    currency: 'MYR',
  };
}
