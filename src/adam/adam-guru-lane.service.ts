/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAMGuru — Small Brain Lane
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import {
  AdamGuruLaneModel,
  GURU_LANE_DIGEST_MAX_CHARS,
  type AdamGuruLaneDocument,
} from './adam-guru.schema';

function clipDigest(text: string): string {
  const t = text.trim();
  if (t.length <= GURU_LANE_DIGEST_MAX_CHARS) return t;
  return `…${t.slice(-(GURU_LANE_DIGEST_MAX_CHARS - 1))}`;
}

export async function getOrCreateGuruLane(input: {
  kelasId:   string;
  guruId:    string;
  guruName:  string;
  subject:   string;
}): Promise<AdamGuruLaneDocument> {
  let lane = await AdamGuruLaneModel.findOne({ kelasId: input.kelasId });
  if (!lane) {
    lane = await AdamGuruLaneModel.create({
      kelasId:    input.kelasId,
      guruId:     input.guruId,
      guruName:   input.guruName,
      subject:    input.subject,
      laneDigest: '',
      topicTags:  [],
      teachCount: 0,
    });
  }
  return lane;
}

export async function appendGuruLaneTeaching(input: {
  kelasId:    string;
  guruName:   string;
  teaching:   string;
  adamEcho?:  string;
}): Promise<void> {
  const lane = await AdamGuruLaneModel.findOne({ kelasId: input.kelasId });
  if (!lane) return;

  const stamp = new Date().toISOString().slice(0, 10);
  const block = [
  `\n\n[${stamp} — ${input.guruName} teaches]`,
  input.teaching.trim(),
  input.adamEcho?.trim()
    ? `\n[ADAM absorbed]: ${input.adamEcho.trim().slice(0, 600)}`
    : '',
  ].filter(Boolean).join('\n');

  const next = clipDigest(`${lane.laneDigest}${block}`);
  await AdamGuruLaneModel.updateOne(
    { kelasId: input.kelasId },
    {
      laneDigest: next,
      $inc:       { teachCount: 1 },
    },
  );
}

export async function loadGuruLaneDigest(kelasId: string): Promise<string> {
  const lane = await AdamGuruLaneModel.findOne({ kelasId }).lean();
  return lane?.laneDigest?.trim() ?? '';
}
