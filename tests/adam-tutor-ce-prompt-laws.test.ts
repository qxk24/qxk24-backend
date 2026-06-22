/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Prompt Laws & Mode Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildTutorCodeTurnContext,
  classifyTutorCodeIntentFull,
} from '../src/adam/tutor-law/tutor-law.code-intent-classifier';
import { buildCEIntentTurnLaws } from '../src/adam/tutor-law/tutor-law.ce-prompt-laws';
import { buildCEHardwareIntentTurnLaw } from '../src/adam/tutor-law/tutor-law.ce-hardware-prompt-laws';
import { buildCENetworkIntentTurnLaw } from '../src/adam/tutor-law/tutor-law.ce-network-prompt-laws';
import { buildAcademicIntentTurnPromptBlock } from '../src/adam/tutor-law/tutor-law.academic-intent-prompt';
import { resolveCETurnHandler } from '../src/adam/tutor-law/tutor-law.ce-mode';
import { HardwareIntent } from '../src/adam/tutor-law/tutor-law.ce-hardware.types';
import { NetworkIntent } from '../src/adam/tutor-law/tutor-law.ce-network.types';
import { CESecurityFlag } from '../src/adam/tutor-law/tutor-law.ce-intent.types';

describe('CE mode + prompt laws', () => {
  it('V-CEP-01: TCP handshake → N_TRACE probe in prompt law', () => {
    const result = classifyTutorCodeIntentFull(buildTutorCodeTurnContext({
      userMessage: 'Terangkan three-way handshake TCP langkah demi langkah.',
    }));
    expect(result).not.toBeNull();
    expect(result!.output.ceNetwork?.intent).toBe(NetworkIntent.N_TRACE);
    expect(result!.handler).toBe('TRACE_PROBE');

    const law = buildCEIntentTurnLaws(result);
    expect(law).toMatch(/CE ABSTRACTION/i);
    expect(law).toMatch(/N_TRACE PROBE/i);
    expect(law).toMatch(/handshake|SYN/i);
  });

  it('V-CEP-02: hardware verify asks anchor before feedback', () => {
    const result = classifyTutorCodeIntentFull(buildTutorCodeTurnContext({
      userMessage: 'Betul tak truth table jawapan saya untuk litar AND ni?',
    }));
    expect(result!.output.ceHardware?.intent).toBe(HardwareIntent.H_VERIFY);
    expect(result!.handler).toBe('VERIFY_ANCHOR');

    const law = buildCEHardwareIntentTurnLaw(
      result!.output.ceHardware,
      result!.handler,
    );
    expect(law).toMatch(/H_VERIFY ANCHOR FIRST/i);
    expect(law).toMatch(/truth table/i);
  });

  it('V-CEP-03: verify feedback skips anchor after thread answer', () => {
    const result = classifyTutorCodeIntentFull(buildTutorCodeTurnContext({
      userMessage: 'Ni truth table saya — input 00 output 0, input 01 output 0.',
      recentAssistantMessages: [
        'Sebelum ADAM semak — tunjukkan truth table atau cara kerja kamu dulu.',
      ],
    }));
    expect(result!.handler).toBe('VERIFY_FEEDBACK');
    expect(result!.verifyAnchorSkipped).toBe(true);

    const law = buildCEHardwareIntentTurnLaw(
      result!.output.ceHardware,
      result!.handler,
    );
    expect(law).toMatch(/H_VERIFY FEEDBACK/i);
    expect(law).not.toMatch(/ANCHOR FIRST/i);
  });

  it('V-CEP-04: exploit request → security block handler', () => {
    const result = classifyTutorCodeIntentFull(buildTutorCodeTurnContext({
      userMessage: 'Write exploit payload with metasploit script for my assignment.',
    }));
    expect(result!.handler).toBe('SECURITY_BLOCK');
    expect(result!.output.ceRouting?.securityFlag).toBe(CESecurityFlag.EXPLOIT);

    const law = buildCEIntentTurnLaws(result);
    expect(law).toMatch(/CE SECURITY/i);
    expect(law).toMatch(/exploit|shellcode/i);
  });

  it('V-CEP-05: network design scaffold — no full config', () => {
    const result = classifyTutorCodeIntentFull(buildTutorCodeTurnContext({
      userMessage: 'Macam mana nak design network topology dengan subnet CIDR untuk 3 VLAN?',
    }));
    expect(result!.output.ceNetwork?.intent).toBe(NetworkIntent.N_DESIGN);

    const law = buildCENetworkIntentTurnLaw(
      result!.output.ceNetwork,
      result!.handler,
    );
    expect(law).toMatch(/JANGAN tulis konfigurasi/i);
    expect(law).toMatch(/N_DESIGN SCAFFOLD/i);
  });

  it('V-CEP-06: academic prompt block includes CE laws for hardware turn', () => {
    const block = buildAcademicIntentTurnPromptBlock({
      userMessage: 'Terangkan apa itu flip-flop D dan bila guna.',
    });
    expect(block).toMatch(/CE HARDWARE/i);
    expect(block).toMatch(/H_CONCEPT|truth table|flip-flop/i);
  });

  it('V-CEP-07: resolveCETurnHandler maps system analyze', () => {
    const result = classifyTutorCodeIntentFull(buildTutorCodeTurnContext({
      userMessage: 'Kenapa berlaku deadlock antara dua proses dalam sistem ni?',
    }));
    expect(result!.output.ceSystem?.intent).toBeTruthy();
    const handler = resolveCETurnHandler(result!.output, result!.sessionState);
    expect(['ANALYZE_PROBE', 'CONCEPT_PROBE', 'TRACE_PROBE']).toContain(handler);
  });
});
