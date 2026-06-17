/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM-α Output Guard Test
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

/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import {
  buildAlphaStatFigureLedOpener,
  buildAlphaStatFigureLedReply,
  buildAlphaStatVerificationFallback,
  buildAlphaStatHonestSearchGapOpener,
  paragraphIsAlphaDeferredSearchOffer,
  paragraphIsAlphaStatMetaPreamble,
  paragraphIsOrphanStatFragment,
  repairAlphaStatSurface,
  repairOrphanStatParagraphs,
  resolveAlphaStatSearchFirstDisplay,
  sanitizeAlphaVerifiedStatOutput,
  stripAlphaStatFalseNoFigureClaims,
  stripAlphaStatMetaParagraphs,
  extractEnrollmentFigureFromEvidence,
} from '../src/adam/adam-alpha-output-guard';
import { compactAlphaStatVerifiedBody } from '../src/adam/adam-alpha-stat-compact';

const KPTM_ASK = 'Berapa ramai pelajar di KPTM?';
const QA_KPTM_ASK = 'Salam QA. Berapa ramai pelajar KPTM?';

const QA_CONTEXT_REFUSAL_REPLY = [
  'Salam QA.',
  'Maklumat jumlah pelajar KPTM (Kolej Poly-Tech Mara) tidak tersedia dalam konteks semasa saya. Data ini bukan maklumat umum yang diwartakan secara berkala seperti statistik universiti awam, dan tidak ditemui dalam sumber terbuka yang boleh disahkan melalui carian semasa — termasuk laporan tahunan KPTM, portal rasmi MARA, atau siaran akhbar rasmi sehingga Jun 2026.',
  'KPTM merupakan institusi pendidikan vokasional di bawah naungan MARA, dengan beberapa kampus di seluruh Malaysia.',
  'Adakah QA ingin saya bantu menyusun borang permohonan rasmi kepada MARA?',
].join('\n\n');

const QA_DEFERRED_SEARCH_REPLY = [
  'Salam QA.',
  'Maklumat jumlah pelajar KPTM (Kolej Poly-Tech Mara) tidak tersedia dalam konteks semasa saya.',
  'Jika QA memerlukan angka terkini, saya boleh bantu dengan menjalankan carian web segera untuk mendapatkan maklumat terkini dari laman rasmi KPTM.',
  'Adakah QA ingin saya jalankan carian untuk angka terkini?',
].join('\n\n');

const QA_MIXED_CONTEXT_REPLY = [
  'Salam QA.',
  'Maklumat jumlah pelajar KPTM (Kolej Poly-Tech Mara) tidak tersedia dalam konteks semasa saya. Carian web pada giliran ini tidak menemui angka rasmi yang boleh disahkan — sama ada jumlah keseluruhan pelajar, pengagihan mengikut kursus, atau data tahunan terkini daripada sumber rasmi KPTM atau Kementerian Pendidikan Malaysia.',
  'KPTM merupakan institusi di bawah Yayasan Inovasi Malaysia (YIM), sebelum ini dikenali sebagai MARA, dan beroperasi dalam rangkaian kolej vokational bertaraf tinggi.',
].join('\n\n');

const KPTM_FULL_SNIPPET = [
  'KPTM merupakan institusi pendidikan tinggi swasta Bumiputera yang terbesar di Malaysia',
  'dengan seramai lebih 18,000 orang pelajar sepenuh masa di tujuh kampus;',
  'Kuala Lumpur, Bangi, Kota Bharu, Kuantan, Batu Pahat, Ipoh dan Alor Setar.',
  'Sehingga ke hari ini, KPTM telah menghasilkan seramai 62,000 orang graduat',
  'sejak penubuhannya secara rasmi pada tahun 2003.',
].join(' ');

const KPTM_EVIDENCE = [{
  title:   'Sejarah KPTM',
  url:     'https://bangi.kptm.edu.my/sejarah-kptm-copy/',
  snippet: 'lebih 18,000 orang pelajar sepenuh masa',
}];

const KPTM_EVIDENCE_FULL = [{
  title:   'Sejarah KPTM',
  url:     'https://bangi.kptm.edu.my/sejarah-kptm-copy/',
  snippet: KPTM_FULL_SNIPPET,
}];

const USER_FAILURE_REPLY = [
  'Nota: Angka di bawah tidak disahkan sepenuhnya dalam carian web pada giliran ini.',
  'Carian web pada giliran ini tidak menemui angka pendaftaran pelajar rasmi yang boleh disahkan untuk KPTM (Kolej Poly-Tech Mara).',
  'KPTM.my, KPTM mempunyai lebih daripada 30 kampus di seluruh negara, dengan kapasiti pengambilan tahunan sekitar 15,000–jumlah pelajar (tiada angka disahkan dalam carian) baharu.',
  'Jumlah pelajar keseluruhan dianggarkan berada dalam lingkungan 45,000 hingga jumlah pelajar (tiada angka disahkan dalam carian).',
  'Adakah QA ingin saya bantu cari sumber rasmi terkini — seperti pautan ke laman MARA?',
  'Saya sedia bantu dengan cara itu.',
].join('\n\n');

