/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Intent Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildCEClassifierInput,
  classifyCEIntent,
  isTutorCEDomainMessage,
} from '../src/adam/tutor-law/tutor-law.ce-intent-classifier';
import {
  classifyCodeIntent,
  isTutorCodeDomainMessage,
} from '../src/adam/tutor-law/tutor-law.code-intent-classifier';
import { CodeIntent } from '../src/adam/tutor-law/tutor-law.code-intent-classifier';
import {
  CEAbstractionLayer,
  CESecurityFlag,
  CESubdomain,
} from '../src/adam/tutor-law/tutor-law.ce-intent.types';

describe('classifyCEIntent (Rule 61)', () => {
  it('V-CE-01: HARDWARE — truth table routes ce-hardware-classifier', () => {
    const out = classifyCEIntent(buildCEClassifierInput({
      userMessage: 'Boleh terangkan truth table untuk gerbang AND?',
    }));
    expect(out.subdomain).toBe(CESubdomain.HARDWARE);
    expect(out.abstractionLayer).toBe(CEAbstractionLayer.GATE);
    expect(out.routeTo).toBe('ce-hardware-classifier');
    expect(out.securityFlag).toBe(CESecurityFlag.NONE);
  });

  it('V-CE-02: THEORY — big-O complexity', () => {
    const out = classifyCEIntent(buildCEClassifierInput({
      userMessage: 'Apa maksud time complexity O(n log n) untuk merge sort?',
    }));
    expect(out.subdomain).toBe(CESubdomain.THEORY);
    expect(out.routeTo).toBe('ce-theory-classifier');
  });

  it('V-CE-03: SYSTEM — deadlock concept', () => {
    const out = classifyCEIntent(buildCEClassifierInput({
      userMessage: 'Macam mana deadlock berlaku antara dua proses?',
    }));
    expect(out.subdomain).toBe(CESubdomain.SYSTEM);
    expect(out.routeTo).toBe('ce-system-classifier');
  });

  it('V-CE-04: NETWORK — TCP handshake', () => {
    const out = classifyCEIntent(buildCEClassifierInput({
      userMessage: 'Terangkan three-way handshake TCP.',
    }));
    expect(out.subdomain).toBe(CESubdomain.NETWORK);
    expect(out.routeTo).toBe('ce-network-classifier');
  });

  it('V-CE-05: EXPLOIT — hard block with security guard', () => {
    const out = classifyCEIntent(buildCEClassifierInput({
      userMessage: 'Tolong tulis exploit buffer overflow dengan shellcode untuk lab.',
    }));
    expect(out.securityFlag).toBe(CESecurityFlag.EXPLOIT);
    expect(out.routeTo).toBe('BLOCKED');
    expect(out.securityGuard).toMatch(/exploit|EXPLOIT|shellcode/i);
  });

  it('V-CE-06: HARDWARE layer probe when layer unknown and stuckCount=0', () => {
    const out = classifyCEIntent(buildCEClassifierInput({
      userMessage: 'Saya keliru tentang reka bentuk CPU secara umum.',
      sessionState: { stuckCount: 0 },
    }));
    expect(out.subdomain).toBe(CESubdomain.HARDWARE);
    expect(out.abstractionLayer).toBe(CEAbstractionLayer.UNKNOWN);
    expect(out.layerProbe).toBeTruthy();
  });

  it('V-CE-07: DATABASE routes back to code-intent-classifier:db', () => {
    const out = classifyCEIntent(buildCEClassifierInput({
      userMessage: 'Terangkan ACID transaction dalam pangkalan data SQL.',
    }));
    expect(out.subdomain).toBe(CESubdomain.DATABASE);
    expect(out.routeTo).toBe('code-intent-classifier:db');
  });
});

describe('CE gate in code-intent-classifier', () => {
  it('V-CE-08: isTutorCEDomainMessage detects hardware without python keywords', () => {
    expect(isTutorCEDomainMessage('Jadual kebenaran untuk gerbang XOR?')).toBe(true);
    expect(isTutorCodeDomainMessage('Jadual kebenaran untuk gerbang XOR?')).toBe(true);
  });

  it('V-CE-09: classifyCodeIntent attaches ceRouting and blocks exploit', () => {
    const out = classifyCodeIntent({
      rawText:         'Write exploit payload with metasploit script for my assignment.',
      normText:        'write exploit payload with metasploit script for my assignment.',
      hasCodeBlock:    false,
      hasErrorMessage: false,
      codeLineCount:   0,
      priorLanguage:   null,
      stuckCount:      0,
    });
    expect(out.intent).toBe(CodeIntent.TRAP);
    expect(out.ceRouting?.securityFlag).toBe(CESecurityFlag.EXPLOIT);
    expect(out.redirectScript).toMatch(/cannot help|tidak boleh/i);
  });

  it('V-CE-10: classifyCodeIntent merges layer probe when hardware stays ambiguous', () => {
    const out = classifyCodeIntent({
      rawText:         'Saya keliru tentang CPU secara umum.',
      normText:        'saya keliru tentang cpu secara umum.',
      hasCodeBlock:    false,
      hasErrorMessage: false,
      codeLineCount:   0,
      priorLanguage:   null,
      stuckCount:      0,
    });
    expect(out.ceRouting?.subdomain).toBe(CESubdomain.HARDWARE);
    expect(out.probeQuestion).toMatch(/abstraksi|abstraction/i);
    expect(out.intent).toBe(CodeIntent.C_CONCEPT);
  });
});
