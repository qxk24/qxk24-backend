/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Book-Aware Teaching Recall — Chapter Probes
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
 */

import { FORMULA_XYZ_BOOK_ID } from '../../llm-pipeline/formula-xyz-syllabus';
import { TEORI_ALAMIN_BOOK_ID } from './bab8-teori-alamin/syllabus';
import type { AlamtologiBookId } from './types';

export interface ChapterProbe {
  chapterId:      string;
  chapterTitleBm: string;
  searchTerms:    string[];
  patterns:       RegExp[];
}

export const TEORI_ALAMIN_PROBES: ChapterProbe[] = [
  {
    chapterId:      'alamin-overview',
    chapterTitleBm: 'Bab 8 — Teori ALAMIN (gambaran keseluruhan)',
    searchTerms:    [
      'teori alamin', 'bab 8 alamin', 'komunikasi alamtologi alamin',
      'ilmu komunikasi alamtologi', 'sains komunikasi alamtologi', 'alamin',
      'silibus alamin', 'disiplin alamin', 'apa itu alamin', 'disiplin baru alamtologi',
    ],
    patterns:       [
      /\bteori\s+alamin\b/i,
      /\bbab\s*(?:8|lapan)\b/i,
      /\bkomunikasi\s+alamtologi\s+alamin\b/i,
      /\bilmu\s+komunikasi\s+alamtologi\b/i,
      /\bsains\s+komunikasi\s+alamtologi\b/i,
      /\bdisiplin\s+(?:baru\s+)?(?:berdasarkan\s+alamtologi|alamtologi|alamin)\b/i,
      /\balamin\b[^.\n]{0,48}\bdisiplin\s+baru\b/i,
      /^(?:apa\s+itu\s+)?alamin\s*\??$/i,
      /\bapa\s+itu\s+alamin\b/i,
    ],
  },
  {
    chapterId:      'alamin-prolog',
    chapterTitleBm: 'Prolog ALAMIN — Komunikasi Alamtologi ALAMIN',
    searchTerms:    [
      'prolog alamin', 'pengenalan buku alamin', 'pembuka alamin',
      'perjalanan pendidikan alamin', 'aminullah prolog', 'stai al-aziziyah',
      'pesantren mudi prolog', 'icns alamtologi', 'masa bayu alamin',
      'gambar rajah 1 alamin', 'interaksi manusia dengan air',
      'pencapaian menemukan alamin', 'musafir alam', 'pakar alamtologi aminullah',
    ],
    patterns:       [
      /\bpencapaian\b[^.\n]{0,48}\bmenemukan\s+ALAMIN\b/i,
      /\bMUSAFIR\s+ALAM\b/i,
      /\bX\+Z\s*\(Y\)/i,
      /\bKomunikasi\s+ALAMTOLOGI\s*:\s*ALAMIN\b/i,
      /\bmenekuni\s+belajar\s+alamtologi\b/i,
      /\bGambar\s+rajah\s+1\b[^.\n]{0,48}\b(?:pengetahuan|ilmu)\b/i,
      /\bInteraksi\s+Manusia\s+Dengan\s+Air\b/i,
      /\bPTPO\b|\bFraser\s+Hill\b/i,
      /\bpermulaan\s+berjumpa\b[^.\n]{0,48}\bpengasas\s+alamtologi\b/i,
      /\bICNS[\s-]*ALAMTOLOGI\b/i,
      /\bMasa\s+Bayu\b/i,
      /\b1\s+Januari\s+2014\b/i,
      /\b25\s+Disember\s+2013\b/i,
      /\bperjalanan\s+pendidikan\b[^.\n]{0,64}\b(?:pesantren|perguruan\s+tinggi|remaja|alamin)\b/i,
      /\bSTAI\s+Al-Aziziyah\b/i,
      /\bkonsep\s+lama.*gaya\s+baru\b/i,
      /\bprolog\s+alamin\b/i,
      /\balamin\b[^.\n]{0,40}\bprolog\b/i,
      /\bprolog\b[^.\n]{0,40}\b(?:komunikasi\s+alamtologi\s+)?alamin\b/i,
    ],
  },
  {
    chapterId:      'alamin-bab-1',
    chapterTitleBm: 'ALAMIN Bab 1 — Ilmu Komunikasi Alamtologi',
    searchTerms:    [
      'dasar pemikiran alamin', 'pengenalan alamin', 'asas alamin', 'definisi alamin',
      'gHp gCp alamin', 'frekuensi media alamin', 'alamin bab 1', 'bab 1 alamin', 'alamin',
    ],
    patterns:       [
      /\bilmu\s+komunikasi\s+alamtologi\b/i,
      /\bdefinisi\s+alamin\b/i,
      /\bgambar\s+rajah\s+1\.[3-7]\b/i,
      /\bALAM\s*\+\s*AMIN\b/i,
      /\bgambar\s+rajah\s+1\.[45]\b[^.\n]{0,80}\b(?:gHp|gCp)\b/i,
      /\b(?:gHp|gCp)\b[^.\n]{0,80}\bgambar\s+rajah\s+1\.[45]\b/i,
      /\b(?:gHp|gCp)\b[^.\n]{0,48}\b(?:definisi|frekuensi)\b/i,
      /\b7\s+proses\s+interaksi\b/i,
      /\bgambar\s+rajah\s+1\.1\b/i,
      /\balamin\b[^.\n]{0,48}\bdasar\s+pemikiran\b/i,
      /\bdasar\s+pemikiran\b[^.\n]{0,48}\balamin\b/i,
      /\bpengenalan\s+alamin\b/i,
      /\basas\s+alamin\b/i,
      /\balamin\b[^.\n]{0,40}\bbab\s*(?:1|satu)\b/i,
      /\bbab\s*(?:1|satu)\b[^.\n]{0,40}\balamin\b/i,
    ],
  },
  {
    chapterId:      'alamin-bab-2',
    chapterTitleBm: 'ALAMIN Bab 2 — Hukum Alamtologi dalam Kajian ALAMIN',
    searchTerms:    [
      'faktor pola alamin', 'faktor kadar alamin', 'pesa pedu pega',
      'pepa pema pena petu', 'alamin bab 2', 'ruang posisi masa alamin',
      'hukum alamtologi dalam kajian alamin', 'proses pelaksanaan hukum',
      'gambar rajah 2.1 alamin', 'gambar rajah 2.5', 'faktor pola komunikasi',
      'XZ gHp', 'ruang hukum', 'pola aktif pasif alamin',
      'pola peringkat sa', 'pola peringkat du', 'pandangan sisi k24', 'psk alamin',
      'gambar rajah 2.6 pesa', 'gambar rajah 2.8 pedu', 'gambar rajah 2.10 pega',
      'kenapa why alamin', 'siapa who alamin', 'kapan when alamin', 'di mana where alamin',
      'gambar rajah 2.12 pepa', 'gambar rajah 2.14 pema', 'gambar rajah 2.16 pena',
      'bagaimana how alamin', '1h alamin',       '5w+1h=1a', 'petu alamin', 'gambar rajah 2.18',
      'ketentuan kadar alamin', 'kxmt kzmt', 'gambar rajah 2.21',
      'kadar ruang alamin', 'batas ruang isi ruang', 'gambar rajah 2.22',
      'batas ruang alamin', 'rbp+ rbp-', 'gambar rajah 2.23', 'gambar rajah 2.26',
      'kzrbp', 'formula batas ruang alamin',
      'isi ruang alamin', 'rip+ rip-', 'gambar rajah 2.27', 'gambar rajah 2.29',
      'kzri rb', 'formula isi ruang alamin', 'gangguan hambatan komunikasi alamin',
      'kadar posisi alamin', 'nukleus pelengkap nukleus', 'gambar rajah 2.30',
      'gambar rajah 2.32', 'gambar rajah 2.33', 'xp nu np alamin', 'hukum x alamin posisi',
      'nukleus napadu alamin', 'gambar rajah 2.34', 'gambar rajah 2.35', 'gambar rajah 2.36',
      'kznunu alamin', 'posisi nukleus komunikator',
      'pelengkap nukleus alamin', 'gambar rajah 2.37', 'kzpnp alamin',
      'komunikan pelengkap nukleus',
      'kadar masa alamin', 'masa pengawal mp', 'masa dikawal mdk', 'gambar rajah 2.38',
      'gambar rajah 2.39', 'formula masa mp alamin', 'xk zk mdk alamin',
      'masa dikawal mdk alamin', 'gambar rajah 2.40', 'xkt zkt nu np alamin',
      'setiap orang ada masanya alamin',
      'kadar tenaga alamin', 'tenaga tambah alamin', 'gambar rajah 2.42', 'gambar rajah 2.43',
      'xk nu zk np tenaga tambah',
      'faktor pasangan alamin', 'gambar rajah 2.46', 'x(z) gabung lerai alamin',
      'pasangan lerai gabung alamin', 'lasa proses lerai alamin',
      'mula dan tamat alamin', 'titik mula titik tamat', 'gambar rajah 2.47',
      'gambar rajah 2.52', 'tmi tti alamin', 'tm tt pasangan',
      'gerakan asas lanjutan alamin', 'gerakan tamat alamin', 'gambar rajah 2.53',
      'ga gl gt alamin', 'gambar rajah 2.55', 'gambar rajah 2.56',
      'persamaan alamin', 'gambar rajah 2.57', 'gambar rajah 2.58',
      'gabung busa lerai persamaan', 'kertas putih komunikan',
      'faktor keseimbangan alamin', 'gambar rajah 2.61', 'gambar rajah 2.62',
      'ghp gcp keseimbangan alamin', 'keperluan kapasiti keseimbangan',
      'keseimbangan keperluan alamin', 'gambar rajah 2.63', 'gambar rajah 2.64',
      'keperluan makro mikro alamin', 'komunikasi keinginan keperluan',
      'keseimbangan kapasiti alamin', 'gambar rajah 2.65', 'gambar rajah 2.66',
      'gambar rajah 2.67', 'xy xz kontribusi kapasiti', 'peringkat kapasiti alamin',
    ],
    patterns:       [
      /\bgambar\s+rajah\s+2\.6[1-7]\b/i,
      /\bketentuan\s+kadar\b[^.\n]{0,48}\b(?:alamin|hukum\s+z)\b/i,
      /\bKXMt\b|\bKZMt\b/i,
      /\bgambar\s+rajah\s+2\.21\b/i,
      /\bkadar\s+ruang\b[^.\n]{0,48}\balamin\b/i,
      /\b(?:batas|isi)\s+ruang\b[^.\n]{0,48}\balamin\b/i,
      /\bRb\d?\b.*\bRi\d?\b|\bKr\d?\b/i,
      /\bgambar\s+rajah\s+2\.22\b/i,
      /\bbatas\s+ruang\b[^.\n]{0,48}\b(?:alamin|unsur\s+z|rbp)/i,
      /\bRbP[+-]\b|\bKZRbP[+-]?mt\b/i,
      /\bgambar\s+rajah\s+2\.2[3-6]\b[^.\n]{0,64}\b(?:alamin|batas|isi|ruang|rb)\b/i,
      /\b(?:batas\s+ruang|rbp)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.2[3-6]\b/i,
      /\bisi\s+ruang\b[^.\n]{0,48}\b(?:alamin|unsur\s+z|rip)/i,
      /\bRiP[+-]\b|\bKZRi\s*\(\s*Rb\s*\)\s*P[+-]?mt\b/i,
      /\bgambar\s+rajah\s+2\.2[789]\b[^.\n]{0,64}\b(?:alamin|isi|ruang|ri)\b/i,
      /\b(?:isi\s+ruang|rip)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.2[789]\b/i,
      /\bkadar\s+posisi\b[^.\n]{0,48}\balamin\b/i,
      /\b(?:nukleus|pelengkap\s+nukleus)\b[^.\n]{0,48}\balamin\b/i,
      /\bXP\s*→\s*N[up]\s*mt\b|\bXP\s+N[up]\b/i,
      /\bgambar\s+rajah\s+2\.3[0-3]\b[^.\n]{0,64}\b(?:alamin|posisi|nukleus|hukum\s+x)\b/i,
      /\b(?:posisi|nukleus|nu|np)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.3[0-6]\b/i,
      /\bNAPADU\b[^.\n]{0,48}\b(?:alamin|nukleus|2\.34)\b/i,
      /\bP\/KzNu\s*\(\s*[+-]\s*\)/i,
      /\bgambar\s+rajah\s+2\.3[4-6]\b[^.\n]{0,64}\b(?:alamin|nukleus|napadu|alpukat)\b/i,
      /\b(?:nukleus|napadu)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.3[4-6]\b/i,
      /\bpelengkap\s+nukleus\b[^.\n]{0,48}\b(?:alamin|komunikan|np)/i,
      /\bP\/KzNp\s*\(\s*[+-]\s*\)/i,
      /\bgambar\s+rajah\s+2\.37\b[^.\n]{0,64}\b(?:alamin|pelengkap|np)\b/i,
      /\b(?:pelengkap\s+nukleus|np)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.37\b/i,
      /\bkadar\s+masa\b[^.\n]{0,48}\balamin\b/i,
      /\b(?:MP|MDK)\b[^.\n]{0,48}\b(?:alamin|masa)/i,
      /\bmasa\s+(?:pengawal|dikawal)\b[^.\n]{0,48}\balamin\b/i,
      /\bgambar\s+rajah\s+2\.38\b[^.\n]{0,64}\b(?:alamin|masa|kadar)/i,
      /\b(?:masa|kadar\s+masa)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.38\b/i,
      /\bmasa\s+pengawal\b[^.\n]{0,48}\b(?:alamin|mp|2\.39)/i,
      /\bNu\s*→\s*Mt\b|\bNp\s*→\s*Mt\b/i,
      /\bgambar\s+rajah\s+2\.39\b[^.\n]{0,64}\b(?:alamin|mp|masa)/i,
      /\b(?:mp|masa\s+pengawal)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.39\b/i,
      /\bmasa\s+dikawal\b[^.\n]{0,48}\b(?:alamin|mdk|2\.40)/i,
      /\bXkt\s*→\s*N[up]\b|\bZkt\s*→\s*N[up]\b/i,
      /\bgambar\s+rajah\s+2\.40\b[^.\n]{0,64}\b(?:alamin|mdk|masa)/i,
      /\b(?:mdk|masa\s+dikawal)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.40\b/i,
      /\bkadar\s+tenaga\b[^.\n]{0,48}\balamin\b/i,
      /\btenaga\s+tambah\b[^.\n]{0,48}\b(?:alamin|pecahan|2\.42)/i,
      /\bXk\.Nu\s*–\s*Zk\.Nu\b|\bXk\.Np\s*–\s*Zk\.Np\b/i,
      /\bgambar\s+rajah\s+2\.4[23]\b[^.\n]{0,64}\b(?:alamin|tenaga|tambah)/i,
      /\b(?:tenaga\s+tambah|tambah\s+tenaga)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.4[23]\b/i,
      /\bfaktor\s+pasangan\b[^.\n]{0,48}\balamin\b/i,
      /\bpasangan\s+(?:lerai|gabung)\b[^.\n]{0,48}\balamin\b/i,
      /\bX\s*\(\s*Z\s*\)|Z\s*&\s*X\b/i,
      /\bgambar\s+rajah\s+2\.46\b[^.\n]{0,64}\b(?:alamin|pasangan|lerai|gabung)/i,
      /\b(?:pasangan|lerai|gabung)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.46\b/i,
      /\bmula\s+dan\s+tamat\b[^.\n]{0,48}\b(?:alamin|pasangan|2\.47)/i,
      /\btitik\s+mula\b[^.\n]{0,48}\b(?:titik\s+tamat|tamat).*alamin/i,
      /\bTMI\b|\bTTI\b|\bTm\b.*\bTt\b/i,
      /\bgambar\s+rajah\s+2\.5[0-2]\b[^.\n]{0,64}\b(?:alamin|mula|tamat|interaksi)/i,
      /\bgambar\s+rajah\s+2\.4[7-9]\b[^.\n]{0,64}\b(?:alamin|mula|tamat|peringkat)/i,
      /\b(?:mula|tamat|tmi)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.5[0-2]\b/i,
      /\bgerakan\s+(?:asas|lanjutan|tamat)\b[^.\n]{0,48}\b(?:alamin|pasangan|2\.53)/i,
      /\b(?:Ga|Gl|Gt)\b[^.\n]{0,48}\b(?:alamin|pasangan|gerakan)/i,
      /\bgambar\s+rajah\s+2\.5[3-6]\b[^.\n]{0,64}\b(?:alamin|gerakan|pasangan)/i,
      /\b(?:gerakan|ga|gl|gt)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.5[3-6]\b/i,
      /\bpersamaan\b[^.\n]{0,48}\b(?:alamin|pasangan|2\.57|gabung|lerai)/i,
      /\bgambar\s+rajah\s+2\.5[7-8]\b[^.\n]{0,64}\b(?:alamin|persamaan|gabung|lerai)/i,
      /\b(?:gabung|busa|lerai|lasa)\b[^.\n]{0,48}\b(?:persamaan|2\.57|2\.58).*alamin/i,
      /\bkertas\s+putih\b[^.\n]{0,64}\b(?:alamin|komunikan|komunikator|persamaan)/i,
      /\bfaktor\s+keseimbangan\b[^.\n]{0,48}\balamin\b/i,
      /\bkeseimbangan\b[^.\n]{0,48}\b(?:alamin|ghp|gcp|2\.61|2\.62)/i,
      /\bgambar\s+rajah\s+2\.6[12]\b[^.\n]{0,64}\b(?:alamin|keseimbangan|ghp|gcp|seimbang)/i,
      /\b(?:ghp|gcp)\b[^.\n]{0,48}\b(?:keseimbangan|2\.61|2\.62|faktor\s+seimbang|tidak\s+seimbang)/i,
      /\b(?:seimbang|tidak\s+seimbang)\b[^.\n]{0,48}\b(?:alamin|keseimbangan|faktor)/i,
      /\bkeperluan\b[^.\n]{0,48}\b(?:alamin|keseimbangan|2\.63|2\.64|makro|mikro)/i,
      /\bgambar\s+rajah\s+2\.6[34]\b[^.\n]{0,64}\b(?:alamin|keperluan|keseimbangan)/i,
      /\b(?:makro|mikro)\b[^.\n]{0,48}\b(?:keperluan|keseimbangan).*alamin/i,
      /\bkomunikasi\s+(?:keinginan|keperluan)\b[^.\n]{0,48}\balamin/i,
      /\bkapasiti\b[^.\n]{0,48}\b(?:alamin|keseimbangan|2\.65|2\.66|kontribusi)/i,
      /\bgambar\s+rajah\s+2\.6[567]\b[^.\n]{0,64}\b(?:alamin|kapasiti|kontribusi|xy|xz)/i,
      /\b(?:Xy|Xz)\s*1\s*→\s*7\b|\bperingkat\s+kapasiti\b[^.\n]{0,48}\balamin/i,
      /\b\+Z\b[^.\n]{0,48}\b(?:m\/t|ghp|kapasiti).*alamin/i,
      /\bpola\s+peringkat\s+(?:sa|du|ga|pa|ma|na|tu)\b/i,
      /\b5w\s*\+\s*1h\s*=\s*1a\b/i,
      /\b1a\b[^.\n]{0,48}\b(?:alamin|petu|pe\s*tu|pencapaian)/i,
      /\bgambar\s+rajah\s+2\.(?:18|19|20)\b[^.\n]{0,64}\b(?:petu|pe\s*tu|1a|alamin)\b/i,
      /\b(?:petu|pe\s*tu)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.(?:18|19|20)\b/i,
      /\b1h\b[^.\n]{0,48}\b(?:alamin|pena|pe\s*na|5w)/i,
      /\bgambar\s+rajah\s+2\.1[67]\b[^.\n]{0,64}\b(?:pena|pe\s*na|psk|alamin|bagaimana)\b/i,
      /\b(?:pena|pe\s*na|bagaimana)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.1[67]\b/i,
      /\bgambar\s+rajah\s+2\.1[45]\b[^.\n]{0,64}\b(?:pema|pe\s*ma|psk|alamin|di\s+mana)\b/i,
      /\b(?:pema|pe\s*ma|di\s+mana)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.1[45]\b/i,
      /\bgambar\s+rajah\s+2\.1[23]\b[^.\n]{0,64}\b(?:pepa|pe\s*pa|psk|alamin|kapan)\b/i,
      /\b(?:pepa|pe\s*pa|kapan)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.1[23]\b/i,
      /\bgambar\s+rajah\s+2\.1[01]\b[^.\n]{0,64}\b(?:pega|pe\s*ga|psk|alamin|siapa)\b/i,
      /\b(?:pega|pe\s*ga|siapa)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.1[01]\b/i,
      /\b1\s*→\s*0⁴|\b1\s*→\s*04\b/i,
      /\bgambar\s+rajah\s+2\.[89]\b[^.\n]{0,64}\b(?:pedu|pe\s*du|psk|alamin|kenapa)\b/i,
      /\b(?:pedu|pe\s*du|kenapa)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.[89]\b/i,
      /\bpandangan\s+sisi\s+k24\b|\bpsk\b[^.\n]{0,32}\b(?:alamin|pesa|pe\s*sa)\b/i,
      /\bgambar\s+rajah\s+2\.[67]\b[^.\n]{0,64}\b(?:pesa|pe\s*sa|psk|alamin)\b/i,
      /\b(?:pesa|pe\s*sa)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.[67]\b/i,
      /\bfaktor\s+pola\s+alamin\b/i,
      /\bpola\s+(?:aktif|pasif)\b[^.\n]{0,48}\balamin\b/i,
      /\b5w\+1h\b/i,
      /\bnilai\s+tujuh\b[^.\n]{0,48}\b(?:alamin|peringkat|pola)\b/i,
      /\bgambar\s+rajah\s+2\.5\b/i,
      /\bfaktor\s+kadar\s+alamin\b/i,
      /\bpe(?:sa|du|ga|pa|ma|na|tu)\b/i,
      /\balamin\b[^.\n]{0,40}\bbab\s*(?:2|dua)\b/i,
      /\bbab\s*(?:2|dua)\b[^.\n]{0,40}\b(?:pola|kadar|hukum)\s+alamin\b/i,
      /\bhukum\s+alamtologi\b[^.\n]{0,48}\b(?:dalam\s+)?kajian\s+alamin\b/i,
      /\bhukum\s+alamtologi\b[^.\n]{0,48}\balamin\b/i,
      /\bproses\s+pelaksanaan\s+hukum\b/i,
      /\bruang\s+hukum\b/i,
      /\bXZ\s*[\+\-]\s*g(?:Hp|Cp)\b/i,
      /\bX\s*[\+\-]\s*g(?:Hp|Cp)\b[^.\n]{0,48}\balamin\b/i,
      /\bgambar\s+rajah\s+2\.[1-4]\b[^.\n]{0,64}\b(?:alamin|pelaksanaan\s+hukum|komunikasi|hukum\s+z)\b/i,
      /\b(?:alamin|pelaksanaan\s+hukum|komunikasi)\b[^.\n]{0,64}\bgambar\s+rajah\s+2\.[1-4]\b/i,
      /\bhukum\s+komunikasi\b[^.\n]{0,48}\balamin\b/i,
    ],
  },
  {
    chapterId:      'alamin-bab-3',
    chapterTitleBm: 'ALAMIN Bab 3 — Falsafah ALAMIN',
    searchTerms:    [
      'falsafah alamin', 'ontologi alamin', 'epistemologi alamin',
      'aksiologi alamin', 'alamin bab 3',
    ],
    patterns:       [
      /\bfalsafah\s+alamin\b/i,
      /\bontologi\b[^.\n]{0,48}\balamin\b/i,
      /\bepistemologi\b[^.\n]{0,48}\balamin\b/i,
      /\balamin\b[^.\n]{0,40}\bbab\s*(?:3|tiga)\b/i,
      /\bbab\s*(?:3|tiga)\b[^.\n]{0,40}\bfalsafah\s+alamin\b/i,
    ],
  },
  {
    chapterId:      'alamin-bab-4',
    chapterTitleBm: 'ALAMIN Bab 4 — Formula ALAMIN',
    searchTerms:    [
      'formula alamin', 'hukum formula alamin', 'isyarah signal alamin',
      'alamin bab 4', 'perumusan x alamin',
    ],
    patterns:       [
      /\bformula\s+alamin\b/i,
      /\bhukum\s+formula\s+alamin\b/i,
      /\balamin\b[^.\n]{0,40}\bbab\s*(?:4|empat)\b/i,
      /\bbab\s*(?:4|empat)\b[^.\n]{0,40}\bformula\s+alamin\b/i,
    ],
  },
];

