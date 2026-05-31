/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
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
  PENCARIAN   = 'PENCARIAN',
  PELAJAR     = 'PELAJAR',
  PROFESIONAL = 'PROFESIONAL',
  ENTERPRISE  = 'ENTERPRISE',
}

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
  cancelledAt:        Date | null;
  cancelReason:       string | null;
  neverDelete:        boolean;
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
    tier:               { type: String, enum: Object.values(SubscriptionTier), required: true },
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
    cancelledAt:        { type: Date, default: null },
    cancelReason:       { type: String, default: null },
    neverDelete:        { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'qxk24_subscriptions' },
);

SubscriptionSchema.index({ userId: 1, tier: 1 });
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ provider: 1, providerSubId: 1 });

export const SubscriptionModel = mongoose.model<ISubscription>(
  'Subscription',
  SubscriptionSchema,
);

export const FOUNDER_SUBSCRIPTION_ID = 'masa-bayu';
