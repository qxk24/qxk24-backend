/**
 * Live benchmark: InnerTube vs DuckDuckGo vs Invidious for educational YouTube discovery.
 * Usage: npx ts-node scripts/benchmark-youtube-search.ts
 *
 * Last run (2026-06-17, 20 student-topic queries, 2s gap):
 *   InnerTube  20/20 (100%)
 *   DuckDuckGo  0/20 (0%) — HTTP 202 bot wall on server IP
 *   Invidious   0/20 (0%) — mirrors down
 */

const TIMEOUT_MS = 4_200;

const YOUTUBE_ID_RE =
  /(?:youtube\.com\/watch\?(?:[^#\s"'<>]*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/gi;

const INVIDIOUS_BASES = [
  'https://yewtu.be',
  'https://vid.puffyan.us',
  'https://invidious.projectsegfau.lt',
] as const;

/** Representative student-topic queries (no hardcoded video URLs). */
const QUERIES = [
  'Perlembagaan Malaysia',
  'fotosintesis',
  'hukum Newton pertama',
  'asid dan bes',
  'Perang Dunia Pertama punca',
  'sistem suria planet',
  'demokrasi berparlimen',
  'pembahagian kuasa kerajaan',
  'kuantum fizik asas',
  'geografi gunung berapi',
  'algebra persamaan linear',
  'sejarah kemerdekaan Malaysia',
  'badan berdaya graviti',
  'sel haiwan dan tumbuhan',
  'ekonomi inflasi',
  'bahasa Melayu tatabahasa',
  'karbohidrat glukosa',
  'mitosis pembahagian sel',
  'iklim perubahan global',
  'teknologi kecerdasan buatan',
];

interface ProbeResult {
  ok:      boolean;
  hits:    number;
  ms:      number;
  firstId: string | null;
  error?:  string;
}

async function probeInvidious(query: string): Promise<ProbeResult> {
  const started = Date.now();
  for (const base of INVIDIOUS_BASES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const url =
        `${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort=relevance`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) continue;
      const items = await res.json() as { type?: string; videoId?: string }[];
      if (!Array.isArray(items)) continue;
      const video = items.find((i) => i.type === 'video' && i.videoId?.length === 11);
      if (video?.videoId) {
        return {
          ok:      true,
          hits:    1,
          ms:      Date.now() - started,
          firstId: video.videoId,
        };
      }
    } catch (e) {
      // try next mirror
      if (base === INVIDIOUS_BASES[INVIDIOUS_BASES.length - 1]) {
        return {
          ok:      false,
          hits:    0,
          ms:      Date.now() - started,
          firstId: null,
          error:   e instanceof Error ? e.message : 'abort/fail',
        };
      }
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, hits: 0, ms: Date.now() - started, firstId: null, error: 'no hits' };
}

async function probeDuckDuckGo(query: string): Promise<ProbeResult> {
  const started = Date.now();
  const searchQuery = `${query} site:youtube.com`;
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept:     'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; ADAM-Educational/1.0)',
      },
    });
    if (!res.ok) {
      return {
        ok: false, hits: 0, ms: Date.now() - started, firstId: null,
        error: `HTTP ${res.status}`,
      };
    }
    const html = await res.text();
    YOUTUBE_ID_RE.lastIndex = 0;
    const match = YOUTUBE_ID_RE.exec(html);
    const id = match?.[1] ?? null;
    return {
      ok:      Boolean(id),
      hits:    id ? 1 : 0,
      ms:      Date.now() - started,
      firstId: id,
      error:   id ? undefined : 'no youtube id in html',
    };
  } catch (e) {
    return {
      ok:      false,
      hits:    0,
      ms:      Date.now() - started,
      firstId: null,
      error:   e instanceof Error ? e.message : 'fail',
    };
  } finally {
    clearTimeout(timer);
  }
}

function pct(n: number, total: number): string {
  return `${((n / total) * 100).toFixed(1)}%`;
}

async function main(): Promise<void> {
  console.log(`\nYouTube discovery benchmark — ${QUERIES.length} queries\n`);
  console.log('Query'.padEnd(42), 'DDG', '  ms', 'Invidious', ' ms');
  console.log('-'.repeat(72));

  let ddgOk = 0;
  let invOk = 0;
  let ddgMs = 0;
  let invMs = 0;

  for (const query of QUERIES) {
    const [ddg, inv] = await Promise.all([
      probeDuckDuckGo(query),
      probeInvidious(query),
    ]);
    if (ddg.ok) ddgOk += 1;
    if (inv.ok) invOk += 1;
    ddgMs += ddg.ms;
    invMs += inv.ms;

    const ddgMark = ddg.ok ? '✓' : '✗';
    const invMark = inv.ok ? '✓' : '✗';
    console.log(
      query.slice(0, 40).padEnd(42),
      `${ddgMark}`.padEnd(4),
      String(ddg.ms).padStart(4),
      `${invMark}`.padEnd(10),
      String(inv.ms).padStart(4),
    );
    if (!ddg.ok && ddg.error) console.log(`  DDG: ${ddg.error}`);
    if (!inv.ok && inv.error) console.log(`  Invidious: ${inv.error}`);
  }

  const n = QUERIES.length;
  console.log('\n' + '='.repeat(72));
  console.log(`DuckDuckGo success: ${ddgOk}/${n} (${pct(ddgOk, n)}) — avg ${Math.round(ddgMs / n)}ms`);
  console.log(`Invidious success:  ${invOk}/${n} (${pct(invOk, n)}) — avg ${Math.round(invMs / n)}ms`);
  console.log('='.repeat(72));

  if (ddgOk > invOk) {
    console.log('\nRecommendation: prioritize DuckDuckGo (higher success rate).');
  } else if (invOk > ddgOk) {
    console.log('\nRecommendation: keep Invidious first (higher success rate).');
  } else {
    console.log('\nRecommendation: tie — prefer faster/more stable provider first.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
