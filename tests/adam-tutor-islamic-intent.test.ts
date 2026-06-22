/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Islamic Intent Classifier Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildIslamicClassifierInput,
  buildTutorIslamicTurnContext,
  classifyIslamicIntent,
  classifyTutorIslamicIntent,
  isTutorIslamicDomainMessage,
} from '../src/adam/tutor-law/tutor-law.islamic-intent-classifier';
import {
  deriveIslamicSessionState,
  mergeIslamicSessionState,
} from '../src/adam/tutor-law/tutor-law.islamic-mode';
import {
  FabricationRisk,
  IslamicIntent,
  SourceTier,
} from '../src/adam/tutor-law/tutor-law.islamic-intent.types';
import { buildAcademicIntentTurnPromptBlock } from '../src/adam/tutor-law/tutor-law.academic-intent-prompt';

describe('tutor islamic intent classifier', () => {
  it('V-II-01: fabrication risk — tuliskan ayat', () => {
    const out = classifyIslamicIntent(buildIslamicClassifierInput({
      userMessage: 'Tolong tuliskan ayat quran tentang sabar.',
    }));
    expect(out.intent).toBe(IslamicIntent.FABRICATION_RISK);
    expect(out.fabricationRisk).toBe(FabricationRisk.HIGH);
    expect(out.fabricationGuard).toBeTruthy();
  });

  it('V-II-02: tafsir surah — Q_QURAN + verification', () => {
    const out = classifyIslamicIntent(buildIslamicClassifierInput({
      userMessage: 'Apa maksud surah Al-Asr dari segi tafsir?',
    }));
    expect(out.intent).toBe(IslamicIntent.Q_QURAN);
    expect(out.sourceTier).toBe(SourceTier.QURAN);
    expect(out.verificationReminder).toBeTruthy();
  });

  it('V-II-03: hadith authenticity — Q_HADITH', () => {
    const out = classifyIslamicIntent(buildIslamicClassifierInput({
      userMessage: 'Hadis ini sahih ke dalam kitab Muslim?',
    }));
    expect(out.intent).toBe(IslamicIntent.Q_HADITH);
    expect(out.sourceTier).toBe(SourceTier.HADITH);
  });

  it('V-II-04b: rukun iman — Q_IMAN (bukan akidah)', () => {
    const out = classifyIslamicIntent(buildIslamicClassifierInput({
      userMessage: 'Apa maksud rukun iman dalam pendidikan Islam?',
    }));
    expect(out.intent).toBe(IslamicIntent.Q_IMAN);
    expect(out.sourceTier).toBe(SourceTier.QURAN);
    expect(out.pedagogyProbe).toBeTruthy();
  });

  it('V-II-05: fiqh halal — Q_FIQH', () => {
    const out = classifyIslamicIntent(buildIslamicClassifierInput({
      userMessage: 'Adakah makanan ini halal atau haram?',
    }));
    expect(out.intent).toBe(IslamicIntent.Q_FIQH);
    expect(out.sourceTier).toBe(SourceTier.IJMAK);
    expect(out.pedagogyProbe).toBeTruthy();
  });

  it('V-II-06: grammar ayat is not islamic domain', () => {
    const msg = 'Ayat ni betul ke dari segi tatabahasa?';
    expect(isTutorIslamicDomainMessage(msg)).toBe(false);
  });

  it('V-II-07: academic prompt includes hierarchy for surah', () => {
    const block = buildAcademicIntentTurnPromptBlock({
      userMessage: 'Jelaskan maksud surah Al-Fatihah.',
    });
    expect(block).toMatch(/ISLAMIC SOURCE HIERARCHY|QURAN CONSTITUTIONAL SUPREMACY/i);
    expect(block).toMatch(/FABRICATION|quran\.com/i);
  });

  it('V-II-08: session skips pedagogy probe after student answered', () => {
    const ctx = buildTutorIslamicTurnContext({
      userMessage: 'Maksudnya ayat tu tentang keistimewaan surah Al-Baqarah bagi umat.',
      recentAssistantMessages: [
        'Sebelum kita bincang maksud ayat ni — kamu tahu tak dalam surah apa ia turun?',
      ],
      recentUserMessages: [
        'Dalam surah Al-Baqarah, ayat tentang keimanan kepada Allah.',
      ],
    });
    const derived = deriveIslamicSessionState(ctx);
    expect(derived.pedagogyProbeAnswered).toBe(true);

    const result = classifyTutorIslamicIntent(ctx);
    expect(result?.pedagogyProbeSkipped).toBe(true);
    expect(result?.output.pedagogyProbe).toBeNull();
    expect(result?.nextSessionState.lockedIntent).toBe(IslamicIntent.Q_QURAN);
  });

  it('V-II-09: mergeIslamicSessionState locks intent across turns', () => {
    mergeIslamicSessionState(undefined, deriveIslamicSessionState(
      buildTutorIslamicTurnContext({ userMessage: 'Apa hukum puasa?' }),
    ));
    const output = classifyIslamicIntent(buildIslamicClassifierInput({
      userMessage: 'Teruskan — boleh puasa kalau sakit?',
    }));
    expect(output.intent).toBe(IslamicIntent.Q_FIQH);

    const result = classifyTutorIslamicIntent(buildTutorIslamicTurnContext({
      userMessage: 'Teruskan — boleh puasa kalau sakit?',
      sessionState: { lockedIntent: IslamicIntent.Q_FIQH },
    }));
    expect(result?.nextSessionState.lockedIntent).toBe(IslamicIntent.Q_FIQH);
  });

  it('V-II-10: thread-lock continues fiqh without explicit sessionState', () => {
    const result = classifyTutorIslamicIntent(buildTutorIslamicTurnContext({
      userMessage: 'Teruskan — bagaimana kalau sakit?',
      recentUserMessages: ['Apa hukum puasa?'],
    }));
    expect(result?.output.intent).toBe(IslamicIntent.Q_FIQH);
    expect(result?.output.decisionTrace?.some((t) => /thread-lock/.test(t))).toBe(true);
  });

  it('V-II-11: strips parenthetical ayat before islamic turn context', () => {
    const ctx = buildTutorIslamicTurnContext({
      userMessage: 'Apa maksud ayat ini (Inna lillahi wa inna ilayhi rajiun) dalam ujian?',
    });
    expect(ctx.userMessage).not.toMatch(/Inna lillahi/);
    expect(ctx.userMessage).toMatch(/Apa maksud ayat ini/);
  });

  it('V-II-12: academic prompt includes translation-only law for surah', () => {
    const block = buildAcademicIntentTurnPromptBlock({
      userMessage: 'Jelaskan maksud surah Al-Fatihah.',
    });
    expect(block).toMatch(/QURAN TRANSLATION ONLY|TERJEMAHAN sahaja/i);
    expect(block).toMatch(/BUANG sepenuhnya/i);
  });
});
