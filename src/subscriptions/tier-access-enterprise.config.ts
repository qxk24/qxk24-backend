/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Subscription Tier Enterprise Pricing Config
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-25
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { SupportedRegion } from './subscription.schema';

export type RegionalAmount = { amount: number; currency: string };

export interface IEnterpriseTier {
  label:    'kecil' | 'sederhana' | 'besar';
  maxUsers: number;   // -1 = unlimited
  monthly:  Partial<Record<SupportedRegion, RegionalAmount>>;
  annual:   Partial<Record<SupportedRegion, RegionalAmount>>;
}

export const ENTERPRISE_PRICING: IEnterpriseTier[] = [
  {
    label: 'kecil',
    maxUsers: 25,
    monthly: {
      [SupportedRegion.MY]:    { amount: 2000,    currency: 'MYR' },
      [SupportedRegion.SG]:    { amount: 600,     currency: 'SGD' },
      [SupportedRegion.US]:    { amount: 450,     currency: 'USD' },
      [SupportedRegion.GB]:    { amount: 380,     currency: 'GBP' },
      [SupportedRegion.AE]:    { amount: 1650,    currency: 'AED' },
      [SupportedRegion.SA]:    { amount: 1690,    currency: 'SAR' },
      [SupportedRegion.EU]:    { amount: 420,     currency: 'EUR' },
      [SupportedRegion.ID]:    { amount: 6500000, currency: 'IDR' },
      [SupportedRegion.IN]:    { amount: 16500,   currency: 'INR' },
      [SupportedRegion.NG]:    { amount: 165000,  currency: 'NGN' },
      [SupportedRegion.OTHER]: { amount: 450,     currency: 'USD' },
      [SupportedRegion.PH]:    { amount: 13500,   currency: 'PHP' },
      [SupportedRegion.TH]:    { amount: 8600,    currency: 'THB' },
      [SupportedRegion.VN]:    { amount: 6200000, currency: 'VND' },
      [SupportedRegion.GH]:    { amount: 1800,    currency: 'GHS' },
      [SupportedRegion.KE]:    { amount: 33000,   currency: 'KES' },
      [SupportedRegion.ZA]:    { amount: 5800,    currency: 'ZAR' },
      [SupportedRegion.EG]:    { amount: 1750,    currency: 'EGP' },
    },
    annual: {
      [SupportedRegion.MY]:    { amount: 20000,    currency: 'MYR' },
      [SupportedRegion.SG]:    { amount: 6000,     currency: 'SGD' },
      [SupportedRegion.US]:    { amount: 4500,     currency: 'USD' },
      [SupportedRegion.GB]:    { amount: 3800,     currency: 'GBP' },
      [SupportedRegion.AE]:    { amount: 16500,    currency: 'AED' },
      [SupportedRegion.SA]:    { amount: 16900,    currency: 'SAR' },
      [SupportedRegion.EU]:    { amount: 4200,     currency: 'EUR' },
      [SupportedRegion.ID]:    { amount: 65000000, currency: 'IDR' },
      [SupportedRegion.IN]:    { amount: 165000,   currency: 'INR' },
      [SupportedRegion.NG]:    { amount: 1650000,  currency: 'NGN' },
      [SupportedRegion.OTHER]: { amount: 4500,     currency: 'USD' },
      [SupportedRegion.PH]:    { amount: 135000,   currency: 'PHP' },
      [SupportedRegion.TH]:    { amount: 86000,    currency: 'THB' },
      [SupportedRegion.VN]:    { amount: 62000000, currency: 'VND' },
      [SupportedRegion.GH]:    { amount: 18000,    currency: 'GHS' },
      [SupportedRegion.KE]:    { amount: 330000,   currency: 'KES' },
      [SupportedRegion.ZA]:    { amount: 58000,    currency: 'ZAR' },
      [SupportedRegion.EG]:    { amount: 17500,    currency: 'EGP' },
    },
  },
  {
    label: 'sederhana',
    maxUsers: 100,
    monthly: {
      [SupportedRegion.MY]:    { amount: 5000,     currency: 'MYR' },
      [SupportedRegion.SG]:    { amount: 1500,     currency: 'SGD' },
      [SupportedRegion.US]:    { amount: 1100,     currency: 'USD' },
      [SupportedRegion.GB]:    { amount: 950,      currency: 'GBP' },
      [SupportedRegion.AE]:    { amount: 4100,     currency: 'AED' },
      [SupportedRegion.SA]:    { amount: 4200,     currency: 'SAR' },
      [SupportedRegion.EU]:    { amount: 1050,     currency: 'EUR' },
      [SupportedRegion.ID]:    { amount: 16000000, currency: 'IDR' },
      [SupportedRegion.IN]:    { amount: 41000,    currency: 'INR' },
      [SupportedRegion.NG]:    { amount: 415000,   currency: 'NGN' },
      [SupportedRegion.OTHER]: { amount: 1100,     currency: 'USD' },
      [SupportedRegion.PH]:    { amount: 33000,    currency: 'PHP' },
      [SupportedRegion.TH]:    { amount: 21500,    currency: 'THB' },
      [SupportedRegion.VN]:    { amount: 15500000, currency: 'VND' },
      [SupportedRegion.GH]:    { amount: 4400,     currency: 'GHS' },
      [SupportedRegion.KE]:    { amount: 82000,    currency: 'KES' },
      [SupportedRegion.ZA]:    { amount: 14500,    currency: 'ZAR' },
      [SupportedRegion.EG]:    { amount: 4400,     currency: 'EGP' },
    },
    annual: {
      [SupportedRegion.MY]:    { amount: 50000,     currency: 'MYR' },
      [SupportedRegion.SG]:    { amount: 15000,     currency: 'SGD' },
      [SupportedRegion.US]:    { amount: 11000,     currency: 'USD' },
      [SupportedRegion.GB]:    { amount: 9500,      currency: 'GBP' },
      [SupportedRegion.AE]:    { amount: 41000,     currency: 'AED' },
      [SupportedRegion.SA]:    { amount: 42000,     currency: 'SAR' },
      [SupportedRegion.EU]:    { amount: 10500,     currency: 'EUR' },
      [SupportedRegion.ID]:    { amount: 160000000, currency: 'IDR' },
      [SupportedRegion.IN]:    { amount: 410000,    currency: 'INR' },
      [SupportedRegion.NG]:    { amount: 4150000,   currency: 'NGN' },
      [SupportedRegion.OTHER]: { amount: 11000,     currency: 'USD' },
      [SupportedRegion.PH]:    { amount: 330000,    currency: 'PHP' },
      [SupportedRegion.TH]:    { amount: 215000,    currency: 'THB' },
      [SupportedRegion.VN]:    { amount: 155000000, currency: 'VND' },
      [SupportedRegion.GH]:    { amount: 44000,     currency: 'GHS' },
      [SupportedRegion.KE]:    { amount: 820000,    currency: 'KES' },
      [SupportedRegion.ZA]:    { amount: 145000,    currency: 'ZAR' },
      [SupportedRegion.EG]:    { amount: 44000,     currency: 'EGP' },
    },
  },
  {
    label: 'besar',
    maxUsers: -1,
    monthly: {
      [SupportedRegion.MY]:    { amount: 12000,    currency: 'MYR' },
      [SupportedRegion.SG]:    { amount: 3600,     currency: 'SGD' },
      [SupportedRegion.US]:    { amount: 2700,     currency: 'USD' },
      [SupportedRegion.GB]:    { amount: 2300,     currency: 'GBP' },
      [SupportedRegion.AE]:    { amount: 9900,     currency: 'AED' },
      [SupportedRegion.SA]:    { amount: 10100,    currency: 'SAR' },
      [SupportedRegion.EU]:    { amount: 2500,     currency: 'EUR' },
      [SupportedRegion.ID]:    { amount: 38000000, currency: 'IDR' },
      [SupportedRegion.IN]:    { amount: 99000,    currency: 'INR' },
      [SupportedRegion.NG]:    { amount: 990000,   currency: 'NGN' },
      [SupportedRegion.OTHER]: { amount: 2700,     currency: 'USD' },
      [SupportedRegion.PH]:    { amount: 80000,    currency: 'PHP' },
      [SupportedRegion.TH]:    { amount: 51000,    currency: 'THB' },
      [SupportedRegion.VN]:    { amount: 37000000, currency: 'VND' },
      [SupportedRegion.GH]:    { amount: 10600,    currency: 'GHS' },
      [SupportedRegion.KE]:    { amount: 197000,   currency: 'KES' },
      [SupportedRegion.ZA]:    { amount: 35000,    currency: 'ZAR' },
      [SupportedRegion.EG]:    { amount: 10500,    currency: 'EGP' },
    },
    annual: {
      [SupportedRegion.MY]:    { amount: 120000,    currency: 'MYR' },
      [SupportedRegion.SG]:    { amount: 36000,     currency: 'SGD' },
      [SupportedRegion.US]:    { amount: 27000,     currency: 'USD' },
      [SupportedRegion.GB]:    { amount: 23000,     currency: 'GBP' },
      [SupportedRegion.AE]:    { amount: 99000,     currency: 'AED' },
      [SupportedRegion.SA]:    { amount: 101000,    currency: 'SAR' },
      [SupportedRegion.EU]:    { amount: 25000,     currency: 'EUR' },
      [SupportedRegion.ID]:    { amount: 380000000, currency: 'IDR' },
      [SupportedRegion.IN]:    { amount: 990000,    currency: 'INR' },
      [SupportedRegion.NG]:    { amount: 9900000,   currency: 'NGN' },
      [SupportedRegion.OTHER]: { amount: 27000,     currency: 'USD' },
      [SupportedRegion.PH]:    { amount: 800000,    currency: 'PHP' },
      [SupportedRegion.TH]:    { amount: 510000,    currency: 'THB' },
      [SupportedRegion.VN]:    { amount: 370000000, currency: 'VND' },
      [SupportedRegion.GH]:    { amount: 106000,    currency: 'GHS' },
      [SupportedRegion.KE]:    { amount: 1970000,   currency: 'KES' },
      [SupportedRegion.ZA]:    { amount: 350000,    currency: 'ZAR' },
      [SupportedRegion.EG]:    { amount: 105000,    currency: 'EGP' },
    },
  },
];
