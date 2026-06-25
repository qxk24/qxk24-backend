import { beginAdamBrainRiver } from '../src/adam/adam-brain-river';
import { buildAdamUiPlanPayload } from '../src/adam/adam-ui-plan';
import { resolveFounderTeachingFlags } from '../src/adam/adam-chat-stream-turn-context';

function makeRiver(message: string) {
  const teachingFlags = resolveFounderTeachingFlags({
    isFounder:               false,
    mode:                    'QUESTIONING',
    normalizedMessage:       message,
    hasTeachingUpload:       false,
    recentAssistantMessages: [],
    recentUserMessages:      [],
  });
  return beginAdamBrainRiver({
    isFounder:    false,
    mode:         'QUESTIONING',
    userMessage:  message,
    teachingFlags,
  });
}

describe('buildAdamUiPlanPayload — F1 UI planner', () => {
  it('skips search when brain recall is stable', () => {
    const river = makeRiver('Apa itu fotosintesis?');
    const payload = buildAdamUiPlanPayload({
      river,
      brainRecallLoaded: true,
      brainRecallStable: true,
      webSearchReason:   'factual',
    });
    const searchStep = payload.steps.find((s) => s.id === 'search-skip');
    expect(searchStep?.status).toBe('skipped');
    expect(searchStep?.label).toMatch(/Brain-first/i);
    expect(payload.phase).toBe('F1');
  });

  it('activates web verification when search gate opens', () => {
    const river = makeRiver('Harga minyak Malaysia hari ini?');
    const payload = buildAdamUiPlanPayload({
      river,
      brainRecallLoaded: false,
      brainRecallStable: false,
      webSearchReason:   'current-affairs',
    });
    const searchStep = payload.steps.find((s) => s.id === 'search');
    expect(searchStep?.status).toBe('active');
    expect(searchStep?.label).toMatch(/web/i);
  });

  it('marks no search when gate is closed', () => {
    const river = makeRiver('Terima kasih ADAM');
    const payload = buildAdamUiPlanPayload({
      river,
      brainRecallLoaded: false,
      brainRecallStable: false,
      webSearchReason:   null,
    });
    const skip = payload.steps.find((s) => s.id === 'search-skip');
    expect(skip?.status).toBe('skipped');
    expect(skip?.label).toMatch(/No web search/i);
  });
});
