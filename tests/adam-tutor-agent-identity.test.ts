/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Identity Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  formatIcNumberDisplay,
  formatMalaysiaAddressDisplay,
  formatMalaysiaPhoneDisplay,
  normalizeAgentMalaysiaAddress,
  normalizeAgentPayoutIdentity,
  normalizeIcNumber,
  normalizeMalaysiaPhone,
  normalizePostcode,
  validateAgentPayoutIdentity,
  validateAgentRegistrationInput,
  validateIcNumber,
  validateMalaysiaPhone,
  validatePostcode,
  validateTaxId,
} from '../src/adam/tutor/adam-tutor-agent-identity';

describe('adam-tutor agent payout identity', () => {
  const valid = {
    phone:             '012-345 6789',
    addressLine1:      'No. 12, Jalan Merdeka',
    addressLine2:      'Taman Seri Indah',
    postcode:          '43000',
    city:              'Kajang',
    state:             'Selangor',
    icNumber:          '900101-01-5432',
    taxId:             'c1234567890',
    bankName:          'Maybank',
    bankAccountNumber: '5123 4567 8901',
    bankAccountHolder: 'Ali Bin Abu',
  };

  it('normalizes IC, tax ID, phone, address, and bank account', () => {
    const payout = normalizeAgentPayoutIdentity(valid);
    expect(payout.icNumber).toBe('900101015432');
    expect(payout.taxId).toBe('C1234567890');

    const address = normalizeAgentMalaysiaAddress(valid);
    expect(address.postcode).toBe('43000');
    expect(address.city).toBe('Kajang');
    expect(address.state).toBe('Selangor');

    expect(normalizeMalaysiaPhone('0123456789')).toBe('+60123456789');
    expect(formatMalaysiaPhoneDisplay('+60123456789')).toBe('+60 12-3456 789');
  });

  it('formats IC and full Malaysia address for display', () => {
    expect(formatIcNumberDisplay('900101015432')).toBe('900101-01-5432');
    expect(normalizeIcNumber('900101-01-5432')).toBe('900101015432');
    expect(formatMalaysiaAddressDisplay(valid)).toContain('43000 Kajang');
    expect(formatMalaysiaAddressDisplay(valid)).toContain('Malaysia');
  });

  it('accepts valid registration input', () => {
    expect(validateAgentRegistrationInput(valid)).toBeNull();
    expect(validateAgentPayoutIdentity(valid)).toBeNull();
  });

  it('rejects invalid IC length', () => {
    expect(validateIcNumber('123')).toMatch(/12 digit/);
  });

  it('rejects invalid tax ID format', () => {
    expect(validateTaxId('ABC')).toMatch(/10–20/);
    expect(validateTaxId('INVALID123')).toMatch(/Format TIN/);
  });

  it('rejects invalid Malaysia phone and postcode', () => {
    expect(validateMalaysiaPhone('12345')).toMatch(/Malaysia/);
    expect(validatePostcode('123')).toMatch(/5 digit/);
  });

  it('rejects short bank account', () => {
    expect(
      validateAgentPayoutIdentity({ ...valid, bankAccountNumber: '123' }),
    ).toMatch(/8–20 digit/);
  });
});
