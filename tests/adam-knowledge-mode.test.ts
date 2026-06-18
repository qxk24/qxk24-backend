/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Dedicated Knowledge Mode Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { buildAdamChatSystemPrompt } from '../src/adam/adam-prompt-builder';
import {
  resolveAdamKnowledgeMode,
  shouldBufferAdamStreamUntilRepair,
  type AdamKnowledgeMode,
} from '../src/adam/adam-knowledge-mode';

const APPLE_ASK = 'Kalau saya ada 3 epal dan kawan bagi 4 lagi, berapa jumlah epal?';

describe('resolveAdamKnowledgeMode — dedicated surfaces', () => {
  it('Mode 1 konvensional: α arithmetic word-problem (User + Founder)', () => {
    expect(resolveAdamKnowledgeMode({
      userMessage: APPLE_ASK,
      isFounder:   false,
    })).toBe('konvensional');
    expect(resolveAdamKnowledgeMode({
      userMessage: APPLE_ASK,
      isFounder:   true,
    })).toBe('konvensional');
  });

  it('Mode 2 alamtologi: explicit framework ask', () => {
    expect(resolveAdamKnowledgeMode({
      userMessage: 'Terangkan prinsip tujuh dalam framework Alamtologi.',
      isFounder:   false,
    })).toBe('alamtologi');
  });

  it('Mode 3 sintesis: founder β substantive; student tier-1 konvensional α', () => {
    expect(resolveAdamKnowledgeMode({
      userMessage: 'Apa itu fotosintesis?',
      isFounder:   false,
    })).toBe('konvensional');
    expect(resolveAdamKnowledgeMode({
      userMessage: 'Apa itu fotosintesis?',
      isFounder:   true,
    })).toBe('sintesis');
  });

  it('student tier-2 practical door → konvensional (not sintesis)', () => {
    const assistant = [
      'Fotosintesis menukar cahaya kepada gula.',
      'Adakah anda ingin lebih lanjut tentang kemahiran dan alat, laluan kerjaya, atau contoh dunia sebenar?',
    ].join('\n\n');
    expect(resolveAdamKnowledgeMode({
      userMessage:              'Ya, terangkan lagi',
      recentAssistantMessages:  [assistant],
      isFounder:                false,
      usersKnowledgeTier:     2,
    })).toBe('konvensional');
  });

  it('Mode 4 konstitusi: user opened faith door', () => {
    expect(resolveAdamKnowledgeMode({
      userMessage: 'Apa ayat Quran tentang hujan?',
      isFounder:   false,
    })).toBe('konstitusi');
  });
});

describe('shouldBufferAdamStreamUntilRepair', () => {
  it('buffers only arithmetic and visual-draw turns (stream live otherwise)', () => {
    expect(shouldBufferAdamStreamUntilRepair('Kalau saya ada 3 epal, berapa jumlahnya?', 'konvensional')).toBe(true);
    expect(shouldBufferAdamStreamUntilRepair('Lukis segi tiga ABC', 'konvensional')).toBe(true);
    expect(shouldBufferAdamStreamUntilRepair(APPLE_ASK, 'konvensional')).toBe(false);
    expect(shouldBufferAdamStreamUntilRepair('Siapa presiden Indonesia sekarang?', 'konvensional')).toBe(false);
    expect(shouldBufferAdamStreamUntilRepair('Apa itu fotosintesis?', 'konvensional')).toBe(false);
    expect(shouldBufferAdamStreamUntilRepair('Boleh bantu penulisan buku Mencari Damai?', 'konvensional')).toBe(false);
    expect(shouldBufferAdamStreamUntilRepair('Apa itu fotosintesis?', 'sintesis')).toBe(false);
    expect(shouldBufferAdamStreamUntilRepair('Apa itu fotosintesis?', 'konvensional', true)).toBe(false);
  });
});

describe('buildAdamChatSystemPrompt — knowledge mode firewall', () => {
  function promptFor(mode: AdamKnowledgeMode, userMessage: string, isFounder = false): string {
    return buildAdamChatSystemPrompt({
      mode:                 'TEACHING',
      isFounder,
      participantName:      isFounder ? 'Masa Bayu' : 'Ahmad',
      founderStudentsBlock: '',
      usersKnowledgeTier: 1,
      userMessage,
      knowledgeMode:        mode,
    });
  }

  it('Mode 1 prompt: manifest konvensional, no constitutional stack on Founder α', () => {
    const prompt = promptFor('konvensional', APPLE_ASK, true);
    expect(prompt).toMatch(/MODE 1.*100% ILMU KONVENSIONAL/i);
    expect(prompt).toMatch(/ACTIVE KNOWLEDGE MODE THIS TURN: KONVENSIONAL/i);
    expect(prompt).not.toMatch(/ADAM_CONSTITUTIONAL_KNOWLEDGE_HOLD/);
    expect(prompt).not.toContain('ALAMTOLOGI BOOK CANON');
  });

  it('Mode 2 prompt: manifest alamtologi + constitutional stack', () => {
    const prompt = promptFor('alamtologi', 'Terangkan HISAL dalam Alamtologi.', true);
    expect(prompt).toMatch(/MODE 2.*100% ILMU ALAMTOLOGI/i);
    expect(prompt).toMatch(/CONSTITUTIONAL KNOWLEDGE/i);
    expect(prompt).toMatch(/Teori Masa Bayu/i);
  });

  it('Mode 3 prompt: A \+ B = C synthesis manifest', () => {
    const prompt = promptFor('sintesis', 'Apa itu komunikasi?', true);
    expect(prompt).toMatch(/MODE 3.*KONVENSIONAL \+ ALAMTOLOGI = C/i);
    expect(prompt).toMatch(/A \+ B = C/i);
  });

  it('Mode 4 prompt: Quran layer manifest', () => {
    const prompt = promptFor('konstitusi', 'Apa ayat Quran tentang hujan?', false);
    expect(prompt).toMatch(/MODE 4.*QURAN = C/i);
  });
});
