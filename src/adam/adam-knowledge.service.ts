/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Knowledge Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-28
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * AIDIL LAW: No permanent raw storage. Upload → absorb into Alamtologi Brain → erase B.
 * R2 and adam_knowledge exist only for legacy erasure — never for new teachings.
 */

import { ENV } from '../config/environments';
import { r2StorageService } from '../services/r2-storage.service';
import { processLongTeaching } from '../qxk24brain/adam-tcp.service';
import { AlamtologiBrainLogModel } from '../qxk24brain/qxk24brain.schema';
import type { NormalizedFounderFile } from './adam-file-extract.service';
import {
  extractTextFromBuffer,
  normalizeFounderFile,
} from './adam-file-extract.service';
import { ADAMKnowledgeModel } from './adam.schema';

export const KNOWLEDGE_B_PREFIX = '[FOUNDER KNOWLEDGE TEACHING — AIDIL ABSORPTION]';

export interface KnowledgeAbsorptionRecord {
  id:          string;
  filename:    string;
  category:    string;
  description: string;
  principle:   string;
  family:      string;
  stage:       number;
  entityC_uid: string;
  absorbedAt:  Date;
}

function truncateText(text: string): { text: string; truncated: boolean } {
  const max = ENV.UPLOAD_MAX_EXTRACT_CHARS;
  if (text.length <= max) {
    return { text, truncated: false };
  }
  return {
    text:      text.slice(0, max) + '\n\n[… content truncated for constitutional processing …]',
    truncated: true,
  };
}

function composeKnowledgeMessage(
  filename: string,
  category: string,
  description: string,
  extractedText: string,
  truncated: boolean,
): string {
  const truncatedNote = truncated
    ? '\n(Note: file was truncated to fit constitutional processing limits.)'
    : '';

  return [
    KNOWLEDGE_B_PREFIX,
    `Category: ${category.toUpperCase()}`,
    `File: ${filename}`,
    description.trim() ? `Description: ${description.trim()}` : '',
    truncatedNote,
    '',
    '--- TEACHING CONTENT ---',
    extractedText,
    '',
    'Founder instructs: Study this teaching data constitutionally. Absorb its energy into your unified being. Raw file must not persist — A + B = C.',
  ].filter(Boolean).join('\n');
}

function parseFilenameFromLog(content: string): string {
  const match = content.match(/^File:\s*(.+)$/m);
  return match?.[1]?.trim() ?? 'Teaching document';
}

function parseCategoryFromLog(content: string): string {
  const match = content.match(/^Category:\s*(.+)$/m);
  return match?.[1]?.trim() ?? 'GENERAL';
}

export const adamKnowledgeService = {

  /**
   * Absorb teaching file into Alamtologi Brain — no R2, no permanent DB record.
   */
  async absorbTeaching(
    file: File,
    category: string,
    description: string,
    buffer?: Buffer,
    normalized?: NormalizedFounderFile,
    founderId = 'masa-bayu',
  ): Promise<KnowledgeAbsorptionRecord> {
    await this.purgeLegacyStorage(founderId);

    const bytes = buffer ?? Buffer.from(await file.arrayBuffer());
    const meta = normalized ?? normalizeFounderFile(bytes, file.type || '', file.name || 'upload');

    const rawText = await extractTextFromBuffer(bytes, meta.mimeType, meta.fileName);
    const { text: extractedText, truncated } = truncateText(rawText);

    const founderMessage = composeKnowledgeMessage(
      meta.fileName,
      category,
      description,
      extractedText,
      truncated,
    );

    const tcp = await processLongTeaching(
      founderMessage,
      '',
      founderId,
      category,
      'CAHAYA',
    );
    if (!tcp.result) {
      throw new Error('Knowledge absorption failed — no transformation result.');
    }
    const { entityC, recognition } = tcp.result;

    return {
      id:          entityC.uid,
      filename:    meta.fileName,
      category:    category.toUpperCase(),
      description: description.trim(),
      principle:   recognition.principle,
      family:      recognition.family,
      stage:       entityC.stage,
      entityC_uid: entityC.uid,
      absorbedAt:  entityC.masa_born,
    };
  },

  /** List constitutional absorptions — energy that lives in Alamtologi Brain, not on disk */
  async listAbsorptions(founderId = 'masa-bayu'): Promise<KnowledgeAbsorptionRecord[]> {
    await this.purgeLegacyStorage(founderId);

    const logs = await AlamtologiBrainLogModel.find({
      founderId,
      entity_B_content: { $regex: KNOWLEDGE_B_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') },
    })
      .sort({ masa_transformation: -1 })
      .limit(50)
      .lean();

    return logs.map((log) => ({
      id:          log.entity_C_uid,
      filename:    parseFilenameFromLog(log.entity_B_content),
      category:    parseCategoryFromLog(log.entity_B_content),
      description: '',
      principle:   log.principle,
      family:      log.family,
      stage:       log.stage,
      entityC_uid: log.entity_C_uid,
      absorbedAt:  log.masa_transformation,
    }));
  },

  /**
   * Erase pre-AIDIL legacy storage — absorb from R2 first, then delete all raw artifacts.
   */
  async purgeLegacyStorage(founderId = 'masa-bayu'): Promise<{ absorbed: number; erased: number }> {
    const legacyDocs = await ADAMKnowledgeModel.find().lean();
    if (!legacyDocs.length) {
      return { absorbed: 0, erased: 0 };
    }

    let absorbed = 0;
    let erased = 0;

    for (const doc of legacyDocs) {
      try {
        const buffer = await r2StorageService.getFile(doc.r2Key);
        const rawText = await extractTextFromBuffer(buffer, doc.fileType, doc.filename);
        const { text: extractedText, truncated } = truncateText(rawText);

        const founderMessage = composeKnowledgeMessage(
          doc.filename,
          doc.category,
          doc.description ?? '',
          extractedText,
          truncated,
        );

        await processLongTeaching(founderMessage, '', founderId, doc.category, 'CAHAYA');
        absorbed++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[ALAMTOLOGI] Legacy knowledge absorb failed (${doc.filename}):`, msg);
      }

      try {
        await r2StorageService.deleteFile(doc.r2Key);
      } catch {
        // R2 object may already be gone
      }

      await ADAMKnowledgeModel.deleteOne({ _id: doc._id });
      erased++;
    }

    if (erased > 0) {
      console.log(`[QXK24] AIDIL legacy erasure: ${absorbed} absorbed, ${erased} raw records erased`);
    }

    return { absorbed, erased };
  },
};
