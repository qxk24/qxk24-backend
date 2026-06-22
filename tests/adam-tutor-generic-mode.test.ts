/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Generic Mode Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildTutorGenericTurnContext,
  classifyTutorGenericIntentFull,
  isTutorGenericDomainMessage,
} from '../src/adam/tutor-law/tutor-law.generic-intent-classifier';
import { buildGenericIntentTurnLaw } from '../src/adam/tutor-law/tutor-law.generic-prompt-laws';
import {
  resolveGenericTurnHandler,
} from '../src/adam/tutor-law/tutor-law.generic-mode';
import {
  GenericDomain,
  GenericIntent,
} from '../src/adam/tutor-law/tutor-law.generic-intent.types';
import { buildAcademicIntentTurnPromptBlock } from '../src/adam/tutor-law/tutor-law.academic-intent-prompt';

describe('generic mode — Section 10 usage contract', () => {
  it('V-GM-01: G_FACT prompt law requires significance after factual answer', () => {
    const result = classifyTutorGenericIntentFull(buildTutorGenericTurnContext({
      userMessage: 'Siapa tokoh yang menandatangani Perjanjian 1957?',
    }));
    expect(result).not.toBeNull();
    expect(result!.output.intent).toBe(GenericIntent.G_FACT);
    expect(result!.handler).toBe('FACT_WITH_SIGNIFICANCE');

    const law = buildGenericIntentTurnLaw(result!.output, result!.handler);
    expect(law).toMatch(/G_FACT/i);
    expect(law).toMatch(/SIGNIFICANCE QUESTION/i);
    expect(result!.output.significanceQuestion).toBeTruthy();
    expect(law).toContain(result!.output.significanceQuestion!);
  });

  it('V-GM-02: G_ANALYSIS prompt law uses argument probe only — no full analysis', () => {
    const result = classifyTutorGenericIntentFull(buildTutorGenericTurnContext({
      userMessage: 'Bincangkan faktor kemerdekaan Tanah Melayu dan kesan terhadap masyarakat.',
    }));
    expect(result!.output.intent).toBe(GenericIntent.G_ANALYSIS);
    expect(result!.handler).toBe('ARGUMENT_PROBE');

    const law = buildGenericIntentTurnLaw(result!.output, result!.handler);
    expect(law).toMatch(/JANGAN beri analisis siap/i);
    expect(law).toMatch(/ARGUMENT PROBE/i);
    expect(law).not.toMatch(/beri analisis penuh/i);
  });

  it('V-GM-03: G_REVIEW asks review anchor before feedback', () => {
    const result = classifyTutorGenericIntentFull(buildTutorGenericTurnContext({
      userMessage: 'Boleh semak jawapan saya untuk soalan sivik ni?',
    }));
    expect(result!.handler).toBe('REVIEW_ANCHOR');

    const law = buildGenericIntentTurnLaw(result!.output, result!.handler);
    expect(law).toMatch(/REVIEW ANCHOR FIRST/i);
    expect(law).toContain(result!.output.reviewAnchor!);
  });

  it('V-GM-04: G_REVIEW skips anchor when thread shows student answered', () => {
    const result = classifyTutorGenericIntentFull(buildTutorGenericTurnContext({
      userMessage: 'Bahagian pendahuluan saya rasa paling lemah.',
      recentAssistantMessages: [
        'ADAM akan tengok apa yang kamu tulis. Sebelum beri maklum balas — bahagian mana yang kamu rasa paling tidak puas hati atau paling tidak pasti?',
      ],
      recentUserMessages: [],
    }));
    expect(result!.handler).toBe('REVIEW_FEEDBACK');
    expect(result!.reviewAnchorSkipped).toBe(true);

    const law = buildGenericIntentTurnLaw(result!.output, result!.handler);
    expect(law).toMatch(/REVIEW FEEDBACK MODE/i);
    expect(law).not.toMatch(/REVIEW ANCHOR FIRST/i);
  });

  it('V-GM-05: EXAM_DIRECT uses redirect only', () => {
    const result = classifyTutorGenericIntentFull(buildTutorGenericTurnContext({
      userMessage: 'Tolong jawab soalan peperiksaan sejarah ini.',
    }));
    expect(result!.handler).toBe('REDIRECT');

    const law = buildGenericIntentTurnLaw(result!.output, result!.handler);
    expect(law).toMatch(/GENERIC EXAM REDIRECT/i);
    expect(law).toMatch(/peperiksaan/i);
  });

  it('V-GM-06: sejarah question routes generic not math', () => {
    expect(isTutorGenericDomainMessage(
      'Siapa tokoh yang menandatangani Perjanjian 1957?',
    )).toBe(true);
  });

  it('V-GM-07: academic prompt block includes generic G_FACT law', () => {
    const block = buildAcademicIntentTurnPromptBlock({
      userMessage: 'Siapa tokoh yang menandatangani Perjanjian 1957?',
    });
    expect(block).toMatch(/G_FACT/i);
    expect(block).toMatch(/SIGNIFICANCE QUESTION/i);
  });

  it('V-GM-08: FACT_SIGNIFICANCE_ONLY when fact already delivered in thread', () => {
    const handler = resolveGenericTurnHandler(
      {
        intent:               GenericIntent.G_FACT,
        domain:               GenericDomain.SEJARAH,
        confidence:           'HIGH',
        significanceQuestion: 'Mengapa penting?',
        argumentProbe:        null,
        reviewAnchor:         null,
        redirectScript:       null,
        probeQuestion:        null,
        _trace:               [],
      },
      {
        lockedDomain:           GenericDomain.SEJARAH,
        reviewAnchorAnswered:   false,
        factAnsweredThisThread: true,
        significanceAsked:      false,
        argumentProbeDelivered: false,
        stuckCount:             0,
      },
    );
    expect(handler).toBe('FACT_SIGNIFICANCE_ONLY');
  });
});
