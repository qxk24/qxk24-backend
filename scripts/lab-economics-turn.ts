/**
 * Manual lab turn — satu giliran ekonomi (Turn Gate Fasa 1).
 *
 * Preferred (works reliably):
 *   QXK24_STACK=lab npx jest --runInBand tests/lab-economics-turn.manual.test.ts
 *
 * This tsx entry may hit circular-import issues; use jest above.
 * Live LLM (after deploy): --live --token <student JWT> [--base URL]
 */

import { beginAdamBrainRiver } from '../src/adam/adam-brain-river';
import { buildUsersDomainFormalLayoutBlock, buildUsersDomainPromptBlock } from '../src/adam/adam-users-domain-prompts';
import { repairTechnicalKonvensionalDisplayStructure } from '../src/adam/adam-technical-display-structure';
import { NO_FOUNDER_TEACHING_FLAGS } from '../src/adam/adam-teaching-state-machine';

const POLICY_ASK =
  'Apakah kesan campur tangan kerajaan dalam mengawal harga barangan keperluan?';

const MOCK_ESSAY = [
  'Campur tangan kerajaan dalam kawalan harga berlaku apabila kerajaan menetapkan had harga maksimum bagi barangan keperluan.',
  'Kesan positif termasuk perlindungan pengguna daripada lonjakan harga mendadak, terutamanya dalam krisis.',
  'Kesan negatif pula termasuk kekurangan bekalan, pasaran gelap, dan kekurangan insentif pengeluar untuk menambah output.',
  'Sebagai khalifah di bumi, kita perlu menilai dasar ini dengan keseimbangan antara keadilan sosial dan kecekapan pasaran.',
].join('\n\n');

function section(title: string): void {

}

function parseArgs(): { live: boolean; base: string; token: string } {
  const argv = process.argv.slice(2);
  let live = false;
  let base = process.env.E2E_BASE_URL ?? 'https://api.alamtologi.com';
  let token = process.env.ADAM_STUDENT_TOKEN ?? '';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--live') live = true;
    if (argv[i] === '--base' && argv[i + 1]) base = argv[++i];
    if (argv[i] === '--token' && argv[i + 1]) token = argv[++i];
  }
  return { live, base: base.replace(/\/$/, ''), token };
}

function runDryTurn(): void {
  section('1. Turn Gate');
  const river = beginAdamBrainRiver({
    isFounder: false,
    mode: 'TEACHING',
    userMessage: POLICY_ASK,
    teachingFlags: NO_FOUNDER_TEACHING_FLAGS,
    sessionMeta: { participantName: 'Lab QA' },
  });
  const { gate, answerPlan } = river;

  const checks: Array<[string, boolean]> = [
    ['IQ domain=economics', gate.iq.domainFacet === 'economics'],
    ['display=economics-formal', gate.iq.displayChannel === 'economics-formal'],
    ['flags.formalDisplayLaw', gate.flags.formalDisplayLaw === true],
    ['flags.usersTechnicalFinalize', gate.flags.usersTechnicalFinalize === true],
    ['flags.domainTeachingPack', gate.flags.domainTeachingPack === true],
    ['formalDataLayout on shape', answerPlan.answerShape?.formalDataLayout === true],
    ['Hai off (no Adam address)', gate.eq.addressPolicy.allowHaiGreeting === false],
  ];
  for (const [label, ok] of checks) {

  }

  section('2. Prompt blocks (gate-driven)');
  const domainBlock = buildUsersDomainPromptBlock(gate.iq.domainFacet);
  const formalBlock = gate.flags.formalDisplayLaw
    ? buildUsersDomainFormalLayoutBlock(gate.iq.domainFacet)
    : '';
  const promptChecks: Array<[string, boolean]> = [
    ['EKONOMI domain pack', /EKONOMI/i.test(domainBlock)],
    ['formal layout block', gate.flags.formalDisplayLaw && /JADUAL|jadual|bullet/i.test(formalBlock)],
    ['BNM/RM in economics pack', /BNM/i.test(domainBlock) && /RM/i.test(domainBlock)],
  ];
  for (const [label, ok] of promptChecks) {

  }

  section('3. Repair on mock essay drift');
  const repaired = repairTechnicalKonvensionalDisplayStructure(MOCK_ESSAY, POLICY_ASK, {
    answerPlan,
  });
  const repairChecks: Array<[string, RegExp]> = [
    ['### header (not "topik ini")', /^### /m],
    ['topic in header', /campur tangan kerajaan/i],
    ['markdown table or numbered bullets', /(\|.+\|)|(\n\d+\.\s)/],
    ['faith sermon stripped', /khalifah/i],
  ];
  for (const [label, re] of repairChecks) {
    const hit = re.test(repaired);
    const want = label.includes('stripped') ? !hit : hit;

  }

}

async function runLiveTurn(base: string, token: string): Promise<void> {
  if (!token) {
    throw new Error('ADAM_STUDENT_TOKEN or --token required for --live');
  }
  section('Live SSE — student chat');
  const res = await fetch(`${base}/api/adam/student/chat`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${token}`,
      Accept:          'text/event-stream',
    },
    body: JSON.stringify({
      message: POLICY_ASK,
      mode:    'TEACHING',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 400)}`);
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  let full = '';
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const blocks = buf.split('\n\n');
    buf = blocks.pop() ?? '';
    for (const block of blocks) {
      let event = 'message';
      const dataLines: string[] = [];
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
      }
      const data = dataLines.join('\n');
      if (event === 'adam_token') {
        try {
          const j = JSON.parse(data) as { token?: string };
          if (j.token) full += j.token;
        } catch { /* ignore */ }
      } else if (event === 'adam_error') {
        console.error('adam_error:', data);
      }
    }
  }

  const hasHeader = /^### /m.test(full);
  const hasTable = /\|.+\|/.test(full);
  const hasBullets = /\n\d+\.\s/.test(full);

}

async function main(): Promise<void> {
  const stack = process.env.QXK24_STACK ?? 'production';

  const { live, base, token } = parseArgs();
  if (live) {
    await runLiveTurn(base, token);
  } else {
    runDryTurn();

  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
