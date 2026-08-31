import { describe, expect, it } from 'vitest';

import { STORE_DEFINITION_SCHEMA_VERSION } from './index';

describe('@xandevo/shared', () => {
  it('exposes the supported Store Definition schema version', () => {
    expect(STORE_DEFINITION_SCHEMA_VERSION).toBe(1);
  });
});
