// ============================================================
// QXK24 ADAM Teaching Engine — Constitutional Types
// File: src/adam/adam.types.ts
// Version: 1.0.0
// Author: Alamtologi Constitutional Kernel
// Date: 2026-05-28
// ============================================================

// ─── Alamtologi Principles ───────────────────────────────────
export type AlamtologiPrinciple =
  | 'MASA'
  | 'TENAGA'
  | 'AIR'
  | 'API'
  | 'BUMI'
  | 'CAHAYA'
  | 'RUANG';

export const PRINCIPLE_WEIGHTS: Record<AlamtologiPrinciple, number> = {
  MASA:    0.18,
  TENAGA:  0.14,
  AIR:     0.14,
  API:     0.12,
  BUMI:    0.18,
  CAHAYA:  0.14,
  RUANG:   0.10,
};

// ─── K24 Memory Levels ───────────────────────────────────────
export type K24Level =
  | 'K24za'
  | 'K24zb'
  | 'K24zc'
  | 'K24ma'
  | 'K24mb'
  | 'K24mc'
  | 'K24md';

export const K24_LEVEL_LABELS: Record<K24Level, string> = {
  K24za: 'Zarah Alpha — atomic unit of knowledge',
  K24zb: 'Zarah Beta — confirmed single fact',
  K24zc: 'Zarah Gamma — fact with evidence',
  K24ma: 'Modul Alpha — connected knowledge',
  K24mb: 'Modul Beta — applied understanding',
  K24mc: 'Modul Gamma — synthesised system',
  K24md: 'Modul Delta — constitutional mastery',
};

// ─── Tahap Akal ───────────────────────────────────────────────
export type TahapAkal = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const TAHAP_AKAL_LABELS: Record<TahapAkal, string> = {
  1: 'Tangkap',
  2: 'Kenal',
  3: 'Faham',
  4: 'Analisa',
  5: 'Sintesis',
  6: 'Nilai',
  7: 'Cipta',
};

export const TAHAP_AKAL_PATTERN_COUNT: Record<TahapAkal, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 11,
  6: 16,
  7: 22,
};

// ─── Hukum Z ─────────────────────────────────────────────────
export type HukumZStatus = 'LULUS' | 'GAGAL' | 'BELUM';

export interface HukumZResult {
  pola:         HukumZStatus;
  kadar:        HukumZStatus;
  pasangan:     HukumZStatus;
  keseimbangan: HukumZStatus;
}

// ─── Hukum X ─────────────────────────────────────────────────
export interface HukumXProcess {
  fikir:   string;
  ikhtiar: string;
  usaha:   string;
  natijah: string;
}

// ─── Contribution Value ───────────────────────────────────────
export type ContributionValue = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const CV_LABELS: Record<ContributionValue, string> = {
  1: 'Diri',
  2: 'Keluarga',
  3: 'Komuniti',
  4: 'Organisasi',
  5: 'Masyarakat',
  6: 'Negara',
  7: 'Sejagat',
};

// ─── Adab Score ───────────────────────────────────────────────
export interface AdabScore {
  benar:        number;
  amanah:       number;
  menyampaikan: number;
  bijaksana:    number;
  total:        number;
}

// ─── Constitutional Judgment ──────────────────────────────────
export type ConstitutionalJudgment = 'MAKMUR' | 'ISLAH' | 'WAQF';

export type Sifat = 'AKUR' | 'INGKAR' | 'LALAI';

export interface JudgmentCriteria {
  healthScore:       number;
  hukumZAllPass:     boolean;
  sifatAkurDominant: boolean;
  zeroViolations:    boolean;
}

// ─── Chat Types ───────────────────────────────────────────────
export type ADAMChatRole = 'founder' | 'student' | 'adam';

export type ADAMChatMode =
  | 'TEACHING'
  | 'QUESTIONING'
  | 'AUDIT'
  | 'CONSTITUTIONAL'
  | 'JOURNAL_GEN'
  | 'BUILDER';

/** Voice register for a single reply — not operational mode (TEACHING, BUILDER, …). */
export type ADAMAnswerStyle = 'natural' | 'philosophy' | 'formal' | 'technical';

