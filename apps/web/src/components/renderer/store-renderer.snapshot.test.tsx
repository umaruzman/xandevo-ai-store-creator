import {
  buildStoreDefinition,
  sequentialIdFactory,
  validStoreDefinitionInput,
} from '@xandevo/shared';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StoreRenderer } from './store-renderer';

describe('StoreRenderer snapshot', () => {
  it('matches the reference definition (home page)', () => {
    const definition = buildStoreDefinition(validStoreDefinitionInput(), {
      idFactory: sequentialIdFactory(),
    });
    const { container } = render(<StoreRenderer definition={definition} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
