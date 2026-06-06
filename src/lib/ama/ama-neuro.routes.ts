/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : AMA Neuro Validation Routes (Tahap 4)
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-07
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireFounder } from '../../middleware/auth.middleware';
import {
  getAmaNeuroHealthSnapshot,
  getLastNeuroValidationReport,
  persistNeuroSampleToSegments,
  runDefaultSimulatorProtocol,
  runNeuroValidationProtocol,
  validateNeuroSample,
} from './ama-neuro-validation.service';
import {
  isAmaBrainV2Enabled,
  isAmaNeuroCalibrated,
  isAmaNeuroValidationEnabled,
  isAmaTamatOassEnabled,
} from './ama.config';
import type { NeuroPhysioSample } from './ama-neuro.types';

const neuroSampleSchema = z.object({
  sourceId:            z.string().min(1),
  subjectId:           z.string().min(1),
  mode:                z.enum(['simulator', 'device', 'clinical']).default('device'),
  thetaAlphaCoherence: z.number().min(0).max(1),
  hrvSdnnMs:           z.number().min(0),
  rsaGain:             z.number().min(0).max(1),
  fmriKrKnZScore:      z.number().optional(),
  krSnippet:           z.string().optional(),
  knSnippet:           z.string().optional(),
});

const protocolSchema = z.object({
  samples: z.array(neuroSampleSchema).min(1).max(10).optional(),
  mode:    z.enum(['simulator', 'device', 'clinical']).default('simulator'),
});

export const amaNeuroRoutes = new Hono();

amaNeuroRoutes.get('/status', requireFounder, (c) => {
  return c.json({
    ama: {
      brainV2:           isAmaBrainV2Enabled(),
      tamatOass:         isAmaTamatOassEnabled(),
      neuroValidation:   isAmaNeuroValidationEnabled(),
      neuroCalibrated:   isAmaNeuroCalibrated(),
    },
    neuro: getAmaNeuroHealthSnapshot(),
    lastReport: getLastNeuroValidationReport(),
  });
});

amaNeuroRoutes.post(
  '/validate/sample',
  requireFounder,
  zValidator('json', neuroSampleSchema),
  async (c) => {
    const body = c.req.valid('json') as NeuroPhysioSample;
    const sample: NeuroPhysioSample = {
      ...body,
      timestamp: new Date().toISOString(),
    };
    const result = validateNeuroSample(sample);

    persistNeuroSampleToSegments('masa-bayu', sample).catch(() => {});

    return c.json({ validation: result });
  },
);

amaNeuroRoutes.post(
  '/validate/protocol',
  requireFounder,
  zValidator('json', protocolSchema),
  async (c) => {
    const body = c.req.valid('json');
    const report = body.samples?.length
      ? runNeuroValidationProtocol(body.samples as NeuroPhysioSample[], body.mode)
      : runDefaultSimulatorProtocol();

    for (const v of report.samples) {
      if (v.passed) {
        persistNeuroSampleToSegments('masa-bayu', v.sample).catch(() => {});
      }
    }

    return c.json({ report });
  },
);

amaNeuroRoutes.get('/report', requireFounder, (c) => {
  const report = getLastNeuroValidationReport();
  if (!report) {
    return c.json({ report: null, message: 'No protocol run yet — POST /validate/protocol' }, 404);
  }
  return c.json({ report });
});
