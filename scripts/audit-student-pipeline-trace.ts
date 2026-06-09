/**
 * One-shot audit trace — student verification pipeline root-cause analysis.
 * Run: npx ts-node --transpile-only scripts/audit-student-pipeline-trace.ts
 */

import {
  buildTechnicalVerificationFallback,
  finalizeVerificationGatedOutput,
  precisionAskAlreadyAnchored,
  prependSearchUnavailableNotice,
  resolveTechnicalPrecisionTurn,
} from '../src/adam/adam-factual-grounding';
import { enrichSunomVerificationInput } from '../src/adam/adam-sunom-pipeline';
import {
  extractPicuLerai,
  picuSupportedByEvidence,
  runSunomVerification,
  sanitizeSunomVerifiedOutput,
} from '../src/adam/adam-sunom-verification';
import { sanitizeStudentOutputSync } from '../src/adam/adam-student-output-guard';
import type { LlmSearchResult } from '../src/llm/llm-types';

const FALLBACK_RE = /tidak dapat mengesahkan|Taip semula/i;

interface Scenario {
  name: string;
  userMessage: string;
  recentUserMessages?: string[];
  rawModelOutput: string;
  searchUsed: boolean;
  searchDropped?: boolean;
  searchResults: LlmSearchResult[];
}

const SCENARIOS: Scenario[] = [
  {
    name: 'USER_QUESTION_XTRAIL_COMPARE (no model — fallback fn only)',
    userMessage: 'Apa beza tork xtrail 2.5 dengan 2.0',
    rawModelOutput: '',
    searchUsed: false,
    searchResults: [],
  },
  {
    name: 'GOOD_ANSWER_WEAK_SEARCH (comparison torques, unrelated hits)',
    userMessage: 'Apa beza tork xtrail 2.5 dengan 2.0',
    rawModelOutput:
      'X-Trail 2.5L: tork maksimum sekitar 233 Nm.\n\n'
      + 'X-Trail 2.0L: tork maksimum sekitar 196 Nm.',
    searchUsed: true,
    searchResults: [
      { title: 'Nissan X-Trail review fuel economy', url: 'https://reviews.example/xtrail' },
      { title: 'SUV comparison 2024', url: 'https://cars.example/suv' },
    ],
  },
  {
    name: 'GOOD_ANSWER_STRONG_SEARCH (both torques in titles)',
    userMessage: 'Apa beza tork xtrail 2.5 dengan 2.0',
    rawModelOutput:
      'X-Trail 2.5L: tork maksimum 233 Nm @ 4000 rpm.\n\n'
      + 'X-Trail 2.0L: tork maksimum 196 Nm @ 4400 rpm.',
    searchUsed: true,
    searchResults: [
      { title: 'X-Trail 2.5 torque 233 Nm specification', url: 'https://nissan.example/25' },
      { title: 'X-Trail 2.0 torque 196 Nm specification', url: 'https://nissan.example/20' },
    ],
  },
  {
    name: 'GOOD_ANSWER_ONE_TORQUE_IN_SEARCH (partial evidence)',
    userMessage: 'Apa beza tork xtrail 2.5 dengan 2.0',
    rawModelOutput:
      'X-Trail 2.5L: tork maksimum 233 Nm.\n\n'
      + 'X-Trail 2.0L: tork maksimum 196 Nm.',
    searchUsed: true,
    searchResults: [
      { title: 'Torque 233 Nm X-Trail 2.5', url: 'https://spec.example/25' },
      { title: 'Generic SUV engine guide', url: 'https://guide.example' },
    ],
  },
  {
    name: 'SEARCH_DROPPED',
    userMessage: 'Apa beza tork xtrail 2.5 dengan 2.0',
    rawModelOutput: 'Tork 2.5L ialah 233 Nm, 2.0L ialah 196 Nm.',
    searchUsed: false,
    searchDropped: true,
    searchResults: [],
  },
  {
    name: 'A1_STYLE_VERIFIED (scenario test baseline)',
    userMessage: 'Berapa tork enjin model kereta X varian Elite?',
    rawModelOutput: 'Tork maksimum ialah 90 Nm @ 3600 rpm untuk varian Elite 1.0L.',
    searchUsed: true,
    searchResults: [
      { title: 'Torque 90 Nm @ 3600 rpm specification', url: 'https://example.com/spec' },
    ],
  },
];

