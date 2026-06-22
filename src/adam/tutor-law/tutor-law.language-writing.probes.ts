/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Language & Writing Probes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { LanguageVariant, WritingType } from './tutor-law.language-writing.types';

export const FEEDBACK_ANCHOR_BM =
  'ADAM dah baca draf kamu. Sebelum ADAM beri maklum balas — bahagian mana yang kamu sendiri rasa paling lemah atau paling tidak puas hati?';

export const FEEDBACK_ANCHOR_EN =
  'ADAM has read your draft. Before giving feedback — which part do you feel is the weakest or you\'re least happy with?';

export function buildTrapRedirect(writingType: WritingType, lang: LanguageVariant): string {
  const isBm = lang !== LanguageVariant.ENGLISH;

  const scripts: Partial<Record<WritingType, string>> = {
    [WritingType.KARANGAN]: isBm
      ? 'ADAM tidak akan menulis karangan untuk kamu — kemahiran mengarang perlu dibina sendiri. Tapi ADAM boleh bantu kamu hasilkan karangan yang lebih baik dari yang kamu jangkakan. Mulakan dengan ini: apa tiga perkara utama yang kamu rasa penting tentang tajuk ni?'
      : 'ADAM won\'t write the essay for you — that\'s the skill you\'re building. But ADAM can help you write something better than you think you can. Start with this: what are three things you feel strongly about on this topic?',
    [WritingType.LAPORAN]: isBm
      ? 'ADAM tidak menyiapkan laporan — tapi ADAM boleh bimbing kamu bina laporan yang lengkap. Soalan pertama: apa tujuan utama laporan ni? Untuk siapa ia ditulis?'
      : 'ADAM won\'t write the report — but can guide you to build a complete one. First question: what is the main purpose of this report, and who is the audience?',
    [WritingType.SURAT]: isBm
      ? 'ADAM tidak menulis surat untuk kamu. Tapi boleh bimbing kamu tulis surat yang tepat. Mula dengan ni: apakah tujuan surat ini, dan kepada siapa ia ditujukan?'
      : 'ADAM won\'t write the letter for you. But can guide you to write one properly. Start here: what is the purpose of this letter and who is it addressed to?',
    [WritingType.ESEI]: isBm
      ? 'ADAM tidak boleh tulis esei untuk kamu — tapi boleh bimbing kamu bina argumen yang kukuh. Cuba tulis thesis statement kamu dalam satu ayat dahulu.'
      : 'ADAM won\'t write the essay — but can help you build a strong argument. Try writing your thesis statement in one sentence first.',
    [WritingType.PUISI]: isBm
      ? 'ADAM tidak akan menulis sajak atau puisi untuk kamu — irama dan imejan perlu datang dari kamu. Cuba mula dengan satu perasaan atau satu imej yang kuat tentang tajuk tu.'
      : 'ADAM won\'t write the poem for you — rhythm and imagery need to come from you. Start with one strong feeling or image about the topic.',
    [WritingType.KOMSAS]: isBm
      ? 'ADAM tidak menyiapkan analisis Komsas — tapi boleh bimbing kamu bina hujah sastera sendiri. Apa satu perasaan utama selepas baca teks tu?'
      : 'ADAM won\'t complete the literary analysis — but can guide your own argument. What is one main feeling after reading the text?',
  };

  return scripts[writingType] ?? (isBm
    ? 'ADAM tidak akan menyiapkan penulisan untuk kamu — tapi boleh bimbing proses itu. Mula dengan ini: apa idea pertama yang datang dalam kepala kamu tentang tugasan ni?'
    : 'ADAM won\'t complete the writing for you — but can guide the process. Start here: what is the first idea that comes to mind about this task?');
}

