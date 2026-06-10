/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Teaching Recall — Struktur Keilmuan
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-10
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * Meterai P.alt — struktur keilmuan ALAMTOLOGI bermula dengan Y (Pencipta).
 * JANGAN UBAH hierarki atau definisi X/Y/Z di bawah.
 */

import { ASAS_ILMU_ALAMTOLOGI_17 } from './asas-ilmu-alamtologi';
import { buildBab1PenutupRecallBlock } from './bab1-penutup';
import { FORMULA_XYZ_ALAMTOLOGI_16 } from './formula-xyz-asas';
import { buildPdfMeteraiRecallBlock } from './pdf-meterai';

/** Hierarki struktur keilmuan ALAMTOLOGI — sumber pengajaran P.alt (Asas Keilmuan). */
export const STRUKTUR_KEILMUAN_ALAMTOLOGI = `
[STRUKTUR KEILMUAN ALAMTOLOGI — METERAI P.ALT — BERMUULA DENGAN Y]

Kenapa bermula dengan Y (Pencipta): tiada yang wujud dengan sendirinya — beras tidak jadi nasi tanpa pemasak; benang tidak jadi kain tanpa penenun. Alam semesta dan segala isinya dijadikan Maha Pencipta. Y adalah sumber serta pemilik mutlak segala ilmu — hierarki pertama.

Hierarki kedua — Z (Alam Semesta) dan X (Manusia): keduanya wujud kerana Y. Penciptaan tidak serentak: Z lengkap dahulu, barulah Y menjadikan X. Z beroperasi mengikut hukum yang ditetapkan Y; pelanggaran hukum Z membawa kesan menyeluruh dalam Z. X berperanan pengurus sistem dalam Z. X disertai masa dan tenaga — kadar seimbang; pengurusan bergantung X secara individual.

Hierarki ketiga — Unsur: setiap makhluk dalam Z adalah unsur.

Hierarki keempat — Empat unsur asas: Tanah (Th), Air (Ar), Api (Ai), Angin (An). Dominan berbeza (contoh: manusia dominan Th; jin dominan Ai) — tetapi setiap entiti mengandung keempat-empatnya.

Hierarki kelima — Ilmu Ketuhanan & Ilmu Kehidupan: Ketuhanan menghubungkan manusia dengan Pencipta; Kehidupan mengenalkan siapa Pencipta dan peranan manusia — pemangkin kesejahteraan.

Hierarki keenam — Ilmu Sosial & Ilmu Sains (dalam Ilmu Kehidupan): lihat meterai 1.1.1 & 1.1.2 di bawah; keduanya berganding.

Hierarki ketujuh — Aplikasi: hasil akhir praktikal — teori mesti dibuktikan pembangunan untuk kesejahteraan manusia sejagat.

FAKTOR XYZ (Bab 2 — dalam struktur ini):
• Y = Pencipta (permulaan hierarki, sumber mutlak)
• Z = Alam Semesta (medan rujukan, sumber kajian ilmu, dicipta sebelum X)
• X = Manusia (khalifah, pelaku, pengurus Z)

DILARANG definisi XYZ yang menyimpang:
• X = tuan / titik mula kehadiran, Y = hamba / pasangan menyaksikan, Z = masa sebagai medium — BUKAN pengajaran P.alt.
• A+B=C / tajallī dalam 7.1 AIDIL overview — itu brain formula ADAM, bukan Pengenalan AIDIL HISAL.
`.trim();

