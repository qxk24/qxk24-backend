/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Media Quota Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-23
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  isAdamMediaGenerationTurn,
  userWantsGeneratedVideo,
  buildAdamMediaGenerationPrompt,
  parseRequestedVideoSeconds,
} from '../src/adam/adam-media-generation';
import {
  getMediaQuotaLimits,
  mediaWalletCostCents,
  resolveMediaQuotaTier,
  mediaMaxVideoSeconds,
} from '../src/adam/adam-media-quota-tier';
import { snapWanxVideoDuration } from '../src/adam/adam-wanx-video.client';
import { SubscriptionTier } from '../src/subscriptions/subscription.schema';

describe('adam-media-generation intent', () => {
  it('detects explicit image generation asks', () => {
    expect(isAdamMediaGenerationTurn('Jana gambar fotosintesis')).toBe(true);
    expect(isAdamMediaGenerationTurn('Create an illustration of the water cycle')).toBe(true);
    expect(isAdamMediaGenerationTurn('Apa itu fotosintesis?')).toBe(false);
  });

  it('detects video generation intent', () => {
    expect(userWantsGeneratedVideo('Buat video animasi sel')).toBe(true);
    expect(userWantsGeneratedVideo('Jana gambar sel')).toBe(false);
  });

  it('strips generation verbs from prompt', () => {
    const prompt = buildAdamMediaGenerationPrompt('Sila jana gambar mitosis untuk saya');
    expect(prompt.toLowerCase()).toContain('mitosis');
    expect(prompt.toLowerCase()).not.toMatch(/\bjana\b/);
  });
});

describe('adam-media-quota-tier Option A', () => {
  it('maps subscription tiers to media pools', () => {
    expect(getMediaQuotaLimits('pro').imagesMonthly).toBe(10);
    expect(getMediaQuotaLimits('tutor').imagesMonthly).toBe(15);
    expect(getMediaQuotaLimits('free').imagesMonthly).toBe(0);
    expect(getMediaQuotaLimits('pro').videoSecondsMonthly).toBe(15);
  });

  it('resolves Pro and Tutor from subscription tier', () => {
    expect(resolveMediaQuotaTier({ tier: SubscriptionTier.PRO })).toBe('pro');
    expect(resolveMediaQuotaTier({ tier: SubscriptionTier.TUTOR })).toBe('tutor');
    expect(resolveMediaQuotaTier({ isFounder: true })).toBe('enterprise');
  });

  it('charges Option A wallet rates', () => {
    expect(mediaWalletCostCents('image')).toBe(25);
    expect(mediaWalletCostCents('video', 5)).toBe(75);
    expect(mediaWalletCostCents('video', 10)).toBe(150);
  });
});

describe('adam-media-generation video duration', () => {
  it('parses seconds from user message', () => {
    expect(parseRequestedVideoSeconds('Buat video 10 saat mitosis')).toBe(10);
    expect(parseRequestedVideoSeconds('Generate a 5 second clip')).toBe(5);
    expect(parseRequestedVideoSeconds('Buat video animasi sel')).toBe(5);
  });

  it('snaps Wanx duration to 5 or 10 within cap', () => {
    expect(snapWanxVideoDuration(3)).toBe(5);
    expect(snapWanxVideoDuration(8)).toBe(10);
    expect(snapWanxVideoDuration(10)).toBe(10);
    expect(snapWanxVideoDuration(99)).toBe(mediaMaxVideoSeconds() <= 5 ? 5 : 10);
  });
});