export const FORMULA_XYZ_PROBES: ChapterProbe[] = [
  {
    chapterId:      'bab-1-asas',
    chapterTitleBm: 'Bab 1 — Asas Keilmuan',
    searchTerms:    [
      'asas keilmuan', 'teori masabayu', 'formula xyz bab 1',
      'epistemologi alamtologi', 'bahasa melayu berfikir', 'keilmuan alamtologi',
      'bab 1 asas', 'ilmu hadir', 'kehadiran berqiraah',
    ],
    patterns:       [
      /\basas\s+keilmuan\b/i,
      /\bteori\s+masabayu\b/i,
      /\bformula\s+xyz\b[^.\n]{0,40}\bbab\s*(?:1|satu)\b/i,
      /\bbab\s*(?:1|satu)\b[^.\n]{0,40}\basas\s+keilmuan\b/i,
    ],
  },
  {
    chapterId:      'bab-2-faktor-xyz',
    chapterTitleBm: 'Bab 2 — Faktor XYZ',
    searchTerms:    [
      'faktor xyz', 'faktor x y z', 'ketetapan y', 'formula xyz bab 2',
      'faktor x', 'faktor y', 'faktor z', 'pelaku x', 'pencipta y',
    ],
    patterns:       [
      /\bfaktor\s*xyz\b/i,
      /\bfaktor\s*\(\s*x\s*,?\s*y\s*,?\s*z\s*\)/i,
      /\bformula\s+xyz\b[^.\n]{0,40}\bbab\s*(?:2|dua)\b/i,
      /\bbab\s*(?:2|dua)\b[^.\n]{0,40}\bfaktor\b/i,
      /\bketetapan\s+y\b/i,
    ],
  },
  {
    chapterId:      'bab-3-hukum',
    chapterTitleBm: 'Bab 3 — Hukum Alamtologi',
    searchTerms:    [
      'hukum alamtologi', 'hukum z', 'hukum x', 'hukum peleraian',
      'pola kadar pasangan keseimbangan', 'formula xyz bab 3',
      'empat hukum alam', 'empat hukum manusia', 'bab 3 hukum',
    ],
    patterns:       [
      /\bhukum\s+alamtologi\b/i,
      /\bhukum\s+z\b/i,
      /\bhukum\s+x\b/i,
      /\bhukum\s+peleraian\b/i,
      /\bempat\s+hukum\s+alam\b/i,
      /\bempat\s+hukum\s+manusia\b/i,
      /\bformula\s+xyz\b[^.\n]{0,40}\bbab\s*(?:3|tiga)\b/i,
      /\bbab\s*(?:3|tiga)\b[^.\n]{0,40}\bhukum\b/i,
    ],
  },
  {
    chapterId:      'bab-4-sains',
    chapterTitleBm: 'Bab 4 — Sains Alamtologi',
    searchTerms:    [
      'sains alamtologi', 'izwa', 'sira', 'rina', 'formula xyz bab 4',
      'kerangka hisal sains', 'hisal izwa sira rina', 'bab 4 sains',
    ],
    patterns:       [
      /\bsains\s+alamtologi\b/i,
      /\b(?:izwa|sira|rina)\b/i,
      /\bformula\s+xyz\b[^.\n]{0,40}\bbab\s*(?:4|empat)\b/i,
      /\bbab\s*(?:4|empat)\b[^.\n]{0,40}\bsains\b/i,
      /\bhisal\s*,\s*izwa\b/i,
      /\b(?:izwa|sira|rina)\b[^.\n]{0,48}\bsains\b/i,
    ],
  },
  {
    chapterId:      'bab-5-masa',
    chapterTitleBm: 'Bab 5 — Faktor Masa',
    searchTerms:    [
      'faktor masa', 'napadu', 'ruang masa', 'formula xyz bab 5',
      'bekas pada masa', 'bab 5 masa', 'z masa dominan',
    ],
    patterns:       [
      /\bfaktor\s+masa\b/i,
      /\bnapadu\b/i,
      /\bbekas\s+pada\s+masa\b/i,
      /\bformula\s+xyz\b[^.\n]{0,40}\bbab\s*(?:5|lima)\b/i,
      /\bbab\s*(?:5|lima)\b[^.\n]{0,40}\bmasa\b/i,
    ],
  },
  {
    chapterId:      'bab-6-tenaga',
    chapterTitleBm: 'Bab 6 — Faktor Tenaga',
    searchTerms:    [
      'faktor tenaga', 'pasata', 'dna uid tenaga', 'formula xyz bab 6',
      'uid tenaga', 'x masa tenaga', 'bab 6 tenaga', 'pelaksanaan tenaga',
    ],
    patterns:       [
      /\bfaktor\s+tenaga\b/i,
      /\bpasata\b/i,
      /\buid\s+tenaga\b/i,
      /\bformula\s+xyz\b[^.\n]{0,40}\bbab\s*(?:6|enam)\b/i,
      /\bbab\s*(?:6|enam)\b[^.\n]{0,40}\btenaga\b/i,
      /\bx\s*\[\s*m\s*,\s*t/i,
    ],
  },
];

export const HISAL_MAIN_PROBE: ChapterProbe = {
  chapterId:      'hisal-chapter-7',
  chapterTitleBm: 'Bab 7 — HISAL',
  searchTerms:    ['hisal', 'bab 7 hisal', 'sains alamtologi bab 7', '7.1 7.2 7.3 7.4'],
  patterns:       [
    /\b(?:apa\s+itu|terangkan|jelaskan)\s+hisal\b/i,
    /\bbab\s*(?:7|tujuh)\b/i,
    /\bchapter\s*(?:7|seven)\b/i,
  ],
};

const HISAL_AIDIL_PROBES: ChapterProbe[] = [
  {
    chapterId:      'aidil-bab-1',
    chapterTitleBm: 'Bab 1 — Pengenalan AIDIL (Pola & Proses)',
    searchTerms:    [
      'hisal aidil', 'pengenalan aidil', 'pengenalan pola proses',
      'hisal aidil bab 1', 'apa itu aidil',
    ],
    patterns:       [
      /\bpengenalan\s+pola\b/i,
      /\bpengenalan\s+aidil\b/i,
      /\bisi\s+kandungan\s+aidil\b/i,
      /\b(?:apa\s+itu|terangkan|jelaskan)\s+aidil\b/i,
      /^(?:apa\s+itu\s+)?aidil\s*\??$/i,
    ],
  },
  {
    chapterId:      'aidil-bab-2',
    chapterTitleBm: 'HISAL AIDIL · Bab 2 — Ganda Pa / Penetapan',
    searchTerms:    ['aidil ganda pa', 'aidil penetapan', 'aidil bab 2'],
    patterns:       [
      /\baidil\b[^.\n]{0,48}\bganda\s+pa\b/i,
      /\bganda\s+pa\b[^.\n]{0,48}\baidil\b/i,
      /\baidil\b[^.\n]{0,48}\bpenetapan\b/i,
    ],
  },
  {
    chapterId:      'aidil-bab-3',
    chapterTitleBm: 'HISAL AIDIL · Bab 3 — Cara Kira AIDIL',
    searchTerms:    ['cara kira aidil', 'aidil 9 10 15 16', 'aidil bab 3'],
    patterns:       [/\bcara\s+kira\s+aidil\b/i, /\baidil\s*(?:9|10|15|16)\b/i],
  },
  {
    chapterId:      'aidil-bab-4',
    chapterTitleBm: 'HISAL AIDIL · Bab 4 — Nombor 20',
    searchTerms:    ['hisal aidil nombor 20', 'aidil bab 4 nombor 20'],
    patterns:       [
      /\bhisal[\s-]*aidil\b[^.\n]{0,64}\bnombor\s+20\b/i,
      /\bbahagian\s+aidil\b[^.\n]{0,64}\bnombor\s+20\b/i,
      /\bnombor\s+20\b[^.\n]{0,64}\b(?:hisal[\s-]*aidil|bahagian\s+aidil)\b/i,
      /\baidil\b[^.\n]{0,48}\bbab\s*(?:4|empat)\b[^.\n]{0,48}\bnombor\s+20\b/i,
    ],
  },
  {
    chapterId:      'aidil-bab-5',
    chapterTitleBm: 'HISAL AIDIL · Bab 5 — Nombor 24(1)',
    searchTerms:    ['hisal aidil nombor 24', 'aidil bab 5 nombor 24'],
    patterns:       [
      /\bhisal[\s-]*aidil\b[^.\n]{0,64}\bnombor\s+24\b/i,
      /\bbahagian\s+aidil\b[^.\n]{0,64}\bnombor\s+24\b/i,
      /\bnombor\s+24\b[^.\n]{0,64}\b(?:hisal[\s-]*aidil|bahagian\s+aidil)\b/i,
      /\baidil\b[^.\n]{0,48}\bbab\s*(?:5|lima)\b[^.\n]{0,48}\bnombor\s+24\b/i,
    ],
  },
  {
    chapterId:      'aidil-bab-7',
    chapterTitleBm: 'HISAL AIDIL · Bab 7 — Operasi Tolak',
    searchTerms:    ['hisal aidil operasi tolak', 'aidil bab 7 operasi tolak'],
    patterns:       [
      /\bhisal[\s-]*aidil\b[^.\n]{0,64}\boperasi\s+tolak\b/i,
      /\bbahagian\s+aidil\b[^.\n]{0,64}\boperasi\s+tolak\b/i,
      /\boperasi\s+tolak\b[^.\n]{0,64}\b(?:hisal[\s-]*aidil|bahagian\s+aidil)\b/i,
      /\baidil\b[^.\n]{0,48}\bbab\s*(?:7|tujuh)\b[^.\n]{0,48}\boperasi\s+tolak\b/i,
    ],
  },
];

const HISAL_GANDA_PROBES: ChapterProbe[] = [
  {
    chapterId:      'ganda-bab-1',
    chapterTitleBm: 'HISAL · GANDA · Bab 1 — Pengenalan GANDA',
    searchTerms:    ['hisal ganda', 'pengenalan ganda', 'bahagian ganda', 'apa itu ganda'],
    patterns:       [
      /\bpengenalan\s+ganda\b/i,
      /\bhisal[\s-]*ganda\b/i,
      /\bbahagian\s+ganda\b/i,
      /\b(?:apa\s+itu|terangkan|jelaskan)\s+ganda\b/i,
    ],
  },
];

const HISAL_ASAS_PROBES: ChapterProbe[] = [
  {
    chapterId:      'asas-bab-1',
    chapterTitleBm: 'HISAL · ASAS · Bab 1 — Pengenalan ASAS',
    searchTerms:    ['hisal asas', 'pengenalan asas', 'hisal-asas', 'apa itu asas'],
    patterns:       [
      /\bpengenalan\s+asas\b/i,
      /\bhisal[\s-]*asas\b/i,
      /\b(?:apa\s+itu|terangkan|jelaskan)\s+asas\b(?!\s+keilmuan)/i,
    ],
  },
  {
    chapterId:      'asas-bab-2',
    chapterTitleBm: 'HISAL ASAS · Bab 2 — Proses Cara Kira & Pola Operasi Tambah',
    searchTerms:    ['hisal asas ganda pa', 'operasi tambah asas', 'asas bab 2', 'hisal asas bab 2'],
    patterns:       [
      /\bhisal[\s-]*asas\b[^.\n]{0,72}\b(?:ganda\s+pa|operasi\s+tambah|proses\s+cara\s+kira|pola\s+operasi)\b/i,
      /\bbahagian\s+asas\b[^.\n]{0,72}\b(?:ganda\s+pa|operasi\s+tambah|proses\s+cara\s+kira|pola\s+operasi)\b/i,
      /\b(?:ganda\s+pa|operasi\s+tambah|proses\s+cara\s+kira|pola\s+operasi\s+tambah)\b[^.\n]{0,72}\bhisal[\s-]*asas\b/i,
      /\bbahagian\s+asas\b[^.\n]{0,48}\bbab\s*(?:2|dua)\b/i,
      /\bhisal[\s-]*asas\b[^.\n]{0,48}\bbab\s*(?:2|dua)\b/i,
    ],
  },
  {
    chapterId:      'asas-bab-5',
    chapterTitleBm: 'HISAL ASAS · Bab 5 — Aplikasi KM',
    searchTerms:    ['hisal asas aplikasi km', 'asas bab 5 aplikasi km'],
    patterns:       [
      /\bhisal[\s-]*asas\b[^.\n]{0,64}\baplikasi\s+km\b/i,
      /\bbahagian\s+asas\b[^.\n]{0,64}\baplikasi\s+km\b/i,
      /\baplikasi\s+km\b[^.\n]{0,64}\bhisal[\s-]*asas\b/i,
      /\bhisal[\s-]*asas\b[^.\n]{0,48}\bbab\s*(?:5|lima)\b/i,
    ],
  },
];

const HISAL_SUNOM_PROBES: ChapterProbe[] = [
  {
    chapterId:      'sunom-bab-1',
    chapterTitleBm: 'SuNom Bab 1 — Pengenalan SuNom',
    searchTerms:    ['sunom', 'pengenalan sunom', 'prakata sunom'],
    patterns:       [/\bpengenalan\s+sunom\b/i, /\bprakata\s+sunom\b/i],
  },
  {
    chapterId:      'sunom-bab-2',
    chapterTitleBm: 'SuNom Bab 2 — Penetapan',
    searchTerms:    ['sunom penetapan', 'sunom bab 2'],
    patterns:       [
      /\bsunom\b[^.\n]{0,48}\bpenetapan\b/i,
      /\bpenetapan\b[^.\n]{0,48}\bsunom\b/i,
    ],
  },
  {
    chapterId:      'sunom-bab-3',
    chapterTitleBm: 'SuNom Bab 3 — Operasi SuNom',
    searchTerms:    ['operasi sunom', 'sunom bab 3'],
    patterns:       [/\boperasi\s+sunom\b/i],
  },
  {
    chapterId:      'sunom-bab-4',
    chapterTitleBm: 'SuNom Bab 4 — Pola Garis',
    searchTerms:    ['pola garis sunom', 'sunom bab 4'],
    patterns:       [
      /\bsunom\b[^.\n]{0,64}\bpola\s+garis\b/i,
      /\bpola\s+garis\b[^.\n]{0,64}\bsunom\b/i,
      /\bhisal[\s-]*sunom\b[^.\n]{0,48}\bbab\s*(?:4|empat)\b/i,
    ],
  },
];

export const BOOK_PROBE_TABLE: Array<{
  bookId:  AlamtologiBookId;
  detect:  RegExp[];
  probes:  ChapterProbe[];
  babOnly: (bab: number) => string | null;
}> = [
  {
    bookId: TEORI_ALAMIN_BOOK_ID,
    detect: [
      /\bteori\s+alamin\b/i,
      /\bkomunikasi\s+alamtologi\s+alamin\b/i,
      /\bilmu\s+komunikasi\s+alamtologi\b/i,
      /\bfaktor\s+pola\s+alamin\b/i,
      /\bfaktor\s+kadar\s+alamin\b/i,
      /\bformula\s+alamin\b/i,
      /\bfalsafah\s+alamin\b/i,
      /\bpe(?:sa|du|ga|pa|ma|na|tu)\b/i,
      /\bbab\s*(?:8|lapan)\b/i,
      /\balamin\b/i,
    ],
    probes: TEORI_ALAMIN_PROBES,
    babOnly: (bab) => {
      if (bab === 8) return 'alamin-overview';
      const map: Record<number, string> = {
        1: 'alamin-bab-1',
        2: 'alamin-bab-2',
        3: 'alamin-bab-3',
        4: 'alamin-bab-4',
      };
      return map[bab] ?? null;
    },
  },
  {
    bookId: 'hisal-main',
    detect: [
      /\bhisal\b/i,
      /\bbab\s*(?:7|tujuh)\b/i,
      /\bchapter\s*(?:7|seven)\b/i,
    ],
    probes: [HISAL_MAIN_PROBE],
    babOnly: (bab) => (bab === 7 ? 'hisal-chapter-7' : null),
  },
  {
    bookId: FORMULA_XYZ_BOOK_ID,
    detect: [
      /\bformula\s+xyz\b/i,
      /\basas\s+keilmuan\b/i,
      /\bfaktor\s+xyz\b/i,
      /\bhukum\s+alamtologi\b/i,
      /\bsains\s+alamtologi\b/i,
      /\b(?:hukum\s+z|hukum\s+x)\b/i,
      /\b(?:izwa|sira|rina)\b/i,
      /\bfaktor\s+(?:masa|tenaga)\b/i,
      /\bnapadu\b/i,
      /\bpasata\b/i,
      /\bketetapan\s+y\b/i,
      /\bteori\s+masabayu\b/i,
    ],
    probes: FORMULA_XYZ_PROBES,
    babOnly: (bab) => {
      const map: Record<number, string> = {
        1: 'bab-1-asas',
        2: 'bab-2-faktor-xyz',
        3: 'bab-3-hukum',
        4: 'bab-4-sains',
        5: 'bab-5-masa',
        6: 'bab-6-tenaga',
      };
      return map[bab] ?? null;
    },
  },
  {
    bookId: 'hisal-sunom',
    detect: [/\bsunom\b/i, /\bsu\s*nom\b/i],
    probes: HISAL_SUNOM_PROBES,
    babOnly: (bab) => {
      const map: Record<number, string> = {
        1: 'sunom-bab-1',
        2: 'sunom-bab-2',
        3: 'sunom-bab-3',
        4: 'sunom-bab-4',
      };
      return map[bab] ?? null;
    },
  },
  {
    bookId: 'hisal-ganda',
    detect: [/\bhisal[\s-]*ganda\b/i, /\bbahagian\s+ganda\b/i, /\bganda\b/i],
    probes: HISAL_GANDA_PROBES,
    babOnly: (bab) => (bab === 1 ? 'ganda-bab-1' : null),
  },
  {
    bookId: 'hisal-aidil',
    detect: [
      /\bhisal[\s-]*aidil\b/i,
      /\bbahagian\s+aidil\b/i,
      /\bcara\s+kira\s+aidil\b/i,
      /\bluman\b/i,
      /\bpengenalan\s+aidil\b/i,
      /\baidil\b/i,
      /\baidil\b[^.\n]{0,32}\bbab\s*(?:\d+|satu|dua|tiga|empat|lima|tujuh)\b/i,
      /\bbab\s*(?:\d+|satu|dua|tiga|empat|lima|tujuh)\b[^.\n]{0,32}\baidil\b/i,
      /\bhisal[\s-]*aidil\b[^.\n]{0,48}\boperasi\s+tolak\b/i,
    ],
    probes: HISAL_AIDIL_PROBES,
    babOnly: (bab) => {
      const map: Record<number, string> = {
        1: 'aidil-bab-1',
        2: 'aidil-bab-2',
        3: 'aidil-bab-3',
        4: 'aidil-bab-4',
        5: 'aidil-bab-5',
        7: 'aidil-bab-7',
      };
      return map[bab] ?? null;
    },
  },
  {
    bookId: 'hisal-asas',
    detect: [
      /\bhisal[\s-]*asas\b/i,
      /\bbahagian\s+asas\b/i,
    ],
    probes: HISAL_ASAS_PROBES,
    babOnly: (bab) => {
      const map: Record<number, string> = {
        1: 'asas-bab-1',
        2: 'asas-bab-2',
        5: 'asas-bab-5',
      };
      return map[bab] ?? null;
    },
  },
];
