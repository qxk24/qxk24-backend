/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { deriveSessionTitleFromMessage } from '../src/adam/adam-chat-session.service';

describe('deriveSessionTitleFromMessage', () => {
  it('uses first sentence trimmed', () => {
    expect(deriveSessionTitleFromMessage('Cara buat hiperpautan Doc')).toBe(
      'Cara buat hiperpautan Doc',
    );
  });

  it('truncates long titles', () => {
    const long = 'A'.repeat(100);
    const title = deriveSessionTitleFromMessage(long);
    expect(title.length).toBeLessThanOrEqual(72);
    expect(title.endsWith('…')).toBe(true);
  });

  it('returns New chat for empty', () => {
    expect(deriveSessionTitleFromMessage('   ')).toBe('New chat');
  });
});
