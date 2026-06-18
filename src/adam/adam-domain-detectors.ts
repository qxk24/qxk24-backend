/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Domain Detectors (global IQ facets)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-18
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Global subject detectors — all nations, BM/EN and common school terms.
 * One dominant facet per turn; consumed by adam-users-domain-router.
 */

import {
  isAdamLightChatTurn,
  stripLeadingAdamSalutation,
} from './adam-response-generation';
import { userOpenedFaithDoor } from './adam-universal-voice';

function body(message: string): string {
  return stripLeadingAdamSalutation(message).trim();
}

/** School / syllabus Islamic studies — not faith-door Quran/konstitusi. */
const ISLAMIC_STUDIES_SUBJECT =
  /\b(?:fiqh|fiqh|usul\s+al[-\s]?fiqh|usuluddin|akidah|aqidah|aqeedah|sirah|seerah|sejarah\s+islam|islamic\s+studies|pendidikan\s+islam|IGCSE\s+islamic|SPM\s+PI\b|hadith\s+studies|uloom|syariah\s+subject|bab\s+\d+\s+(?:pendidikan\s+)?islam)\b/i;

export function isAdamIslamicStudiesTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  if (userOpenedFaithDoor(t)) return false;
  return ISLAMIC_STUDIES_SUBJECT.test(t);
}

/** Human / physical geography — all regions; Universal Scholar prose channel. */
const GEOGRAPHY_SUBJECT =
  /\b(?:geography|geografi|geographic|continent|benua|archipelago|kepulauan|country|countries|negara|nation|capital|ibu\s+kota|river|sungai|fluvial|mountain|gunung|peak|puncak|ocean|laut|sea|tasik|lake|desert|gurun|plateau|tanah\s+tinggi|delta|estuary|kuala|population|penduduk|demographics|border|sempadan|latitude|longitud|hemisphere|hemisfera|time\s+zone|zon\s+waktu|atlas|cartography|topography|climate\s+zone|rainforest|hutan\s+hujan|tundra|savanna|sabana|megacity|bandar\s+raya|urbanization|urbanisasi|migration|migrasi|UNESCO|USGS|longitude|equator|khatulistiwa|meridian)\b/i;

const GEOGRAPHY_SUPERLATIVE =
  /\b(?:terpanjang|terpendek|terbesar|tertinggi|terdalam|terluas|paling\s+panjang|paling\s+tinggi|paling\s+besar|longest|shortest|largest|highest|deepest|biggest|tallest|widest|most\s+populous)\b/i;

export function isAdamGeographyTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  if (GEOGRAPHY_SUBJECT.test(t)) return true;
  return GEOGRAPHY_SUPERLATIVE.test(t)
    && /\b(?:sungai|river|gunung|mountain|negara|country|bandar|city|laut|ocean|tasik|lake|benua|continent|pulau|island|waterfall|air\s+terjun|desert|gurun)\b/i.test(t);
}

/** Mathematics beyond simple arithmetic — school through undergraduate. */
const MATHEMATICS_SUBJECT =
  /\b(?:mathematics|matematik|maths\b|algebra|aljabar|calculus|kalkulus|geometry|geometri|trigonometry|trigonometri|trigonometri|statistics|statistik|probability|kebarangkalian|polynomial|polinomial|logarithm|logaritma|theorem|teorem|axiom|aksiom|matrix|matriks|vector|vektor|derivative|terbitan|integral|differential|kuadratik|quadratic|linear\s+equation|persamaan\s+linear|factorization|faktorisasi|prime\s+number|nombor\s+perdana|pi\b|pythagoras|fibonacci|set\s+theory|teori\s+himpunan|combinatorics|kombinatorik|topology|topologi)\b/i;

export function isAdamMathematicsTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  return MATHEMATICS_SUBJECT.test(t);
}

/** Languages & literature — any locale. */
const LANGUAGES_SUBJECT =
  /\b(?:grammar|tatabahasa|syntax|sintaks|morphology|morfologi|vocabulary|perbendaharaan\s+kata|literature|sastera|kesusasteraan|literary|essay\s+writing|penulisan\s+esei|poetry|puisi|prose|novel|drama|metaphor|metafora|simile|personification|spelling|ejaan|pronunciation|sebutan|phonetic|fonetik|translate|terjemah|translation|terjemahan|idiom|peribahasa|proverb|figurative\s+language|bahasa\s+(?:melayu|inggeris|arab|cina|tamil|jepun|korea|sepanyol|perancis|jerman)|malay\s+language|english\s+language|arabic\s+language|mandarin|spanish\s+language|french\s+language|ESL|EFL|IELTS\s+writing|TOEFL)\b/i;

export function isAdamLanguagesTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  return LANGUAGES_SUBJECT.test(t);
}

