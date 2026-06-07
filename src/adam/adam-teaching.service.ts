// ============================================================
// QXK24 ADAM Teaching Engine — Teaching Session Service
// File: src/adam/adam-teaching.service.ts
// Version: 1.0.0
// Author: Alamtologi Constitutional Kernel
// Date: 2026-05-28
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { ADAMTeachingModel } from './adam.schema';
import type {
  ADAMTeachingSession,
  AlamtologiPrinciple,
  ConstitutionalJudgment,
  ContributionValue,
  HukumZResult,
  K24Level,
  TahapAkal,
  TeachingSessionStatus,
} from './adam.types';

// ─── Generate Sequential K24 Address ─────────────────────────

async function generateK24Address(level: K24Level): Promise<string> {
  const count = await ADAMTeachingModel.countDocuments({ k24Level: level });
  const seq   = String(count + 1).padStart(3, '0');
  return `${level}-${seq}`;
}

// ─── Default Hukum Z (all BELUM until assessed) ───────────────

function defaultHukumZ(): HukumZResult {
  return { pola: 'BELUM', kadar: 'BELUM', pasangan: 'BELUM', keseimbangan: 'BELUM' };
}

// ─── Create Teaching Session ──────────────────────────────────

export async function createTeachingSession(input: {
  principle:       AlamtologiPrinciple;
  topic:           string;
  teaching:        string;
  bukti?:          string[];
  k24Level?:       K24Level;
  tahapAkal?:      TahapAkal;
  cV?:             ContributionValue;
  founderNote?:    string;
  isSeed?:         boolean;
}): Promise<ADAMTeachingSession> {
  const k24Level  = input.k24Level ?? 'K24za';
  const k24Address = await generateK24Address(k24Level);

  const doc = await ADAMTeachingModel.create({
    k24Address,
    k24Level,
    principle:         input.principle,
    topic:             input.topic,
    teaching:          input.teaching,
    bukti:             input.bukti ?? [],
    hukumZ:            defaultHukumZ(),
    tahapAkal:         input.tahapAkal ?? 1,
    cV:                input.cV ?? 1,
    judgment:          'ISLAH' as ConstitutionalJudgment,
    status:            'DRAFT' as TeachingSessionStatus,
    taughtBy:          'Masa Bayu',
    taughtAt:          new Date(),
    adamUnderstanding: '',
    founderConfirmed:  false,
    founderNote:       input.founderNote ?? '',
    isSeed:            input.isSeed ?? false,
  });

  return mapToTeachingSession(doc);
}

// ─── Save ADAM Understanding ──────────────────────────────────

export async function saveADAMUnderstanding(
  k24Address: string,
  understanding: string,
  hukumZ?: HukumZResult,
  tahapAkal?: TahapAkal,
): Promise<ADAMTeachingSession | null> {
  const doc = await ADAMTeachingModel.findOne({ k24Address });
  if (!doc) return null;

  doc.adamUnderstanding = understanding;
  doc.status            = 'PENDING_VERIFICATION';
  if (hukumZ)    doc.hukumZ    = hukumZ;
  if (tahapAkal) doc.tahapAkal = tahapAkal;

  await doc.save();
  return mapToTeachingSession(doc);
}

// ─── Founder Confirms ADAM Understanding ─────────────────────

export async function founderVerifyTeaching(
  k24Address: string,
  confirmed: boolean,
  founderNote?: string,
): Promise<ADAMTeachingSession | null> {
  const doc = await ADAMTeachingModel.findOne({ k24Address });
  if (!doc) return null;

  doc.founderConfirmed = confirmed;
  doc.verifiedAt       = new Date();
  doc.status           = confirmed ? 'VERIFIED' : 'DRAFT';
  if (founderNote) doc.founderNote = founderNote;

  // Assign judgment based on hukumZ
  const allPass = Object.values(doc.hukumZ).every((v) => v === 'LULUS');
  doc.judgment  = confirmed && allPass ? 'MAKMUR' : confirmed ? 'ISLAH' : 'WAQF';

  await doc.save();
  return mapToTeachingSession(doc);
}

