/**
 * ============================================================
 * Module      : ADAM Journal Initiate Service
 * Creates a new journal document with TITLE_DRAFT status.
 * ============================================================
 */

import { JournalV2Model } from './adam-journal-v2.schema';
import { generateJournalNumber } from './adam-journal-number.service';

interface InitiateParams {
  topicId:         string;
  majorId:         string;
  disciplineId:    string;
  disciplineLabel: string;
  subfield:        string;
  founderUserId:   string;
}

const COPYRIGHT = (year: number) =>
  `© ${year} QIUBBX Technologies (M) Sdn Bhd. All rights reserved. ` +
  `Alamtologi is the proprietary knowledge system of QIUBBX Technologies (M) Sdn Bhd, ` +
  `founded and developed by Masa Bayu. Published on Alamtologi — alamtologi.com. ` +
  `Unauthorised reproduction is prohibited under the Malaysian Copyright Act 1987.`;

export async function initiateJournal(
  params: InitiateParams,
): Promise<{ journalId: string; journalNumber: string }> {
  const journalNumber = await generateJournalNumber();
  const year = new Date().getFullYear();

  const doc = await JournalV2Model.create({
    journalNumber,
    topicId:         params.topicId,
    majorId:         params.majorId,
    disciplineId:    params.disciplineId,
    disciplineLabel: params.disciplineLabel,
    subfield:        params.subfield,
    author:          'Masa Bayu',
    organisation:    'QIUBBX Technologies (M) Sdn Bhd',
    copyright:       COPYRIGHT(year),
    founderUserId:   params.founderUserId,
    status:          'TITLE_DRAFT',
  });

  const journalId = String(doc._id);
  console.log(`[journal:initiate] Created ${journalNumber} — id: ${journalId}`);
  return { journalId, journalNumber };
}
