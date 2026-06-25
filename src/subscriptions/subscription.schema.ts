/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Subscription Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-31
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';

export enum SubscriptionTier {
  /** Free registered tier (public name: Basic) */
  BASIC       = 'BASIC',
  /** Public Pro — all users; not the closed tutor pelajar lane */
  PRO         = 'PRO',
  /** Public Premium (public name: Premium) */
  PROFESIONAL = 'PROFESIONAL',
  ENTERPRISE  = 'ENTERPRISE',
  TESTER      = 'TESTER',
  /** Closed MLM channel — not on public pricing */
  TUTOR       = 'TUTOR',
}

/** Legacy Mongo value — was misnamed “Pelajar”; maps to Pro for everyone */
export const LEGACY_SUBSCRIPTION_TIER_PELAJAR = 'PELAJAR' as const;

/** Legacy Mongo value before BASIC rename */
export const LEGACY_SUBSCRIPTION_TIER_PENCARIAN = 'PENCARIAN' as const;

export function normalizeSubscriptionTier(
  tier: string | SubscriptionTier | null | undefined,
): SubscriptionTier {
  if (!tier || tier === LEGACY_SUBSCRIPTION_TIER_PENCARIAN) {
    return SubscriptionTier.BASIC;
  }
  if (tier === LEGACY_SUBSCRIPTION_TIER_PELAJAR) {
    return SubscriptionTier.PRO;
  }
  return tier as SubscriptionTier;
}

/** Checkout/query aliases → canonical subscription tier (DB + billing). */
export function resolveCheckoutTier(
  raw: string | null | undefined,
): SubscriptionTier | null {
  const t = (raw ?? '').trim().toUpperCase();
  if (t === 'PRO' || t === LEGACY_SUBSCRIPTION_TIER_PELAJAR) {
    return SubscriptionTier.PRO;
  }
  if (t === 'PREMIUM') return SubscriptionTier.PROFESIONAL;
  if (t === 'BASIC' || t === LEGACY_SUBSCRIPTION_TIER_PENCARIAN) {
    return SubscriptionTier.BASIC;
  }
  if (Object.values(SubscriptionTier).includes(t as SubscriptionTier)) {
    return t as SubscriptionTier;
  }
  return null;
}

/** Mongo filter — Basic tier rows (current + legacy). */
export const BASIC_TIER_DB_IN = [
  SubscriptionTier.BASIC,
  LEGACY_SUBSCRIPTION_TIER_PENCARIAN,
] as const;

/** Mongo filter — Pro tier rows (current + legacy PELAJAR). */
export const PRO_TIER_DB_IN = [
  SubscriptionTier.PRO,
  LEGACY_SUBSCRIPTION_TIER_PELAJAR,
] as const;

/** Tier values accepted in Mongo (includes legacy PENCARIAN rows). */
export const SUBSCRIPTION_TIER_DB_VALUES = [
  ...Object.values(SubscriptionTier),
  LEGACY_SUBSCRIPTION_TIER_PENCARIAN,
  LEGACY_SUBSCRIPTION_TIER_PELAJAR,
] as const;

export enum BillingCycle {
  MONTHLY    = 'MONTHLY',
  ANNUAL     = 'ANNUAL',
  ONE_TIME   = 'ONE_TIME',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE    = 'ACTIVE',
  PENDING   = 'PENDING',
  PAUSED    = 'PAUSED',
  CANCELLED = 'CANCELLED',
  EXPIRED   = 'EXPIRED',
  WAQF      = 'WAQF',
}

export enum PaymentProvider {
  FOUNDER_WAQF = 'FOUNDER_WAQF',
  RAZORPAY     = 'RAZORPAY',
  STRIPE       = 'STRIPE',
  XENDIT       = 'XENDIT',
  PAYSTACK     = 'PAYSTACK',
  CURLEC       = 'CURLEC',
  PADDLE       = 'PADDLE',
  MANUAL       = 'MANUAL',
}

export enum SupportedRegion {
  MY    = 'MY',
  SG    = 'SG',
  ID    = 'ID',
  PH    = 'PH',
  TH    = 'TH',
  VN    = 'VN',
  GB    = 'GB',
  US    = 'US',
  AE    = 'AE',
  SA    = 'SA',
  NG    = 'NG',
  GH    = 'GH',
  KE    = 'KE',
  ZA    = 'ZA',
  EG    = 'EG',
  IN    = 'IN',
  EU    = 'EU',
  OTHER = 'OTHER',
}

/** ADAM Tutor — school level determines monthly MYR (Layer 1 pelajar lane). */
export type TutorSubscriptionLevel = 'primary' | 'secondary' | 'university';

/** Kod-daftar agent wholesale vs public retail monthly billing. */
export type TutorSubscriptionPricingChannel = 'agent' | 'public';

export enum PencarianStage {
  KNOW    = 'KNOW',
  CLOSER  = 'CLOSER',
  BONDING = 'BONDING',
}

export interface IPencarianUsage {
  totalMessagesUsed:      number;
  totalMessagesLimit:     number;
  extensionsPurchased:    number;
  extensionMessagesAdded: number;
  currentStage:           PencarianStage;
  stageDetectedAt: {
    know:    Date | null;
    closer:  Date | null;
    bonding: Date | null;
  };
  warningShownAt:      Date | null;
  limitReachedAt:      Date | null;
  limitReachedSession: string | null;
  invitationShownAt:   Date | null;
  convertedToPelajar:  boolean;
  convertedAt:         Date | null;
  extensionHistory: Array<{
    purchasedAt:   Date;
    messagesAdded: number;
    provider:      PaymentProvider;
    transactionId: string;
    amountPaid:    number;
    currency:      string;
  }>;
}

