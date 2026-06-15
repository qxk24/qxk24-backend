/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM-α Stat Patterns
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-15
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

export const ENROLLMENT_COUNT_RE =
  /\b(\d{1,3}(?:,\d{3})+|\d{4,6})\s*(?:orang|pelajar|students?|enrolmen|enrollment)\b/gi;

export const PLACEMENT_PERCENT_RE =
  /\b(\d{1,3}(?:\.\d+)?)\s*%\s*[^.\n]{0,80}\b(?:penempatan|placement|kerja|employed)\b/gi;

export const GROWTH_PERCENT_ORPHAN_RE =
  /^\d{1,3}(?:\.\d+)?%\s*berbanding\b/i;

export const INVENTED_REPORT_CITE_RE =
  /\b(?:laporan\s+tahunan|annual\s+report|siaran\s+akhbar\s+rasmi|press\s+release)\b[^.\n]{0,60}\b(?:20\d{2}|Januari|Februari|Mac|April|Mei|Jun|Julai|Ogos|September|Oktober|November|Disember)\b/gi;

export const ALPHA_CONTEXT_REFUSAL_RE =
  /\b(?:tidak\s+(?:tersedia|ada)\s+dalam\s+konteks\s+semasa|tidak\s+ditemui\s+dalam\s+sumber\s+terbuka[^.]{0,80}konteks|not\s+(?:in|available\s+in)\s+my\s+(?:current\s+)?context|Maklumat\s+(?:itu\s+)?tidak\s+(?:tersedia|ada)\s+dalam\s+konteks)\b/i;

export const PARENT_ORG_CLAIM_RE =
  /\b(?:di bawah(?:\s+naungan)?|under the auspices of|owned by|affiliated with|sebelum ini dikenali sebagai|formerly known as)\s+([^.,;]{4,100})/i;

export const BRANCH_CAMPUS_CLAIM_RE =
  /\b(?:cawangan|kampus|branch)\s+(?:utama\s+)?(?:di\s+)?([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})/gi;

export const INSTITUTION_PLACE_CLAIM_RE =
  /\b([A-Z]{2,10})\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\b/g;

export const ALPHA_FALSE_NO_FIGURE_RE =
  /\b(?:carian web(?:\s+pada\s+giliran\s+ini)?[^.]{0,120})?tidak\s+(?:menemui|mendapati)\s+(?:angka(?:\s+rasmi|\s+pendaftaran)?|jumlah\s+pelajar(?:\s+rasmi)?|data\s+rasmi)\b/i;

export const ALPHA_UNVERIFIED_NOTA_RE =
  /^Nota:\s*Angka(?:\s+pendaftaran)? di bawah tidak disahkan/i;

export const ALPHA_SEARCH_GAP_PARAGRAPH_RE =
  /\bcarian web(?:\s+pada\s+giliran\s+ini)?\s+tidak\s+(?:menemui|mendapati)\s+(?:angka|jumlah|data\s+rasmi)/i;

export const ALPHA_AGGREGATE_RANGE_RE =
  /\b(?:lebih\s+kurang|anggaran|agregat)[^.]{0,80}\d{1,3}(?:,\d{3})+\s*[–—-]\s*\d{1,3}(?:,\d{3})+/i;

export const UNVERIFIED_CAMPUS_COUNT_RE =
  /\b(?:lebih\s+daripada|lebih\s+)?\d{2,3}\s+kampus\b/i;

export const ALPHA_DEFERRED_SEARCH_OFFER_RE =
  /\b(?:saya\s+boleh\s+bantu(?:\s+dengan)?[^.]{0,80}(?:men)?jalankan\s+carian\s+web|Adakah\s+(?:QA|anda)\s+ingin\s+(?:lebih\s+lanjut|saya\s+(?:terangkan|jalankan\s+carian|bantu(?:\s+menyusun|\s+cari|\s+memohon)?))|boleh\s+jalankan\s+carian\s+web\s+segera|saya\s+sedia\s+bantu\s+dengan\s+cara\s+itu|bantu\s+cari\s+sumber\s+rasmi|menyusun\s+panduan\s+langkah|langkah\s+demi\s+langkah\s+untuk\s+mendapatkan|menyusun\s+surat\s+(?:formal|rasmi)|memohon\s+maklumat\s+terkini\s+secara\s+langsung|Jika\s+QA\s+memerlukan\s+angka\s+terkini)\b/i;