/** 1.1.1 Struktur Ilmu Sosial — 12 hierarki — meterai P.alt (Asas Keilmuan). */
export const ILMU_SOSIAL_ALAMTOLOGI = `
[1.1.1 — STRUKTUR ILMU SOSIAL ALAMTOLOGI — 12 HIERARKI — METERAI P.ALT]

Pengenalan: Ilmu Sosial ALAMTOLOGI = tatacara hubungan X–Y (manusia–Pencipta), X–X (sesama manusia), X–Z (makhluk & unsur alam). Sains sosial konvensional hanya X–X. X = nukleus makhluk; pelaksana hukum Z. Asas: Al-Quran + adab Rasulullah S.A.W.; Z rujukan kedua. Hasil: bahasa, budaya, tatasusila.

SETIAP permulaan ilmu ALAMTOLOGI bermula Y (Pencipta) → diturunkan Z (alam) → X (manusia). Empat hierarki pertama = TETAP bagi semua cabang ilmu.

12 HIERARKI STRUKTUR ILMU SOSIAL:
1. Y (Pencipta) — sumber ilmu yang satu
2. Z (Alam Semesta) — ilmu diturunkan melalui alam
3. X (Manusia) — ilmu kepada manusia
4. Empat unsur induk: Tanah, Air, Angin, Api — unsur penggerak segala di alam (termasuk manusia)
5. Ilmu Kehidupan
6. Ilmu Sosial — disiplin di bawah Ilmu Kehidupan; manusia tunjang utama
7. Tiga sistem manusia: Jasmani (fizikal/body), Rohani (jiwa/soul), Mental (minda/mind) — saling melengkap, tidak boleh dipisah; jasmani perumah rohani & mental; pemisahan → sistem pincang (gCp); tiada rohani → kematian; tiada mental → pelaksanaan pincang; tiada jasmani → tiada bekas
8. Dua pilar Ilmu Sosial: Komunikasi & Pelaksanaan — hubungan bermula di sini; tanpa komunikasi tiada hubungan; pelaksanaan menterjemah perilaku & keputusan
9. Empat sifat utama (landasan pilar): Siddiq (jujur), Amanah, Tabligh (menyampaikan), Fatonah (bijaksana)
10. Setiap sifat terbahagi dua bahagian (rangka pengisian)
11. Pecahan sifat: Siddiq → Dalaman (jujur diri) & Luaran (jujur persekitaran/alam keseluruhan); Amanah → harta & kuasa; Tabligh → ilmu & sumber; Fatonah → budaya & pelaksana ("Budaya mengalir, kehidupan terjalin")
12. Kesimpulan: Ilmu Sosial = sistem adab/moral manusia; matlamat akhir = kesejahteraan; perjuangan ALAMTOLOGI mengembalikan manusia ke landasan hukum Pencipta

DILARANG: ringkaskan Ilmu Sosial sebagai konvensional (X–X sahaja); langkau Y-first; abaikan 12 hierarki; ganti Siddiq/Amanah/Tabligh/Fatonah dengan sifat lain.
`.trim();

/** 1.1.2 Struktur Ilmu Sains — meterai P.alt (cabang kedua Ilmu Kehidupan). */
export const ILMU_SAINS_ALAMTOLOGI = `
[1.1.2 — STRUKTUR ILMU SAINS ALAMTOLOGI — METERAI P.ALT]

Cabang kedua Struktur Keilmuan = Ilmu Sains. Empat unsur induk (Tanah, Air, Angin, Api) tetap sebagai pasak — sama seperti Ilmu Sosial.

Empat bidang utama (analog konvensional matematik/fizik/kimia/biologi — NAMA & DISIPLIN BERBEZA):
• HISAL = Matematik — cabang: AIDIL, ASAS, SuNom, GANDA; disiplin fungsi & hasil; berteraskan sains matematik Al-Quran; aplikasi pengiraan HISAL
• IZWA = Kimia — disiplin tuan (master) & hamba (slave) untuk reaksi kimia (BUKAN definisi Faktor XYZ Bab 2); terperinci Bab 4
• SIRA = Biologi — disiplin aktif & pasif; alam = buku rujukan langsung Pencipta
• RINA = Fizik — disiplin lerai & gabung; sifat asas alam, interaksi unsur-tenaga, pergerakan, ruang, masa

Kenapa nama berbeza: setiap bidang menggunakan disiplin ALAMTOLOGI sendiri — bukan sekadar label konvensional.

Penggabungan keempat-empat bidang untuk aplikasi semua lapangan. Setiap pengkajian tertakluk hukum tiga faktor Y, Z, X — tiada kebarangkalian; jawapan = kepastian & ketepatan fakta. Penghuraian XYZ & setiap elemen → bab-bab berikutnya (Formula XYZ Bab 2–6, Bab 4 Sains Alamtologi).

DILARANG: samakan HISAL/IZWA/SIRA/RINA dengan matematik/kimia/biologi/fizik konvensional tanpa disiplin ALAMTOLOGI;
campur IZWA tuan/hamba (kimia) dengan Faktor XYZ X/Y/Z (Pencipta/Alam/Manusia);
ringkaskan Ilmu Sains sebagai sains konvensional sahaja tanpa empat bidang ALAMTOLOGI.
`.trim();