/** Business studies — theory/classroom; not live SME coaching (Niaga / practical-career). */
const BUSINESS_STUDIES_SUBJECT =
  /\b(?:business\s+studies|perniagaan|marketing|pemasaran|management|pengurusan|organisational\s+behaviour|perilaku\s+organisasi|human\s+resources|sumber\s+manusia|supply\s+chain|rantaian\s+bekalan|SWOT|business\s+model|model\s+perniagaan|stakeholder|pemangku\s+taruh|market\s+segment|segmen\s+pasaran|branding|jenama|customer\s+relationship|CRM|BCG\s+matrix|porter(?:'s)?\s+five|4P|marketing\s+mix|campuran\s+pemasaran)\b/i;

export function isAdamBusinessStudiesTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  return BUSINESS_STUDIES_SUBJECT.test(t);
}

/** Accounting & finance literacy — classroom. */
const ACCOUNTING_SUBJECT =
  /\b(?:accounting|perakaunan|bookkeeping|kira[-\s]?kira|balance\s+sheet|imbangan\s+duga|income\s+statement|penyata\s+pendapatan|profit\s+and\s+loss|untung\s+rugi|ledger|lejar|debit|kredit|asset|aset|liabiliti|liability|equity|ekuiti|amortization|pelunasan|depreciation|susut\s+nilai|cash\s+flow|aliran\s+tunai|GAAP|IFRS|double[-\s]entry|catatan\s+berpasangan|trial\s+balance|imbangan\s+percubaan|journal\s+entry|catatan\s+jurnal)\b/i;

export function isAdamAccountingTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  return ACCOUNTING_SUBJECT.test(t);
}

/** Health & PE education — global public-health framing. */
const HEALTH_SUBJECT =
  /\b(?:health\s+education|pendidikan\s+kesihatan|physical\s+education|pendidikan\s+jasmani|nutrition|pemakanan|diet|balanced\s+diet|diet\s+seimbang|exercise|senaman|fitness|kecergasan|mental\s+health|kesihatan\s+mental|hygiene|kebersihan|sanitation|sanitasi|disease\s+prevention|pencegahan\s+penyakit|vaccination|vaksinasi|immunization|imunisasi|public\s+health|kesihatan\s+awam|first\s+aid|pertolongan\s+cemasan|CDC|WHO\s+guideline|NHS\s+guidance|epidemic|wabak|pandemic|pandemi|wellness|kesejahteraan\s+fizikal)\b/i;

export function isAdamHealthEducationTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  return HEALTH_SUBJECT.test(t);
}

/** Environment & sustainability — policy and science interface. */
const ENVIRONMENT_SUBJECT =
  /\b(?:environment|alam\s+sekitar|environmental\s+science|sustainability|kelestarian|sustainable\s+development|pembangunan\s+lestari|climate\s+change|perubahan\s+iklim|global\s+warming|pemanasan\s+global|carbon\s+footprint|jejak\s+karbon|greenhouse|rumah\s+hijau|renewable\s+energy|tenaga\s+boleh\s+diperbaharui|solar\s+power|tenaga\s+surya|wind\s+energy|pollution|pencemaran|biodiversity|biodiversiti|conservation|pemeliharaan|deforestation|penebangan|IPCC|Paris\s+agreement|SDG|ESG|net\s+zero|sifar\s+karbon|circular\s+economy|ekonomi\s+bulatan)\b/i;

export function isAdamEnvironmentTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  return ENVIRONMENT_SUBJECT.test(t);
}

/** Visual & performing arts — global curriculum. */
const ARTS_MUSIC_SUBJECT =
  /\b(?:visual\s+arts|seni\s+visual|fine\s+arts|music\s+theory|teori\s+muzik|painting|lukisan|sculpture|arca|drawing|melukis|rhythm|irama|melody|melodi|harmony|harmoni|art\s+history|sejarah\s+seni|theatre|teater|drama\s+performance|performing\s+arts|seni\s+persembahan|orchestra|orkestra|composer|penggubah|Renaissance\s+art|impressionism|impresionisme)\b/i;

export function isAdamArtsMusicTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  return ARTS_MUSIC_SUBJECT.test(t);
}

/** Moral / ethics education — plural, konvensional; not faith-door. */
const MORAL_ETHICS_SUBJECT =
  /\b(?:moral\s+education|pendidikan\s+moral|ethics|etika|applied\s+ethics|utilitarianism|utilitarianisme|deontology|deontologi|kantian|virtue\s+ethics|etika\s+virtu|moral\s+dilemma|dilema\s+moral|values\s+education|pendidikan\s+nilai|character\s+education|akhlak|CSR|corporate\s+social\s+responsibility|tanggung\s+jawab\s+sosial|professional\s+ethics|etika\s+profesional)\b/i;

export function isAdamMoralEthicsTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  if (userOpenedFaithDoor(t)) return false;
  return MORAL_ETHICS_SUBJECT.test(t);
}