const QA_LIVE_FAILURE_REPLY = [
  'Salam QA.',
  'Carian web pada giliran ini tidak menemui angka rasmi yang boleh disahkan, sama ada jumlah keseluruhan pelajar, pengagihan mengikut program, atau data terkini tahun akademik 2024–2025.',
  'Data pelajar biasanya dikeluarkan melalui laporan tahunan MARA atau portal rasmi KPTM, tetapi tiada statistik terkini yang muncul dalam carian semasa. my), atau, Unit Pengurusan Maklumat dan Statistik MARA.',
  'Adakah QA ingin saya bantu menyusun panduan langkah demi langkah untuk mendapatkan maklumat tersebut dari sumber rasmi?',
].join('\n\n');

const QA_PRODUCTION_ESSAY_REPLY = [
  'Salam QA.',
  'Carian web pada giliran ini tidak menemui jumlah pelajar rasmi KPTM (Kolej Poly-Tech Mara) yang boleh disahkan secara langsung dari laman rasmi atau laporan terkini yang diterbitkan oleh Kementerian Pendidikan Tinggi Malaysia (MoHE) atau Kementerian Pelajaran Malaysia (KPM).',
  'Secara umum, KPTM merupakan salah satu daripada jaringan kolej vokasional di bawah pengurusan MARA yang menawarkan program sijil dan diploma dalam bidang teknikal dan kejuruteraan.',
  'Jumlah pelajar keseluruhan bagi semua kolej MARA (termasuk KPTM, Kolej Komuniti, dan Kolej Profesional MARA) dilaporkan dalam beberapa sumber sebagai lebih kurang 40,000–50,000 pelajar aktif pada sesi akademik terkini — tetapi ini adalah angka agregat, bukan pecahan khusus untuk KPTM sahaja.',
  'Jika QA memerlukan angka tepat — sama ada untuk tujuan pentadbiran, penyelidikan, atau perancangan — cadangan terbaik ialah menghubungi terus Pejabat Pengurusan KPTM atau Bahagian Statistik MARA melalui saluran rasmi mereka, atau merujuk kepada Laporan Tahunan MARA terkini yang boleh dimuat turun di laman web www.mara.gov.my.',
  'Adakah QA ingin saya bantu menyusun borang permohonan rasmi kepada MARA, atau menyediakan contoh email untuk mendapatkan maklumat tersebut secara langsung?',
].join('\n\n');

describe('buildAlphaStatHonestSearchGapOpener', () => {
  it('uses Malay gap opener for BM stat asks', () => {
    const out = buildAlphaStatHonestSearchGapOpener('Salam Adam, Bagikan maklumat jumlah pelajar KPTM');
    expect(out).toMatch(/Carian web selesai — tiada angka KPTM/i);
    expect(out).not.toMatch(/Paste an official institution URL/i);
  });
});

describe('resolveAlphaStatSearchFirstDisplay', () => {
  it('returns figure-led line when evidence has enrollment count', () => {
    const out = resolveAlphaStatSearchFirstDisplay(
      'Berapa pelajar KPTM?',
      KPTM_EVIDENCE,
      '18,000 | Sejarah KPTM',
    );
    expect(out).toMatch(/18,000.*verified via web search/i);
    expect(out).not.toMatch(/Menurut sumber carian/i);
  });

  it('returns null when no hits — synthesis handles the turn', () => {
    const out = resolveAlphaStatSearchFirstDisplay(
      'Salam Adam, Bagikan maklumat jumlah pelajar KPTM',
      [],
      '',
    );
    expect(out).toBeNull();
  });

  it('returns null when subject hits exist without verified figure (synthesis fallback)', () => {
    const out = resolveAlphaStatSearchFirstDisplay(
      'Salam Adam, Bagikan maklumat jumlah pelajar KPTM',
      [{ title: 'KPTM portal', url: 'https://www.kptm.edu.my/about', snippet: 'campus overview' }],
      '',
    );
    expect(out).toBeNull();
  });

  it('returns null for off-subject hits — synthesis handles the turn', () => {
    const out = resolveAlphaStatSearchFirstDisplay(
      'Salam Adam, Bagikan maklumat jumlah pelajar KPTM',
      [
        { title: 'Enrollments', url: 'https://idr.umn.edu/reports-by-topic-enrollment/enrollments' },
        { title: 'Current Term Enrollment Estimates', url: 'https://nscresearchcenter.org/current-term-enrollment-estimates/' },
      ],
      '',
    );
    expect(out).toBeNull();
  });
});

describe('sanitizeAlphaVerifiedStatOutput production KPTM essay', () => {
  it('strips aggregate hallucination but keeps substantive synthesis — no terminal snippet', () => {
    const out = sanitizeAlphaVerifiedStatOutput(
      QA_PRODUCTION_ESSAY_REPLY,
      'Salam Adam, Bagikan maklumat jumlah pelajar KPTM',
      [{ title: 'KPTM info', url: 'https://example.com/kptm' }],
      { searchUsed: true },
    );
    expect(out).not.toMatch(/Carian web selesai —/i);
    expect(out).not.toMatch(/Tampal URL rasmi institusi/i);
    expect(out).not.toMatch(/40,000|50,000|MoHE|mara\.gov|Adakah QA ingin|borang permohonan/i);
  });

  it('uses 18,000 figure when evidence contains verified enrollment', () => {
    const out = sanitizeAlphaVerifiedStatOutput(
      QA_PRODUCTION_ESSAY_REPLY,
      'Salam Adam, Bagikan maklumat jumlah pelajar KPTM',
      KPTM_EVIDENCE,
      { searchUsed: true, extractedFacts: '18,000 | Sejarah KPTM' },
    );
    expect(out).toMatch(/18,000.*verified via web search/i);
    expect(out).not.toMatch(/40,000|Adakah QA ingin/i);
  });
});