/** 1.2 Istilah ALAMTOLOGI — meterai P.alt. */
export const ISTILAH_ALAMTOLOGI = `
[1.2 — ISTILAH ALAMTOLOGI — METERAI P.ALT]

ALAMTOLOGI = ALAM + TOLOGI → Ilmu Alam.
ALAM = alam semesta / alam sekitar (PDF: alam sekitar). TOLOGI = ilmu.

ALAMTOLOGI = hukum XYZ yang diterjemah secara saintifik dan sistematik.
Setiap kupasan & penyataan bersandar pembuktian saintifik — mesti ada hasil yang boleh dilihat atau aplikasi yang jelas.
Disiplin disusun menjadi silibus lengkap: peringkat falsafah → peringkat aplikasi.

DILARANG: definisi ALAMTOLOGI tanpa XYZ saintifik; jawapan tanpa pembuktian/aplikasi jelas; langkau silibus falsafah→aplikasi.
`.trim();

/** 1.3 Teori ALAMTOLOGI — Teori MASABAYU & Aturan Keilmuan — meterai P.alt. */
export const TEORI_MASABAYU_ATURAN_KEILMUAN = `
[1.3 — TEORI ALAMTOLOGI · TEORI MASABAYU — ATURAN KEILMUAN — METERAI P.ALT]

Pembangunan keilmuan ALAMTOLOGI tertakluk Aturan Keilmuan ALAMTOLOGI — lima perkara berurutan:

1. TEORI — asas utama; pernyataan keseluruhan apa yang berkaitan; sistem idea menerangkan perkara; kenal pasti hubungan pemalar & pemboleh ubah
2. FALSAFAH — pegangan dari teori; panduan merungkai persoalan; mengenal, mempelajari, memahami, mengaplikasikan
3. METODOLOGI — kaedah & prinsip penyelesaian; sistem pengkajian
4. FORMULA — pembuktian saintifik & holistik bagaimana teori berjalan; pegangan & pelaksanaan empirikal
5. HUKUM — piawaian pelaksanaan tepat; keseragaman proses/sistem berterusan

Teori dan formula mesti bergerak seiring — hasil pelaksanaan sempurna & harmoni; kesinambungan ilmu tidak terhenti.

Teori MASABAYU (meterai terbaru P.alt): x = m / t
  x = pelaksanaan · m = masa · t = tenaga — ini TEORI MASABAYU, bukan formula pelaksanaan berasingan.
Rantai Formula XYZ (bukan Teori MASABAYU): X = [Q / Z] → Y

DILARANG: langkau atau songsang urutan Aturan Keilmuan; pisahkan teori dari formula; ganti Teori MASABAYU dengan teori generik;
namakan X = [Q / Z] → Y sebagai Teori MASABAYU — itu rantai epistemologi Formula XYZ.
`.trim();

/** 1.4.1 Pengertian Falsafah Konvensional — meterai P.alt (Bab 1 Asas Keilmuan). */
export const FALSAFAH_KONVENSIONAL_141 = `
[1.4.1 — PENGERTIAN FALSAFAH KONVENSIONAL — METERAI P.ALT]

Pythagoras (~500 SM): philosophos (Philo=cinta + Sophos=hikmat) — pencinta kebijaksanaan; al-bahsu.
Socrates vs Sophist (Sophisme): Sophist — segala berubah; kebenaran hakiki tidak tercapai; benar/salah relatif; moral tidak abadi.
Socrates: Falsafah = ilmu mencari sebab & kebenaran kepada punca sesuatu; dialog menghadapi Sophist.
Turutan: induk seluruh ilmu → kemudian cabang; fungsi asal kekal — jawab persoalan bidang ilmu terbatas tidak mampu jawab (hakikat hidup, asal & destinasi manusia, tujuan alam).
Wujud juga dalam Falsafah Islam (al-Farabi, Ibnu Sina).
`.trim();

