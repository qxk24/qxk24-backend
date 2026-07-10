import {
  synthesizeConstitution,
  buildSynthesisContent,
  weaveMasterUnderstanding,
  graphFromActiveFamilies,
} from '../../../src/qxk24brain/deep-ul/constitutional-synthesizer';
import { recognizeTeaching } from '../../../src/qxk24brain/deep-ul/recognition-engine';
import { parseTeachingPrinciples } from '../../../src/qxk24brain/deep-ul/parse-teaching-principles';
import { Principle } from '../../../src/qxk24brain/deep-ul/ontology';
import {
  generateJournal,
  generateJournalSection,
  type DailyEpisode,
} from '../../../src/qxk24brain/deep-ul/episodic-aggregator';
import {
  weaveContext,
  inferFocusPrinciple,
} from '../../../src/qxk24brain/deep-ul/context-weaver';
import { synthesizeDialogue } from '../../../src/qxk24brain/deep-ul/dialogue-synthesizer';

describe('Deep UL — constitutional synthesizer', () => {
  it('merges teaching principles into ontology graph', () => {
    const principles = parseTeachingPrinciples('TENAGA execution and RUANG boundaries');
    const recognition = recognizeTeaching(
      'TENAGA execution and RUANG boundaries',
      [],
    );
    const entityC = synthesizeConstitution(
      {
        masterUnderstanding: 'Initial ADAM state',
        ontologyGraph:       graphFromActiveFamilies([]),
      },
      {
        teachingContent:     'TENAGA execution and RUANG boundaries',
        extractedPrinciples: principles,
      },
    );

    expect(entityC.updatedGraph.length).toBeGreaterThan(0);
    expect(entityC.newUnderstanding).toContain('TENAGA');
    expect(recognition.principle).toBe(Principle.TENAGA);

    const synthesis = buildSynthesisContent(
      'Initial ADAM state',
      'TENAGA execution and RUANG boundaries',
      recognition,
      entityC,
    );
    expect(synthesis.newStage).toBe(1);
    expect(synthesis.content).toContain('Entity B');

    const master = weaveMasterUnderstanding(
      'Initial ADAM state',
      synthesis.content,
      recognition.family,
    );
    expect(master).toContain('Initial ADAM state');
    expect(master).toContain('Constitutional merge');
  });
});

describe('Deep UL — episodic aggregator', () => {
  const episodes: DailyEpisode[] = [
    {
      timestamp: '2026-07-10T08:00:00.000Z',
      action:    'scan codebase',
      principle: Principle.TENAGA,
      outcome:   'success',
    },
    {
      timestamp: '2026-07-10T09:00:00.000Z',
      action:    'boundary audit',
      principle: Principle.RUANG,
      outcome:   'learning',
    },
  ];

  it('generates deterministic daily journal', () => {
    const journal = generateJournal(episodes, 'Alamtologi');
    expect(journal).toContain('TENAGA');
    expect(journal).toContain('scan codebase');
    expect(journal).toContain('RUANG');
  });

  it('generates section content meeting minimum word count', () => {
    const section = generateJournalSection(
      'abstract',
      episodes,
      'Universal Language',
      'Phase 10 Journal',
    );
    const wordCount = section.trim().split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBeGreaterThanOrEqual(150);
    expect(section).toContain('Abstract');
  });
});

describe('Deep UL — dialogue synthesizer', () => {
  it('synthesizes founder health query with principle focus', () => {
    const graph = [
      { filePath: 'master', symbolName: 'svc', principle: Principle.RUANG, connections: [] },
      { filePath: 'master', symbolName: 'job', principle: Principle.TENAGA, connections: [] },
    ];

    const response = synthesizeDialogue({
      userMessage:   "How is my project's health?",
      persona:       'founder',
      contextBlocks: ['[LONG_TERM] unified graph loaded'],
      ontologyGraph: graph,
      participantName: 'Masa Bayu',
    });

    expect(response.intent).toBe('HEALTH_QUERY');
    expect(response.principleFocus).toContain(Principle.TENAGA);
    expect(response.text).toContain('RUANG');
    expect(response.text).toContain('TENAGA');
    expect(response.confidence).toBeGreaterThan(0.9);
  });

  it('synthesizes coach architecture guidance', () => {
    const response = synthesizeDialogue({
      userMessage:   'Review the service layer boundaries',
      persona:       'coach',
      contextBlocks: [],
      ontologyGraph: [
        { filePath: 'master', symbolName: 'api', principle: Principle.API, connections: [] },
      ],
    });

    expect(response.intent).toBe('ARCHITECTURE_QUERY');
    expect(response.text.toLowerCase()).toContain('ruang');
  });
});

describe('Deep UL — context weaver', () => {
  it('assembles ontological context block', () => {
    const context = weaveContext(
      {
        working:   ['user: hello', 'assistant: ready'],
        shortTerm: 'session digest',
        longTerm:  'master understanding',
      },
      inferFocusPrinciple('architect the RUANG layer'),
    );

    expect(context).toContain('<adam_context>');
    expect(context).toContain('[LONG_TERM] master understanding');
    expect(context).toContain('[FOCUS]');
    expect(context).toContain('RUANG');
  });
});

describe('Deep UL — Phase 12 extractors', () => {
  it('extracts episode metadata deterministically', () => {
    const { extractEpisodeDeterministically } = require('../../../src/qxk24brain/deep-ul/episode-extractor');
    const episode = extractEpisodeDeterministically(
      'How do I fix this database error?',
      'The issue was resolved by repairing the state flow handler.',
    );

    expect(episode.intent).toBe('PROBLEM_RESOLUTION');
    expect(episode.outcome).toBe('RESOLVED');
    expect(episode.principlesTouched).toContain(Principle.BUMI);
    expect(episode.summary).toContain('BUMI');
  });

  it('intercepts forbidden stream tokens', () => {
    const { interceptAndSanitizeStream } = require('../../../src/qxk24brain/deep-ul/stream-interceptor');
    const sanitized = interceptAndSanitizeStream('As an AI, I think this is wrong');
    expect(sanitized).toContain('Universal Operating System');
    expect(sanitized).toContain('ontology indicates');
    expect(sanitized).not.toMatch(/as an ai/i);
  });

  it('extracts session keyframes by score', () => {
    const { extractSessionKeyframes } = require('../../../src/qxk24brain/deep-ul/keyframe-extractor');
    const keyframes = extractSessionKeyframes([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
      { role: 'user', content: 'How do I fix the database error in the architect layer?' },
    ], 2);

    expect(keyframes.length).toBe(2);
    expect(keyframes[keyframes.length - 1]).toContain('database');
  });

  it('aggregates top search snippets without rewriting', () => {
    const { aggregateSearchFacts } = require('../../../src/qxk24brain/deep-ul/fact-aggregator');
    const block = aggregateSearchFacts('university enrollment', [
      { title: 'Other', snippet: 'unrelated topic', url: 'https://a.test' },
      { title: 'Uni', snippet: 'enrollment reached 12,000 students', url: 'https://b.test' },
      { title: 'News', snippet: 'campus expansion', url: 'https://c.test' },
    ]);

    expect(block).toContain('[Verified context]');
    expect(block).toContain('12,000');
    expect(block).not.toContain('unrelated topic');
  });
});
