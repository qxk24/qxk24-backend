/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Pedagogy v2 Classifier Core
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { normalizeMathClassifierText } from './tutor-law.math-intent.signals';
import { studentStatesFinalArithmeticAnswer } from './tutor-law.arithmetic-closure';
import {
  buildCrossLinkPrompt,
  buildFiveWhysProbe,
  buildFormativeQuestion,
  buildIThinkScaffold,
  FEYNMAN_PROBE_BM,
  inferFormativeTopicKey,
  METACOGNITION_PROBE_BM,
} from './tutor-law.pedagogy-v2.probes';
import {
  countSignalHits,
  CROSS_CURRICULAR_SIGNALS,
  detectIThinkMapType,
  FEYNMAN_SIGNALS,
  FIVE_WHYS_SIGNALS,
  FORMATIVE_SIGNALS,
  ITHINK_SIGNALS,
  METACOGNITION_SIGNALS,
  studentAcceptedPracticeOffer,
  threadInFiveWhysChain,
  threadOfferedPractice,
} from './tutor-law.pedagogy-v2.signals';
import {
  CrossCurricularCluster,
  IThinkMapType,
  PedagogyV2Intent,
  type PedagogyV2ClassifierOutput,
  type PedagogyV2SessionState,
  type PedagogyV2TurnInput,
} from './tutor-law.pedagogy-v2.types';

function emptyOutput(trace: string[]): PedagogyV2ClassifierOutput {
  return {
    intent:             PedagogyV2Intent.NONE,
    mapType:            IThinkMapType.UNKNOWN,
    crossCluster:       CrossCurricularCluster.GENERAL,
    topicHint:          null,
    feynmanProbe:       null,
    fiveWhysProbe:      null,
    mapScaffold:        null,
    crossLinkPrompt:    null,
    formativeQuestion:  null,
    metacognitionProbe: null,
    confidence:         'LOW',
    _trace:             trace,
  };
}

function detectCrossCluster(norm: string): CrossCurricularCluster {
  if (/sejarah|penjajah|kemerdekaan|tarikh/i.test(norm)
    && /geografi|peta|bijih|sumber|lokasi/i.test(norm)) {
    return CrossCurricularCluster.HISTORY_GEO_ECON;
  }
  if (/sains|fizik|kimia|biologi|eksperimen/i.test(norm)
    && /matematik|kira|graf|formula/i.test(norm)) {
    return CrossCurricularCluster.SCIENCE_MATH;
  }
  if (/bahasa|karangan|esei|tatabahasa/i.test(norm)
    && /sejarah|sivik|geografi|ekonomi/i.test(norm)) {
    return CrossCurricularCluster.LANGUAGE_HUMANITIES;
  }
  if (/(?:teknologi|engineering|sistem|rangkaian|data)/i.test(norm)
    && /masyarakat|sosial|kesan|polisi/i.test(norm)) {
    return CrossCurricularCluster.STEM_SOCIETY;
  }
  return CrossCurricularCluster.GENERAL;
}

function countActiveDomainHints(input: PedagogyV2TurnInput): number {
  let n = 0;
  const blob = [
    input.userMessage,
    ...(input.recentUserMessages ?? []),
  ].join('\n').toLowerCase();

  if (/\b(?:matematik|kira|tambah|tolak|algebra|nombor)\b/i.test(blob)) n += 1;
  if (/\b(?:sains|fizik|kimia|biologi|eksperimen)\b/i.test(blob)) n += 1;
  if (/\b(?:sejarah|geografi|sivik|ekonomi|komsas)\b/i.test(blob)) n += 1;
  if (/\b(?:bahasa|karangan|esei|tatabahasa)\b/i.test(blob)) n += 1;
  if (/\b(?:islam|quran|hadis|fiqh)\b/i.test(blob)) n += 1;
  return n;
}

