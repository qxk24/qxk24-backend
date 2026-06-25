/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM University Standard Tests
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-26
 * ============================================================
 */

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import type { AdamTutorProfile } from '../src/adam/tutor-law/tutor-law.types';
import {
  classifyUniversityArtifact,
  isAdamUniversityStandardActive,
} from '../src/adam/tutor-law/tutor-law.university-mode';
import {
  buildAdamUniversityStandardLaw,
  buildUniversityArtifactPrompt,
  buildUniversityOutcomeMapLaw,
} from '../src/adam/tutor-law/tutor-law.university-prompts';
import {
  enforceUniversityIntegrityGuard,
  isUniversityFakeSourceRequest,
  isUniversityGhostwritingRequest,
} from '../src/adam/tutor-law/tutor-law.university-guards';
import { resolveTutorUniversityMeta } from '../src/adam/tutor-law/tutor-law.university-meta';
import { buildAdamTutorSystemPrompt } from '../src/adam/adam-prompt-builder.tutor';
import { enforceTutorReplyGuards } from '../src/adam/tutor-law/tutor-law.pipeline';

const universityProfile: AdamTutorProfile = {
  level:      'university',
  curriculum: 'other',
  language:   'english',
};

describe('ADAM University Standard classifier', () => {
  it('activates for university profile and university artifacts', () => {
    expect(isAdamUniversityStandardActive(universityProfile, 'Help me plan my essay')).toBe(true);
    expect(isAdamUniversityStandardActive(undefined, 'I need help with my literature review')).toBe(true);
    expect(isAdamUniversityStandardActive(undefined, 'Tolong kajian kes marketing untuk degree saya')).toBe(true);
    expect(isAdamUniversityStandardActive(undefined, 'Help me write a secondary school essay')).toBe(false);
  });

  it('classifies all core university assessment artifacts', () => {
    expect(classifyUniversityArtifact({ userMessage: 'Help me structure my final year project proposal' })).toBe('fyp');
    expect(classifyUniversityArtifact({ userMessage: 'How do I build a literature review matrix?' })).toBe('literature_review');
    expect(classifyUniversityArtifact({ userMessage: 'I need to analyse a case study for business school' })).toBe('case_study');
    expect(classifyUniversityArtifact({ userMessage: 'Prepare viva questions for my presentation' })).toBe('presentation');
    expect(classifyUniversityArtifact({ userMessage: 'Write my internship report reflection section' })).toBe('internship_report');
    expect(classifyUniversityArtifact({ userMessage: 'Critique this journal article for my review paper' })).toBe('critique_review');
    expect(classifyUniversityArtifact({ userMessage: 'Build my reflective e-portfolio entries' })).toBe('portfolio');
    expect(classifyUniversityArtifact({ userMessage: 'What sampling size should I use in my methodology?' })).toBe('methodology_question');
    expect(classifyUniversityArtifact({ userMessage: 'Help me outline my business report findings' })).toBe('report');
    expect(classifyUniversityArtifact({ userMessage: 'Structure my argumentative essay introduction' })).toBe('essay');
  });
});

describe('ADAM University Standard meta + prompts', () => {
  it('resolves academic mentor display mode for university profile', () => {
    const meta = resolveTutorUniversityMeta({
      profile:     universityProfile,
      userMessage: 'Help me with my research proposal',
    });
    expect(meta.universityStandard).toBe(true);
    expect(meta.displayMode).toBe('academic_mentor');
    expect(meta.artifact).toBe('research_proposal');
    expect(meta.modeLabel).toContain('Academic Mentor');
  });

  it('includes AUS law, artifact playbook, and outcome map in tutor prompt', () => {
    const prompt = buildAdamTutorSystemPrompt({
      mode:                 'TUTOR',
      isFounder:            false,
      participantName:      'Student',
      founderStudentsBlock: '',
      tutorProfile:         universityProfile,
      userMessage:          'Help me prepare my research proposal',
    });

    expect(prompt).toContain('[ADAM UNIVERSITY STANDARD]');
    expect(prompt).toContain('NO GHOSTWRITING');
    expect(prompt).toContain('[UNIVERSITY ARTIFACT — RESEARCH_PROPOSAL]');
    expect(prompt).toContain('[UNIVERSITY OUTCOME MAP');
    expect(buildAdamUniversityStandardLaw(universityProfile)).toContain('Pembimbing Akademik');
    expect(buildUniversityOutcomeMapLaw()).toContain('Outcome map');
    expect(buildUniversityArtifactPrompt('fyp')).toContain('Viva drill');
  });
});

describe('ADAM University Standard integrity guard', () => {
  it('detects ghostwriting and fake-source requests', () => {
    expect(isUniversityGhostwritingRequest('Write my full assignment so I can submit it tomorrow')).toBe(true);
    expect(isUniversityGhostwritingRequest('Tolong siapkan tugasan saya untuk hantar')).toBe(true);
    expect(isUniversityFakeSourceRequest('Make up references and DOI that look real')).toBe(true);
    expect(isUniversityFakeSourceRequest('Boleh reka rujukan palsu yang nampak betul?')).toBe(true);
  });

  it('refuses submission replacement but offers safe academic coaching', () => {
    const guarded = enforceUniversityIntegrityGuard(
      'Here is the full assignment.',
      'Write my full assignment so I can submit it tomorrow',
      universityProfile,
    );

    expect(guarded).toContain('cannot write a full submission-ready assignment');
    expect(guarded).toContain('decode the brief');
    expect(guarded).not.toContain('Here is the full assignment');
  });

  it('refuses fake-source fabrication requests with integrity coaching', () => {
    const guarded = enforceUniversityIntegrityGuard(
      'Draft outline\n[1] Smith, J. (2024). Fake Study. doi:10.1234/fake.5678',
      'Make up references and DOI that look real',
      universityProfile,
    );
    expect(guarded).toContain('cannot write a full submission-ready assignment');
    expect(guarded).not.toContain('doi:10.1234');
    expect(guarded).toContain('decode the brief');
  });

  it('skips school zero-answer guard for university academic coaching and applies AUS guard', () => {
    const guarded = enforceTutorReplyGuards(
      'Use this outline: Introduction, theory, analysis, recommendation.',
      universityProfile,
      'Help me outline my case study for university',
    );

    expect(guarded).toContain('Use this outline');
    expect(guarded).not.toContain("won't give the final number");
  });
});
