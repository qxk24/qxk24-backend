/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Server Pricing (Layer 2)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-08
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Canonical MY base — PPP for other regions follows Pelajar factor later.
 * Source: ADAMPrice.pdf v1.0 (2025), aligned ERA_1 2026.
 */

import { SupportedRegion } from '../subscriptions/subscription.schema';
import { AdamServerId, AdamServerTier } from './adam-server.types';

export interface AdamServerTierPrice {
  tier:           AdamServerTier;
  label:          string;
  monthlyMYR:     number;
  limitSummary:   string;
  targetAudience: string;
}

export interface AdamServerStudentAddon {
  label:          string;
  monthlyMYR:     number;
  limitSummary:   string;
  targetAudience: string;
}

export interface AdamServerCatalogEntry {
  id:           AdamServerId;
  slug:         string;
  name:         string;
  tagline:      string;
  marketValue:  string;
  roiMinimum:   string;
  previewNote:  string;
  tiers:        AdamServerTierPrice[];
  /** Optional student-side add-on (e.g. ADAMGuru kelas pass). */
  studentAddon?: AdamServerStudentAddon;
}

export const ADAM_SERVER_CATALOG: AdamServerCatalogEntry[] = [
  {
    id:          AdamServerId.JURNAL,
    slug:        'jurnal',
    name:        'ADAM Jurnal',
    tagline:     'Platform jana jurnal akademik profesional',
    marketValue: 'RM 500 – RM 2,000 setiap jurnal di pasaran',
    roiMinimum:  '10×',
    previewNote: 'Lihat contoh jurnal lengkap — preview sahaja, tiada jana atau muat turun.',
    tiers: [
      {
        tier:           AdamServerTier.STARTER,
        label:          'Starter',
        monthlyMYR:     49,
        limitSummary:   '3 jurnal / bulan + soalan tanpa had pada server',
        targetAudience: 'Penyelidik individu, pelajar PhD',
      },
      {
        tier:           AdamServerTier.PROFESSIONAL,
        label:          'Professional',
        monthlyMYR:     129,
        limitSummary:   '10 jurnal / bulan + semua format akademik',
        targetAudience: 'Akademik aktif, pensyarah',
      },
      {
        tier:           AdamServerTier.INSTITUTION,
        label:          'Institution',
        monthlyMYR:     499,
        limitSummary:   '50 jurnal / bulan + 5 akaun pengguna',
        targetAudience: 'Universiti, pusat penyelidikan',
      },
    ],
  },
  {
    id:          AdamServerId.BUKU,
    slug:        'buku',
    name:        'ADAM Buku',
    tagline:     'Platform penulisan buku berpandu profesional',
    marketValue: 'RM 3,000 – RM 10,000 setiap buku di pasaran',
    roiMinimum:  '38×',
    previewNote: 'Lihat struktur Bab 1 sahaja — tidak boleh teruskan atau eksport.',
    tiers: [
      {
        tier:           AdamServerTier.STARTER,
        label:          'Writer',
        monthlyMYR:     79,
        limitSummary:   '1 buku aktif + soalan tanpa had pada server',
        targetAudience: 'Penulis bebas, akademik',
      },
      {
        tier:           AdamServerTier.PROFESSIONAL,
        label:          'Author',
        monthlyMYR:     199,
        limitSummary:   '3 buku serentak + semakan editorial',
        targetAudience: 'Penulis aktif, korporat',
      },
      {
        tier:           AdamServerTier.INSTITUTION,
        label:          'Publisher',
        monthlyMYR:     599,
        limitSummary:   'Tanpa had buku + 3 akaun pengguna',
        targetAudience: 'Penerbit, institusi',
      },
    ],
  },
  {
    id:          AdamServerId.KOD,
    slug:        'kod',
    name:        'ADAM Kod & Aplikasi',
    tagline:     'Pembangunan kod dan aplikasi dengan AI Advisor hingga siap',
    marketValue: 'RM 5,000 – RM 50,000 setiap projek di pasaran',
    roiMinimum:  '50×',
    previewNote: 'Lihat contoh kod sahaja — tidak boleh run, simpan, atau teruskan.',
    tiers: [
      {
        tier:           AdamServerTier.STARTER,
        label:          'Builder',
        monthlyMYR:     99,
        limitSummary:   '2 projek serentak + advisor penuh',
        targetAudience: 'Developer bebas, startup awal',
      },
      {
        tier:           AdamServerTier.PROFESSIONAL,
        label:          'Engineer',
        monthlyMYR:     249,
        limitSummary:   '5 projek + panduan deployment',
        targetAudience: 'Jurutera perisian, syarikat teknologi',
      },
      {
        tier:           AdamServerTier.INSTITUTION,
        label:          'Studio',
        monthlyMYR:     799,
        limitSummary:   'Tanpa had projek + 5 akaun developer',
        targetAudience: 'Agensi, enterprise teknologi',
      },
    ],
  },
  {
    id:          AdamServerId.GURU,
    slug:        'guru',
    name:        'ADAM Guru',
    tagline:     'Teachers train ADAM; students learn — one channel per subject',
    marketValue: 'RM 200 – RM 800 / month vs traditional LMS classroom platforms',
    roiMinimum:  '8×',
    previewNote: 'Register as guru, open subject channels, teach ADAM (A+B=C), invite students. ADAM sleep = silent listening, not offline.',
    tiers: [
      {
        tier:           AdamServerTier.STARTER,
        label:          'Guru',
        monthlyMYR:     59,
        limitSummary:   '1 subject channel · 20 students · invite & shared class chat',
        targetAudience: 'Solo tutors, ustaz, lecturers',
      },
      {
        tier:           AdamServerTier.PROFESSIONAL,
        label:          'Guru Pro',
        monthlyMYR:     129,
        limitSummary:   '5 subject channels · 80 students · ADAM sleep & teach mode',
        targetAudience: 'Multi-subject teachers, tuition centres',
      },
      {
        tier:           AdamServerTier.INSTITUTION,
        label:          'Campus',
        monthlyMYR:     399,
        limitSummary:   'Unlimited channels · 300 students · 5 guru accounts',
        targetAudience: 'Madrasah, faculties, schools',
      },
    ],
    studentAddon: {
      label:          'Class Pass (student)',
      monthlyMYR:     15,
      limitSummary:   'Access invited guru channels — no full private ADAM desk',
      targetAudience: 'Students without Premium; or included in guru seat quota',
    },
  },
];

