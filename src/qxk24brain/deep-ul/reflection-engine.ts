/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Deterministic Reflection Engine
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-10
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Principle } from './ontology';
import type { DailyEpisode } from './episodic-aggregator';
import { generateJournal } from './episodic-aggregator';

export interface ReflectionPayload {
  reflection:          string;
  questionsForFounder: string[];
  nearStage7Notes:     string[];
  missingConnections:  string[];
  uncertainties:       string[];
}

export interface ReflectionContext {
  unifiedUnderstanding: string;
  activeFamilies:       Array<{ family: string; principle: string; stage: number; summary?: string }>;
  completedFamilies:    Array<{ family: string; principle: string }>;
  disconnectedFamilies: string[];
  recentTransformations: Array<{ family: string; principle: string; stage: number; preview: string }>;
}

function episodesFromContext(ctx: ReflectionContext): DailyEpisode[] {
  return ctx.recentTransformations.map((t) => ({
    timestamp: new Date().toISOString(),
    action:    `${t.family} (${t.principle})`,
    principle: (t.principle as Principle) || Principle.TENAGA,
    outcome:   'learning' as const,
  }));
}

export function generateNightlyReflection(ctx: ReflectionContext): ReflectionPayload {
  const episodes = episodesFromContext(ctx);
  const journalBody = generateJournal(episodes, 'QXK24');

  const nearStage7 = ctx.activeFamilies
    .filter((f) => f.stage >= 5)
    .map((f) => `${f.family} at Stage ${f.stage}/7 — nearing constitutional completion`);

  const missingConnections = ctx.disconnectedFamilies.length
    ? ctx.disconnectedFamilies.map((f) => `${f} has no graph connections yet`)
    : ['All active families maintain graph linkage'];

  const uncertainties = ctx.activeFamilies.length === 0
    ? ['Awaiting next Founder teaching to advance active families']
    : [];

  const questionsForFounder = nearStage7.length
    ? [`How shall we complete ${nearStage7[0]}?`]
    : ['What teaching shall deepen the ontology next?'];

  const reflection = [
    journalBody,
    '',
    `Active families: ${ctx.activeFamilies.length}. Completed: ${ctx.completedFamilies.length}.`,
    ctx.unifiedUnderstanding.trim().slice(0, 600),
  ].join('\n').slice(0, 8000);

  return {
    reflection,
    questionsForFounder,
    nearStage7Notes:    nearStage7.slice(0, 8),
    missingConnections: missingConnections.slice(0, 8),
    uncertainties:      uncertainties.slice(0, 8),
  };
}
