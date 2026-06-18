/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Current Affairs Test
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-14
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
  buildCurrentAffairsPrefetchPrompt,
  repairStaleOfficeHolderOutput,
  stripCurrentAffairsCoachingTail,
} from '../src/adam/adam-current-affairs';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard';
import { resolveUsersStreamSurface } from '../src/adam/adam-users-output-guard';

const USER_EXACT_BAD_REPLY_V2 =
  'Bismillahirahmanirrahim. \n\nPresiden Indonesia saat ini ialah **Joko Widodo**, yang memegang jawatan sejak 20 Oktober 2014. Beliau telah menjalani dua penggal — penggal pertama (2014–2019) dan penggal kedua (2019–2024). \n\nNamun, berdasarkan hasil Pemilihan Umum 2024, **Prabowo Subianto** telah dilantik sebagai Presiden Republik Indonesia ke-8, bermula pada **20 Oktober 2024**, setelah mengambil sumpah di hadapan Majlis Permusyawaratan Rakyat (MPR). \n\nBeliau menjalankan tugas bersama Wakil Presiden **Gibran Rakabuming Raka**, anak lelaki Joko Widodo. \n\nJika QA ingin tahu tentang latar belakang, visi kerajaan baharu, atau bagaimana proses pelantikan berlangsung dari sudut undang-undang atau prinsip Alamtologi — saya sedia jelaskan dengan tenang dan jelas.';

const BAD_INDONESIA_PRESIDENT_REPLY = [
  'Presiden Republik Indonesia saat ini ialah **Ir. H. Joko Widodo**, yang menjalani penggal kedua.',
  'Namun, pasangan terpilih 2024–2029 ialah Ir. H. Prabowo Subianto sebagai Presiden.',
  'Jadi, sejak 20 Oktober 2024, presiden Indonesia yang sah ialah Bapak Prabowo Subianto.',
  'Jika QA ingin, saya boleh bantu jelaskan proses pelantikan dan hikmah di balik peralihan kepemimpinan ini.',
].join('\n\n');

describe('ADAM current affairs', () => {
  it('sharpens prefetch prompt for office-holder questions', () => {
    const prompt = buildCurrentAffairsPrefetchPrompt('Siapa presiden Indonesia sekarang?');
    expect(prompt).toMatch(/IN OFFICE NOW|office-holder as of today/i);
    expect(prompt).toMatch(/Siapa presiden Indonesia/);
  });

  it('repairs stale Jokowi-as-current lead when Prabowo is named', () => {
    const fixed = repairStaleOfficeHolderOutput(
      BAD_INDONESIA_PRESIDENT_REPLY,
      'Siapa presiden Indonesia sekarang?',
    );
    expect(fixed).toMatch(/Prabowo Subianto/);
    expect(fixed).toMatch(/20 Oktober 2024/);
    expect(fixed).not.toMatch(/saat ini.*Jokowi|Jokowi.*saat ini/i);
    expect(fixed).not.toMatch(/Jika QA ingin/i);
  });

  it('strips coaching tail on simple president ask via student guard', () => {
    const out = sanitizeUsersOutputSync(
      BAD_INDONESIA_PRESIDENT_REPLY,
      'Siapa presiden Indonesia sekarang?',
    );
    expect(out).not.toMatch(/Jika QA ingin/i);
    expect(out).not.toMatch(/hikmah di balik/i);
  });

  it('stripCurrentAffairsCoachingTail removes constitutional offer paragraphs', () => {
    const out = stripCurrentAffairsCoachingTail(
      BAD_INDONESIA_PRESIDENT_REPLY,
      'Who is the president of Indonesia?',
    );
    expect(out).not.toMatch(/Jika QA ingin/i);
  });

  it('strips philosophical RUANG/BUMI coaching on president ask', () => {
    const philosophical = [
      'Presiden Republik Indonesia saat ini ialah Ir. H. Prabowo Subianto.',
      'Undang Dasar 1945. Jika Guest ingin tahu: bagaimana proses pelantikan presiden berlaku dalam kerangka amānah dan mīzān,. Mengapa sistem presidensi memerlukan keteguhan ruang (RUANG), ketenangan bumi (BUMI), dan kejelasan cahaya (CAHAYA),. Atau bagaimana "siapa" yang memimpin bukan sekadar soalan jawatan, tetapi soalan *kemampuan menahan MASA dengan TENAGA yang beradab*, saya sedia kongsikan, bukan sebagai fakta semata, tetapi sebagai satu ruang untuk memahami kepimpinan sebagai amānah, bukan kuasa.',
    ].join('\n\n');
    const out = sanitizeUsersOutputSync(philosophical, 'Siapa presiden Indonesia sekarang?');
    expect(out).toMatch(/Prabowo Subianto/);
    expect(out).not.toMatch(/keteguhan ruang/i);
    expect(out).not.toMatch(/Jika Guest ingin/i);
    expect(out).not.toMatch(/\*\*/);
  });

  it('stripConsumerMarkdownEmphasis removes bold markers', async () => {
    const { stripConsumerMarkdownEmphasis } = await import('../src/adam/adam-users-output-law');
    expect(stripConsumerMarkdownEmphasis('**Prabowo Subianto** dilantik **20 Oktober 2024**.'))
      .toBe('Prabowo Subianto dilantik 20 Oktober 2024.');
  });

  it('repairs user-reported Indonesia president reply end-to-end', () => {
    const question = 'Siapa presiden Indonesia sekarang?';
    const surface = sanitizeUsersOutputSync(USER_EXACT_BAD_REPLY_V2, question);
    const resolved = resolveUsersStreamSurface(USER_EXACT_BAD_REPLY_V2, surface, {
      preferSanitized: true,
    });

    expect(surface).toMatch(/Prabowo Subianto/);
    expect(surface).not.toMatch(/Bismillah/i);
    expect(surface).not.toMatch(/\*\*/);
    expect(surface).not.toMatch(/saat ini.*Jokowi|Jokowi.*saat ini/i);
    expect(surface).not.toMatch(/Alamtologi/i);
    expect(resolved.fullResponse).toBe(surface);
    expect(resolved.streamReplace).toBe(surface);
  });
});
