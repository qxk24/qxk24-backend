/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Memory Configuration
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export interface AdamMemoryTierConfig {
  MESSAGE_WINDOW: number;
  BRAIN_CHARS: number;
  MESSAGE_CHARS: number;
  ANCHOR_MAX_CHARS: number;
  COMPLETED_FAMILIES: number;
  ACTIVE_FAMILIES: number;
  /** Current turn is never truncated below this (founder teaching) */
  CURRENT_MESSAGE_MIN_CHARS: number;
}

export const ADAM_MEMORY_CONFIG = {
  FOUNDER: {
    MESSAGE_WINDOW:     envInt('ADAM_FOUNDER_MESSAGE_WINDOW', 30),
    BRAIN_CHARS:        envInt('ADAM_FOUNDER_BRAIN_CHARS', 48_000),
    MESSAGE_CHARS:      envInt('ADAM_FOUNDER_MESSAGE_CHARS', 8_000),
    ANCHOR_MAX_CHARS:   envInt('ADAM_FOUNDER_ANCHOR_CHARS', 2_000),
    COMPLETED_FAMILIES: envInt('ADAM_FOUNDER_COMPLETED_FAMILIES', 10),
    ACTIVE_FAMILIES:    envInt('ADAM_FOUNDER_ACTIVE_FAMILIES', 20),
    CURRENT_MESSAGE_MIN_CHARS: 80_000,
  },
  STUDENT: {
    MESSAGE_WINDOW:     envInt('ADAM_STUDENT_MESSAGE_WINDOW', 15),
    BRAIN_CHARS:        envInt('ADAM_STUDENT_BRAIN_CHARS', 24_000),
    MESSAGE_CHARS:      envInt('ADAM_STUDENT_MESSAGE_CHARS', 4_000),
    ANCHOR_MAX_CHARS:   envInt('ADAM_STUDENT_ANCHOR_CHARS', 1_500),
    COMPLETED_FAMILIES: envInt('ADAM_STUDENT_COMPLETED_FAMILIES', 5),
    ACTIVE_FAMILIES:    envInt('ADAM_STUDENT_ACTIVE_FAMILIES', 10),
    CURRENT_MESSAGE_MIN_CHARS: 48_000,
  },
  WORKSPACE: {
    MESSAGE_WINDOW:     envInt('ADAM_WORKSPACE_MESSAGE_WINDOW', 20),
    BRAIN_CHARS:        envInt('ADAM_WORKSPACE_BRAIN_CHARS', 32_000),
    MESSAGE_CHARS:      envInt('ADAM_WORKSPACE_MESSAGE_CHARS', 6_000),
    ANCHOR_MAX_CHARS:   envInt('ADAM_WORKSPACE_ANCHOR_CHARS', 1_500),
    COMPLETED_FAMILIES: envInt('ADAM_WORKSPACE_COMPLETED_FAMILIES', 5),
    ACTIVE_FAMILIES:    envInt('ADAM_WORKSPACE_ACTIVE_FAMILIES', 10),
    CURRENT_MESSAGE_MIN_CHARS: 64_000,
  },
} as const satisfies Record<string, AdamMemoryTierConfig>;

export function getAdamMemoryConfig(
  role: 'founder' | 'student',
  isWorkspace: boolean,
): AdamMemoryTierConfig {
  const base = isWorkspace
    ? ADAM_MEMORY_CONFIG.WORKSPACE
    : role === 'founder'
      ? ADAM_MEMORY_CONFIG.FOUNDER
      : ADAM_MEMORY_CONFIG.STUDENT;

  if (process.env.QXK24_STACK !== 'lab') return base;

  return {
    ...base,
    MESSAGE_WINDOW:     Math.min(base.MESSAGE_WINDOW, 12),
    BRAIN_CHARS:        Math.min(base.BRAIN_CHARS, 8_000),
    MESSAGE_CHARS:      Math.min(base.MESSAGE_CHARS, 3_000),
    COMPLETED_FAMILIES: Math.min(base.COMPLETED_FAMILIES, 3),
    ACTIVE_FAMILIES:    Math.min(base.ACTIVE_FAMILIES, 5),
  };
}