export function getServerCatalogEntry(id: AdamServerId): AdamServerCatalogEntry {
  const entry = ADAM_SERVER_CATALOG.find((s) => s.id === id);
  if (!entry) throw new Error(`Unknown server: ${id}`);
  return entry;
}

export function serverDisplayName(id: AdamServerId): string {
  return getServerCatalogEntry(id).name;
}

/** Layer 1 platform copy for pricing API */
export const LAYER1_PLATFORM = {
  guestLimit:     '3 soalan seumur hidup (tetamu)',
  pencarianLimit: '15 soalan / hari (daftar percuma)',
  rule:           'Lapisan 1 — soal jawab ADAM sahaja. Tiada jana jurnal, buku, atau aplikasi.',
} as const;

export function buildServerPricingPayload(region: SupportedRegion = SupportedRegion.MY) {
  return {
    layer1: {
      ...LAYER1_PLATFORM,
      layer:        1,
      open:         true,
    },
    layer2: {
      layer:        2,
      open:         false,
      testingNote:  'Server dalam ujian dalaman — langganan dibuka selepas ujian penuh.',
      noBundle:     true,
      currency:     region === SupportedRegion.MY ? 'MYR' : 'MYR',
      servers:      ADAM_SERVER_CATALOG,
    },
  };
}