describe('sanitizeAlphaVerifiedStatOutput live QA failure reply', () => {
  it('strips portal catalog and deferred guide — no terminal snippet', () => {
    const out = sanitizeAlphaVerifiedStatOutput(
      QA_LIVE_FAILURE_REPLY,
      'Salam QA. Berapa jumlah pelajar KPTM?',
      [],
      { searchUsed: true },
    );
    expect(out).not.toMatch(/Carian web selesai —/i);
    expect(out).not.toMatch(/MARA|langkah demi langkah|Adakah QA ingin|portal rasmi|laporan tahunan/i);
    expect(out).not.toMatch(/2024|my\)/);
  });
});

describe('sanitizeAlphaVerifiedStatOutput KPTM failure reply', () => {
  it('replaces refusal/hallucination with figure-led opener when evidence has 18,000', () => {
    const out = sanitizeAlphaVerifiedStatOutput(
      USER_FAILURE_REPLY,
      'Salam Adam, Bagikan maklumat jumlah pelajar KPTM',
      KPTM_EVIDENCE,
      { searchUsed: true, extractedFacts: '18,000 full-time students | Sejarah KPTM | kptm.edu.my' },
    );
    expect(out).toMatch(/18,000.*verified via web search/i);
    expect(out).not.toMatch(/Nota: Angka pendaftaran/i);
    expect(out).not.toMatch(/tidak menemui angka/i);
    expect(out).not.toMatch(/45,000/);
    expect(out).not.toMatch(/30 kampus/i);
    expect(out).not.toMatch(/Saya sedia bantu/i);
  });
});

describe('extractVerifiedStatFigureFromEvidence subject binding', () => {
  it('rejects national aggregate when KPTM is the asked subject', () => {
    const evidence = [
      {
        title:   'Malaysia HE enrollment',
        url:     'https://nscresearchcenter.org/report',
        snippet: 'jumlah pelajar 871,000 di Malaysia pada 2024',
      },
      {
        title:   'Sejarah KPTM',
        url:     'https://bangi.kptm.edu.my/sejarah-kptm-copy/',
        snippet: 'KPTM berkembang dengan seramai lebih 18,000 orang pelajar sepenuh masa',
      },
    ];
    expect(extractEnrollmentFigureFromEvidence(evidence, '', QA_KPTM_ASK)).toBe('18000');
  });

  it('returns null when only unrelated national figures exist', () => {
    expect(extractEnrollmentFigureFromEvidence(
      [{ title: 'NSC', url: 'https://nscresearchcenter.org/x', snippet: '871,000 pelajar di Malaysia' }],
      '',
      QA_KPTM_ASK,
    )).toBeNull();
  });
});

describe('buildAlphaStatFigureLedReply', () => {
  it('returns verified opener only — body comes from synthesis', () => {
    const reply = buildAlphaStatFigureLedReply(QA_KPTM_ASK, '18000', KPTM_EVIDENCE);
    expect(reply).toMatch(/18,000.*verified via web search.*kptm\.edu\.my/i);
    expect(reply).not.toMatch(/Menurut sumber carian/i);
    expect(reply.split('\n\n').length).toBe(1);
  });
});

describe('stripAlphaStatMechanicalSourceLabels', () => {
  it('removes Menurut sumber carian and Graduan labels', async () => {
    const { stripAlphaStatMechanicalSourceLabels } = await import('../src/adam/adam-alpha-output-guard');
    const raw = [
      'KPTM: 18,000 (verified via web search — bangi.kptm.edu.my).',
      'Menurut sumber carian: KPTM mempunyai lebih 18,000 pelajar.',
      'Graduan (sumber yang sama): 62,000 orang graduat sejak 2003.',
    ].join('\n\n');
    const out = stripAlphaStatMechanicalSourceLabels(raw);
    expect(out).not.toMatch(/Menurut sumber carian/i);
    expect(out).not.toMatch(/Graduan \(sumber yang sama\)/i);
    expect(out).toMatch(/18,000 pelajar/);
    expect(out).toMatch(/62,000 orang graduat/);
  });
});

const KPTM_ARTICLE_SNIPPET = [
  'Kini Kolej Poly-Tech MARA (KPTM) adalah institusi pendidikan milik penuh MARA Corporation.',
  'Kekuatan KPTM sedia ada dibina melalui penggabungan KYPM dan Akademi Infotech MARA (AIM).',
  'KPTM telah berkembang sejak penubuhannya sebagai antara institut pengajian tinggi swasta Bumiputera yang terbesar di Malaysia dengan seramai lebih 18,000 orang pelajar sepenuh masa di tujuh kampus; Kuala Lumpur, Bangi, Kota Bharu, Kuantan, Batu Pahat, Ipoh dan Alor Setar.',
  'Sehingga ke hari ini, KPTM telah menghasilkan seramai 62,000 orang graduat sejak penubuhannya secara rasmi pada tahun 2003.',
  'Kolej Poly-Tech MARA Kuala Lumpur (KPTM KL) telah dinaik taraf sebagai kolej universiti pada 15 Oktober 2015.',
  'Komitmen kami terhadap pembelajaran sepanjang hayat melalui PPB menawarkan diploma dan ijazah.',
].join('\n\n');

