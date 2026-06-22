/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Network Intent Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildNetworkClassifierInput,
  classifyNetworkIntent,
  classifyTutorCENetworkIntent,
} from '../src/adam/tutor-law/tutor-law.ce-network-classifier';
import { classifyCodeIntent } from '../src/adam/tutor-law/tutor-law.code-intent-classifier';
import { CodeIntent } from '../src/adam/tutor-law/tutor-law.code-intent-classifier';
import { classifyCEIntent } from '../src/adam/tutor-law/tutor-law.ce-intent-classifier.core';
import { buildCEClassifierInput } from '../src/adam/tutor-law/tutor-law.ce-intent-classifier';
import {
  NetworkIntent,
  NetworkTopic,
} from '../src/adam/tutor-law/tutor-law.ce-network.types';

describe('classifyNetworkIntent (Rule 61)', () => {
  it('V-CNW-01: N_TRACE — TCP three-way handshake', () => {
    const out = classifyNetworkIntent(buildNetworkClassifierInput({
      userMessage: 'Terangkan three-way handshake TCP langkah demi langkah.',
    }));
    expect(out.intent).toBe(NetworkIntent.N_TRACE);
    expect(out.topic).toBe(NetworkTopic.TCP_UDP);
    expect(out.traceProbe).toMatch(/SYN|handshake/i);
  });

  it('V-CNW-02: N_CONCEPT — apa itu DNS', () => {
    const out = classifyNetworkIntent(buildNetworkClassifierInput({
      userMessage: 'Apa itu DNS dan macam mana ia berfungsi?',
    }));
    expect(out.intent).toBe(NetworkIntent.N_CONCEPT);
    expect(out.topic).toBe(NetworkTopic.APPLICATION_PROTOCOL);
    expect(out.conceptProbe).toBeTruthy();
  });

  it('V-CNW-03: N_ANALYZE — packet loss diagnosis', () => {
    const out = classifyNetworkIntent(buildNetworkClassifierInput({
      userMessage: 'Kenapa berlaku packet loss yang tinggi pada link ini?',
    }));
    expect(out.intent).toBe(NetworkIntent.N_ANALYZE);
    expect(out.analyzeProbe).toMatch(/host|link|failure|path/i);
  });

  it('V-CNW-04: N_DESIGN — subnet topology scaffold', () => {
    const out = classifyNetworkIntent(buildNetworkClassifierInput({
      userMessage: 'Macam mana nak design network topology dengan subnet CIDR untuk 3 VLAN?',
    }));
    expect(out.intent).toBe(NetworkIntent.N_DESIGN);
    expect(out.designScaffold).toMatch(/VLAN|design|router/i);
  });

  it('V-CNW-05: N_VERIFY — check subnet answer', () => {
    const out = classifyNetworkIntent(buildNetworkClassifierInput({
      userMessage: 'Betul tak subnet mask jawapan saya untuk /26?',
    }));
    expect(out.intent).toBe(NetworkIntent.N_VERIFY);
    expect(out.verifyAnchor).toMatch(/Sebelum ADAM semak|Before ADAM checks/i);
  });

  it('V-CNW-06: EXAM_DIRECT — no full router config', () => {
    const out = classifyNetworkIntent(buildNetworkClassifierInput({
      userMessage: 'Tolong selesaikan soalan peperiksaan tulis konfigurasi router OSPF ni.',
    }));
    expect(out.intent).toBe(NetworkIntent.EXAM_DIRECT);
    expect(out.redirectScript).toMatch(/tidak akan tulis konfigurasi|will not write/i);
  });

  it('V-CNW-07: OSI_MODEL topic — layer concept', () => {
    const out = classifyNetworkIntent(buildNetworkClassifierInput({
      userMessage: 'Apa beza antara lapisan transport dan network dalam OSI model?',
    }));
    expect(out.topic).toBe(NetworkTopic.OSI_MODEL);
    expect(out.intent).toBe(NetworkIntent.N_CONCEPT);
  });
});

describe('CE network routing in code-intent-classifier', () => {
  it('V-CNW-08: classifyTutorCENetworkIntent null for system route', () => {
    const ce = classifyCEIntent(buildCEClassifierInput({
      userMessage: 'Macam mana deadlock berlaku antara dua proses?',
    }));
    expect(classifyTutorCENetworkIntent({
      userMessage: 'Macam mana deadlock berlaku antara dua proses?',
      ceRouting: ce,
    })).toBeNull();
  });

  it('V-CNW-09: code intent attaches ceNetwork for TCP handshake', () => {
    const out = classifyCodeIntent({
      rawText:         'Terangkan three-way handshake TCP.',
      normText:        'terangkan three-way handshake tcp.',
      hasCodeBlock:    false,
      hasErrorMessage: false,
      codeLineCount:   0,
      priorLanguage:   null,
      stuckCount:      0,
    });
    expect(out.ceRouting?.routeTo).toBe('ce-network-classifier');
    expect(out.ceNetwork?.intent).toBe(NetworkIntent.N_TRACE);
    expect(out.probeQuestion).toMatch(/SYN|handshake/i);
    expect(out.intent).toBe(CodeIntent.C_CONCEPT);
  });
});
