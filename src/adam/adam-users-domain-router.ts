/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Users Domain Router
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-17
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Users lane — domain facet after main channel (economics, science, …).
 * One dominant facet per turn; orthogonal to knowledge mode (konvensional).
 * Global coverage — all nations; detectors in adam-domain-detectors.ts.
 */

import {
  isAdamAccountingTurn,
  isAdamArtsMusicTurn,
  isAdamBusinessStudiesTurn,
  isAdamEntrepreneurshipEducationTurn,
  isAdamEnvironmentTurn,
  isAdamGeographyTurn,
  isAdamGlobalCivicsTurn,
  isAdamHealthEducationTurn,
  isAdamHomeVocationalTurn,
  isAdamIslamicStudiesTurn,
  isAdamLanguagesTurn,
  isAdamMathematicsTurn,
  isAdamMoralEthicsTurn,
  isAdamPedagogyKonvensionalTurn,
} from './adam-domain-detectors';
import {
  isAdamCivicsGovernmentTurn,
  isAdamCivicsLawTurn,
  isAdamContinuationDepthTurn,
  isAdamHistoricalBiographyTurn,
  isAdamHistorySynthesisTurn,
  isAdamLightChatTurn,
  isAdamPracticalAdvisoryTurn,
  isAdamScienceNatureSynthesisTurn,
  stripLeadingAdamSalutation,
} from './adam-response-generation';
import { isAdamProseCraftTurn } from './adam-prose-craft';
import { userOpenedFaithDoor } from './adam-universal-voice';

export type AdamUsersDomainFacet =
  | 'prose-craft'
  | 'faith'
  | 'practical-career'
  | 'civics'
  | 'history'
  | 'economics'
  | 'science'
  | 'technology'
  | 'academic'
  | 'geography'
  | 'mathematics'
  | 'languages'
  | 'business-studies'
  | 'accounting'
  | 'health'
  | 'environment'
  | 'arts-music'
  | 'moral-ethics'
  | 'islamic-studies'
  | 'entrepreneurship'
  | 'home-vocational'
  | 'general';

const ECONOMICS_DOMAIN =
  /\b(?:ekonomi|ekonomik|econom(?:y|ics)|makro(?:ekonomi)?|mikro(?:ekonomi)?|inflasi|inflation|deflasi|deflation|GDP|KDNK|GNP|fiskal|fiscal|monetari|monetary|BNM|bank\s+negara|bajet\s+negara|belanjawan|kos\s+peluang|opportunity\s+cost|kelangkaan|scarcity|permintaan|penawaran|supply\s+and\s+demand|pasaran\s+(?:buruh|kerja|modal|saham)?|market\s+structure|suku\s+bunga|kadar\s+faedah|interest\s+rate|pengangguran|unemployment|nilai\s+tukar|exchange\s+rate|ringgit|stagflasi|resesi|recession|kemelesetan|elasticiti|elasticity|suku\s+kupon|kurva\s+(?:permintaan|penawaran)|OPEC|harga\s+minyak|kos\s+sara\s+hidup|DOSM|MOF\s+malaysia|keseimbangan\s+pasaran|Federal\s+Reserve|ECB|World\s+Bank|IMF)\b/i;

const ECONOMICS_POLICY_DOMAIN =
  /\b(?:campur\s+tangan\s+kerajaan|kawalan\s+harga|harga\s+(?:maksimum|awam|barangan\s+keperluan)|subsidi\s+(?:harga|barangan|minyak|beras)?|keberkesanan\s+(?:dasar|subsidi|campur\s+tangan|kawalan)|dasar\s+(?:fiskal|monetari|harga)|KPDNHEP|SMH|indeks\s+harga\s+pengguna|IHP|price\s+ceiling|subsidy\s+policy|fiscal\s+policy)\b/i;

const TECHNOLOGY_DOMAIN =
  /\b(?:teknologi|technology|artificial\s+intelligence|machine\s+learning|pemrograman|programming|perisian|software|perkakasan|hardware|rangkaian|network(?:ing)?|cyber(?:security)?|blockchain|cloud\s+computing|pangkalan\s+data|database|API\b|IoT|robotik|robotics|semiconductor|semikonduktor|GPU|CPU|algoritma\s+data|big\s+data|data\s+science|komputer|computer\s+science)\b/i;

