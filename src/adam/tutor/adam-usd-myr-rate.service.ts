/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : USD → MYR Live Rate Service
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-16
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Live USD/MYR for Tutor RM display — Frankfurter (ECB daily, no API key).
 * Cached briefly; stale cache used if fetch fails before env override.
 */

import { ENV } from '../../config/environments';

export type UsdMyrRateSource = 'live' | 'cache' | 'env_fallback';

export interface UsdMyrRateSnapshot {
  rate:      number;
  source:    UsdMyrRateSource;
  fetchedAt: string;
  provider:  string;
}

const FRANKFURTER_URL = 'https://api.frankfurter.app/latest?from=USD&to=MYR';
const FETCH_TIMEOUT_MS = 6_000;

interface RateCache {
  snapshot:  UsdMyrRateSnapshot;
  expiresAt: number;
}

let rateCache: RateCache | null = null;

function cacheTtlMs(): number {
  const raw = ENV.ADAM_USD_MYR_CACHE_MS;
  return raw > 0 ? raw : 15 * 60 * 1000;
}

function envFallbackRate(): number | null {
  const v = ENV.ADAM_USD_MYR_RATE;
  return v > 0 ? v : null;
}

function buildSnapshot(
  rate: number,
  source: UsdMyrRateSource,
  provider: string,
): UsdMyrRateSnapshot {
  return {
    rate,
    source,
    fetchedAt: new Date().toISOString(),
    provider,
  };
}

async function fetchLiveUsdMyr(): Promise<UsdMyrRateSnapshot> {
  const response = await fetch(FRANKFURTER_URL, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Frankfurter HTTP ${response.status}`);
  }

  const data = await response.json() as {
    rates?: { MYR?: number };
    date?:  string;
  };

  const rate = data.rates?.MYR;
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    throw new Error('Frankfurter returned invalid MYR rate.');
  }

  const snapshot = buildSnapshot(rate, 'live', 'frankfurter');
  if (data.date) {
    snapshot.fetchedAt = `${data.date}T12:00:00.000Z`;
  }

  rateCache = { snapshot, expiresAt: Date.now() + cacheTtlMs() };
  return snapshot;
}

function staleCacheSnapshot(): UsdMyrRateSnapshot | null {
  if (!rateCache) return null;
  return { ...rateCache.snapshot, source: 'cache' };
}

/** Live USD/MYR with short TTL cache; never uses a hardcoded rate. */
export async function getUsdMyrRate(forceRefresh = false): Promise<UsdMyrRateSnapshot> {
  if (!forceRefresh && rateCache && Date.now() < rateCache.expiresAt) {
    return { ...rateCache.snapshot, source: 'cache' };
  }

  try {
    return await fetchLiveUsdMyr();
  } catch {
    const stale = staleCacheSnapshot();
    if (stale) return stale;

    const envRate = envFallbackRate();
    if (envRate) {
      return buildSnapshot(envRate, 'env_fallback', 'env:ADAM_USD_MYR_RATE');
    }

    throw new Error(
      'Kadar USD/MYR tidak tersedia buat masa ini. Cuba lagi sebentar atau set ADAM_USD_MYR_RATE pada server.',
    );
  }
}

/** Test helper — clear in-memory cache between cases. */
export function resetUsdMyrRateCacheForTests(): void {
  rateCache = null;
}