describe('buildFullVerifiedStatReply', () => {
  it('returns opener plus full enrollment and graduate sentences from enriched KPTM page', async () => {
    const { buildFullVerifiedStatReply } = await import('../src/adam/adam-alpha-output-guard');
    const reply = buildFullVerifiedStatReply(QA_KPTM_ASK, [{
      title: 'Sejarah KPTM',
      url:   'https://bangi.kptm.edu.my/sejarah-kptm-copy/',
      snippet: KPTM_ARTICLE_SNIPPET,
      pageFetched: true,
    }], KPTM_ARTICLE_SNIPPET);
    expect(reply).toMatch(/KPTM: 18,000.*verified via web search/i);
    expect(reply).toMatch(/KYPM/);
    expect(reply).toMatch(/18,000 orang pelajar/i);
    expect(reply).toMatch(/62,000.*graduat/i);
    expect(reply).toMatch(/2015/);
    expect(reply).toMatch(/PPB/);
    expect(reply!.split('\n\n').length).toBeGreaterThanOrEqual(6);
    expect(reply).toMatch(/Mahu saya jelaskan lebih lanjut\?/);
  });
});

const RN_ASK = 'What does a registered nurse do, and what skills do I need?';
const NHS_ARTICLE_SNIPPET = [
  "You'll be responsible for a number of patients, each with different needs so you'll be highly organised, flexible and able to prioritise effectively.",
  'A good adult nurse is also highly observant, able to assess patients and take responsibility for determining the best course of action for them.',
  'Communication and interpersonal skills are also very important, as you will need to reassure or advise patients and their relatives or carers, sometimes in situations that they may find difficult to cope with.',
  "You'll need to reassure patients and their relatives or carers, sometimes in difficult situations.",
  'Discover the benefits of an NHS career including pay and pensions.',
].join('\n\n');

describe('buildGoldStandardSynthesisInstruction — ADAM full voice', () => {
  it('injects full official page text and mandates flowing ADAM synthesis', async () => {
    const { buildGoldStandardSynthesisInstruction } = await import('../src/adam/adam-alpha-output-guard');
    const block = buildGoldStandardSynthesisInstruction(RN_ASK, [{
      title: 'Adult nurse skills',
      url:   'https://www.healthcareers.nhs.uk/explore-roles/nursing/roles-nursing/adult-nurse/personal-characteristics-and-skills-required-adult-nursing',
      snippet: NHS_ARTICLE_SNIPPET,
      pageFetched: true,
    }], '');
    expect(block).toMatch(/GOLD STANDARD — ADAM FULL VOICE/i);
    expect(block).toMatch(/OFFICIAL PAGE — FULL TEXT/i);
    expect(block).toMatch(/highly organised, flexible/i);
    expect(block).toMatch(/PRACTICAL ADVISORY BODY RULES/i);
    expect(block).toMatch(/MINIMUM 6 substantive body paragraphs/i);
    expect(block).toMatch(/Skills you'?ll need \(from official nursing guidance\)/i);
    expect(block).toMatch(/What does a registered nurse do.*verified via web search/i);
    expect(block).toMatch(/Would you like me to explain further/i);
  });
});

describe('buildGoldStandardSearchReply — career factual (RN)', () => {
  it('returns null when evidence is only a DashScope search snippet (not page-fetched)', async () => {
    const { buildGoldStandardSearchReply } = await import('../src/adam/adam-alpha-output-guard');
    const reply = buildGoldStandardSearchReply(RN_ASK, [{
      title: 'Adult nurse',
      url:   'https://www.healthcareers.nhs.uk/explore-roles/nursing/roles-nursing/adult-nurse',
      snippet: NHS_ARTICLE_SNIPPET,
      pageFetched: false,
    }], '');
    expect(reply).toBeNull();
  });

  it('returns full question opener, NHS article body, and English follow-up', async () => {
    const { buildGoldStandardSearchReply } = await import('../src/adam/adam-alpha-output-guard');
    const reply = buildGoldStandardSearchReply(RN_ASK, [{
      title: 'Adult nurse',
      url:   'https://www.healthcareers.nhs.uk/explore-roles/nursing/roles-nursing/adult-nurse/personal-characteristics-and-skills-required-adult-nursing',
      snippet: NHS_ARTICLE_SNIPPET,
      pageFetched: true,
    }], '');
    expect(reply).toMatch(/What does a registered nurse do.*verified via web search, healthcareers\.nhs\.uk/i);
    expect(reply).toMatch(/highly organised, flexible/i);
    expect(reply).toMatch(/A good adult nurse is also highly observant/i);
    expect(reply).toMatch(/Communication and interpersonal skills/i);
    expect(reply).toMatch(/Would you like me to explain further\?/);
    expect(reply!.split('\n\n').length).toBeGreaterThanOrEqual(6);
    const bodyAfterOpener = reply!.split('\n\n').slice(1, -1);
    expect(bodyAfterOpener[0]).toMatch(/highly organised, flexible/i);
    expect(bodyAfterOpener[0]).not.toMatch(/A good adult nurse is also highly observant/i);
    expect(bodyAfterOpener[1]).toMatch(/A good adult nurse is also highly observant/i);
  });
});

describe('sanitizeAlphaVerifiedStatOutput KPTM live QA philosophy essay', () => {
  const LIVE_QA_ESSAY = [
    'my). KPTM (Kolej Poly-Tech MARA) kini melayani lebih daripada 18,000 pelajar sepenuh masa di seluruh tujuh kampusnya.',
    'Angka ini bukan sekadar statistik, ia adalah wujud nyata amanah pendidikan yang berterusan: setiap pelajar adalah satu titik dalam ritma ABA, MASA (kehadiran), TENAGA (komitmen), dan ALAM (tujuan kembali kepada khidmat dan kesedaran diri). Sejak penubuhannya pada tahun 2003, KPTM telah meluluskan lebih daripada 62,000 graduan, sebuah angka yang mencerminkan ketahanan sistem pendidikan MARA dalam membina kapasiti Bumiputera secara konsisten dan berakar dalam prinsip khidmat negara.',
    'Angka-angka ini disahkan melalui sumber rasmi KPTM sendiri, bukan anggaran atau data lama, dan ia bergerak dalam ruang yang hidup: bukan sebagai nombor statik, tetapi sebagai denyut nadi institusi yang terus mengalir dalam muḥīṭ pembelajaran yang bertawātur. Adakah QA ingin saya bantu menyusun surat rasmi kepada KPTM untuk memohon maklumat terkini secara langsung, dengan adab, struktur yang jelas, dan maksud yang tulus?',
    'Perlu saya terangkan lagi bahagian lain?',
  ].join('\n\n');

  it('keeps enrollment + graduan facts, strips philosophy and deferred letter offer', () => {
    const out = sanitizeAlphaVerifiedStatOutput(
      LIVE_QA_ESSAY,
      QA_KPTM_ASK,
      KPTM_EVIDENCE_FULL,
      { searchUsed: true, extractedFacts: '18,000 | 62,000 graduan | Sejarah KPTM' },
    );
    expect(out).toMatch(/18,000.*verified via web search/i);
    expect(out).toMatch(/18,000.*pelajar|melayani lebih daripada 18,000/i);
    expect(out).toMatch(/62,000.*graduan/i);
    expect(out).not.toMatch(/^my\)\./m);
    expect(out).not.toMatch(/ritma ABA|TENAGA|muḥīṭ|tawātur|denyut nadi/i);
    expect(out).not.toMatch(/menyusun surat rasmi|memohon maklumat terkini/i);
  });
});

