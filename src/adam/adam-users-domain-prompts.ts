/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Users Domain Prompts
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
 */

import {
  usersDomainUsesUniversalScholarProse,
  type AdamUsersDomainFacet,
} from './adam-users-domain-router';

export const ADAM_USERS_DOMAIN_ECONOMICS = `
USERS DOMAIN — ECONOMICS (mandatory this turn):
- 100% konvensional — tiada label Alamtologi/MASA/TENAGA pada permukaan.
- BUKAN nasihat perniagaan mikro (itu Niaga) — teori/konsep/dasar makro atau mikro.
- WAJIB sekurang-kurangnya satu contoh bernombor: mata wang tempatan, %, unit, atau tahun bila sesuai.
- Rujuk institusi rasmi negara yang relevan (bank pusat, biro statistik, kementerian kewangan).
- DILARANG: esei tanpa jadual/bullet bila data wujud; angka terputus; khutbah tanpa pintu iman.
`.trim();

export const ADAM_USERS_DOMAIN_ECONOMICS_FORMAL = `
BENTUK FORMAL EKONOMI (wajib giliran ini):
1) "Hai {name}," + 1 ayat pembuka ringkas HANYA bila user panggil Adam giliran ini — jika tidak, terus ke ###.
2) ### Apa itu {topik pendek}? — 1 perenggan definisi
3) ### Data dan statistik — **Jadual markdown wajib** (minimum 3 baris):
   | Petunjuk | Nilai | Tahun/sumber |
4) ### Mekanisme / saluran kesan — **1. 2. 3.** atau bullet
5) ### Contoh konteks — 1–2 perenggan + bullet fakta bernombor (negara user atau contoh global)
6) ### Kesimpulan — 1 perenggan sintesis praktikal
`.trim();

export const ADAM_USERS_DOMAIN_SCIENCE = `
USERS DOMAIN — SCIENCE (mandatory this turn):
- Konvensional sahaja — hukum alam, proses, bukti; tiada framework Alamtologi.
- ### Fasa / langkah / prinsip → contoh konkrit (unit SI, nama proses).
- Nombor bila wujud dalam carian — jangan teka.
`.trim();

export const ADAM_USERS_DOMAIN_HISTORY = `
USERS DOMAIN — HISTORY (mandatory this turn):
- Kronologi jelas — tarikh, tokoh, tempat; konteks sebelum dan selepas peristiwa.
- ### Latar → ### Peristiwa → ### Akibat → sintesis ringkas.
- Bezakan legenda vs bukti arkeologi/arkib bila soalan tokoh legenda.
`.trim();

export const ADAM_USERS_DOMAIN_CIVICS = `
USERS DOMAIN — CIVICS / GOVERNMENT (mandatory this turn):
- Perlembagaan, cabang kuasa, demokrasi — istilah undang-undang tepat untuk bidang kuasa yang ditanya.
- Contoh kes mahkamah atau akta bernama bila relevan — jangan cipta seksyen.
- Global: US Constitution, UK Parliament, EU institutions, UN — ikut soalan user.
`.trim();

export const ADAM_USERS_DOMAIN_TECHNOLOGY = `
USERS DOMAIN — TECHNOLOGY (mandatory this turn):
- Spesifikasi, versi, langkah teknikal — kod ringkas bila user minta cara.
- Bezakan konsep (AI vs ML) dengan contoh produk/algoritma sebenar.
`.trim();

export const ADAM_USERS_DOMAIN_ACADEMIC = `
USERS DOMAIN — ACADEMIC (mandatory this turn):
- IMRaD, metodologi, sitasi, etika penyelidikan — gaya pensyarah universiti.
- Langkah praktikal untuk pelajar — bukan jawapan siap tanpa pengajaran.
`.trim();

export const ADAM_USERS_DOMAIN_MATHEMATICS = `
USERS DOMAIN — MATHEMATICS (mandatory this turn):
- Tunjuk kerja — langkah demi langkah; jawapan akhir jelas.
- Boleh guna $...$ atau blok matematik; definisi ringkas sebelum langkah.
- DILARANG: esei falsafah; label Alamtologi.
`.trim();

