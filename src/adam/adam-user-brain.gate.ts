/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM User Relational Brain Gate
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

export function shouldSkipUserRelationalCBlock(studentId: string): boolean {
  return !studentId?.trim();
}

export function shouldSkipStudentInquiryRecall(studentId: string, userMessage: string): boolean {
  return shouldSkipUserRelationalCBlock(studentId) || userMessage.trim().length < 2;
}
