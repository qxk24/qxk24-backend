/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : Journal Translation Service
 * Platform : Backend (TypeScript)
 * ALAMTOLOGI : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { getDeepModel } from '../config/llm-models';
import { llmCompleteUserPrompt } from '../llm/llm-client';
import { ADAMJournalModel } from './adam.schema';
import { parseLooseAdamJson } from './adam-chat-response-parser';
import type { AlamtologiAcademicJournal, JournalContent } from './adam.types';
import {
  DEFAULT_JOURNAL_LOCALE,
  inferJournalSourceLanguage,
  JOURNAL_LOCALE_LABELS,
  type JournalLocale,
} from './journal-locale';
import {
  JOURNAL_PUBLISH_LOCALE,
} from './adam-journal-language.config';
import { getJournal } from './adam-journal.service';

export interface JournalTranslationBundle {
  title:         string;
  abstract:      string;
  content:       JournalContent;
  translatedAt:  string;
  locale:        JournalLocale;
}

export interface JournalTranslationResponse {
  locale:         JournalLocale;
  sourceLanguage: JournalLocale;
  cached:         boolean;
  title:          string;
  abstract:       string;
  content:        JournalContent;
}

function corpusFromJournal(journal: AlamtologiAcademicJournal): string {
  const c = journal.content;
  return [
    journal.title,
    journal.abstract,
    c.introduction,
    c.background,
    c.methodology,
    c.findings,
    c.discussion,
    c.conclusion,
    ...(c.references ?? []),
    ...(c.alamtologiAnalysis ?? []).map((a) => a.analysis),
  ].filter(Boolean).join('\n\n');
}

function normalizeTranslationContent(raw: Partial<JournalContent> | undefined): JournalContent {
  const base = raw ?? {};
  return {
    introduction:       String(base.introduction ?? '').trim(),
    background:         String(base.background ?? '').trim(),
    methodology:        String(base.methodology ?? '').trim(),
    alamtologiAnalysis: Array.isArray(base.alamtologiAnalysis) ? base.alamtologiAnalysis : [],
    findings:           String(base.findings ?? '').trim(),
    discussion:         String(base.discussion ?? '').trim(),
    conclusion:         String(base.conclusion ?? '').trim(),
    references:         Array.isArray(base.references) ? base.references.map(String) : [],
    appendices:         Array.isArray(base.appendices) ? base.appendices.map(String) : undefined,
  };
}

function buildTranslationPrompt(
  journal: AlamtologiAcademicJournal,
  target: JournalLocale,
  source: JournalLocale,
): string {
  const targetLabel = JOURNAL_LOCALE_LABELS[target];
  const sourceLabel = JOURNAL_LOCALE_LABELS[source];

  return `You are ADAM — constitutional translator for QXK24 academic journals.

Translate this journal from ${sourceLabel} to ${targetLabel}.

RULES (non-negotiable):
- Preserve all Alamtologi constitutional terms (MASA, TENAGA, AIR, API, BUMI, CAHAYA, RUANG, Hukum Z, Alamtologi, QXK24).
- Preserve Quranic Arabic rasm exactly — do NOT translate Arabic script.
- Preserve [FORMULA]…[/FORMULA], [INLINE_FORMULA]…[/INLINE_FORMULA], [DISPLAY_FORMULA]…[/DISPLAY_FORMULA] tags and their inner LaTeX unchanged.
- Preserve journal numbers, topic IDs, and proper names (Masa Bayu, Feynman, Ibn Khaldun, etc.).
- Academic tone: scholar precision + human warmth — same voice as the source.
- Translate references list entries faithfully (author names stay; titles may translate if not proper nouns).

Return ONLY valid JSON:
{
  "title": "translated title",
  "abstract": "translated abstract",
  "content": {
    "introduction": "...",
    "background": "...",
    "methodology": "...",
    "alamtologiAnalysis": [
      {
        "principle": "MASA",
        "weight": 0.18,
        "score": 85,
        "analysis": "translated analysis",
        "evidence": ["translated evidence"]
      }
    ],
    "findings": "...",
    "discussion": "...",
    "conclusion": "...",
    "references": ["APA reference 1", "..."]
  }
}

SOURCE TITLE: ${journal.title}
SOURCE ABSTRACT: ${journal.abstract}

SOURCE CONTENT JSON:
${JSON.stringify(journal.content)}`;
}