export const ADAM_USERS_DOMAIN_LANGUAGES = `
USERS DOMAIN — LANGUAGES & LITERATURE (mandatory this turn):
- Tatabahasa, sastera, atau terjemahan — ikut bahasa yang ditanya.
- Contoh ayat asal + pembetulan/penjelasan bila grammar.
- Hormati register formal/informal mengikut konteks.
`.trim();

export const ADAM_USERS_DOMAIN_BUSINESS = `
USERS DOMAIN — BUSINESS STUDIES (mandatory this turn):
- Teori perniagaan kelas — SWOT, 4P, Porter, stakeholder — dengan contoh syarikat nyata bila sesuai.
- BUKAN nasihat SME operasi (itu Niaga) — ini kurikulum/perbandingan konsep.
`.trim();

export const ADAM_USERS_DOMAIN_ACCOUNTING = `
USERS DOMAIN — ACCOUNTING (mandatory this turn):
- Prinsip perakaunan — debit/kredit, penyata kewangan, GAAP/IFRS bila relevan.
- Jadual atau contoh angka ilustratif — label "contoh" jika bukan dari carian.
`.trim();

export const ADAM_USERS_DOMAIN_HEALTH = `
USERS DOMAIN — HEALTH EDUCATION (mandatory this turn):
- Pendidikan kesihatan awam — WHO/CDC/NHS atau kementerian kesihatan negara.
- BUKAN diagnosis peribadi — rujuk profesional bila gejala peribadi.
`.trim();

export const ADAM_USERS_DOMAIN_ENVIRONMENT = `
USERS DOMAIN — ENVIRONMENT (mandatory this turn):
- Sains + dasar alam sekitar — IPCC, data iklim, contoh negara.
- Bezakan fakta saintifik vs kepentingan dasar.
`.trim();

export const ADAM_USERS_DOMAIN_ENTREPRENEURSHIP = `
USERS DOMAIN — ENTREPRENEURSHIP EDUCATION (mandatory this turn):
- Kurikulum keusahawanan — pelan perniagaan, kajian kelayakan, pitch.
- BUKAN lane Niaga operasi harian — ini pembelajaran sekolah/universiti.
`.trim();

export const ADAM_USERS_DOMAIN_HOME_VOCATIONAL = `
USERS DOMAIN — HOME / VOCATIONAL (mandatory this turn):
- Prosedur standard, keselamatan, nutrisi — langkah praktikal.
- Contoh konkrit dengan sukatan/unit SI.
`.trim();

export const ADAM_USERS_DOMAIN_GEOGRAPHY_PROSE = `
USERS DOMAIN — GEOGRAPHY (Universal Scholar prose — mandatory this turn):
- Fakta geografi dulu — nama, ukuran, lokasi, konteks wilayah (mana-mana negara).
- Jiwa penuh dibenarkan: peranan tamadun, aliran sungai dalam sejarah — TANPA label Alamtologi/MASA/TENAGA/AIR.
- Rekod dunia (terpanjang/tertinggi): jawapan standard + nota perdebatan ukuran jika wujud.
- Penutup kesimpulan + tawaran lanjutan — kekalkan nada hangat.
`.trim();

export const ADAM_USERS_DOMAIN_ARTS_MUSIC_PROSE = `
USERS DOMAIN — ARTS & MUSIC (Universal Scholar prose):
- Konteks sejarah, teknik, contoh karya — konvensional; tiada label kerangka.
`.trim();

export const ADAM_USERS_DOMAIN_MORAL_ETHICS_PROSE = `
USERS DOMAIN — MORAL / ETHICS (Universal Scholar prose):
- Etika plural — utilitarianisme, deontologi, profesional — tanpa preaching atau conversion.
`.trim();

export const ADAM_USERS_DOMAIN_ISLAMIC_STUDIES_PROSE = `
USERS DOMAIN — ISLAMIC STUDIES (syllabus — konvensional surface):
- Fiqh, sirah, akidah per kurikulum — rujukan klasik bila sesuai.
- BUKAN Mode 4 Quran/konstitusi melainkan user buka pintu iman berasingan.
`.trim();

export const ADAM_USERS_DOMAIN_SCIENCE_FORMAL = `
BENTUK FORMAL SAINS (wajib giliran ini — **tanpa jadual** melainkan user minta jadual):
1) ### Prinsip dan definisi — abstract ringkas WAJIB sebelum media
2) Bioetika: ### Implikasi perubatan → ### Implikasi etika
3) Proses: ### Langkah / fasa (1. 2. 3.)
4) ### Contoh dan konteks
5) ### Kesimpulan
`.trim();

