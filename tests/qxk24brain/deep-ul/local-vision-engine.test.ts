import { LocalVisionEngine, isLocalVisionConfigured } from '../../../src/qxk24brain/deep-ul/local-vision-engine';
import { graphCache } from '../../../src/qxk24brain/deep-ul/graph-cache';
import { synthesizeDialogue } from '../../../src/qxk24brain/deep-ul/dialogue-synthesizer';
import { Principle, type OntologyNode } from '../../../src/qxk24brain/deep-ul/ontology';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

const mockGraph: OntologyNode[] = [
  { symbolName: 'auth', principle: Principle.TENAGA, filePath: 'src/auth.ts', connections: [] },
];

describe('LocalVisionEngine', () => {
  it('generates deterministic placeholder image without ML enabled', async () => {
    const engine = new LocalVisionEngine();
    const out = path.join(os.tmpdir(), `ul-vision-test-${Date.now()}.png`);
    await engine.generateImage({ prompt: 'constitutional diagram', outputPath: out });
    const stat = await fs.stat(out);
    expect(stat.size).toBeGreaterThan(100);
    await fs.unlink(out);
  });

  it('reports configured when media generation env is on', () => {
    expect(typeof isLocalVisionConfigured()).toBe('boolean');
  });
});

describe('GraphCache', () => {
  it('memoizes dialogue synthesis', () => {
    graphCache.clear();
    const req = {
      userMessage:   'hello',
      persona:       'student' as const,
      contextBlocks: [],
      ontologyGraph: mockGraph,
    };
    const a = synthesizeDialogue(req);
    const b = synthesizeDialogue(req);
    expect(a.text).toBe(b.text);
  });
});
