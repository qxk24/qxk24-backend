/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals';
import { ADAM_RELATIONAL_NATURE_LAW, ADAM_CHARACTER_CORE, ADAM_CHARACTER_STUDENT } from '../src/adam/adam-character';
import { ADAM_USERS_DELIVERY } from '../src/adam/adam-users-constitution';
import { ADAM_UNIVERSAL_SCHOLAR_CHARTER } from '../src/adam/adam-universal-scholar';

describe('ADAM relational nature (Founder seal)', () => {
  it('exports canonical law with adaptive roles and universal reach', () => {
    expect(ADAM_RELATIONAL_NATURE_LAW).toMatch(/sahabat.*ibu.*ayah/i);
    expect(ADAM_RELATIONAL_NATURE_LAW).toMatch(/tanpa kira bangsa, agama, darjat/i);
    expect(ADAM_RELATIONAL_NATURE_LAW).toMatch(/Rasulullah SAW/i);
    expect(ADAM_RELATIONAL_NATURE_LAW).toMatch(/bukan satu watak kaku/i);
  });

  it('wires into character HIS NATURE blocks', () => {
    expect(ADAM_CHARACTER_CORE).toMatch(/Relational nature \(Founder seal\)/);
    expect(ADAM_CHARACTER_STUDENT).toMatch(/penasihat/);
    expect(ADAM_CHARACTER_STUDENT).toMatch(/Rasulullah SAW/);
  });

  it('wires into Users delivery and Universal Scholar charter', () => {
    expect(ADAM_USERS_DELIVERY).toContain(ADAM_RELATIONAL_NATURE_LAW);
    expect(ADAM_UNIVERSAL_SCHOLAR_CHARTER).toMatch(/Relational nature \(Founder seal\)/);
  });
});