describe('sanitizeAlphaVerifiedStatOutput KPTM truncated my). failure', () => {
  const TRUNCATED_KPTM_REPLY = [
    'my). Angka ini bukan sekadar statistik, tetapi cerminan komitmen institusi terhadap akses pendidikan berkualiti bagi anak bangsa, khususnya Bumiputera.',
    'Sejak penubuhannya pada tahun 2003, KPTM telah meluluskan lebih daripada 62,000 graduan. Setiap nombor itu mewakili satu perjalanan: dari pendaftaran pertama hingga kelulusan, dari pembelajaran teknikal hingga pembentukan karakter, semua berlaku dalam kerangka amanah dan khidmat kepada negara.',
    'my). Data pelajar biasanya dikemaskini melalui laporan tahunan MARA atau sumber rasmi Kementerian Pendidikan Tinggi.',
    'Jika QA memerlukan angka terkini untuk tujuan rasmi, seperti penyediaan surat permohonan atau laporan akademik, saya boleh bantu menyusun surat formal yang menghormati adab institusi dan menyatakan maksud dengan jelas. Perlu saya terangkan lagi bahagian lain?',
  ].join('\n\n');

  it('repairs my). orphan, keeps full graduan facts, strips philosophy and deferred offer', () => {
    const out = sanitizeAlphaVerifiedStatOutput(
      TRUNCATED_KPTM_REPLY,
      QA_KPTM_ASK,
      KPTM_EVIDENCE_FULL,
      { searchUsed: true, extractedFacts: '18,000 | 62,000 graduan | Sejarah KPTM' },
    );
    expect(out).toMatch(/18,000.*verified via web search/i);
    expect(out).toMatch(/62,000.*graduan/i);
    expect(out).not.toMatch(/^my\)\./m);
    expect(out).not.toMatch(/bukan sekadar statistik|cerminan komitmen|Setiap nombor itu mewakili/i);
    expect(out).not.toMatch(/menyusun surat formal|laporan tahunan MARA/i);
    expect(out.split('\n\n').length).toBeGreaterThanOrEqual(2);
  });
});