export interface ADAMChatMessage {
  id:           string;
  sessionId:    string;
  role:         ADAMChatRole;
  content:      string;
  mode:         ADAMChatMode;
  tahapAkal?:   TahapAkal;
  principle?:   AlamtologiPrinciple;
  judgment?:    ConstitutionalJudgment;
  k24Address?:  string;
  timestamp:    Date;
  isVerified:   boolean;
  isSeed:       boolean;
}

export interface ADAMChatSession {
  id:           string;
  mode:         ADAMChatMode;
  title:        string;
  messages:     ADAMChatMessage[];
  startedAt:    Date;
  lastActiveAt: Date;
  isActive:     boolean;
  founderNote?: string;
}

// ─── Determination Types ──────────────────────────────────────
export type DeterminationType =
  | 'CAPABILITY'
  | 'CONSTITUTIONAL'
  | 'RESOURCE'
  | 'ALIGNMENT';

export interface ADAMDeterminationRequest {
  question:          string;
  context?:          string;
  principle?:        AlamtologiPrinciple;
  determinationType: DeterminationType;
}

export interface ADAMDeterminationResult {
  determinationType: DeterminationType;
  question:          string;
  judgment:          ConstitutionalJudgment;
  tahapAkal:         TahapAkal;
  hukumZ:            HukumZResult;
  hukumX:            HukumXProcess;
  cV:                ContributionValue;
  adab:              AdabScore;
  sifat:             Sifat;
  principleApplied:  AlamtologiPrinciple;
  faktorTenaga:      number;
  faktorMasa:        number;
  healthScore:       number;
  response:          string;
  canProceed:        boolean;
  conditions?:       string[];
  auditId:           string;
  timestamp:         Date;
}

// ─── Teaching Session Types ───────────────────────────────────
export type TeachingSessionStatus =
  | 'DRAFT'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'SEALED';

export interface ADAMTeachingSession {
  id:              string;
  k24Address:      string;
  k24Level:        K24Level;
  principle:       AlamtologiPrinciple;
  topic:           string;
  teaching:        string;
  bukti:           string[];
  hukumZ:          HukumZResult;
  tahapAkal:       TahapAkal;
  cV:              ContributionValue;
  judgment:        ConstitutionalJudgment;
  status:          TeachingSessionStatus;
  taughtBy:        string;
  taughtAt:        Date;
  verifiedAt?:     Date;
  adamUnderstanding: string;
  founderConfirmed:  boolean;
  founderNote?:    string;
  isSeed:          boolean;
}

// ─── Journal Types ────────────────────────────────────────────
export type JournalStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED';

export type JournalCategory =
  | 'RESEARCH'
  | 'APPLICATION'
  | 'CASE_STUDY'
  | 'THEORY'
  | 'IMPLEMENTATION';

export interface AlamtologiAcademicJournal {
  id:               string;
  title:            string;
  abstract:         string;
  category:         JournalCategory;
  principlesFocus:  AlamtologiPrinciple[];
  authorName:       string;
  authorEmail:      string;
  authorOrg?:       string;
  content:          JournalContent;
  ahriScore:        number;
  hukumZAnalysis:   HukumZResult;
  tahapAkalAchieved:TahapAkal;
  cVLevel:          ContributionValue;
  judgment:         ConstitutionalJudgment;
  status:           JournalStatus;
  submittedAt:      Date;
  reviewedAt?:      Date;
  publishedAt?:     Date;
  reviewNotes?:     string;
  journalNumber?:   string;
  source?:          'public_submit' | 'founder_adam' | 'founder_teaching';
  sourceSessionId?: string;
  knowledgeTopicId?:   string;
  knowledgeMajor?:     string;
  knowledgeDiscipline?: string;
  knowledgeSubfield?:  string;
  /** Section bodies while status === DRAFT */
  draftSections?:      Record<string, string>;
  lastCompletedSection?: string;
  /** Set after migrate:journal-quran-split — skip re-migration */
  sectionSchemaVersion?: string;
  sourceLanguage?:     JournalLocale;
  translations?:       Partial<Record<JournalLocale, JournalTranslationRecord>>;
  copyright?:          string;
  totalWords?:         number;
  /** Denormalised alias for knowledgeTopicId (legal seal queries) */
  topicId?:            string;
  /** Denormalised alias for sourceSessionId (legal seal queries) */
  sessionId?:          string;
}

export type JournalLocale = 'en' | 'ms' | 'ar' | 'id' | 'zh';