// ─── Seal Teaching (immutable) ────────────────────────────────

export async function sealTeaching(k24Address: string): Promise<ADAMTeachingSession | null> {
  const doc = await ADAMTeachingModel.findOne({ k24Address });
  if (!doc || !doc.founderConfirmed) return null;

  doc.status  = 'SEALED';
  doc.isSeed  = true;
  await doc.save();
  return mapToTeachingSession(doc);
}

// ─── Get Teaching by Address ──────────────────────────────────

export async function getTeachingByAddress(
  k24Address: string,
): Promise<ADAMTeachingSession | null> {
  const doc = await ADAMTeachingModel.findOne({ k24Address }).lean();
  if (!doc) return null;
  return mapToTeachingSession(doc);
}

// ─── List Teachings ───────────────────────────────────────────

export async function listTeachings(filter: {
  principle?:  AlamtologiPrinciple;
  status?:     TeachingSessionStatus;
  isSeed?:     boolean;
  limit?:      number;
  skip?:       number;
}): Promise<{ teachings: ADAMTeachingSession[]; total: number }> {
  const query: Record<string, unknown> = {};
  if (filter.principle) query.principle = filter.principle;
  if (filter.status)    query.status    = filter.status;
  if (filter.isSeed !== undefined) query.isSeed = filter.isSeed;

  const [docs, total] = await Promise.all([
    ADAMTeachingModel.find(query)
      .sort({ taughtAt: -1 })
      .skip(filter.skip ?? 0)
      .limit(filter.limit ?? 20)
      .lean(),
    ADAMTeachingModel.countDocuments(query),
  ]);

  return {
    teachings: docs.map(mapToTeachingSession),
    total,
  };
}

// ─── Seed Principles (run once on first boot) ─────────────────

