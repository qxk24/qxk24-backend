/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Consult Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 */

import { ADAMConsultModel } from './adam.schema';
import type { SessionType } from './adam-student.types';

export interface ConsultRecord {
  id:            string;
  studentId:     string;
  studentName:   string;
  sessionId:     string;
  sessionType:   SessionType;
  studentMessage:string;
  adamSummary:   string;
  status:        'pending' | 'resolved';
  createdAt:     Date;
}

export async function createConsultFlag(params: {
  studentId:      string;
  studentName:    string;
  sessionId:      string;
  sessionType:    'student' | 'group';
  studentMessage: string;
  adamSummary?:   string;
}): Promise<ConsultRecord> {
  const consultId = `K24c-${Date.now()}`;

  const doc = await ADAMConsultModel.create({
    consultId,
    studentId:          params.studentId,
    studentName:        params.studentName,
    sessionId:          params.sessionId,
    sessionType:        params.sessionType,
    studentMessage:     params.studentMessage.slice(0, 3000),
    adamSummary:        params.adamSummary?.slice(0, 2000) ?? '',
    status:             'pending',
    deliveredToFounder: false,
  });

  return mapConsult(doc);
}

export async function markConsultDeliveredToFounder(consultId: string): Promise<void> {
  await ADAMConsultModel.updateOne(
    { consultId },
    { deliveredToFounder: true },
  );
}

export async function listPendingConsults(limit = 50): Promise<ConsultRecord[]> {
  const docs = await ADAMConsultModel.find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map(mapConsult);
}

export async function listAllConsults(limit = 50): Promise<ConsultRecord[]> {
  const docs = await ADAMConsultModel.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map(mapConsult);
}

export async function listConsultsForStudent(
  studentId: string,
  limit = 12,
): Promise<ConsultRecord[]> {
  const docs = await ADAMConsultModel.find({ studentId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map(mapConsult);
}

export async function resolveConsult(consultId: string): Promise<boolean> {
  const result = await ADAMConsultModel.updateOne(
    { consultId, status: 'pending' },
    { status: 'resolved', resolvedAt: new Date() },
  );
  return result.modifiedCount > 0;
}

function mapConsult(doc: {
  consultId:       string;
  studentId:       string;
  studentName:     string;
  sessionId:       string;
  sessionType:     string;
  studentMessage:  string;
  adamSummary:     string;
  status:          'pending' | 'resolved';
  createdAt:       Date;
}): ConsultRecord {
  return {
    id:             doc.consultId,
    studentId:      doc.studentId,
    studentName:    doc.studentName,
    sessionId:      doc.sessionId,
    sessionType:    doc.sessionType as SessionType,
    studentMessage: doc.studentMessage,
    adamSummary:    doc.adamSummary,
    status:         doc.status,
    createdAt:      doc.createdAt,
  };
}