async function traceScenario(s: Scenario): Promise<void> {
  console.log('\n' + '='.repeat(72));
  console.log(`SCENARIO: ${s.name}`);
  console.log('='.repeat(72));

  const recent = s.recentUserMessages ?? [];
  const precision = resolveTechnicalPrecisionTurn(s.userMessage, recent);
  console.log('1) precisionTurn:', {
    isActive: precision.isActive,
    isFollowUp: precision.isFollowUp,
    precisionText: precision.precisionText.slice(0, 120),
  });
  console.log('   precisionAskAlreadyAnchored:', precisionAskAlreadyAnchored(precision.precisionText));

  if (!s.rawModelOutput) {
    const fb = buildTechnicalVerificationFallback(s.userMessage, recent);
    console.log('2) (no model) buildTechnicalVerificationFallback:', fb.slice(0, 160));
    return;
  }

  let stage = sanitizeStudentOutputSync(s.rawModelOutput, s.userMessage, recent);
  console.log('2) after sanitizeStudentOutputSync:', stage.slice(0, 120) + (stage.length > 120 ? '…' : ''));

  stage = prependSearchUnavailableNotice(stage, {
    technicalTurn: precision.isActive,
    searchWasDropped: s.searchDropped === true,
  });

  const sunomInput = await enrichSunomVerificationInput({
    userMessage: s.userMessage,
    recentUserMessages: recent,
    searchResults: s.searchResults,
    searchUsed: s.searchUsed,
    searchDropped: s.searchDropped === true,
    skipFingerFetch: true,
  });

  console.log('3) enrichSunom:', {
    fingerFetched: sunomInput.fingerFetched,
    evidenceCount: sunomInput.searchResults?.length ?? 0,
    titles: (sunomInput.searchResults ?? []).map((r) => r.title).slice(0, 3),
  });

  const report = runSunomVerification({
    ...sunomInput,
    outputText: s.rawModelOutput,
  });

  const picu = extractPicuLerai(s.rawModelOutput);
  const picuSupport = picu.map((p) => ({
    raw: p.raw,
    support: picuSupportedByEvidence(p, sunomInput.searchResults ?? []),
  }));

  console.log('4) runSunomVerification (on RAW model text):', {
    lika: report.lika,
    kadar: report.kadar,
    unsupportedClaims: report.unsupportedClaims,
    picuCount: picu.length,
    picuSupport,
  });

  const afterSunom = sanitizeSunomVerifiedOutput(stage, {
    ...sunomInput,
    rawOutputText: s.rawModelOutput,
  });

  console.log('5) after sanitizeSunomVerifiedOutput:', afterSunom.slice(0, 160) + (afterSunom.length > 160 ? '…' : ''));
  console.log('   isFallback?', FALLBACK_RE.test(afterSunom));

  const final = finalizeVerificationGatedOutput(afterSunom, s.userMessage, recent);
  console.log('6) after finalizeVerificationGatedOutput:', final.slice(0, 160) + (final.length > 160 ? '…' : ''));
  console.log('   isFallback?', FALLBACK_RE.test(final));

  if (FALLBACK_RE.test(final)) {
    console.log('>>> ROOT PATH: fallback injected');
    if (FALLBACK_RE.test(afterSunom)) {
      console.log('    → sanitizeSunomVerifiedOutput → resolvePasifGateBody → buildTechnicalVerificationFallback');
      console.log(`    → lika=${report.lika} unsupportedClaims=${report.unsupportedClaims}/${picu.length}`);
    } else {
      console.log('    → finalizeVerificationGatedOutput emptied body → buildTechnicalVerificationFallback');
    }
  }
}

async function main() {
  console.log('ADAM STUDENT PIPELINE — ROOT CAUSE AUDIT');
  console.log('Pipeline order: repairStudentOutput → prependSearch → enrichSunom → sanitizeSunom → finalize\n');

  for (const s of SCENARIOS) {
    await traceScenario(s);
  }

  console.log('\n' + '='.repeat(72));
  console.log('STATIC CODE PATHS THAT INJECT FALLBACK (grep-verified):');
  console.log('  A) adam-sunom-verification.ts resolvePasifGateBody() L549');
  console.log('     when lika=pasif AND stripped content has no evidence-backed picu');
  console.log('  B) adam-factual-grounding.ts finalizeVerificationGatedOutput() L371');
  console.log('     when all paragraphs stripped by paragraphShouldStripAfterVerificationFailure');
  console.log('\nLIKA PASIF TRIGGERS (resolveKadarAndLika + likaFromKadar):');
  console.log('  • searchUsed=false OR searchDropped OR evidence.length=0');
  console.log('  • unsupportedClaims === picu.length (no picu in search titles)');
  console.log('  • unsupportedClaims === picu.length (all picu missing from search)');
  console.log('='.repeat(72));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