async function translateJournalWithLlm(
  journal: AlamtologiAcademicJournal,
  target: JournalLocale,
  source: JournalLocale,
): Promise<JournalTranslationBundle> {
  const raw = await llmCompleteUserPrompt(
    'Alamtologi constitutional journal translation.',
    buildTranslationPrompt(journal, target, source),
    getDeepModel(),
    8192,
  );

  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = parseLooseAdamJson(cleaned) as {
    title?: string;
    abstract?: string;
    content?: Partial<JournalContent>;
  } | null;

  if (!parsed?.title?.trim() || !parsed.abstract?.trim() || !parsed.content) {
    throw new Error('Journal translation JSON parse failed');
  }

  return {
    title:        parsed.title.trim(),
    abstract:     parsed.abstract.trim(),
    content:      normalizeTranslationContent(parsed.content),
    translatedAt: new Date().toISOString(),
    locale:       target,
  };
}

export async function getJournalTranslation(
  journalId: string,
  locale: JournalLocale,
  opts?: { allowGenerate?: boolean },
): Promise<JournalTranslationResponse | null> {
  const journal = await getJournal(journalId);
  if (!journal) return null;

  const doc = await ADAMJournalModel.findById(journalId).lean();
  if (!doc) return null;

  const sourceLanguage =
    (doc.sourceLanguage as JournalLocale | undefined)
    ?? inferJournalSourceLanguage(corpusFromJournal(journal));

  if (locale === sourceLanguage) {
    return {
      locale,
      sourceLanguage,
      cached: true,
      title:    journal.title,
      abstract: journal.abstract,
      content:  journal.content,
    };
  }

  const existing = (doc.translations as Record<string, JournalTranslationBundle> | undefined)?.[locale];
  if (existing?.title && existing.content) {
    return {
      locale,
      sourceLanguage,
      cached: true,
      title:    existing.title,
      abstract: existing.abstract,
      content:  normalizeTranslationContent(existing.content),
    };
  }

  if (opts?.allowGenerate === false) return null;

  const bundle = await translateJournalWithLlm(journal, locale, sourceLanguage);

  await ADAMJournalModel.findByIdAndUpdate(journalId, {
    $set: {
      sourceLanguage,
      [`translations.${locale}`]: bundle,
    },
  });

  return {
    locale,
    sourceLanguage,
    cached: false,
    title:    bundle.title,
    abstract: bundle.abstract,
    content:  bundle.content,
  };
}

export function applyTranslationToJournal(
  journal: AlamtologiAcademicJournal,
  translation: Pick<JournalTranslationResponse, 'title' | 'abstract' | 'content' | 'locale' | 'sourceLanguage'>,
): AlamtologiAcademicJournal {
  return {
    ...journal,
    title:    translation.title,
    abstract: translation.abstract,
    content:  translation.content,
  };
}

export async function ensureEnglishPublicationManuscript(journalId: string): Promise<void> {
  const journal = await getJournal(journalId);
  if (!journal) throw new Error('Journal not found for publication translation.');

  const doc = await ADAMJournalModel.findById(journalId).lean();
  if (!doc) throw new Error('Journal document not found.');

  const sourceLanguage =
    (doc.sourceLanguage as JournalLocale | undefined)
    ?? inferJournalSourceLanguage(corpusFromJournal(journal));

  if (sourceLanguage === JOURNAL_PUBLISH_LOCALE) {
    return;
  }

  const malayBundle: JournalTranslationBundle = {
    title:        journal.title,
    abstract:     journal.abstract,
    content:      normalizeTranslationContent(journal.content),
    translatedAt: new Date().toISOString(),
    locale:       sourceLanguage,
  };

  const english = await translateJournalWithLlm(
    journal,
    JOURNAL_PUBLISH_LOCALE,
    sourceLanguage,
  );

  await ADAMJournalModel.findByIdAndUpdate(journalId, {
    $set: {
      title:          english.title,
      abstract:       english.abstract,
      content:        english.content,
      sourceLanguage: JOURNAL_PUBLISH_LOCALE,
      [`translations.${sourceLanguage}`]: malayBundle,
    },
  });

  console.log(
    '[journal:publish-en]',
    JSON.stringify({
      journalId,
      from: sourceLanguage,
      to:   JOURNAL_PUBLISH_LOCALE,
      titleChars: english.title.length,
    }),
  );
}

export async function ensureSourceLanguage(journalId: string): Promise<JournalLocale> {
  const doc = await ADAMJournalModel.findById(journalId).lean();
  if (!doc) return DEFAULT_JOURNAL_LOCALE;
  if (doc.sourceLanguage) return doc.sourceLanguage as JournalLocale;

  const journal = await getJournal(journalId);
  if (!journal) return DEFAULT_JOURNAL_LOCALE;

  const sourceLanguage = inferJournalSourceLanguage(corpusFromJournal(journal));
  await ADAMJournalModel.findByIdAndUpdate(journalId, { $set: { sourceLanguage } });
  return sourceLanguage;
}
