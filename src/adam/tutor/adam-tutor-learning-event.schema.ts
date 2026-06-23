/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Learning Event Schema (ERA_2h)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose, { Document, Schema } from 'mongoose';
import type {
  LearningInteractionEvent,
  LearningInteractionKind,
} from '../tutor-law/tutor-law.learning-profile.types';
import type { PlacementSubject } from '../tutor-law/tutor-law.placement-bank';

export interface ITutorLearningEvent extends Document, LearningInteractionEvent {
  userId: string;
}

const TutorLearningEventSchema = new Schema<ITutorLearningEvent>(
  {
    userId:      { type: String, required: true, index: true },
    at:          { type: String, required: true, index: true },
    kind:        { type: String, required: true },
    contentId:   { type: String, required: true },
    conceptTag:  { type: String, required: true },
    subject:     { type: String, required: true },
    correct:     { type: Boolean, required: true },
    responseMs:  { type: Number },
    thetaAfter:  { type: Number },
  },
  { timestamps: true, collection: 'tutorLearningEvents' },
);

TutorLearningEventSchema.index({ userId: 1, at: -1 });

export const TutorLearningEventModel = mongoose.model<ITutorLearningEvent>(
  'TutorLearningEvent',
  TutorLearningEventSchema,
);

export type TutorLearningEventInsert = LearningInteractionEvent & {
  userId: string;
  kind:     LearningInteractionKind;
  subject:  PlacementSubject;
};
