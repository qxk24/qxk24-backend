import {
  extractMailDomain,
  resolveMailReplyToForDomains,
} from '../src/adam/adam-mail.service';

describe('adam mail reply-to alignment', () => {
  it('extractMailDomain parses display-name from addresses', () => {
    expect(extractMailDomain('ADAM Tutor <info@updates.alamtologi.com>')).toBe('updates.alamtologi.com');
    expect(extractMailDomain('info@alamtologi.com')).toBe('alamtologi.com');
  });

  it('aligns env reply-to to verified FROM subdomain', () => {
    expect(resolveMailReplyToForDomains(
      'ADAM Tutor <info@updates.alamtologi.com>',
      'info@alamtologi.com',
    )).toBe('info@updates.alamtologi.com');
  });

  it('keeps matching reply-to domain', () => {
    expect(resolveMailReplyToForDomains(
      'ADAM Tutor <info@updates.alamtologi.com>',
      'support@updates.alamtologi.com',
    )).toBe('support@updates.alamtologi.com');
  });
});
