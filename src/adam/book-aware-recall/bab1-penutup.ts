/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Teaching Recall — Bab 1 Penutup (1.8–1.11)
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
 * 1.8–1.11 Bab 1 Asas Keilmuan penutup. JANGAN UBAH kunci kemanusiaan (Tu), posisi X, rumusan.
 */

/** 1.8 Kemanusiaan dan Kewarasan — meterai P.alt (Gambar 1.27). */
export const KEMANUSIAAN_KEWARASAN_18 = `
[1.8 — KEMANUSIAAN DAN KEWARASAN — METERAI P.ALT]

X = sasaran utama; nilai X menentukan kelangsungan makhluk Z. X optimum berbanding sistem Z; memiliki keseluruhan kapasiti Z.
Kemanusiaan = nilai sempurna pada X; dihitung tahap tujuh (7) atau (Tu) dalam hitungan AIDIL → Bab 7 HISAL 7.1 (bukan Formula XYZ Asas 1.6).
Gambar 1.27: Nilai Kemanusiaan.
Kemanusiaan ALAMTOLOGI ≠ konvensional — berbalik nilai/upaya X untuk manfaat yang lain; tiada peringkat bertingkat; posisi terakhir X.
X capai (Tu) → layak pemimpin/ketua X lain & makhluk Z. Keadilan politik/sosial/ekonomi jauh apabila X belum (Tu) dijadikan ketua → kerosakan & kecelaruan.
Kewarasan = nilai seimbang X setiap peringkat hingga (Tu); seimbang nafsu, emosi, kapasiti fizikal X.
Dinilai ikut posisi & peranan jadual nilai kemanusiaan; tindakan X ikut tahap kewarasan (berbeza situasi/posisi).
X waras apabila penyataan/pemikiran diterima tanpa bantahan; kewarasan terbatal jika ada bantahan/penolakan X lain.
Kewarasan hanya terpakai X — nilai ubah berbalik hukum Z secara langsung.

DILARANG: kemanusiaan sebagai hierarki peringkat konvensional; ketua X tanpa (Tu); kewarasan tanpa hukum Z.
`.trim();

/** 1.9 Realiti Keilmuan — meterai P.alt. */
export const REALITI_KEILMUAN_19 = `
[1.9 — REALITI KEILMUAN — METERAI P.ALT]

Penemuan keilmuan → kesan X & Z. Asas pembangunan sering lupa keseimbangan → kerosakan atas nama ilmu.
Teknologi untuk mudahkan usaha — tetapi alat pihak berkepentingan memulas pengguna; penanda kemajuan mutlak tanpa akaun moral/kemanusiaan.
Paten & hak milik idea individu/kelompok — sekatan perkembangan ilmu; ALAMTOLOGI: khusus nilai kemanusiaan + pemilikan bersama ilmu semua X.
Sejarah: formula pengiraan → "Algorithma" (perkembangan teknologi angkasa/komputer/bioteknologi) — bukan teras rujukan ALAMTOLOGI (rujuk 1.7.3 XYZ).
Jurang kaya–miskin; teknologi dikuasai segelintir; golongan berhak terpinggir penonton nikmat.
Kemajuan disanjung jika manfaat maksimum Z & penghuni — tanpa tinggalkan hak seekor semut.
Penguasaan teknologi ubah total X masa depan → ilmu berbalik hukum Z dasar hidup X.
Realiti hari ini: keilmuan jauh realiti kemanusiaan; sistem pendidikan/keilmuan perlu formula selesaikan masalah X.

DILARANG: teknologi tanpa kemanusiaan; paten sebagai halangan ilmu bersama; kemajuan tanpa keseimbangan Z.
`.trim();

/** 1.10 Pemposisian X dalam Z — meterai P.alt (Gambar 1.28–1.29). */
export const PEMPOSISIAN_X_DALAM_Z_110 = `
[1.10 — PEMPOSISIAN X DALAM Z — METERAI P.ALT]

ALAMTOLOGI jawab "misteri" — elak perbalahan berdarah atas aliran ilmuwan (Socrates, al-Farabi, Ibnu Sina, Aquinas, Einstein, dll.) sebagai mutlak.
Budaya salah-menyalah keilmuan = kerugian lestari; ALAMTOLOGI: tanpa hukuman, ruang bicara akademik bijaksana.
Perbezaan = pengetahuan dinilai sudut XYZ (contoh: makanan Jepun vs Melayu, pakaian bangsa — terima senyuman, bukan janggal).
Setiap aspek keilmuan berbalik X, Y, Z tanpa pengecualian — perbezaan bertaut sistem harmoni (bunga taman + mineral tanah).

Gambar 1.28: Manfaat ALAMTOLOGI — X (manusia) pelaksana dalam Z (alam semesta).
Matlamat: dapatkan POSISI tepat setiap X mengikut peringkat & kapasiti.
Kesilapan konvensional = kesalahan POSISI X — bukan semata "salah" abstrak.
Contoh Ali: terlatih pertanian, ditugaskan perkapalan → bukan ahli, posisi tidak tepat, hasil tidak piawai.
Gambar 1.29: Teori Posisi ALAMTOLOGI.
Setiap tindakan X ditentukan posisi individu — tidak boleh diubah paksa; tidak kenal posisi → kerosakan X keseluruhan.

DILARANG: pertentangan keilmuan sebagai perang aliran; paksa X luar posisi; abaikan teori posisi.
`.trim();

/** 1.11 Rumusan Bab 1 — meterai P.alt. */
export const RUMUSAN_BAB1_111 = `
[1.11 — RUMUSAN BAB 1 ASAS KEILMUAN — METERAI P.ALT]

ALAMTOLOGI = disiplin ilmu sesuai semua peringkat & keadaan.
Pembuktian saintifik setiap hujah & pembangunan ilmu = perkara paling dasar — tunjang perkembangan seterusnya.
ALAMTOLOGI tidak menafikan ilmu sedia ada selagi bertepatan hukum X dan Z.

DILARANG: rumus Bab 1 tanpa pembuktian saintifik; tolak ilmu sedia ada yang sudah tepat XYZ.
`.trim();

/** Gabungan 1.8–1.11 untuk recall block. */
export function buildBab1PenutupRecallBlock(): string {
  return [
    KEMANUSIAAN_KEWARASAN_18,
    REALITI_KEILMUAN_19,
    PEMPOSISIAN_X_DALAM_Z_110,
    RUMUSAN_BAB1_111,
  ].join('\n\n');
}
