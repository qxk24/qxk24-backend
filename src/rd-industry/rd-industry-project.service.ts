/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : R&D Industry Project Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { compileAdamDocument } from '../adam/adam-document-export.service';
import {
  deliverableHeader,
  emptyDeliverableSections,
  isValidSectionKey,
  listSectionTemplates,
} from './rd-industry-template';
import {
  RdIndustryProjectModel,
  type IRdIndustryProject,
} from './rd-industry-project.schema';
import type { RdIndustryAccess } from './rd-industry-access.service';
import type { RdIndustryDeliverableType } from './rd-industry.types';

function yearKey(): string {
  return String(new Date().getUTCFullYear());
}

async function nextSequence(suffix: 'TW' | 'IW' | 'PACK'): Promise<string> {
  const year = yearKey();
  const prefix = `ALM-RD-${year}-`;
  const count = await RdIndustryProjectModel.countDocuments({
    $or: [
      { 'technical.documentId': { $regex: `^${prefix}` } },
      { packId: { $regex: `^${prefix}` } },
    ],
  });
  const seq = String(count + 1).padStart(3, '0');
  return suffix === 'PACK'
    ? `${prefix}${seq}-PACK`
    : `${prefix}${seq}-${suffix}`;
}

function deliverableField(
  type: RdIndustryDeliverableType,
): 'technical' | 'implementation' {
  return type === 'TECHNICAL_WHITEPAPER' ? 'technical' : 'implementation';
}

function sectionsToMarkdown(
  project: IRdIndustryProject,
  type: RdIndustryDeliverableType,
): string {
  const field = deliverableField(type);
  const del = project[field];
  const templates = listSectionTemplates(type);
  const lines: string[] = [
    `# ${deliverableHeader(type)}`,
    '',
    `**Project:** ${project.projectFocus}`,
    del.documentId ? `**Document ID:** ${del.documentId}` : '',
    '',
  ].filter(Boolean);

  for (const tmpl of templates) {
    const draft = del.sections?.[tmpl.key];
    const body = typeof draft === 'object' && draft && 'content' in draft
      ? String((draft as { content: string }).content)
      : '';
    lines.push(`## ${tmpl.title}`, '', body || '_(draft pending)_', '');
  }

  lines.push(
    '---',
    '',
    '**Ownership:** This document is 100% owned by the researcher / rightful party — not Alamtologi or ADAM.',
    '',
    '_Sealed under Alamtologi R&D Eksklusif — Industry · QXK24 v1.7.0_',
  );

  return lines.join('\n');
}

export function serializeProject(project: IRdIndustryProject) {
  return {
    id:                project._id.toString(),
    projectFocus:      project.projectFocus,
    status:            project.status,
    packId:            project.packId,
    researchSessionId: project.researchSessionId,
    rdSubscriptionId:  project.rdSubscriptionId,
    technical: {
      type:       project.technical.type,
      status:     project.technical.status,
      documentId: project.technical.documentId,
      sealedAt:   project.technical.sealedAt,
      sections:   listSectionTemplates('TECHNICAL_WHITEPAPER').map((t) => ({
        key:         t.key,
        title:       t.title,
        description: t.description,
        hasContent:  Boolean(project.technical.sections?.[t.key]?.content?.trim()),
      })),
    },
    implementation: {
      type:       project.implementation.type,
      status:     project.implementation.status,
      documentId: project.implementation.documentId,
      sealedAt:   project.implementation.sealedAt,
      technicalWpVersion: project.implementation.technicalWpVersion,
      sections:   listSectionTemplates('IMPLEMENTATION_WHITEPAPER').map((t) => ({
        key:         t.key,
        title:       t.title,
        description: t.description,
        hasContent:  Boolean(project.implementation.sections?.[t.key]?.content?.trim()),
      })),
    },
  };
}

export async function getOrCreateIndustryProject(
  userId: string,
  access: RdIndustryAccess,
): Promise<IRdIndustryProject> {
  const existing = await RdIndustryProjectModel.findOne({
    userId,
    rdSubscriptionId: access.subscriptionId,
    status:           { $ne: 'completed' },
  }).sort({ createdAt: -1 });

  if (existing) return existing;

  const focus = access.subscription.projectFocus?.trim()
    || 'Industry R&D project';

  return RdIndustryProjectModel.create({
    userId,
    rdSubscriptionId: access.subscriptionId,
    projectFocus:     focus,
    status:           'active',
    technical: {
      type:       'TECHNICAL_WHITEPAPER',
      status:     'draft',
      documentId: null,
      sections:   emptyDeliverableSections('TECHNICAL_WHITEPAPER'),
      sealedAt:   null,
      technicalWpVersion: null,
    },
    implementation: {
      type:       'IMPLEMENTATION_WHITEPAPER',
      status:     'draft',
      documentId: null,
      sections:   emptyDeliverableSections('IMPLEMENTATION_WHITEPAPER'),
      sealedAt:   null,
      technicalWpVersion: null,
    },
  });
}

