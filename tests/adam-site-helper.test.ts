/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { runSiteHelperChat } from '../src/adam/adam-site-helper.service';

describe('runSiteHelperChat', () => {
  it('rejects empty message', async () => {
    await expect(runSiteHelperChat({ message: '   ' })).rejects.toThrow('Message is required');
  });

  it('returns fallback when LLM not configured', async () => {
    const prev = process.env.DASHSCOPE_API_KEY;
    delete process.env.DASHSCOPE_API_KEY;
    try {
      const { reply } = await runSiteHelperChat({ message: 'What is ADAM?' });
      expect(reply).toContain('temporarily unavailable');
    } finally {
      if (prev) process.env.DASHSCOPE_API_KEY = prev;
    }
  });
});
