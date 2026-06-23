/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Parent Report Tests (ERA_2i / ERA_3)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  listSubjectsForBand,
  masteryToTrainingGrade,
  subjectFromConceptTag,
} from '../src/adam/tutor-law/tutor-law.curriculum-catalog';
import { buildParentReportCard } from '../src/adam/tutor-law/tutor-law.parent-report-builder';
import { defaultTutorLearningProfile } from '../src/adam/tutor-law/tutor-law.learning-profile.types';

describe('ERA_3 curriculum catalog', () => {
  it('CAT-01: secondary band lists KSSM subjects including add_math', () => {
    const ids = listSubjectsForBand('secondary').map((s) => s.id);
    expect(ids).toContain('add_math');
    expect(ids).toContain('history');
    expect(ids.length).toBeGreaterThanOrEqual(20);
  });

  it('CAT-02: concept tags map to subject ids', () => {
    expect(subjectFromConceptTag('grammar.tenses.present_simple')).toBe('english');
    expect(subjectFromConceptTag('math.fractions.add')).toBe('math');
    expect(subjectFromConceptTag('bm.tatabahasa.kata_nama')).toBe('bm');
    expect(subjectFromConceptTag('science.cells')).toBe('science');
  });

  it('CAT-03: mastery maps to training grade bands', () => {
    expect(masteryToTrainingGrade(92)).toBe('A+');
    expect(masteryToTrainingGrade(71)).toBe('B');
    expect(masteryToTrainingGrade(35)).toBe('F');
  });
});

describe('ERA_2i parent report builder', () => {
  const now = new Date('2026-06-22T12:00:00.000Z');

  it('RPT-01: builds weekly report with enrolled subjects', () => {
    const profile = defaultTutorLearningProfile(now);
    profile.placementComplete = true;
    profile.subjectLevels = {
      english: 'KUAT',
      math:    'MEMBINA',
      bm:      'UNKNOWN',
    };
    profile.interactionLog = [
      {
        at:         '2026-06-21T10:00:00.000Z',
        kind:       'checkpoint',
        contentId:  'ct-en-d01',
        conceptTag: 'grammar.tenses.present_simple',
        subject:    'english',
        correct:    true,
        responseMs: 5000,
      },
    ];
    profile.conceptMastery = {
      'grammar.tenses.present_simple': {
        pMastery:     0.8,
        attempts:     5,
        correctCount: 4,
        lastUpdated:  '2026-06-21T10:00:00.000Z',
      },
    };

    const report = buildParentReportCard({
      profile,
      studentUserId: 'stu-1',
      studentName:   'Ahmad',
      schoolName:    'SMK Contoh',
      yearLabel:     'Tingkatan 2',
      band:          'secondary',
      subjectsTaken: ['english', 'math', 'science', 'history'],
      now,
    });

    expect(report.version).toBe(1);
    expect(report.kind).toBe('weekly');
    expect(report.subjects).toHaveLength(4);
    expect(report.subjects.find((s) => s.subjectId === 'english')?.tracked).toBe(true);
    expect(report.subjects.find((s) => s.subjectId === 'science')?.tracked).toBe(false);
    expect(report.overall.subjectsEnrolled).toBe(4);
    expect(report.disclaimerMs).toMatch(/bukan keputusan rasmi/i);
    expect(report.insights.recommendations.length).toBeGreaterThan(0);
  });

  it('RPT-02: untracked enrolled subject shows not_started without events', () => {
    const profile = defaultTutorLearningProfile(now);

    const report = buildParentReportCard({
      profile,
      studentUserId: 'stu-2',
      studentName:   'Siti',
      band:          'secondary',
      subjectsTaken: ['physics'],
      now,
    });

    const physics = report.subjects[0];
    expect(physics?.subjectId).toBe('physics');
    expect(physics?.band).toBe('not_started');
    expect(physics?.tracked).toBe(false);
  });
});
