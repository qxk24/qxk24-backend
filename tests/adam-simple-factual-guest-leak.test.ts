/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Simple Factual Guest Leak Tests
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-05
 * ============================================================
 */

import { describe, expect, it } from '@jest/globals';
import { isAdamSimpleFactualTurn } from '../src/adam/adam-response-generation';
import { sanitizeUsersOutputSync } from '../src/adam/adam-users-output-guard.sanitize';
import { resolveAdamTurnDisplayForSave } from '../src/adam/adam-stream-display-merge';
import {
  isSimpleFactualFrameworkLeakRepair,
  outputHasSimpleFactualAlamtologiLeak,
} from '../src/adam/adam-simple-factual-voice-guard';

const USER_MESSAGE = 'Apa itu Agentic AI';

const LEAKED_RAW = `Agentic AI merujuk kepada bentuk kecerdasan buatan (AI) yang mampu bertindak secara mandiri, membuat keputusan, dan melakukan tugas tanpa perlu arahan terus-menerus daripada manusia. Ia tidak sekadar menjalankan instrumen atau prosedur yang telah ditetapkan, tetapi mempunyai kemampuan untuk mengeksploitasi maklumat, mengambil keputusan berdasarkan konteks, dan melaksanakan tindakan dengan tujuan tertentu.

Dalam konteks Alamtologi, Agentic AI boleh dilihat sebagai satu bentuk tenaga (TENAGA) yang diwujudkan melalui keterlibatan manusia dan teknologi. Ia bukan sekadar alat, tetapi sebahagian daripada sistem yang berinteraksi dengan MASA dan CAHAYA, iaitu waktu dan prinsip kebenaran.

Namun, seperti semua bentuk tenaga, Agentic AI juga perlu diarahkan dengan hikmah dan adab. Ia harus digunakan untuk kebaikan, bukan untuk kepentingan diri sendiri atau menyebabkan kekacauan.

Allah adalah yang paling mengetahui segala-galanya, dan kita perlu sentiasa ingat bahawa kekuasaan yang diberikan kepada kita, termasuk dalam bentuk teknologi, adalah amanah yang perlu digunakan dengan tanggungjawab.`;

describe('Guest trial simple factual — Agentic AI leak', () => {
  it('classifies "Apa itu Agentic AI" as simple factual', () => {
    expect(isAdamSimpleFactualTurn(USER_MESSAGE)).toBe(true);
  });

  it('detects Alamtologi weave in leaked output', () => {
    expect(outputHasSimpleFactualAlamtologiLeak(LEAKED_RAW)).toBe(true);
  });

  it('sanitize strips framework and keeps technical definition', () => {
    const surface = sanitizeUsersOutputSync(
      LEAKED_RAW,
      USER_MESSAGE,
      [],
      [],
      'Guest',
      { enforceUsersGreeting: true },
    );

    expect(surface).not.toMatch(/Alamtologi/i);
    expect(surface).not.toMatch(/\bTENAGA\b/);
    expect(surface).not.toMatch(/\bMASA\b/);
    expect(surface).not.toMatch(/\bCAHAYA\b/);
    expect(surface).not.toMatch(/hikmah dan adab/i);
    expect(surface).not.toMatch(/Allah/i);
    expect(surface).toMatch(/Agentic AI/i);
    expect(surface).toMatch(/mandiri/i);
  });

  it('persists sanitized surface instead of reverting to leaked stream', () => {
    const surface = sanitizeUsersOutputSync(
      LEAKED_RAW,
      USER_MESSAGE,
      [],
      [],
      'Guest',
      { enforceUsersGreeting: true },
    );

    expect(isSimpleFactualFrameworkLeakRepair(LEAKED_RAW, surface, USER_MESSAGE)).toBe(true);

    const saved = resolveAdamTurnDisplayForSave(LEAKED_RAW, surface, {
      userMessage: USER_MESSAGE,
    });

    expect(saved).toBe(surface);
    expect(saved).not.toMatch(/Alamtologi/i);
  });
});