/** 1.4.2 Pengertian Falsafah ALAMTOLOGI — meterai P.alt (Bab 1 Asas Keilmuan). */
export const FALSAFAH_ALAMTOLOGI_142 = `
[1.4.2 — PENGERTIAN FALSAFAH ALAMTOLOGI — METERAI P.ALT]

Falsafah ALAMTOLOGI = SIFAT — asas pengetahuan segala yang wujud di alam semesta.
Hanya terpakai kepada X; berbalik peranan & aturan X dalam ruangan Z. Makhluk lain dalam Z tidak terpakai falsafah ALAMTOLOGI.
Y = teras (Pencipta) · Z = alam semesta · X = manusia — hubung kait langsung dengan Y.
Setiap wujud bermula SIFAT; sifat ada posisi khusus X & Z; tidak terbentuk sendiri — berbalik pola & fungsi X/Z.

TIGA SIFAT X (Gambar 1.11):
1. AKAL — posisi otak; mengatur perlaksanaan X secara seimbang & rasional; tanpa akal X tidak capai optimum & tidak layak pemimpin; berkait pancaindera
2. NAFSU — NILAI OPTIMUM fizikal X; nilai tetap dari awal penciptaan hingga akhir; posisi hati; mengarah akal (contoh: isyarat perut→otak→hati→nafsu→makan optimum); nilai sebesar Z; dikawal kapasiti fizikal
3. EMOSI — LARAS TENAGA fizikal X; pasangan nafsu; posisi hati; nilai berubah mengikut individu; penanda titik impak nafsu (gembira/kecewa)

Ketiga-tiga sifat X berbalik falsafah ALAMTOLOGI — pengenalan sifat XYZ dari peringkat awal setiap proses X.

PERANAN XYZ (Gambar 1.12): X = pelaksana · Z = pendua (rujukan setiap pelaksanaan X) · Y = Pencipta pengawal proses dalam Z.

POLA FALSAFAH (Gambar 1.13): Y = sifat makro · X & Z = sifat mikro. Perjalanan X hanya dalam lingkungan Z (titik awal & akhir). Pemahaman falsafah X = tunjang sains ALAMTOLOGI.

Falsafah berbalik manfaat dikongsi — bukan paksa pandangan individu/kelompok majoriti.
Bukan peranan X semata — peranan gabung XYZ. Nilai boleh dihitung → optimum; kapasiti X (individu/kelompok) dilaras Hukum Z; X pelaksana.
Kesilapan falsafah → impak besar sosial, ekonomi, keilmuan. Falsafah = benih pokok; tafsiran salah → buah pahit / pohon rapuh.

DILARANG: samakan Falsafah ALAMTOLOGI (sifat XYZ) dengan Falsafah Konvensional (lover of wisdom / relativisme Sophist) tanpa bezakan 1.4.1 vs 1.4.2;
ganti tiga sifat X (Akal, Nafsu, Emosi) dengan model psikologi Barat generik; abaikan Y makro / X·Z mikro.
`.trim();

