/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Prospect Lead Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import crypto from 'crypto';
import {
  TutorAgentProspectInterest,
  TutorAgentProspectLeadModel,
  type ITutorAgentProspectLead,
} from './adam-tutor-agent-prospect.schema';

function newProspectLeadId(): string {
  return `TUTOR-LEAD-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

export interface SubmitTutorAgentProspectLeadInput {
  contactName:  string;
  email:        string;
  phone?:       string;
  organisation?: string;
  state:        string;
  interest:     TutorAgentProspectInterest;
  notes?:       string;
}

export interface SerializedTutorAgentProspectLead {
  leadId:       string;
  contactName:  string;
  email:        string;
  phone:        string | null;
  organisation: string | null;
  state:        string;
  interest:     TutorAgentProspectInterest;
  notes:        string | null;
  createdAt:    string;
  updatedAt:    string;
}

function serializeLead(doc: ITutorAgentProspectLead): SerializedTutorAgentProspectLead {
  return {
    leadId:       doc.leadId,
    contactName:  doc.contactName,
    email:        doc.email,
    phone:        doc.phone,
    organisation: doc.organisation,
    state:        doc.state,
    interest:     doc.interest,
    notes:        doc.notes,
    createdAt:    doc.createdAt.toISOString(),
    updatedAt:    doc.updatedAt.toISOString(),
  };
}

export async function submitTutorAgentProspectLead(
  input: SubmitTutorAgentProspectLeadInput,
): Promise<SerializedTutorAgentProspectLead> {
  const contactName = input.contactName.trim();
  const email = input.email.trim().toLowerCase();
  const state = input.state.trim();

  if (!contactName) throw new Error('Name is required.');
  if (!email || !email.includes('@')) throw new Error('A valid email is required.');
  if (!state) throw new Error('State is required.');

  const payload = {
    contactName,
    email,
    phone:        input.phone?.trim() || null,
    organisation: input.organisation?.trim() || null,
    state,
    interest:     input.interest,
    notes:        input.notes?.trim() || null,
  };

  const existing = await TutorAgentProspectLeadModel.findOne({ email });
  if (existing) {
    Object.assign(existing, payload);
    await existing.save();
    return serializeLead(existing);
  }

  const created = await TutorAgentProspectLeadModel.create({
    leadId: newProspectLeadId(),
    ...payload,
  });
  return serializeLead(created);
}

export async function listAdminTutorAgentProspectLeads(): Promise<SerializedTutorAgentProspectLead[]> {
  const rows = await TutorAgentProspectLeadModel.find().sort({ createdAt: -1 }).lean();
  return rows.map((row) => serializeLead(row as unknown as ITutorAgentProspectLead));
}