export interface ITierAccess {
  memoryLevel:          'session' | 'basic' | 'full' | 'organisational';
  episodicRecords:      boolean;
  relationalArc:        boolean;
  continuityBridge:     boolean;
  presenceLayer:        boolean;
  unresolvedHoldings:   boolean;
  apiAccess:            boolean;
  apiCallsPerMonth:     number;
  publishingRights:     boolean;
  customWorkspace:      boolean;
  whiteLabel:           boolean;
  supportLevel:         'community' | 'email' | 'priority' | 'dedicated';
  maxUsers:             number;
}

export interface ISubscription extends Document {
  userId:             string;
  founderId:          string;
  tier:               SubscriptionTier;
  /** Set when tier is TUTOR — primary / secondary / university pricing band */
  tutorLevel:         TutorSubscriptionLevel | null;
  status:             SubscriptionStatus;
  billingCycle:       BillingCycle;
  region:             SupportedRegion;
  currency:           string;
  amountPerCycle:     number;
  provider:           PaymentProvider;
  providerSubId:      string | null;
  providerCustomerId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd:   Date | null;
  access:             ITierAccess;
  pencarianUsage:     IPencarianUsage | null;
  isFounderFunded:    boolean;
  enterpriseNotes:    string | null;
  preferredLanguage:  string | null;
  cancelledAt:        Date | null;
  cancelReason:       string | null;
  neverDelete:        boolean;
  /** Tutor kod-daftar: agent USD 15.90 vs public USD 19. */
  pricingChannel:     TutorSubscriptionPricingChannel | null;
  agentPriceEndsAt:   Date | null;
  tutorEnrollmentId:  string | null;
  createdAt:          Date;
  updatedAt:          Date;
}

const PencarianUsageSchema = new Schema<IPencarianUsage>({
  totalMessagesUsed:      { type: Number, default: 0 },
  totalMessagesLimit:     { type: Number, default: 100 },
  extensionsPurchased:    { type: Number, default: 0 },
  extensionMessagesAdded: { type: Number, default: 0 },
  currentStage:           { type: String, enum: Object.values(PencarianStage), default: PencarianStage.KNOW },
  stageDetectedAt: {
    know:    { type: Date, default: null },
    closer:  { type: Date, default: null },
    bonding: { type: Date, default: null },
  },
  warningShownAt:      { type: Date, default: null },
  limitReachedAt:      { type: Date, default: null },
  limitReachedSession: { type: String, default: null },
  invitationShownAt:   { type: Date, default: null },
  convertedToPelajar:  { type: Boolean, default: false },
  convertedAt:         { type: Date, default: null },
  extensionHistory: [{
    purchasedAt:   { type: Date },
    messagesAdded: { type: Number },
    provider:      { type: String },
    transactionId: { type: String },
    amountPaid:    { type: Number },
    currency:      { type: String },
  }],
}, { _id: false });

const TierAccessSchema = new Schema<ITierAccess>({
  memoryLevel:          { type: String },
  episodicRecords:      { type: Boolean },
  relationalArc:        { type: Boolean },
  continuityBridge:     { type: Boolean },
  presenceLayer:        { type: Boolean },
  unresolvedHoldings:   { type: Boolean },
  apiAccess:            { type: Boolean },
  apiCallsPerMonth:     { type: Number },
  publishingRights:     { type: Boolean },
  customWorkspace:      { type: Boolean },
  whiteLabel:           { type: Boolean },
  supportLevel:         { type: String },
  maxUsers:             { type: Number },
}, { _id: false });

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId:             { type: String, required: true, index: true },
    founderId:          { type: String, required: true },
    tier:               { type: String, enum: SUBSCRIPTION_TIER_DB_VALUES, required: true },
    tutorLevel:         { type: String, enum: ['primary', 'secondary', 'university'], default: null },
    status:             { type: String, enum: Object.values(SubscriptionStatus), default: SubscriptionStatus.ACTIVE },
    billingCycle:       { type: String, enum: Object.values(BillingCycle), required: true },
    region:             { type: String, enum: Object.values(SupportedRegion), default: SupportedRegion.OTHER },
    currency:           { type: String, required: true },
    amountPerCycle:     { type: Number, required: true },
    provider:           { type: String, enum: Object.values(PaymentProvider), required: true },
    providerSubId:      { type: String, default: null },
    providerCustomerId: { type: String, default: null },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd:   { type: Date, default: null },
    access:             { type: TierAccessSchema, required: true },
    pencarianUsage:     { type: PencarianUsageSchema, default: null },
    isFounderFunded:    { type: Boolean, default: false },
    enterpriseNotes:    { type: String, default: null },
    preferredLanguage:  { type: String, default: null },
    cancelledAt:        { type: Date, default: null },
    cancelReason:       { type: String, default: null },
    neverDelete:        { type: Boolean, default: true },
    pricingChannel:     { type: String, enum: ['agent', 'public'], default: null },
    agentPriceEndsAt:   { type: Date, default: null },
    tutorEnrollmentId:  { type: String, default: null, index: true },
  },
  { timestamps: true, collection: 'alamtologi_subscriptions' },
);

SubscriptionSchema.index({ userId: 1, tier: 1 });
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ provider: 1, providerSubId: 1 });

export const SubscriptionModel = mongoose.model<ISubscription>(
  'Subscription',
  SubscriptionSchema,
);

export const FOUNDER_SUBSCRIPTION_ID = 'masa-bayu';