/** School entrepreneurship — not Niaga SME lane. */
const ENTREPRENEURSHIP_SUBJECT =
  /\b(?:entrepreneurship\s+education|pengajian\s+keusahawanan|business\s+plan\s+(?:assignment|projek|project)|lean\s+startup|pitch\s+deck|startup\s+theory|teori\s+keusahawanan|venture\s+capital\s+basics|modal\s+teroka|feasibility\s+study|kajian\s+daya\s+maju|entrepreneurship\s+class|kuliah\s+keusahawanan)\b/i;

export function isAdamEntrepreneurshipEducationTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  return ENTREPRENEURSHIP_SUBJECT.test(t);
}

/** Home science, vocational & applied life skills — global. */
const HOME_VOCATIONAL_SUBJECT =
  /\b(?:home\s+science|sains\s+rumah\s+tangga|culinary\s+science|food\s+technology|teknologi\s+makanan|textile\s+technology|fashion\s+design|reka\s+bentuk\s+fesyen|agriculture\s+science|pertanian|horticulture|hortikultur|woodwork|pertukangan|automotive\s+technology|automotif|vocational\s+education|pendidikan\s+vokasional|hospitality|pelancongan\s+dan\s+hospitaliti|child\s+development|perkembangan\s+kanak)\b/i;

export function isAdamHomeVocationalTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  return HOME_VOCATIONAL_SUBJECT.test(t);
}

/** School pedagogy / curriculum concepts — KBAT, Bloom, PdPc (classroom voice, not soul essay). */
const PEDAGOGY_KONVENSIONAL_SUBJECT =
  /\b(?:KBAT|kemahiran\s+berfikir\s+aras\s+tinggi|HOTS|higher\s+order\s+thinking|Bloom(?:'s)?\s+taxonomy|taksonomi\s+(?:bloom|kognitif)|aras\s+kognitif|kognitif\s+(?:domain|taraf)|PdPc|pentaksiran\s+berasaskan\s+sekolah|PBL|project[-\s]based\s+learning|pembelajaran\s+berasaskan\s+projek|scaffolding|differentiated\s+instruction|andragogi|pedagogi|pedagogy|kurikulum\s+standard|KSSM|KSSR|21st\s+century\s+skills|kemahiran\s+abad\s+21|jaminan\s+kualiti\s+pembelajaran|J-QAF)\b/i;

export function isAdamPedagogyKonvensionalTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  return PEDAGOGY_KONVENSIONAL_SUBJECT.test(t);
}

/** Global civics — any constitution / government system. */
const CIVICS_GLOBAL_SUBJECT =
  /\b(?:constitution|perlembagaan|democracy|demokrasi|parliament|parlimen|congress|senate|judiciary|kehakiman|executive|eksekutif|legislature|cabang\s+kuasa|separation\s+of\s+powers|voting|undi|election|pilihan\s+raya|ballot|human\s+rights|hak\s+asasi|civil\s+rights|rule\s+of\s+law|supreme\s+court|mahkamah\s+persekutuan|federal\s+government|local\s+government|kerajaan\s+tempatan|municipal|citizenship|kewarganegaraan|referendum|coalition\s+government|kerajaan\s+perikatan)\b/i;

export function isAdamGlobalCivicsTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  return CIVICS_GLOBAL_SUBJECT.test(t);
}

/** Record / superlative factual asks — surface S1 helper. */
export function isAdamRecordSuperlativeTurn(message: string): boolean {
  return isAdamGeographyTurn(message) && GEOGRAPHY_SUPERLATIVE.test(body(message));
}

/** Procedure / how-to (non-recipe vocational). */
const PROCEDURE_HOWTO_ASK =
  /\b(?:how\s+to|cara\s+(?:buat|melakukan|menggunakan|menyelesaikan)|langkah[-\s]demi[-\s]langkah|step[-\s]by[-\s]step|tutorial|panduan\s+langkah)\b/i;

export function isAdamProcedureHowToTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  return PROCEDURE_HOWTO_ASK.test(t);
}

/** Opinion / evaluative (should we, is it right). */
const OPINION_EVALUATIVE_ASK =
  /\b(?:should\s+we|patut\s+kah|adakah\s+patut|is\s+it\s+(?:right|wrong|ethical)|betul\s+ke|wajar\s+ke|do\s+you\s+think|pendapat\s+anda|is\s+it\s+worth|berbaloi\s+ke)\b/i;

export function isAdamOpinionEvaluativeTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  return OPINION_EVALUATIVE_ASK.test(t);
}

/** Translation request. */
const TRANSLATION_ASK =
  /\b(?:translate|terjemah|terjemahan|translation|how\s+do\s+you\s+say|macam\s+mana\s+nak\s+cakap|apa\s+bahasa\s+untuk)\b/i;

export function isAdamTranslationTurn(message: string): boolean {
  const t = body(message);
  if (!t || isAdamLightChatTurn(t)) return false;
  return TRANSLATION_ASK.test(t);
}