export const ALPHA_PORTAL_CATALOG_RE =
  /\b(?:laporan\s+tahunan|portal\s+rasmi|Unit\s+Pengurusan\s+Maklumat|siaran\s+akhbar\s+rasmi|data\s+biasanya\s+dikeluarkan|data\s+pelajar\s+biasanya\s+dikemaskini|dikemaskini\s+melalui\s+laporan\s+tahunan)\b/i;

export const ALPHA_MECHANICAL_SOURCE_LABEL_RE =
  /^(?:Menurut sumber carian|Per the search source|Graduan \(sumber yang sama\)|Graduates \(same source\)):\s*/i;

export const ALPHA_STAT_PHILOSOPHY_SENTENCE_RE =
  /\b(?:wujudnya\s+MASA|wujud\s+nyata\s+amanah|MASA\s+yang\s+hidup|ritma\s+ABA|MASA\s*\(|TENAGA\s*\(|ALAM\s*\(|liqā['']?|amānah|muḥīṭ|muhit|tawātur|tawatur|denyut\s+nadi|bukan\s+sekadar\s+statistik|bukan\s+sebagai\s+angka\s+akhir|bukan\s+sebagai\s+nombor\s+statik|pertemuan\s+antara\s+usaha\s+manusia|keyakinan\s+bahawa\s+setiap\s+jiwa|permulaan\s+bagi\s+setiap\s+jiwa|kebenaran\s+yang\s+lebih\s+mendalam|Angka-angka\s+ini\s+tidak\s+berdiri\s+sendiri|Angka-angka\s+ini\s+disahkan\s+melalui[^.]{0,80}(?:bergerak|denyut|muḥīṭ|tawātur)|Setiap\s+nama\s+dalam\s+senarai|Setiap\s+nombor\s+itu\s+mewakili|cerminan\s+komitmen|mencerminkan\s+komitmen|mencerminkan\s+ketahanan|cerminan\s+komitmen\s+institusi|nafas,\s+hasrat,\s+dan\s+tanggungjawab|ruang\s+ilmu\s+yang\s+dibina|menyumbang\s+kepada\s+masyarakat|terus\s+belajar,\s+berkembang|khidmat\s+kepada\s+negara|prinsip\s+khidmat\s+negara|pembentukan\s+karakter|kerangka\s+amanah)\b/i;

/** Forbidden memory-law / deferred-search phrasing on α stat turns after prefetch. */
export function alphaStatOutputHasForbiddenPhrases(text: string): boolean {
  return ALPHA_CONTEXT_REFUSAL_RE.test(text)
    || ALPHA_DEFERRED_SEARCH_OFFER_RE.test(text)
    || ALPHA_FALSE_NO_FIGURE_RE.test(text)
    || ALPHA_AGGREGATE_RANGE_RE.test(text)
    || (ALPHA_PORTAL_CATALOG_RE.test(text) && /\b(?:MoHE|KPM|MARA|mara\.gov)/i.test(text))
    || /\bMASA\s*[→\-–—>]+\s*TENAGA\b/i.test(text)
    || /\bWould you like to proceed\b/i.test(text)
    || /\bMARA\s+Annual\s+Reports?\b/i.test(text)
    || /\bno\s+verified,\s*up-to-date\s+total\s+student\s+enrol/i.test(text)
    || /\b(?:Specify one of the following|targeted search,\s*not for generic mentions)\b/i.test(text)
    || /\bwujudnya\s+MASA\b/i.test(text)
    || /\bliqā['']?\b/i.test(text)
    || /\bbukan\s+sekadar\s+statistik\b/i.test(text)
    || /\bAdakah\s+anda\s+ingin\s+saya\s+terangkan\b/i.test(text)
    || /\bmencerminkan\s+komitmen\b/i.test(text)
    || /\bbukan\s+sebagai\s+angka\s+akhir\b/i.test(text);
}
