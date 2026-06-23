/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Voice Assessment (ERA_2c STT)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Rule-based pronunciation + fluency from STT transcript — NOT phoneme ML.
 * Tahap pembelajaran semasa — never IQ labels.
 */

import type { AdamTutorLearningProfile } from './tutor-law.learning-profile.types';

export interface VoiceAssessmentInput {
  transcript:    string;
  targetPhrase?: string | null;
  viaVoice:      boolean;
}

export interface VoiceAssessmentResult {
  targetPhrase:        string | null;
  transcript:          string;
  pronunciationScore:  number;
  fluencyScore:        number;
  combinedScore:       number;
  wordCount:           number;
  feedback:            string[];
}

const FILLER_RE = /\b(um+|uh+|er+|ah+|emm+|hmm+)\b/gi;

const TARGET_EXTRACT_PATTERNS: readonly RegExp[] = [
  /(?:say|repeat|try\s+saying|listen\s+and\s+repeat|pronounce|sebut)[:\s]+["']([^"']{2,120})["']/i,
  /(?:say|repeat|try|sebut)[:\s]+["']([^"']{2,120})["']/i,
  /["']([A-Za-z][^"']{2,80})["']\s*(?:\.|\?|$)/,
];

export const ADAM_TUTOR_VOICE_STT_LAW = `
ADAM TUTOR — VOICE / STT (ERA_2c):
When the student uses the microphone (voice turn):
1. For pronunciation drills, give ONE short target phrase in quotes — e.g. Say: "make a decision"
2. After they speak, recast gently — growth mindset ("belum kuasai bunyi ini"), not IQ labels
3. Fluency and courage to speak matter more than perfect accent on first try
4. One line of feedback + one short follow-up question — no long lecture
`.trim();

export function normalizeSpeechText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeSpeech(text: string): string[] {
  const norm = normalizeSpeechText(text);
  if (!norm) return [];
  return norm.split(' ').filter(Boolean);
}

export function extractSpeakingTargetFromAssistant(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  for (const pattern of TARGET_EXTRACT_PATTERNS) {
    const match = trimmed.match(pattern);
    const phrase = match?.[1]?.trim();
    if (phrase && phrase.length >= 2) return phrase;
  }

  return null;
}

function wordOverlapScore(transcriptTokens: string[], targetTokens: string[]): number {
  if (targetTokens.length === 0) return 0.55;
  const targetSet = new Set(targetTokens);
  let hits = 0;
  for (const token of transcriptTokens) {
    if (targetSet.has(token)) hits += 1;
  }
  return hits / targetTokens.length;
}