export function buildIdeationProbe(writingType: WritingType, lang: LanguageVariant): string {
  const isBm = lang !== LanguageVariant.ENGLISH;

  const probes: Partial<Record<WritingType, string>> = {
    [WritingType.KARANGAN]: isBm
      ? 'Ok, belum ada idea lagi — itu normal. Cuba baca tajuk tu sekali lagi dengan perlahan. Apa satu perkataan pertama yang datang dalam kepala kamu?'
      : 'No ideas yet — that\'s normal. Read the title slowly one more time. What is the very first word that comes to mind?',
    [WritingType.KOMSAS]: isBm
      ? 'Untuk analisis sastera, mula dengan perasaan: selepas baca teks tu, apa yang kamu rasa? Suka? Marah? Sedih? Kenapa?'
      : 'For literary analysis, start with feeling: after reading the text, what did you feel? Why?',
    [WritingType.SEJARAH]: isBm
      ? 'Untuk esei sejarah, mula dengan bertanya: siapa yang terlibat, apa yang berlaku, dan yang paling penting — kenapa ia berlaku? Cuba jawab tiga soalan tu dulu.'
      : 'For a history essay, start by asking: who was involved, what happened, and most importantly — why did it happen? Try answering those three questions first.',
    [WritingType.PERIBAHASA]: isBm
      ? 'Untuk peribahasa, mula dengan situasi: bila kamu pernah nampak maksud peribahasa ni dalam kehidupan sebenar?'
      : 'For proverbs, start with a situation: when have you seen this proverb\'s meaning in real life?',
  };

  return probes[writingType] ?? (isBm
    ? 'Ok, belum ada idea — itu biasa. Cuba beritahu ADAM: tajuk atau arahan tugasan kamu tu apa? Kita mula dari situ.'
    : 'No ideas yet — that\'s fine. Tell ADAM: what is the title or task instruction? We\'ll start from there.');
}

export function buildScaffoldPrompt(writingType: WritingType, lang: LanguageVariant): string {
  const isBm = lang !== LanguageVariant.ENGLISH;

  const scaffolds: Partial<Record<WritingType, string>> = {
    [WritingType.KARANGAN]: isBm
      ? 'Bagus, ada idea. Sekarang cuba senaraikan tiga isi utama kamu — dalam bentuk point ringkas, bukan ayat penuh lagi. Apa tiga perkara yang kamu nak sampaikan?'
      : 'Good, you have ideas. Now list your three main points — just short bullet points, not full sentences yet. What three things do you want to say?',
    [WritingType.LAPORAN]: isBm
      ? 'Untuk laporan, struktur asasnya: (1) latar belakang, (2) dapatan/penemuan, (3) cadangan. Kamu ada maklumat untuk bahagian mana sekali?'
      : 'For a report, the basic structure is: (1) background, (2) findings, (3) recommendations. Which section do you already have information for?',
    [WritingType.ESEI]: isBm
      ? 'Untuk esei yang kukuh, kamu perlukan: (1) thesis yang jelas, (2) tiga hujah dengan bukti, (3) counter-argument, (4) kesimpulan. Mula dengan thesis — dalam satu ayat, apa pendirian kamu?'
      : 'For a strong essay, you need: (1) a clear thesis, (2) three arguments with evidence, (3) a counter-argument, (4) conclusion. Start with the thesis — in one sentence, what is your position?',
    [WritingType.SEJARAH]: isBm
      ? 'Untuk esei sejarah: (1) konteks, (2) kronologi peristiwa, (3) analisis sebab dan akibat, (4) kesimpulan. Bahagian mana kamu dah ada nota?'
      : 'For history essays: (1) context, (2) chronology, (3) cause-and-effect analysis, (4) conclusion. Which section do you already have notes for?',
  };

  return scaffolds[writingType] ?? (isBm
    ? 'Ok kamu ada idea. Sekarang cuba susun: apa yang kamu nak letak di bahagian pertama, tengah, dan akhir? Tulis dalam satu baris je untuk setiap bahagian.'
    : 'You have ideas. Now arrange them: what goes at the beginning, middle, and end? Write just one line for each section.');
}

export function buildAmbiguousProbe(lang: LanguageVariant): string {
  const isBm = lang !== LanguageVariant.ENGLISH;
  return isBm
    ? 'Boleh cerita sikit — kamu tengah buat apa sekarang? Ada tugasan penulisan, nak check tatabahasa, atau ada benda lain?'
    : 'Can you tell me more — what are you working on right now? Is it a writing task, grammar check, or something else?';
}
