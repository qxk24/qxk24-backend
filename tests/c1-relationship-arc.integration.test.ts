/// <reference types="jest" />

/**
 * C1 integration tests — Mongo-backed arc bridge (qxk24-backend only).
 */

jest.mock('../src/adam/adam.schema', () => ({
  ADAMMessageModel: {
    find: jest.fn(),
  },
  ADAMFounderSessionModel: {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  },
}));

jest.mock('../src/qxk24brain/qxk24brain-student.engine', () => ({
  getStudentConstitutionalState: jest.fn(),
  updateStudentConstitutionalState: jest.fn(),
}));

import { ADAMMessageModel, ADAMFounderSessionModel } from '../src/adam/adam.schema';
import {
  ARC_MIN_TURNS,
  buildStudentRelationshipArc,
  syncSessionArcToStudentTrack,
} from '../src/qxk24brain/student-arc-bridge';

describe('C1 — Student Relationship Arc (backend integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('buildStudentRelationshipArc returns empty string for sessions < 3 turns', async () => {
    (ADAMMessageModel.find as jest.Mock).mockReturnValue({
      sort: () => ({
        lean: async () => [{ role: 'student', content: 'Hi' }],
      }),
    });

    const arc = await buildStudentRelationshipArc('session-thin', 'student-test');
    expect(arc).toBe('');
    expect(ARC_MIN_TURNS).toBe(3);
  });

  test('syncSessionArcToStudentTrack returns synced:false when session not found', async () => {
    (ADAMFounderSessionModel.findOne as jest.Mock).mockReturnValue({
      lean: async () => null,
    });

    const result = await syncSessionArcToStudentTrack('nonexistent-session', 'student-x');
    expect(result.synced).toBe(false);
    expect(result.reason).toBe('Session not found');
  });
});
