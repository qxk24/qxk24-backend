/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAM SuNom Fingers (Jari — Phase 3)
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
 * Tool layer — fetch URL evidence for SuNom picu lerai enrichment.
 */

import type { LlmSearchResult } from '../llm/llm-types';
import type { SunomEvidenceHit } from './adam-sunom-verification';

const DEFAULT_MAX_URLS = 3;
const DEFAULT_TIMEOUT_MS = 6_000;
const DEFAULT_MAX_BYTES = 200_000;
const USER_AGENT = 'Alamtologi-ADAM-SuNom/1.7';

export interface SunomFingerFetchOptions {
  maxUrls?:   number;
  timeoutMs?: number;
  maxBytes?:  number;
}

export interface SunomFingerFetchReport {
  evidence:   SunomEvidenceHit[];
  fetched:    number;
  failed:     number;
  durationMs: number;
}

function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h === '127.0.0.1' || h === '0.0.0.0' || h === '::1') return true;
  if (/^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  return false;
}

function isFetchableUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    return !isBlockedHost(u.hostname);
  } catch {
    return false;
  }
}

function htmlToPlainSnippet(html: string, maxChars = 12_000): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&amp;|&lt;|&gt;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxChars);
}

async function readResponseSnippet(
  response: Response,
  maxBytes: number,
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    total += value.length;
  }

  try {
    await reader.cancel();
  } catch {
    // ignore cancel errors
  }

  const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  const ctype = response.headers.get('content-type') ?? '';
  const snippetCap = 12_000;
  if (/application\/pdf/i.test(ctype)) {
    return buf.toString('latin1').replace(/[^\x20-\x7E\n\r\t]/g, ' ').slice(0, snippetCap);
  }
  return htmlToPlainSnippet(buf.toString('utf8', 0, Math.min(buf.length, maxBytes)), snippetCap);
}

/** Fetch page snippets for top search URLs (Jari — universal, bounded). */
export async function fetchSunomEvidenceSnippets(
  searchResults: LlmSearchResult[],
  options: SunomFingerFetchOptions = {},
): Promise<SunomFingerFetchReport> {
  const started = Date.now();
  const maxUrls = options.maxUrls ?? DEFAULT_MAX_URLS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;

  const urls: string[] = [];
  const seen = new Set<string>();
  for (const hit of searchResults) {
    const url = hit.url?.trim();
    if (!url || seen.has(url) || !isFetchableUrl(url)) continue;
    seen.add(url);
    urls.push(url);
    if (urls.length >= maxUrls) break;
  }

  const evidence: SunomEvidenceHit[] = searchResults.map((hit) => ({ ...hit }));
  const byUrl = new Map(evidence.filter((e) => e.url).map((e) => [e.url!, e]));

  let fetched = 0;
  let failed = 0;

  await Promise.all(urls.map(async (url) => {
    const row = byUrl.get(url);
    if (!row) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method:  'GET',
        signal:  controller.signal,
        headers: {
          Accept:          'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8',
          'User-Agent':    USER_AGENT,
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        failed += 1;
        row.fetchError = `HTTP ${response.status}`;
        return;
      }

      const snippet = await readResponseSnippet(response, maxBytes);
      if (snippet.length >= 40) {
        row.snippet = snippet;
        row.fetched = true;
        fetched += 1;
      } else {
        failed += 1;
        row.fetchError = 'empty_snippet';
      }
    } catch (err: unknown) {
      failed += 1;
      row.fetchError = err instanceof Error ? err.message : 'fetch_failed';
    } finally {
      clearTimeout(timer);
    }
  }));

  return {
    evidence,
    fetched,
    failed,
    durationMs: Date.now() - started,
  };
}