const BIOETHICS_DOMAIN =
  /\b(?:CRISPR|crispr-cas9|penyuntingan\s+gen|genome\s+edit|gene\s+edit|germline|sel\s+somatik|somatic\s+(?:cell\s+)?edit|bioetika|bioethics|embrio\s+manusia|human\s+embryo|designer\s+baby|bayi\s+rekaan)\b/i;

const ACADEMIC_DOMAIN =
  /\b(?:IMRaD|metodologi\s+penyelidikan|research\s+method|literature\s+review|kertas\s+kerja|thesis|disertasi|jurnal\s+akademik|peer\s+review|hipotesis|hypothesis|abstrak\s+jurnal|rujukan\s+APA|sitasi|plagiarisme|plagiarism|kajian\s+literatur|systematic\s+review|disertasi\s+phd|penulisan\s+akademik|KBAT|kemahiran\s+berfikir\s+aras\s+tinggi|HOTS|higher\s+order\s+thinking|Bloom(?:'s)?\s+taxonomy|taksonomi\s+bloom|pedagogi|pedagogy|PdPc|KSSM|KSSR)\b/i;

const FORMAL_LAYOUT_FACETS: ReadonlySet<AdamUsersDomainFacet> = new Set([
  'economics',
  'civics',
  'science',
  'technology',
  'academic',
  'mathematics',
  'business-studies',
  'accounting',
  'health',
  'environment',
]);

const TEACHING_PACK_FACETS: ReadonlySet<AdamUsersDomainFacet> = new Set([
  'economics',
  'science',
  'history',
  'civics',
  'technology',
  'academic',
  'mathematics',
  'languages',
  'business-studies',
  'accounting',
  'health',
  'environment',
  'entrepreneurship',
  'home-vocational',
]);

/** Domain facets that require jadual + bullet/nombor — not esei panjang sahaja. */
export function usersDomainRequiresFormalLayout(facet: AdamUsersDomainFacet): boolean {
  return FORMAL_LAYOUT_FACETS.has(facet);
}

/** Domain facets that get teaching-depth + domain prompt pack (not generic direct-only). */
export function usersDomainUsesTeachingPack(facet: AdamUsersDomainFacet): boolean {
  return TEACHING_PACK_FACETS.has(facet);
}

/** Universal Scholar prose — full soul, konvensional; no teaching-pack depth. */
export function usersDomainUsesUniversalScholarProse(facet: AdamUsersDomainFacet): boolean {
  return facet === 'geography'
    || facet === 'arts-music'
    || facet === 'moral-ethics'
    || facet === 'islamic-studies'
    || facet === 'general';
}

export function formatAdamUsersDomainLog(facet: AdamUsersDomainFacet): string {
  return `[adam:users-domain] facet=${facet}`;
}

function resolveDomainFromBody(body: string): AdamUsersDomainFacet {
  const t = body.trim();
  if (!t || isAdamLightChatTurn(t)) return 'general';
  if (isAdamProseCraftTurn(t)) return 'prose-craft';
  if (userOpenedFaithDoor(t)) return 'faith';
  if (isAdamPracticalAdvisoryTurn(t)) return 'practical-career';
  if (isAdamIslamicStudiesTurn(t)) return 'islamic-studies';
  if (isAdamCivicsGovernmentTurn(t) || isAdamCivicsLawTurn(t) || isAdamGlobalCivicsTurn(t)) {
    return 'civics';
  }
  if (isAdamHistorySynthesisTurn(t) || isAdamHistoricalBiographyTurn(t)) return 'history';
  if (ECONOMICS_DOMAIN.test(t) || ECONOMICS_POLICY_DOMAIN.test(t)) return 'economics';
  if (isAdamAccountingTurn(t)) return 'accounting';
  if (isAdamBusinessStudiesTurn(t)) return 'business-studies';
  if (isAdamEntrepreneurshipEducationTurn(t)) return 'entrepreneurship';
  if (isAdamHomeVocationalTurn(t)) return 'home-vocational';
  if (BIOETHICS_DOMAIN.test(t)) return 'science';
  if (isAdamScienceNatureSynthesisTurn(t)) return 'science';
  if (isAdamEnvironmentTurn(t)) return 'environment';
  if (isAdamGeographyTurn(t)) return 'geography';
  if (isAdamHealthEducationTurn(t)) return 'health';
  if (isAdamMathematicsTurn(t)) return 'mathematics';
  if (isAdamLanguagesTurn(t)) return 'languages';
  if (TECHNOLOGY_DOMAIN.test(t)) return 'technology';
  if (ACADEMIC_DOMAIN.test(t) || isAdamPedagogyKonvensionalTurn(t)) return 'academic';
  if (isAdamArtsMusicTurn(t)) return 'arts-music';
  if (isAdamMoralEthicsTurn(t)) return 'moral-ethics';
  return 'general';
}

/** Route one Users turn to a single domain facet — continuation inherits prior topic. */
export function resolveAdamUsersDomainFacet(
  message: string,
  options?: { recentUserMessages?: string[] },
): AdamUsersDomainFacet {
  const t = stripLeadingAdamSalutation(message).trim();
  if (!t) return 'general';

  if (isAdamContinuationDepthTurn(t)) {
    const prior = [...(options?.recentUserMessages ?? [])]
      .reverse()
      .map((m) => stripLeadingAdamSalutation(m).trim())
      .find((p) => p && !isAdamContinuationDepthTurn(p) && !isAdamLightChatTurn(p));
    if (prior) return resolveDomainFromBody(prior);
    return 'general';
  }

  return resolveDomainFromBody(t);
}

/** Search UI / prefetch hint — domain-aware institutions and figures (global). */
export function buildUsersDomainSearchHint(
  facet: AdamUsersDomainFacet,
  message: string,
): string | null {
  const body = stripLeadingAdamSalutation(message).trim();
  if (!body || facet === 'general' || facet === 'prose-craft' || facet === 'faith') {
    return null;
  }
  switch (facet) {
    case 'economics':
      return [
        'DOMAIN SEARCH — ECONOMICS:',
        'Prioritise verified figures: central banks, national statistics offices, World Bank, IMF when relevant.',
        'Prefer local currency amounts, %, year, and named policy instruments — not essay without numbers.',
      ].join('\n');
    case 'science':
      return 'DOMAIN SEARCH — SCIENCE: peer-reviewed or institutional sources (NASA, WHO, textbooks); named laws and SI units.';
    case 'history':
      return 'DOMAIN SEARCH — HISTORY: dated events, named treaties/leaders, regional context; avoid undated folklore.';
    case 'civics':
      return 'DOMAIN SEARCH — CIVICS: named constitution articles, statutes, court decisions for the jurisdiction asked.';
    case 'technology':
      return 'DOMAIN SEARCH — TECHNOLOGY: specs, versions, standards bodies; avoid invented API names.';
    case 'academic':
      return 'DOMAIN SEARCH — ACADEMIC: methodology, citation norms, journal names — not fabricated DOI.';
    case 'practical-career':
      return 'DOMAIN SEARCH — CAREER: role skills, certifications, labour-market data when asked.';
    case 'geography':
      return 'DOMAIN SEARCH — GEOGRAPHY: UNESCO, USGS, national mapping agencies, World Bank country data; named places and measurements.';
    case 'mathematics':
      return 'DOMAIN SEARCH — MATHEMATICS: textbook theorems, step-by-step worked examples; show working.';
    case 'languages':
      return 'DOMAIN SEARCH — LANGUAGES: standard grammar references, dictionary usage, literary context when asked.';
    case 'business-studies':
      return 'DOMAIN SEARCH — BUSINESS: case studies, named frameworks (SWOT, Porter), market data when relevant.';
    case 'accounting':
      return 'DOMAIN SEARCH — ACCOUNTING: GAAP/IFRS standards, sample statements — not invented figures.';
    case 'health':
      return 'DOMAIN SEARCH — HEALTH: WHO, CDC, NHS or national health ministry guidance — not medical diagnosis.';
    case 'environment':
      return 'DOMAIN SEARCH — ENVIRONMENT: IPCC, UNEP, national environment agencies; dated climate data.';
    case 'entrepreneurship':
      return 'DOMAIN SEARCH — ENTREPRENEURSHIP: startup methodology, market sizing — classroom framing only.';
    case 'home-vocational':
      return 'DOMAIN SEARCH — VOCATIONAL: standard procedures, safety codes, nutrition tables when relevant.';
    case 'islamic-studies':
      return 'DOMAIN SEARCH — ISLAMIC STUDIES: syllabus references, classical texts named in question — konvensional surface.';
    case 'moral-ethics':
      return 'DOMAIN SEARCH — ETHICS: named philosophers, case studies, professional codes — plural framing.';
    case 'arts-music':
      return 'DOMAIN SEARCH — ARTS: artists, movements, periods — museum or curriculum sources.';
    default:
      return null;
  }
}
