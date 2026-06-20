/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Identity & Payout Fields
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-19
 * ============================================================
 */

export const MALAYSIA_STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Perak',
  'Perlis',
  'Pulau Pinang',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
  'Wilayah Persekutuan Kuala Lumpur',
  'Wilayah Persekutuan Labuan',
  'Wilayah Persekutuan Putrajaya',
] as const;

export type MalaysiaState = (typeof MALAYSIA_STATES)[number];

export const MALAYSIA_AGENT_BANKS = [
  'Maybank',
  'CIMB Bank',
  'Public Bank',
  'RHB Bank',
  'Hong Leong Bank',
  'AmBank',
  'Bank Islam',
  'Bank Rakyat',
  'Affin Bank',
  'Alliance Bank',
  'OCBC Bank',
  'HSBC Bank',
  'Standard Chartered',
  'UOB Bank',
  'Agrobank',
  'Other',
] as const;

export function normalizeIcNumber(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 12);
}

export function validateIcNumber(raw: string): string | null {
  const ic = normalizeIcNumber(raw);
  if (ic.length !== 12) return 'Nombor IC mesti 12 digit (MyKad).';
  const month = Number(ic.slice(2, 4));
  const day = Number(ic.slice(4, 6));
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return 'Nombor IC tidak sah (tarikh lahir).';
  }
  return null;
}

export function formatIcNumberDisplay(ic: string): string {
  const digits = normalizeIcNumber(ic);
  if (digits.length !== 12) return ic;
  return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
}

export function normalizeTaxId(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function validateTaxId(raw: string): string | null {
  const taxId = normalizeTaxId(raw);
  if (taxId.length < 10 || taxId.length > 20) {
    return 'No. Cukai (TIN) mesti 10–20 aksara.';
  }
  if (!/^[A-Z0-9-]+$/.test(taxId)) {
    return 'No. Cukai (TIN) hanya huruf, nombor, dan sempang.';
  }
  if (!/^[A-Z]{1,2}\d/.test(taxId) && !/^IG\d/.test(taxId)) {
    return 'Format TIN Malaysia: C/CS/D/E/F/FA/PT/TA/TB/TC/TP/TR/TT/J/LE + nombor, atau IG (individu).';
  }
  return null;
}

export function normalizeMalaysiaPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('60')) return `+${digits}`;
  if (digits.startsWith('0')) return `+60${digits.slice(1)}`;
  if (digits.length >= 9 && digits.length <= 11) return `+60${digits}`;
  return digits ? `+${digits}` : '';
}

export function validateMalaysiaPhone(raw: string): string | null {
  const normalized = normalizeMalaysiaPhone(raw);
  const digits = normalized.replace(/\D/g, '');
  if (!digits.startsWith('60')) return 'No. telefon mesti nombor Malaysia (+60).';
  const local = digits.slice(2);
  if (local.length < 9 || local.length > 10) {
    return 'No. telefon Malaysia mesti 9–10 digit selepas kod negara (+60).';
  }
  if (!/^[1-9]/.test(local)) return 'No. telefon tidak sah.';
  return null;
}

export function formatMalaysiaPhoneDisplay(raw: string): string {
  const normalized = normalizeMalaysiaPhone(raw);
  const digits = normalized.replace(/\D/g, '');
  if (!digits.startsWith('60')) return raw.trim();
  const local = digits.slice(2);
  if (local.startsWith('1') && local.length >= 9) {
    return `+60 ${local.slice(0, 2)}-${local.slice(2, 6)} ${local.slice(6)}`;
  }
  if (local.length >= 9) {
    return `+60 ${local.slice(0, 1)}-${local.slice(1, 5)} ${local.slice(5)}`;
  }
  return normalized;
}

export function normalizePostcode(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 5);
}

export function validatePostcode(raw: string): string | null {
  const postcode = normalizePostcode(raw);
  if (postcode.length !== 5) return 'Poskod mesti 5 digit.';
  return null;
}

export function normalizeCity(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, 80);
}

export function validateCity(raw: string): string | null {
  const city = normalizeCity(raw);
  if (city.length < 2) return 'Bandar / daerah diperlukan.';
  return null;
}

export function normalizeAddressLine(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, 160);
}