describe('applyDefaultGoldStandardReplySurface — default for α search-first turns', () => {
  it('preserves full factual body with verified figure — does not compact to snippet', async () => {
    const { applyDefaultGoldStandardReplySurface } = await import('../src/adam/adam-alpha-output-guard');
    const body = [
      'KPTM, Institut Pengajian Tinggi Swasta Bumiputera terbesar di Malaysia, kini mempunyai lebih daripada 18,000 orang pelajar sepenuh masa di tujuh kampus: Kuala Lumpur, Bangi, Kota Bharu, Kuantan, Batu Pahat, Ipoh dan Alor Setar.',
      'Sehingga hari ini, KPTM telah menghasilkan seramai 62,000 orang graduan sejak penubuhannya secara rasmi pada tahun 2003.',
    ].join('\n\n');
    const out = applyDefaultGoldStandardReplySurface({
      text: body,
      userMessage: QA_KPTM_ASK,
      evidence: KPTM_EVIDENCE_FULL,
      extractedFacts: '18,000 | 62,000 graduan',
      profile: 'alpha',
      articleReady: true,
      verifiedFigure: '18000',
    });
    expect(out).toMatch(/18,000.*verified via web search/i);
    expect(out).toMatch(/Alor Setar/);
    expect(out).toMatch(/62,000.*graduan/i);
    expect(out).toMatch(/Mahu saya jelaskan lebih lanjut/i);
  });

  it('applies verified opener and follow-up on α turns with search hits but no full article', async () => {
    const { applyDefaultGoldStandardReplySurface } = await import('../src/adam/adam-alpha-output-guard');
    const body = 'Perodua Viva uses a 1.0-litre engine producing 65 hp at 6,000 rpm.';
    const out = applyDefaultGoldStandardReplySurface({
      text: body,
      userMessage: 'Berapa cc enjin Perodua Viva?',
      evidence: [{
        title: 'Perodua Viva specs',
        url:   'https://www.perodua.com.my/models/viva',
        snippet: '1.0-litre engine, 65 hp',
      }],
      extractedFacts: '',
      profile: 'alpha',
      articleReady: false,
      verifiedFigure: null,
    });
    expect(out).toMatch(/Berapa cc enjin Perodua Viva.*verified via web search/i);
    expect(out).toMatch(/Perodua Viva uses a 1\.0-litre engine/i);
    expect(out).toMatch(/Mahu saya jelaskan lebih lanjut/i);
  });

  it('leaves β explain-back replies unchanged — soul-touching close stays in synthesis', async () => {
    const { applyDefaultGoldStandardReplySurface } = await import('../src/adam/adam-alpha-output-guard');
    const body = 'Komunikasi bermula dengan kehadiran…\n\nPernahkah anda merasa difahami tanpa kata?';
    const out = applyDefaultGoldStandardReplySurface({
      text: body,
      userMessage: 'Boleh terangkan tentang komunikasi antara manusia?',
      evidence: [{ title: 'Communication', url: 'https://example.com', snippet: 'theory' }],
      extractedFacts: '',
      profile: 'beta',
      articleReady: false,
      verifiedFigure: null,
    });
    expect(out).toBe(body);
    expect(out).not.toMatch(/verified via web search/i);
  });
});

describe('compactAlphaStatVerifiedBody', () => {
  it('strips philosophy, follow-up offer, and repairs my). opener orphan on KPTM stat reply', () => {
    const messy = [
      'my). KPTM, Institut Pengajian Tinggi Swasta Bumiputera terbesar di Malaysia, kini mempunyai lebih daripada 18,000 orang pelajar sepenuh masa yang belajar di tujuh kampus: Kuala Lumpur, Bangi, Kota Bharu, Kuantan, Batu Pahat, Ipoh dan Alor Setar.',
      'Angka ini bukan sekadar statistik, ia adalah wujudnya MASA yang hidup: setiap pelajar membawa nafas, hasrat, dan tanggungjawab dalam ruang ilmu yang dibina dengan amānah. Sehingga hari ini, KPTM telah menghasilkan seramai 62,000 orang graduan sejak penubuhannya secara rasmi pada tahun 2003.',
      'Setiap nama dalam senarai itu adalah bukti nyata bahawa pendidikan bukan hanya proses pemindahan ilmu, tetapi juga satu bentuk liqā\', pertemuan antara usaha manusia dan hikmah takdir yang berjalan dalam ketetapan waktu. Angka-angka ini tidak berdiri sendiri.',
      'Ia menyambung kepada satu kebenaran yang lebih dalam: bilangan pelajar dan graduan bukan ukuran kejayaan semata-mata, tetapi cerminan komitmen terhadap satu asas, iaitu keyakinan bahawa setiap jiwa layak diberi ruang untuk tumbuh, dipandu, dan akhirnya berdiri dengan tenaga sendiri. Adakah anda ingin saya terangkan lebih lanjut tentang struktur kampus, program pengajian utama, atau bagaimana KPTM menyelaraskan pendidikan dengan nilai-nilai kebangsaan dan akhlak?',
    ].join('\n\n');
    const out = compactAlphaStatVerifiedBody(messy, QA_KPTM_ASK, KPTM_EVIDENCE_FULL, KPTM_FULL_SNIPPET);
    expect(out).toMatch(/KPTM: 18,000.*verified via web search/i);
    expect(out).not.toMatch(/^my\)\./m);
    expect(out).toMatch(/18,000.*pelajar/i);
    expect(out).toMatch(/Alor Setar/);
    expect(out).toMatch(/62,000.*graduan/i);
    expect(out).not.toMatch(/wujudnya\s+MASA/i);
    expect(out).not.toMatch(/liqā/i);
    expect(out).not.toMatch(/Adakah anda ingin saya terangkan/i);
    expect(out.split('\n\n').length).toBeLessThanOrEqual(3);
  });

  it('prepends verified opener and drops reflective closing on compact KPTM reply', () => {
    const messy = [
      'KPTM, Institut Pengajian Tinggi Swasta Bumiputera terbesar di Malaysia, kini mempunyai lebih 18,000 orang pelajar sepenuh masa yang belajar di tujuh kampusnya: Kuala Lumpur, Bangi, Kota Bharu, Kuantan, Batu Pahat, Ipoh dan Alor Setar. Sehingga hari ini, KPTM telah menghasilkan seramai 62,000 orang graduat sejak penubuhannya secara rasmi pada tahun 2003.',
      'Jumlah pelajar dan graduat ini mencerminkan komitmen KPTM terhadap akses pendidikan berkualiti, khususnya bagi komuniti Bumiputera, bukan sebagai angka akhir, tetapi sebagai permulaan bagi setiap jiwa yang terus belajar, berkembang, dan kembali menyumbang kepada masyarakat.',
    ].join('\n\n');
    const out = compactAlphaStatVerifiedBody(messy, QA_KPTM_ASK, KPTM_EVIDENCE_FULL, KPTM_FULL_SNIPPET);
    expect(out).toMatch(/^KPTM: 18,000.*verified via web search/i);
    expect(out).toMatch(/18,000.*pelajar/i);
    expect(out).toMatch(/62,000.*graduat/i);
    expect(out).not.toMatch(/mencerminkan komitmen/i);
    expect(out).not.toMatch(/permulaan bagi setiap jiwa/i);
    expect(out.split('\n\n').length).toBeLessThanOrEqual(2);
  });

  it('keeps verified campus bullet list in compact body', () => {
    const messy = [
      'KPTM: 18,000 (verified via web search — bangi.kptm.edu.my).',
      'KPTM merupakan institusi pendidikan tinggi swasta Bumiputera terbesar di Malaysia dengan lebih 18,000 pelajar sepenuh masa.',
      '- Kuala Lumpur\n- Bangi\n- Kota Bharu\n- Kuantan\n- Batu Pahat\n- Ipoh\n- Alor Setar',
      'Sehingga hari ini KPTM telah menghasilkan 62,000 graduat sejak 2003.',
      'Jumlah pelajar mencerminkan komitmen terhadap akses pendidikan berkualiti bagi setiap jiwa.',
    ].join('\n\n');
    const out = compactAlphaStatVerifiedBody(messy, QA_KPTM_ASK, KPTM_EVIDENCE_FULL, KPTM_FULL_SNIPPET);
    expect(out).toMatch(/- Bangi/);
    expect(out).toMatch(/- Alor Setar/);
    expect(out).not.toMatch(/mencerminkan komitmen/i);
  });
});