/** 1.4.3 Pelaksanaan Falsafah ALAMTOLOGI — meterai P.alt (Bab 1 Asas Keilmuan). */
export const FALSAFAH_PELAKSANAAN_143 = `
[1.4.3 — PELAKSANAAN FALSAFAH ALAMTOLOGI — METERAI P.ALT]

Pegangan utama: "X adalah sifat yang tertakluk kepada hukum X dan Z."

Falsafah = sifat — permulaan & panduan mengenal, mempelajari, memahami, mengaplikasikan kehidupan X dalam ruang Z.
Falsafah teras setiap pengkajian & penelitian ilmu.

ALAMTOLOGI = sains yang mengkaji & melaksanakan HUKUM pada X dan Z.
TIDAK mengupas teori/pandangan ilmuwan individu atau teori yang dibangunkan X semata-mata.
Hukum memastikan pelaksanaan teratur & jelas kepada X. X wajib ikut hukum ALAMTOLOGI sepenuhnya — tanpa pengecualian.
Hukum ALAMTOLOGI tidak bertindih hukum konvensional. Segala dalam ruang Z kembali pada keseimbangan — permulaan pembangunan ilmu/sains ALAMTOLOGI.

Pelaksanaan: pengamatan/penelitian = kaitan langsung X–Z; permulaan saintifik & praktikal; tiada fakta tersembunyi.
Dilaksanakan X berpaksi hukum X & Z + penjelasan matematik; bebas emosi & tekanan pihak mana-mana.
Yang terlihat & tidak terlihat = sistem tersusun berpusat; aturan seimbang berbalik hukum XZ (contoh: siang/malam, pelangi selepas hujan — sistem Z teratur, wujud Pencipta).

Pembuktian saintifik: Z ada Pencipta — Z tidak terjadi sekadar letusan besar tiba-tiba; jawapan berasaskan bukti, bukan pandangan individu tanpa fakta.
Menolak perbezaan pendapat & ilmu BUKAN pendekatan ALAMTOLOGI.
Hanya pembuktian saintifik/sains mengembalikan tamadun & keharmonian — hukum yang membenarkan secara sedar alam semesta ada Pencipta; diterima semua pihak tanpa emosi/budaya.
Contoh: kenapa malam tidur siang berjaga — jawab fakta saintifik, bukan sekadar "fitrah" tanpa bukti.

Perdebatan tanpa bukti saintifik mengeruhkan kekeliruan. Paksaan/penerimaan tanpa hukum saintifik tidak terpakai dalam aturan alam — dibuktikan ALAMTOLOGI.
Sistem dari hukum alam berakhir keharmonian = matlamat akhir ALAMTOLOGI.
Pertelingkahan perkara tidak praktikal → bencana kemanusiaan — berbalik falsafah diterapkan diri & masyarakat.
Apa perlu: falsafah bertepatan XYZ supaya X tentukan peranannya — jawapan kecelaruan dunia.

DILARANG: jawab pelaksanaan falsafah tanpa hukum X & Z; ganti pembuktian saintifik dengan fitrah/emosi/budaya kosong; paksa pandangan tanpa fakta; abaikan keseimbangan Z.
`.trim();

/** 1.5 Metodologi ALAMTOLOGI — meterai P.alt (Bab 1 Asas Keilmuan). */
export const METODOLOGI_ALAMTOLOGI_15 = `
[1.5 — METODOLOGI ALAMTOLOGI — METERAI P.ALT]

Metodologi = aturan proses pengkajian ALAMTOLOGI — bermula perjalanan kehidupan pengasas; pemerhatian & pelaksanaan diterjemah ke disiplin ilmu.
Dua kaedah utama (mesti digabung — bukan salah satu sahaja):
• Kaedah Pemerhatian — melihat, membaca, memahami setiap proses/perkara di sekeliling
• Kaedah Lapangan — perlaksanaan atas apa difahami dari pemerhatian (berbeza kaedah lapangan konvensional)

Aliran: pemerhatian menyeluruh alam semesta → faham proses kejadian → aplikasi dalam kehidupan.
Pengkajian universal — semua dalam lingkungan alam semesta menjadi rujukan (bukan satu unsur sahaja).

Lima perkara WAJIB sebelum kajian (Gambar 1.15):
1. DEFINISI — apakah kajian yang ingin dilakukan
2. MATLAMAT — kepentingan dari semua sudut/posisi; bukan kepentingan tertentu sahaja
3. SUBJEK — perkara, unsur, planet dalam alam semesta termasuk manusia; seekor semut pun boleh jadi guru
4. PARAMETER — empat asas: POLA · KARAKTER · PROSES · KESEIMBANGAN
   • Pola — bukan bentuk fizikal sahaja; pola pemakanan, petumbuhan, pergerakan, dll.
   • Karakter — sifat & ciri subjek
   • Proses — aktif & pasif; kepentingan terhadap subjek & persekitaran
   • Keseimbangan — dalaman subjek atau subjek terhadap sekeliling
   • Keempat-empat parameter ambil kira faktor MASA & TENAGA (Teori MASABAYU)
5. APLIKASI — apakah aplikasi dapat dibina/dihasilkan daripada kajian

Hukum metodologi: setiap kajian & pembangunan hasilnya mesti harmoni; semua dalam lingkungan mendapat manfaat sama rata.

DILARANG: metodologi satu kaedah sahaja; langkau lima perkara; parameter tanpa pola/karakter/proses/keseimbangan; kajian tanpa masa & tenaga; aplikasi tanpa manfaat sejagat harmoni.
`.trim();

