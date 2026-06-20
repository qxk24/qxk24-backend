/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Schema
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';
import type { TutorSubscriptionLevel } from '../../subscriptions/subscription.schema';
import {
  TutorAgentPackageStatus,
  type TutorAgentPackageTier,
} from './adam-tutor-agent-package.config';

export enum TutorAgentStatus {
  ACTIVE    = 'active',
  SUSPENDED = 'suspended',
}

export interface ITutorAgent extends Document {
  agentId:            string;
  agentCode:          string;
  portalToken:        string;
  orgName:            string;
  contactName:        string;
  email:              string;
  phone:              string | null;
  icNumber:           string | null;
  taxId:              string | null;
  bankName:           string | null;
  bankAccountNumber:  string | null;
  bankAccountHolder:  string | null;
  addressLine1:       string | null;
  addressLine2:       string | null;
  postcode:           string | null;
  city:               string | null;
  state:              string;
  /** School band this agent distributes — primary / secondary / university. */
  band:               TutorSubscriptionLevel | null;
  packageTier:        TutorAgentPackageTier | null;
  packageStatus:      TutorAgentPackageStatus;
  pinBalance:         number;
  pinPurchasedTotal:  number;
  packagePaidAt:      Date | null;
  packageStripeSessionId: string | null;
  commissionPercent:  number;
  walletBalanceMyr:   number;
  status:             TutorAgentStatus;
  /** Lowercase student login id — same as agentId, for marketing demo account. */
  marketingStudentUserId: string | null;
  createdBy:          string;
  notes:              string | null;
  createdAt:          Date;
  updatedAt:          Date;
}

const TutorAgentSchema = new Schema<ITutorAgent>(
  {
    agentId:           { type: String, required: true, unique: true, index: true },
    agentCode:         { type: String, required: true, unique: true, index: true },
    portalToken:       { type: String, required: true, index: true },
    orgName:           { type: String, required: true },
    contactName:       { type: String, required: true },
    email:             { type: String, required: true, lowercase: true, trim: true },
    phone:             { type: String, default: null },
    icNumber:          { type: String, default: null, index: true },
    taxId:             { type: String, default: null },
    bankName:          { type: String, default: null },
    bankAccountNumber: { type: String, default: null },
    bankAccountHolder: { type: String, default: null },
    addressLine1:      { type: String, default: null },
    addressLine2:      { type: String, default: null },
    postcode:          { type: String, default: null, index: true },
    city:              { type: String, default: null },
    state:             { type: String, required: true },
    band:              {
      type: String,
      enum: ['primary', 'secondary', 'university', null],
      default: null,
      index: true,
    },
    packageTier:       {
      type: String,
      enum: ['silver', 'gold', 'diamond', 'platinum', null],
      default: null,
    },
    packageStatus:     {
      type:    String,
      enum:    Object.values(TutorAgentPackageStatus),
      default: TutorAgentPackageStatus.LEGACY,
      index:   true,
    },
    pinBalance:        { type: Number, default: 0, min: 0 },
    pinPurchasedTotal: { type: Number, default: 0, min: 0 },
    packagePaidAt:     { type: Date, default: null },
    packageStripeSessionId: { type: String, default: null, index: true },
    commissionPercent: { type: Number, default: 20, min: 0, max: 50 },
    walletBalanceMyr:  { type: Number, default: 0 },
    marketingStudentUserId: { type: String, default: null, index: true },
    status:            {
      type:    String,
      enum:    Object.values(TutorAgentStatus),
      default: TutorAgentStatus.ACTIVE,
      index:   true,
    },
    createdBy:         { type: String, required: true },
    notes:             { type: String, default: null },
  },
  { timestamps: true, collection: 'adam_tutor_agents' },
);

export const TutorAgentModel = mongoose.model<ITutorAgent>(
  'TutorAgent',
  TutorAgentSchema,
);