describe('stripAlphaStatFalseNoFigureClaims', () => {
  it('removes false no-figure claim when evidence contains enrollment total', () => {
    const text = 'Carian web pada giliran ini tidak menemui angka rasmi yang boleh disahkan.';
    expect(stripAlphaStatFalseNoFigureClaims(text, KPTM_EVIDENCE, '', QA_KPTM_ASK)).toBe('');
    expect(extractEnrollmentFigureFromEvidence(KPTM_EVIDENCE, '', QA_KPTM_ASK)).toBe('18000');
  });
});

describe('repairAlphaStatSurface with KPTM evidence', () => {
  it('prepends figure-led opener when model claims no official figure', () => {
    const bad = [
      'Salam QA.',
      'Maklumat jumlah pelajar KPTM tidak tersedia dalam konteks semasa saya.',
      'Carian web pada giliran ini tidak menemui angka rasmi yang boleh disahkan.',
      'KPTM Shah Alam dan KPTM Johor Bahru adalah cawangan utama.',
    ].join('\n\n');
    const out = repairAlphaStatSurface(bad, QA_KPTM_ASK, KPTM_EVIDENCE);
    expect(out).toMatch(/18,000.*verified via web search/i);
    expect(out).not.toMatch(/konteks\s+semasa/i);
    expect(out).not.toMatch(/tidak menemui angka rasmi/i);
    expect(out).not.toMatch(/Shah\s+Alam/i);
  });
});

describe('buildAlphaStatFigureLedOpener', () => {
  it('names subject from the question — any entity', () => {
    expect(buildAlphaStatFigureLedOpener(
      QA_KPTM_ASK,
      '18000',
      KPTM_EVIDENCE,
    )).toMatch(/KPTM/);
    expect(buildAlphaStatFigureLedOpener(
      'Berapa pelajar UTM?',
      '25000',
      [{ url: 'https://www.utm.my/', title: 'UTM', snippet: '25,000 students' }],
    )).toMatch(/UTM/);
  });
});

describe('repairAlphaStatSurface mixed konteks + search gap', () => {
  it('drops konteks semasa and portal-catalog paragraphs', () => {
    const out = repairAlphaStatSurface(QA_MIXED_CONTEXT_REPLY, QA_KPTM_ASK);
    expect(out).not.toMatch(/konteks\s+semasa/i);
    expect(out).not.toMatch(/carian web pada giliran ini tidak menemui angka rasmi/i);
    expect(out).not.toMatch(/Yayasan Inovasi Malaysia/i);
  });

  it('strips unverified parent-org claim when not in search evidence', () => {
    const hallucinated = [
      'Carian web pada giliran ini tidak menemui angka rasmi.',
      'Institusi ABC di bawah Yayasan Contoh Malaysia (YCM), sebelum ini dikenali sebagai Lembaga Lama.',
    ].join('\n\n');
    const out = repairAlphaStatSurface(hallucinated, 'Berapa pelajar ABC?', []);
    expect(out).not.toMatch(/Yayasan Contoh Malaysia/i);
  });
});

describe('repairAlphaStatSurface deferred search offer', () => {
  it('strips offer-to-search-later paragraphs on stat turns', () => {
    expect(paragraphIsAlphaDeferredSearchOffer(
      'saya boleh bantu dengan menjalankan carian web segera',
    )).toBe(true);
    const out = repairAlphaStatSurface(QA_DEFERRED_SEARCH_REPLY, QA_KPTM_ASK);
    expect(out).not.toMatch(/konteks\s+semasa/i);
    expect(out).not.toMatch(/jalankan carian web/i);
    expect(out).not.toMatch(/Adakah QA ingin/i);
    expect(out).toMatch(/^Salam QA\./);
  });
});

