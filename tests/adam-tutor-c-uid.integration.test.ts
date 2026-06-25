/// <reference types="jest" />

import { describe, expect, it, jest, afterEach } from '@jest/globals';
import { buildTutorUidRecallBlock } from '../src/adam/adam-tutor-recall.service';
import * as teachingRecord from '../src/qxk24brain/adam-teaching-record.service';
import type { TeachingRecordRow } from '../src/qxk24brain/adam-teaching-record.service';

function mockEpisode(studentId: string, topic: string): TeachingRecordRow {
  return {
    recordId:           'K24TR-TUT-test',
    founderId:          'founder-1',
    transformationId:   'K24TX-TUT-test',
    entity_C_uid:       'K24B-TUTOR-test',
    masa_recorded:      new Date(),
    stage:              1,
    family:             'Tutor UI Guide Synthesis',
    principle:          'CAHAYA',
    isNewFamily:        false,
    teacherRole:        'tutor',
    teacherName:          'ADAM UI Guide',
    aSource:            'tutor',
    episodeSummary:     topic,
    teachingIntent:     `Guide ${topic}`,
    outcomeSummary:     `Pelajar memahami asas ${topic}`,
    relationalTags:     [`uid:${studentId}`, 'channel:tutor'],
    autoJudgment:       'MAKMUR',
    auditStatus:        'pending',
    kernel:             '1.7.0',
    era:                'ERA_3',
    status:             'active',
    transformMeta: {
      studentId,
      channelLane:  'tutor',
      questionHash: 'abc',
    },
  } as TeachingRecordRow;
}

describe('adam-tutor-c-uid — recall isolation (integration)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('buildTutorUidRecallBlock returns only scoped student episodes', async () => {
    const spy = jest.spyOn(teachingRecord, 'searchTeachingRecords')
      .mockImplementation(async (_founderId, _query, _limit, options) => {
        const studentId = options?.studentId?.trim();
        if (studentId === 'uid-a') {
          return [mockEpisode('uid-a', 'fotosintesis')];
        }
        return [];
      });

    const blockA = await buildTutorUidRecallBlock('uid-a', 'Ali', 'fotosintesis');
    const blockB = await buildTutorUidRecallBlock('uid-b', 'Siti', 'fotosintesis');

    expect(blockA).toMatch(/TUTOR UI GUIDE RECALL/);
    expect(blockA).toMatch(/UID: uid-a/);
    expect(blockB).toBeNull();

    expect(spy).toHaveBeenCalledWith(
      expect.any(String),
      'fotosintesis',
      expect.any(Number),
      expect.objectContaining({
        studentId:    'uid-a',
        teacherRoles: ['tutor'],
        channelLane:  'tutor',
      }),
    );
  });
});