export function classifyPedagogyV2Intent(
  input: PedagogyV2TurnInput,
  session: PedagogyV2SessionState,
): PedagogyV2ClassifierOutput {
  const trace: string[] = [];
  const raw = input.userMessage ?? '';
  const norm = normalizeMathClassifierText(raw);
  const assistants = input.recentAssistantMessages ?? [];

  if (!norm || norm.length < 3) {
    return emptyOutput([...trace, 'EMPTY']);
  }

  if (countSignalHits(norm, METACOGNITION_SIGNALS) >= 1) {
    trace.push('METACOGNITION');
    return {
      ...emptyOutput(trace),
      intent:             PedagogyV2Intent.METACOGNITION,
      metacognitionProbe: METACOGNITION_PROBE_BM,
      confidence:         'HIGH',
    };
  }

  if (countSignalHits(norm, ITHINK_SIGNALS) >= 1) {
    const mapType = detectIThinkMapType(norm);
    trace.push(`ITHINK_MAP:${mapType}`);
    return {
      ...emptyOutput(trace),
      intent:      PedagogyV2Intent.ITHINK_MAP,
      mapType,
      mapScaffold: buildIThinkScaffold(mapType),
      confidence:  'HIGH',
    };
  }

  if (countSignalHits(norm, FEYNMAN_SIGNALS) >= 1) {
    trace.push('FEYNMAN');
    return {
      ...emptyOutput(trace),
      intent:       PedagogyV2Intent.FEYNMAN,
      feynmanProbe: FEYNMAN_PROBE_BM,
      topicHint:    raw.slice(0, 80),
      confidence:   'HIGH',
    };
  }

  const fiveWhysExplicit = countSignalHits(norm, FIVE_WHYS_SIGNALS) >= 1;
  const fiveWhysContinuing =
    session.fiveWhysStarted
    && session.fiveWhysDepth < 5
    && (threadInFiveWhysChain(assistants) || fiveWhysExplicit);

  if (fiveWhysExplicit || fiveWhysContinuing) {
    const depth = session.fiveWhysDepth;
    if (depth < 5) {
      trace.push(`FIVE_WHYS:q${depth + 1}`);
      return {
        ...emptyOutput(trace),
        intent:        PedagogyV2Intent.FIVE_WHYS,
        fiveWhysProbe: buildFiveWhysProbe(depth, raw.slice(0, 120)),
        topicHint:     raw.slice(0, 80),
        confidence:    fiveWhysExplicit ? 'HIGH' : 'MEDIUM',
      };
    }
    trace.push('FIVE_WHYS:complete');
  }

  const practiceOffered = threadOfferedPractice(assistants);
  const acceptedPractice = practiceOffered
    && studentAcceptedPracticeOffer(raw)
    && !studentStatesFinalArithmeticAnswer(raw);
  const explicitFormative = countSignalHits(norm, FORMATIVE_SIGNALS) >= 1;
  const postClosure = input.mathIntent?.postClosureTurn ?? false;

  if (
    explicitFormative
    || acceptedPractice
    || (postClosure && session.practiceOfferAccepted && studentAcceptedPracticeOffer(raw))
  ) {
    const topicKey = inferFormativeTopicKey(
      input.mathIntent?.topic,
      input.genericIntent?.output.domain,
      false,
    );
    const qIdx = session.formativeQuestionsAsked;
    if (qIdx < 3) {
      trace.push(`FORMATIVE_QUIZ:${topicKey}:q${qIdx + 1}`);
      return {
        ...emptyOutput(trace),
        intent:            PedagogyV2Intent.FORMATIVE_QUIZ,
        formativeQuestion: buildFormativeQuestion(topicKey, qIdx),
        confidence:        'HIGH',
      };
    }
    trace.push('FORMATIVE_QUIZ:complete');
  }

  const crossSignals = countSignalHits(norm, CROSS_CURRICULAR_SIGNALS);
  const multiDomain = countActiveDomainHints(input) >= 2;
  if (crossSignals >= 1 || multiDomain) {
    const cluster = detectCrossCluster(norm);
    trace.push(`CROSS_CURRICULAR:${cluster}`);
    return {
      ...emptyOutput(trace),
      intent:          PedagogyV2Intent.CROSS_CURRICULAR,
      crossCluster:    cluster,
      crossLinkPrompt: buildCrossLinkPrompt(cluster),
      confidence:      crossSignals >= 1 ? 'HIGH' : 'MEDIUM',
    };
  }

  return emptyOutput([...trace, 'NONE']);
}