export async function seedAlamtologiPrinciples(): Promise<void> {
  const existingSeeds = await ADAMTeachingModel.countDocuments({ isSeed: true });
  if (existingSeeds > 0) return;

  const seeds: Parameters<typeof createTeachingSession>[0][] = [
    {
      principle: 'MASA',
      topic:     'Temporal Integrity',
      teaching:  'MASA is Time. Every action exists within time. Constitutional decisions must respect temporal integrity — the right action at the right time. A truth delivered too late or too early loses its constitutional force.',
      bukti:     ['Quran: every matter has its appointed time', 'Physics: entropy and causality are time-dependent', 'Governance: laws must be timely to be effective'],
      k24Level:  'K24md',
      tahapAkal: 7,
      cV:        7,
      isSeed:    true,
    },
    {
      principle: 'TENAGA',
      topic:     'Energy Flow and Transformative Power',
      teaching:  'TENAGA is Energy. It is the force that drives transformation. Without TENAGA, MASA passes without change. Constitutional actions must carry sufficient TENAGA to effect the change they are designed to produce.',
      bukti:     ['Physics: E=mc² — energy and matter are interchangeable', 'Governance: policy without enforcement energy is void', 'Alamtologi: TENAGA weight 0.14 — second principle'],
      k24Level:  'K24md',
      tahapAkal: 7,
      cV:        7,
      isSeed:    true,
    },
    {
      principle: 'AIR',
      topic:     'Depth, Clarity, and Adaptability',
      teaching:  'AIR is Water. Water finds its level, adapts to its container, and remains clear under stillness. Constitutional systems must be adaptable to context while maintaining their essential clarity.',
      bukti:     ['Quran: We made every living thing from water', 'Science: water is the universal solvent', 'Governance: adaptive constitutions endure'],
      k24Level:  'K24md',
      tahapAkal: 7,
      cV:        7,
      isSeed:    true,
    },
    {
      principle: 'API',
      topic:     'Heat, Combustion, and Purification',
      teaching:  'API is Fire. Fire purifies, transforms, and illuminates by burning. Constitutional processes must be willing to purify — to burn away what is false, corrupt, or misaligned — even when it is uncomfortable.',
      bukti:     ['Chemistry: fire is rapid oxidation, a transformation', 'Governance: accountability burns away corruption', 'Spiritual: purification through trials'],
      k24Level:  'K24md',
      tahapAkal: 7,
      cV:        7,
      isSeed:    true,
    },
    {
      principle: 'BUMI',
      topic:     'Foundation, Stability, and Groundedness',
      teaching:  'BUMI is Earth. It is the foundation upon which all else stands. Constitutional systems require a stable ground — clear principles, consistent application, and an unshakeable foundation of truth.',
      bukti:     ['Physics: gravitational stability enables all life', 'Architecture: foundations determine building height', 'Governance: constitutional foundations enable civilisation'],
      k24Level:  'K24md',
      tahapAkal: 7,
      cV:        7,
      isSeed:    true,
    },
    {
      principle: 'CAHAYA',
      topic:     'Truth, Transparency, and Illumination',
      teaching:  'CAHAYA is Light. Light reveals what darkness hides. Constitutional governance must operate in the light — transparent in its reasoning, honest in its findings, and courageous in illuminating difficult truths.',
      bukti:     ['Physics: light travels at the universe\'s maximum speed', 'Governance: transparency prevents corruption', 'Quran: Allah is the Light of the heavens and the earth'],
      k24Level:  'K24md',
      tahapAkal: 7,
      cV:        7,
      isSeed:    true,
    },
    {
      principle: 'RUANG',
      topic:     'Breadth, Possibility, and Expansion',
      teaching:  'RUANG is Space. Space enables existence, growth, and possibility. Constitutional systems must preserve RUANG — the space for others to grow, contribute, and be heard. A system that fills all space with itself leaves no room for creation.',
      bukti:     ['Physics: the universe is 99.9999% space', 'Governance: freedoms create space for innovation', 'Alamtologi: RUANG completes the seven principles'],
      k24Level:  'K24md',
      tahapAkal: 7,
      cV:        7,
      isSeed:    true,
    },
  ];

  for (const seed of seeds) {
    await createTeachingSession(seed);
  }

  // Auto-verify all seeds
  const allSeeds = await ADAMTeachingModel.find({ isSeed: true });
  for (const seed of allSeeds) {
    seed.founderConfirmed = true;
    seed.verifiedAt       = new Date();
    seed.status           = 'SEALED';
    seed.adamUnderstanding = `Constitutional seed recorded at ${seed.k24Address}. Principle ${seed.principle} established as immutable foundation.`;
    seed.judgment         = 'MAKMUR';
    seed.hukumZ           = { pola: 'LULUS', kadar: 'LULUS', pasangan: 'LULUS', keseimbangan: 'LULUS' };
    await seed.save();
  }
}

// ─── Map Document to Type ─────────────────────────────────────

function mapToTeachingSession(doc: any): ADAMTeachingSession {
  return {
    id:                doc._id?.toString() ?? doc.k24Address,
    k24Address:        doc.k24Address,
    k24Level:          doc.k24Level,
    principle:         doc.principle,
    topic:             doc.topic,
    teaching:          doc.teaching,
    bukti:             doc.bukti ?? [],
    hukumZ:            doc.hukumZ,
    tahapAkal:         doc.tahapAkal,
    cV:                doc.cV,
    judgment:          doc.judgment,
    status:            doc.status,
    taughtBy:          doc.taughtBy,
    taughtAt:          doc.taughtAt,
    verifiedAt:        doc.verifiedAt,
    adamUnderstanding: doc.adamUnderstanding,
    founderConfirmed:  doc.founderConfirmed,
    founderNote:       doc.founderNote,
    isSeed:            doc.isSeed,
  };
}