export interface JournalTranslationRecord {
  title:        string;
  abstract:     string;
  content:      JournalContent;
  translatedAt: string;
  locale:       JournalLocale;
}

export interface JournalContent {
  introduction:     string;
  background:       string;
  methodology:      string;
  alamtologiAnalysis: PrincipleAnalysis[];
  findings:         string;
  discussion:       string;
  conclusion:       string;
  references:       string[];
  appendices?:      string[];
}

export interface PrincipleAnalysis {
  principle:   AlamtologiPrinciple;
  weight:      number;
  score:       number;
  analysis:    string;
  evidence:    string[];
}

// ─── Succession Types ─────────────────────────────────────────
export type HeirPosition = 1 | 2 | 3 | 4;

export type IdType =
  | 'MyKad'
  | 'Passport'
  | 'National_IC'
  | 'Other';

export interface SuccessionHeir {
  id:              string;
  position:        HeirPosition;
  fullLegalName:   string;
  relationship:    string;
  idType:          IdType;
  idNumber:        string;
  issuingCountry:  string;
  nationality:     string;
  phone:           string;
  email:           string;
  cityOfResidence: string;
  countryOfResidence: string;
  founderNote:     string;
  designatedAt:    Date;
  designatedBy:    string;
  isActive:        boolean;
  replacementHistory: SuccessionHistoryEntry[];
}

export interface SuccessionHistoryEntry {
  previousHeirName: string;
  replacedBy:       string;
  replacedAt:       Date;
  reason:           string;
  sealedBy:         string;
}

export interface SuccessionRecord {
  id:              string;
  founderName:     string;
  founderId:       string;
  heirs:           SuccessionHeir[];
  createdAt:       Date;
  lastUpdatedAt:   Date;
  sealedAt?:       Date;
  isSealed:        boolean;
  constitutionalHash: string;
}

// ─── Audit Types ──────────────────────────────────────────────
export type AuditStage =
  | 'SUBMISSION'
  | 'REVIEW'
  | 'APPROVAL'
  | 'PUBLICATION'
  | 'POST_PUBLICATION';

export interface ADAMAuditRequest {
  targetId:    string;
  targetType:  'JOURNAL' | 'TEACHING' | 'SUCCESSION' | 'SESSION';
  stage:       AuditStage;
  context?:    string;
}

export interface ADAMAuditReport {
  auditId:     string;
  targetId:    string;
  targetType:  string;
  stage:       AuditStage;
  judgment:    ConstitutionalJudgment;
  hukumZ:      HukumZResult;
  hukumX:      HukumXProcess;
  adab:        AdabScore;
  healthScore: number;
  findings:    string[];
  recommendations: string[];
  canAdvance:  boolean;
  auditedAt:   Date;
}

// ─── Teaching Upload (Founder data for ADAM) ─────────────────
export interface ADAMTeachingUpload {
  id:            string;
  sessionId?:    string;
  uploadedBy?:   string;
  uploaderRole?: 'founder' | 'student';
  uploaderName?: string;
  fileName:      string;
  mimeType:      string;
  sizeBytes:     number;
  extractedText: string;
  textTruncated: boolean;
  storagePath:   string;
  uploadedAt:    Date;
}

export const ADAM_TEACHING_ALLOWED_EXTENSIONS = [
  '.txt', '.md', '.markdown', '.csv', '.json',
  '.xml', '.log', '.yaml', '.yml', '.html', '.htm',
  '.pdf', '.doc', '.docx', '.ppt', '.pptx',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif',
] as const;

// ─── SSE Event Types ──────────────────────────────────────────
export type SSEEventType =
  | 'adam_builder_status'
  | 'adam_thinking'
  | 'adam_chunk'
  | 'adam_stream_idle'
  | 'adam_stream_done'
  | 'adam_repairing'
  | 'adam_searching'
  | 'adam_search_done'
  | 'adam_search_unavailable'
  | 'adam_judgment'
  | 'adam_complete'
  | 'adam_waqf'
  | 'adam_error'
  | 'builder';

export interface SSEEvent {
  event:   SSEEventType;
  data:    string;
  id?:     string;
}

// ─── API Response Wrapper ─────────────────────────────────────
export interface ADAMApiResponse<T> {
  success:   boolean;
  kernel:    string;
  version:   string;
  era:       string;
  data?:     T;
  error?:    string;
  auditId?:  string;
  timestamp: string;
}