export function buildStrukturKeilmuanRecallBlock(): string {
  return [
    STRUKTUR_KEILMUAN_ALAMTOLOGI,
    ISTILAH_ALAMTOLOGI,
    TEORI_MASABAYU_ATURAN_KEILMUAN,
    FALSAFAH_KONVENSIONAL_141,
    FALSAFAH_ALAMTOLOGI_142,
    FALSAFAH_PELAKSANAAN_143,
    METODOLOGI_ALAMTOLOGI_15,
    FORMULA_XYZ_ALAMTOLOGI_16,
    ASAS_ILMU_ALAMTOLOGI_17,
    buildBab1PenutupRecallBlock(),
    buildPdfMeteraiRecallBlock(),
    ILMU_SOSIAL_ALAMTOLOGI,
    ILMU_SAINS_ALAMTOLOGI,
  ].join('\n\n');
}

/** Wrong XYZ redefinitions invented by the model (not P.alt). */
export const WRONG_XYZ_DEFINITION_OUTPUT: RegExp[] = [
  /\bX\b[^.\n]{0,120}\b(?:tuan|titik\s+mula\s+kehadiran)\b/i,
  /\bY\b[^.\n]{0,120}\b(?:hamba|pasangan\s+yang\s+menyaksikan)\b/i,
  /\bZ\b[^.\n]{0,120}\bmasa\s+sebagai\s+medium\b/i,
  /\bXYZ\b[^.\n]{0,160}\btiga\s+dimensi\s+kehadiran\b[^.\n]{0,200}\b(?:tuan|hamba)\b/i,
];

/** A+B=C blur in HISAL 7.1 overview (brain formula ≠ Pengenalan AIDIL). */
export const AIDIL_BRAIN_FORMULA_IN_OVERVIEW_OUTPUT: RegExp[] = [
  /\b7\.1\s+AIDIL\b[^.\n]{0,200}\b(?:a\s*\+\s*b\s*=\s*c|tajall[iī])\b/i,
  /\bAIDIL\b[^.\n]{0,120}\b(?:a\s*\+\s*b\s*=\s*c|tajall[iī])\b/i,
  /\bBab\s*7\b[^.\n]{0,400}\b7\.1\b[^.\n]{0,200}\b(?:a\s*\+\s*b\s*=\s*c|tajall[iī])\b/i,
];

export function detectWrongXyzDefinitionOutput(text: string): boolean {
  const body = text.replace(/^Bismillahirahmanirrahim\.?\s*/i, '').trim();
  if (!body) return false;
  return WRONG_XYZ_DEFINITION_OUTPUT.some((re) => re.test(body));
}

export function detectAidilBrainFormulaInOverviewOutput(text: string): boolean {
  const body = text.replace(/^Bismillahirahmanirrahim\.?\s*/i, '').trim();
  if (!body) return false;
  return AIDIL_BRAIN_FORMULA_IN_OVERVIEW_OUTPUT.some((re) => re.test(body));
}