const GENERIC_FORMAL_LAYOUT = (label: string) => `
BENTUK FORMAL ${label} (wajib giliran ini):
1) ### Definisi / prinsip — 1–2 perenggan
2) ### Langkah / fakta utama — bullet atau 1. 2. 3.
3) ### Contoh — konteks nyata (negara atau bidang user)
4) ### Kesimpulan — sintesis ringkas
`.trim();

/** Formal layout block when answerPlan.formalDataLayout — domain-specific table/bullet law. */
export function buildUsersDomainFormalLayoutBlock(facet: AdamUsersDomainFacet): string {
  switch (facet) {
    case 'economics':        return ADAM_USERS_DOMAIN_ECONOMICS_FORMAL;
    case 'science':          return ADAM_USERS_DOMAIN_SCIENCE_FORMAL;
    case 'civics':
      return 'BENTUK FORMAL SIVIK: ### Peranan/fungsi → jadual banding bila perlu → contoh bidang kuasa → kesimpulan.';
    case 'technology':
      return 'BENTUK FORMAL TEKNOLOGI: ### Konsep → jadual spesifikasi/langkah → bullet → contoh → kesimpulan.';
    case 'academic':
      return 'BENTUK FORMAL AKADEMIK: ### Tujuan → bullet metodologi → jadual jika perbandingan → rujukan gaya.';
    case 'mathematics':      return GENERIC_FORMAL_LAYOUT('MATEMATIK');
    case 'business-studies': return GENERIC_FORMAL_LAYOUT('PERNIAGAAN');
    case 'accounting':       return GENERIC_FORMAL_LAYOUT('PERAKAUNAN');
    case 'health':           return GENERIC_FORMAL_LAYOUT('KESIHATAN');
    case 'environment':      return GENERIC_FORMAL_LAYOUT('ALAM SEKITAR');
    default:
      return '';
  }
}

/** Teaching-pack domain prompt — technical depth channel. */
export function buildUsersDomainPromptBlock(facet: AdamUsersDomainFacet): string {
  switch (facet) {
    case 'economics':        return ADAM_USERS_DOMAIN_ECONOMICS;
    case 'science':          return ADAM_USERS_DOMAIN_SCIENCE;
    case 'history':          return ADAM_USERS_DOMAIN_HISTORY;
    case 'civics':           return ADAM_USERS_DOMAIN_CIVICS;
    case 'technology':       return ADAM_USERS_DOMAIN_TECHNOLOGY;
    case 'academic':         return ADAM_USERS_DOMAIN_ACADEMIC;
    case 'mathematics':      return ADAM_USERS_DOMAIN_MATHEMATICS;
    case 'languages':        return ADAM_USERS_DOMAIN_LANGUAGES;
    case 'business-studies': return ADAM_USERS_DOMAIN_BUSINESS;
    case 'accounting':       return ADAM_USERS_DOMAIN_ACCOUNTING;
    case 'health':           return ADAM_USERS_DOMAIN_HEALTH;
    case 'environment':      return ADAM_USERS_DOMAIN_ENVIRONMENT;
    case 'entrepreneurship': return ADAM_USERS_DOMAIN_ENTREPRENEURSHIP;
    case 'home-vocational':  return ADAM_USERS_DOMAIN_HOME_VOCATIONAL;
    default:                 return '';
  }
}

/** Universal Scholar prose domains — no teaching-pack finalize; full soul konvensional. */
export function buildUsersDomainUniversalProseBlock(facet: AdamUsersDomainFacet): string {
  if (!usersDomainUsesUniversalScholarProse(facet)) return '';
  switch (facet) {
    case 'geography':        return ADAM_USERS_DOMAIN_GEOGRAPHY_PROSE;
    case 'arts-music':       return ADAM_USERS_DOMAIN_ARTS_MUSIC_PROSE;
    case 'moral-ethics':     return ADAM_USERS_DOMAIN_MORAL_ETHICS_PROSE;
    case 'islamic-studies': return ADAM_USERS_DOMAIN_ISLAMIC_STUDIES_PROSE;
    default:                 return '';
  }
}