export function validateAddressLine1(raw: string): string | null {
  const line = normalizeAddressLine(raw);
  if (line.length < 5) return 'Alamat baris 1 diperlukan (min 5 aksara).';
  return null;
}

export function validateMalaysiaState(raw: string): string | null {
  if (!(MALAYSIA_STATES as readonly string[]).includes(raw.trim())) {
    return 'Negeri tidak sah.';
  }
  return null;
}

export interface AgentMalaysiaAddressInput {
  addressLine1: string;
  addressLine2?: string | null;
  postcode:     string;
  city:         string;
  state:        string;
}

export function validateAgentMalaysiaAddress(input: AgentMalaysiaAddressInput): string | null {
  const line1Err = validateAddressLine1(input.addressLine1);
  if (line1Err) return line1Err;
  const postcodeErr = validatePostcode(input.postcode);
  if (postcodeErr) return postcodeErr;
  const cityErr = validateCity(input.city);
  if (cityErr) return cityErr;
  const stateErr = validateMalaysiaState(input.state);
  if (stateErr) return stateErr;
  return null;
}

export function normalizeAgentMalaysiaAddress(input: AgentMalaysiaAddressInput) {
  return {
    addressLine1: normalizeAddressLine(input.addressLine1),
    addressLine2: input.addressLine2?.trim()
      ? normalizeAddressLine(input.addressLine2)
      : null,
    postcode:     normalizePostcode(input.postcode),
    city:         normalizeCity(input.city),
    state:        input.state.trim() as MalaysiaState,
  };
}

export function formatMalaysiaAddressDisplay(input: AgentMalaysiaAddressInput): string {
  const addr = normalizeAgentMalaysiaAddress(input);
  const parts = [
    addr.addressLine1,
    addr.addressLine2,
    `${addr.postcode} ${addr.city}`,
    addr.state,
    'Malaysia',
  ].filter(Boolean);
  return parts.join(', ');
}

export function normalizeBankAccountNumber(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 20);
}

export function validateBankAccountNumber(raw: string): string | null {
  const acct = normalizeBankAccountNumber(raw);
  if (acct.length < 8 || acct.length > 20) {
    return 'No. akaun bank mesti 8–20 digit.';
  }
  return null;
}

export function normalizeBankAccountHolder(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, 120);
}

export function validateBankAccountHolder(raw: string): string | null {
  const name = normalizeBankAccountHolder(raw);
  if (name.length < 3) return 'Nama pemegang akaun bank diperlukan.';
  return null;
}

export interface AgentPayoutIdentityInput {
  icNumber:            string;
  taxId:               string;
  bankName:            string;
  bankAccountNumber:   string;
  bankAccountHolder:   string;
}

export interface AgentRegistrationInput extends AgentPayoutIdentityInput, AgentMalaysiaAddressInput {
  phone: string;
}

export function validateAgentRegistrationInput(input: AgentRegistrationInput): string | null {
  const phoneErr = validateMalaysiaPhone(input.phone);
  if (phoneErr) return phoneErr;
  const addrErr = validateAgentMalaysiaAddress(input);
  if (addrErr) return addrErr;
  return validateAgentPayoutIdentity(input);
}

export function validateAgentPayoutIdentity(input: AgentPayoutIdentityInput): string | null {
  const icErr = validateIcNumber(input.icNumber);
  if (icErr) return icErr;
  const taxErr = validateTaxId(input.taxId);
  if (taxErr) return taxErr;
  const bankName = input.bankName.trim();
  if (bankName.length < 2) return 'Nama bank diperlukan.';
  const acctErr = validateBankAccountNumber(input.bankAccountNumber);
  if (acctErr) return acctErr;
  const holderErr = validateBankAccountHolder(input.bankAccountHolder);
  if (holderErr) return holderErr;
  return null;
}

export function normalizeAgentPayoutIdentity(input: AgentPayoutIdentityInput) {
  return {
    icNumber:          normalizeIcNumber(input.icNumber),
    taxId:             normalizeTaxId(input.taxId),
    bankName:          input.bankName.trim(),
    bankAccountNumber: normalizeBankAccountNumber(input.bankAccountNumber),
    bankAccountHolder: normalizeBankAccountHolder(input.bankAccountHolder),
  };
}
