/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { isQaUnlimitedNotes, QA_UNLIMITED_NOTES } from '../src/qa/qa-unlimited-account.service';

describe('QA unlimited account markers', () => {
  it('detects QA unlimited enterprise notes', () => {
    expect(isQaUnlimitedNotes(QA_UNLIMITED_NOTES)).toBe(true);
    expect(isQaUnlimitedNotes('Founder grant — ADAM Profesional')).toBe(false);
    expect(isQaUnlimitedNotes(null)).toBe(false);
  });
});
