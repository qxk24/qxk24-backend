/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { sanitizeAdamProseDashBridges } from '../src/adam/adam-prose-sanitize';

describe('adam-prose-sanitize', () => {
  it('replaces em dash bridges with comma', () => {
    expect(sanitizeAdamProseDashBridges('Hello — world')).toBe('Hello, world');
  });

  it('collapses duplicate commas', () => {
    expect(sanitizeAdamProseDashBridges('A — B — C')).toBe('A, B, C');
  });
});