export async function getIndustryProjectForUser(
  userId: string,
  projectId: string,
): Promise<IRdIndustryProject | null> {
  return RdIndustryProjectModel.findOne({ _id: projectId, userId });
}

export async function saveIndustrySection(input: {
  userId:    string;
  projectId: string;
  type:      RdIndustryDeliverableType;
  sectionKey: string;
  content:   string;
}): Promise<IRdIndustryProject> {
  const project = await getIndustryProjectForUser(input.userId, input.projectId);
  if (!project) throw new Error('R&D Industry project not found.');

  if (!isValidSectionKey(input.type, input.sectionKey)) {
    throw new Error(`Invalid section key: ${input.sectionKey}`);
  }

  const field = deliverableField(input.type);
  if (project[field].status === 'sealed') {
    throw new Error('Cannot edit a sealed deliverable.');
  }

  if (
    input.type === 'IMPLEMENTATION_WHITEPAPER'
    && project.technical.status !== 'sealed'
  ) {
    throw new Error('Seal Technical Whitepaper before editing Implementation Whitepaper.');
  }

  const path = `${field}.sections.${input.sectionKey}`;
  await RdIndustryProjectModel.findByIdAndUpdate(project._id, {
    $set: {
      [path]: { content: input.content, updatedAt: new Date() },
    },
  });

  const updated = await RdIndustryProjectModel.findById(project._id);
  if (!updated) throw new Error('Project update failed.');
  return updated;
}

export async function sealIndustryDeliverable(input: {
  userId:    string;
  projectId: string;
  type:      RdIndustryDeliverableType;
}): Promise<{ project: IRdIndustryProject; packId: string | null }> {
  const project = await getIndustryProjectForUser(input.userId, input.projectId);
  if (!project) throw new Error('R&D Industry project not found.');

  const field = deliverableField(input.type);
  const del = project[field];

  if (del.status === 'sealed') {
    throw new Error('Deliverable already sealed.');
  }

  if (
    input.type === 'IMPLEMENTATION_WHITEPAPER'
    && project.technical.status !== 'sealed'
  ) {
    throw new Error('Technical Whitepaper must be sealed first.');
  }

  const templates = listSectionTemplates(input.type);
  const missing = templates.filter((t) => {
    const c = del.sections?.[t.key]?.content?.trim();
    return !c || c.length < 40;
  });
  if (missing.length > 0) {
    throw new Error(
      `Complete all sections before seal (min ~40 chars). Missing: ${missing.map((m) => m.key).join(', ')}`,
    );
  }

  const docId = await nextSequence(input.type === 'TECHNICAL_WHITEPAPER' ? 'TW' : 'IW');
  const now = new Date();

  const update: Record<string, unknown> = {
    [`${field}.status`]:     'sealed',
    [`${field}.documentId`]: docId,
    [`${field}.sealedAt`]:   now,
  };

  if (input.type === 'TECHNICAL_WHITEPAPER') {
    update.status = 'technical_sealed';
    update['implementation.technicalWpVersion'] = docId;
  }

  let packId: string | null = project.packId;

  if (input.type === 'IMPLEMENTATION_WHITEPAPER') {
    packId = await nextSequence('PACK');
    update.packId = packId;
    update.status = 'pack_sealed';
  }

  await RdIndustryProjectModel.findByIdAndUpdate(project._id, { $set: update });
  const updated = await RdIndustryProjectModel.findById(project._id);
  if (!updated) throw new Error('Seal failed.');

  return { project: updated, packId };
}

export async function exportIndustryDeliverable(input: {
  userId:    string;
  projectId: string;
  type:      RdIndustryDeliverableType;
  format:    'pdf' | 'docx';
}): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
  const project = await getIndustryProjectForUser(input.userId, input.projectId);
  if (!project) throw new Error('R&D Industry project not found.');

  const field = deliverableField(input.type);
  if (project[field].status !== 'sealed') {
    throw new Error('Export Full requires sealed deliverable.');
  }

  const markdown = sectionsToMarkdown(project, input.type);
  const title = project[field].documentId
    ?? deliverableHeader(input.type);

  const compiled = await compileAdamDocument({
    content: markdown,
    format:  input.format,
    title,
    author:  'Researcher — Alamtologi R&D Eksklusif',
  });

  return compiled;
}

export async function bindResearchSession(
  userId: string,
  projectId: string,
  sessionId: string,
): Promise<void> {
  await RdIndustryProjectModel.findOneAndUpdate(
    { _id: projectId, userId },
    { $set: { researchSessionId: sessionId } },
  );
}