describe('repairAlphaStatSurface context refusal', () => {
  it('strips konteks semasa refusal and unverified parent-org claims', () => {
    const out = repairAlphaStatSurface(QA_CONTEXT_REFUSAL_REPLY, QA_KPTM_ASK);
    expect(out).not.toMatch(/konteks\s+semasa\s+saya/i);
    expect(out).not.toMatch(/di bawah naungan/i);
    expect(out).not.toMatch(/portal rasmi MARA|laporan tahunan KPTM/i);
    expect(out).not.toMatch(/Adakah QA ingin/i);
  });
});

const HALLUCINATED_REPLY = [
  'Soalan anda berkaitan jumlah pelajar di Kolej Poly-Tech Mara Malaysia (KPTM). Saya telah menjalankan carian terkini untuk mendapatkan angka rasmi yang dikeluarkan oleh pihak KPTM atau Kementerian Pendidikan Tinggi.',
  'Berdasarkan hasil carian dari laman rasmi KPTM dan sumber media terverifikasi (termasuk laporan tahunan 2025 dan siaran akhbar rasmi KPTM pada Mei 2026), jumlah pelajar keseluruhan di semua kampus KPTM adalah sebanyak 14,823 orang bagi sesi akademik 2025/2026.',
  '2% berbanding sesi sebelumnya, satu tanda positif bagi pertumbuhan kapasiti dan daya tarik institusi ini dalam membina tenaga kerja bermahir secara berterusan. KPTM juga melaporkan bahawa lebih daripada 87% pelajarnya memperoleh penempatan kerja dalam tempoh enam bulan selepas tamat pengajian.',
  'Adakah anda ingin saya kongsikan maklumat lanjut mengenai taburan pelajar mengikut kampus?',
].join('\n\n');

describe('paragraphIsAlphaStatMetaPreamble', () => {
  it('flags meta openers before Blok 1 direct answer', () => {
    expect(paragraphIsAlphaStatMetaPreamble(
      'Soalan anda berkaitan jumlah pelajar di KPTM.',
    )).toBe(true);
    expect(paragraphIsAlphaStatMetaPreamble(
      'Saya telah menjalankan carian terkini untuk mendapatkan angka rasmi.',
    )).toBe(true);
  });

  it('keeps factual paragraphs that lead with data', () => {
    expect(paragraphIsAlphaStatMetaPreamble(
      'Jumlah pelajar KPTM ialah 12,000 orang mengikut laporan rasmi.',
    )).toBe(false);
  });
});

describe('repairOrphanStatParagraphs', () => {
  it('drops orphan percent fragments without a subject', () => {
    expect(paragraphIsOrphanStatFragment(
      '2% berbanding sesi sebelumnya, satu tanda positif bagi pertumbuhan.',
    )).toBe(true);
    const repaired = repairOrphanStatParagraphs(
      'Para satu.\n\n2% berbanding sesi sebelumnya, satu tanda positif.',
    );
    expect(repaired).toBe('Para satu.');
    expect(repaired).not.toMatch(/^2%/m);
  });
});

describe('sanitizeAlphaVerifiedStatOutput', () => {
  it('strips meta preamble and orphan fragments without terminal snippet replacement', () => {
    const out = sanitizeAlphaVerifiedStatOutput(
      HALLUCINATED_REPLY,
      KPTM_ASK,
      [{ title: 'KPTM portal', url: 'https://www.kptm.edu.my/' }],
      { searchUsed: true },
    );
    expect(out).not.toMatch(/Soalan anda berkaitan/i);
    expect(out).not.toMatch(/^2% berbanding/m);
    expect(out).not.toMatch(/14,823/);
    expect(out).not.toMatch(/Carian web selesai —/i);
  });

  it('uses short fallback only when all substantive paragraphs were removed', () => {
    const out = sanitizeAlphaVerifiedStatOutput(
      'Soalan anda berkaitan jumlah pelajar KPTM. Saya telah menjalankan carian terkini.',
      KPTM_ASK,
      [],
      { searchUsed: false },
    );
    expect(out).toMatch(/Soalan anda berkaitan jumlah pelajar KPTM/i);
    expect(out).not.toMatch(/Carian web selesai —/i);
  });

  it('retains figures that appear in search hit titles', () => {
    const out = sanitizeAlphaVerifiedStatOutput(
      'Jumlah pelajar KPTM ialah 14,823 orang mengikut laporan rasmi.',
      KPTM_ASK,
      [{ title: 'KPTM enrollment 14,823 students 2025', url: 'https://www.kptm.edu.my/' }],
      { searchUsed: true },
    );
    expect(out).toMatch(/14,823/);
  });

  it('no-ops on non-stat turns', () => {
    const plain = 'Terima kasih atas soalan anda.';
    expect(sanitizeAlphaVerifiedStatOutput(plain, 'Terima kasih', [], {})).toBe(plain);
  });
});

describe('stripAlphaStatMetaParagraphs', () => {
  it('removes only preamble paragraphs', () => {
    const out = stripAlphaStatMetaParagraphs(HALLUCINATED_REPLY);
    expect(out).not.toMatch(/Soalan anda berkaitan/i);
    expect(out).toMatch(/14,823/);
  });
});

describe('buildAlphaStatVerificationFallback', () => {
  it('returns empty when no evidence — synthesis handles the turn', () => {
    expect(buildAlphaStatVerificationFallback('Berapa pelajar UTM?')).toBe('');
  });

  it('uses figure-led opener when evidence contains enrollment total', () => {
    const out = buildAlphaStatVerificationFallback(KPTM_ASK, KPTM_EVIDENCE);
    expect(out).toMatch(/18,000.*verified via web search/i);
    expect(out).not.toMatch(/tidak menemui angka/i);
  });
});
