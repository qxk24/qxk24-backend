/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM SuNom Lidah (Phase 2 — Picu Gabung)
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-08
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Taste layer — merge picu lerai + snippets into Sa/Du/Ga/Pa kadar.
 */

import type { SunomEvidenceHit, PicuGabungKadar } from './adam-sunom-verification';
import { evidenceBlob, picuSupportedByEvidence } from './adam-sunom-verification';

export interface PicuGabungReport {
  kadar:              PicuGabungKadar;
  /** 1:1 | 2:1 | 4:1 style ratio label for logging. */
  ratioLabel:         string;
  independentDomains: number;
  snippetBackedHits:  number;
  officialSnippetHits: number;
}

const OFFICIAL_URL_HINT =
  /\.gov\.|\.edu\.|wikipedia\.org|manual|specification|datasheet|brochure|official|service[- ]?guide|owner[- ]?guide/i;

function domainOf(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

/** Score picu gabung from enriched evidence (title + URL + fetched snippet). */
export function scorePicuGabung(
  evidence: SunomEvidenceHit[],
  picuCount: number,
  perPicuSupport: number[],
): PicuGabungReport {
  const maxSupport = perPicuSupport.length ? Math.max(...perPicuSupport) : 0;
  const snippetBackedHits = evidence.filter(
    (e) => e.fetched && e.snippet && e.snippet.length >= 40,
  ).length;

  const officialSnippetHits = evidence.filter(
    (e) => e.fetched
      && e.snippet
      && (OFFICIAL_URL_HINT.test(e.url ?? '') || OFFICIAL_URL_HINT.test(e.title ?? '')),
  ).length;

  const supportingDomains = new Set<string>();
  for (const hit of evidence) {
    const blob = evidenceBlob(hit);
    if (!blob) continue;
    const domain = domainOf(hit.url);
    if (!domain) continue;
    if (hit.fetched && hit.snippet && hit.snippet.length >= 40) {
      supportingDomains.add(domain);
    } else if (maxSupport > 0 && blob.length > 20) {
      supportingDomains.add(domain);
    }
  }

  const independentDomains = supportingDomains.size;

  if (
    picuCount > 0
    && maxSupport >= 2
    && officialSnippetHits >= 1
    && independentDomains >= 3
    && snippetBackedHits >= 2
  ) {
    return {
      kadar: 'Pa',
      ratioLabel: '4:1',
      independentDomains,
      snippetBackedHits,
      officialSnippetHits,
    };
  }

  if (picuCount > 0 && (maxSupport >= 2 || (independentDomains >= 2 && snippetBackedHits >= 1))) {
    return {
      kadar: 'Ga',
      ratioLabel: '2:1',
      independentDomains,
      snippetBackedHits,
      officialSnippetHits,
    };
  }

  if (picuCount > 0 && maxSupport >= 1) {
    return {
      kadar: 'Sa',
      ratioLabel: '1:1',
      independentDomains,
      snippetBackedHits,
      officialSnippetHits,
    };
  }

  return {
    kadar: 'Sa',
    ratioLabel: '1:1',
    independentDomains,
    snippetBackedHits,
    officialSnippetHits,
  };
}

/** Per-picu support counts using full evidence blobs (Phase 2). */
export function perPicuSupportCounts(
  evidence: SunomEvidenceHit[],
  picu: import('./adam-sunom-verification').PicuLerai[],
): number[] {
  return picu.map((p) => picuSupportedByEvidence(p, evidence));
}