function orderedTokenScore(transcriptTokens: string[], targetTokens: string[]): number {
  if (targetTokens.length === 0 || transcriptTokens.length === 0) return 0;

  const dp: number[][] = Array.from({ length: transcriptTokens.length + 1 }, () =>
    Array(targetTokens.length + 1).fill(0));

  for (let i = 1; i <= transcriptTokens.length; i += 1) {
    for (let j = 1; j <= targetTokens.length; j += 1) {
      if (transcriptTokens[i - 1] === targetTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[transcriptTokens.length][targetTokens.length] / targetTokens.length;
}

function scorePronunciation(transcript: string, targetPhrase: string | null | undefined): number {
  const transcriptTokens = tokenizeSpeech(transcript);
  if (transcriptTokens.length === 0) return 0.15;

  if (!targetPhrase?.trim()) {
    return transcriptTokens.length >= 4 ? 0.62 : 0.48;
  }

  const targetTokens = tokenizeSpeech(targetPhrase);
  if (targetTokens.length === 0) return 0.55;

  const overlap = wordOverlapScore(transcriptTokens, targetTokens);
  const ordered = orderedTokenScore(transcriptTokens, targetTokens);
  return Math.max(0.05, Math.min(0.98, overlap * 0.45 + ordered * 0.55));
}

function scoreFluency(transcript: string, targetPhrase: string | null | undefined): number {
  const tokens = tokenizeSpeech(transcript);
  if (tokens.length === 0) return 0.1;

  const targetCount = targetPhrase ? tokenizeSpeech(targetPhrase).length : 0;
  const expected = Math.max(targetCount || 5, 3);
  const lengthRatio = Math.min(1, tokens.length / expected);

  const fillerHits = (transcript.match(FILLER_RE) ?? []).length;
  const fillerPenalty = Math.min(0.35, fillerHits * 0.08);

  const base = 0.35 + lengthRatio * 0.55;
  return Math.max(0.08, Math.min(0.98, base - fillerPenalty));
}

function buildVoiceFeedback(
  pronunciation: number,
  fluency: number,
  targetPhrase: string | null,
): string[] {
  const hints: string[] = [];

  if (targetPhrase && pronunciation < 0.55) {
    hints.push(`Focus on key words in: "${targetPhrase}" — try once more slowly.`);
  } else if (targetPhrase && pronunciation >= 0.75) {
    hints.push('Good match to the target phrase — keep the rhythm natural.');
  }

  if (fluency < 0.5) {
    hints.push('Try a slightly longer answer — 1–2 full sentences builds fluency.');
  } else if (fluency >= 0.7) {
    hints.push('Fluency is improving — compare with your last voice attempt, not others.');
  }

  return hints;
}

export function scoreVoiceTranscript(input: VoiceAssessmentInput): VoiceAssessmentResult {
  const transcript = input.transcript.trim();
  const targetPhrase = input.targetPhrase?.trim() || null;
  const pronunciationScore = scorePronunciation(transcript, targetPhrase);
  const fluencyScore = scoreFluency(transcript, targetPhrase);
  const combinedScore = Math.round(
    (pronunciationScore * 0.55 + fluencyScore * 0.45) * 100,
  ) / 100;

  return {
    targetPhrase,
    transcript,
    pronunciationScore,
    fluencyScore,
    combinedScore,
    wordCount: tokenizeSpeech(transcript).length,
    feedback:  buildVoiceFeedback(pronunciationScore, fluencyScore, targetPhrase),
  };
}

export function assessVoiceTurn(input: {
  transcript:              string;
  viaVoice:                boolean;
  recentAssistantMessages?: string[];
}): VoiceAssessmentResult | null {
  if (!input.viaVoice || !input.transcript.trim()) return null;

  const target = extractSpeakingTargetFromAssistant(
    input.recentAssistantMessages?.[0] ?? '',
  );

  return scoreVoiceTranscript({
    transcript:   input.transcript,
    targetPhrase: target,
    viaVoice:     true,
  });
}

export function buildVoiceProfilePromptHint(
  profile: AdamTutorLearningProfile | null | undefined,
): string {
  const voice = profile?.voice;
  if (!voice?.sessions) return '';

  return (
    `VOICE PROFILE (STT — bukan IQ): sessions=${voice.sessions}, `
    + `pronunciation≈${Math.round(voice.avgPronunciation * 100)}%, `
    + `fluency≈${Math.round(voice.avgFluency * 100)}%. `
    + 'Recast gently; celebrate attempt before nitpicking sounds.'
  );
}

export function buildVoicePedagogyTurnLaw(input: {
  viaVoice?:                 boolean;
  learningProfile?:          AdamTutorLearningProfile | null;
  recentAssistantMessages?:  string[];
}): string {
  if (!input.viaVoice) return '';

  const parts = [ADAM_TUTOR_VOICE_STT_LAW];
  const hint = buildVoiceProfilePromptHint(input.learningProfile);
  if (hint) parts.push(hint);

  const pendingTarget = extractSpeakingTargetFromAssistant(
    input.recentAssistantMessages?.[0] ?? '',
  );
  if (pendingTarget) {
    parts.push(`PENDING VOICE TARGET: "${pendingTarget}" — score student's 🎤 reply against this phrase.`);
  }

  return parts.join('\n\n');
}
