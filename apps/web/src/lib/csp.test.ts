// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { buildCsp } from './csp';

describe('buildCsp', () => {
  it('is nonce-based and strict in production', () => {
    const csp = buildCsp('abc123', false);
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("img-src 'self' data: https:");
  });

  it('relaxes script-src for the dev server (HMR needs eval)', () => {
    const csp = buildCsp('abc123', true);
    expect(csp).toContain("script-src 'self' 'unsafe-eval' 'unsafe-inline'");
    expect(csp).not.toContain('nonce-');
  });

  it('allows inline styles (storefront theme uses style={})', () => {
    expect(buildCsp('n', false)).toContain("style-src 'self' 'unsafe-inline'");
  });
});
