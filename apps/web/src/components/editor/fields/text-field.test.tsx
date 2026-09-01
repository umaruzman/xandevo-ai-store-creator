import {
  buildStoreDefinition,
  sequentialIdFactory,
  validStoreDefinitionInput,
} from '@xandevo/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useBuilderStore } from '@/lib/store/builder';

import { TextField } from './text-field';

const seed = () =>
  useBuilderStore.getState().setGenerated({
    definition: buildStoreDefinition(validStoreDefinitionInput(), {
      idFactory: sequentialIdFactory(),
    }),
    promptVersion: 'store@v1',
  });

describe('TextField', () => {
  beforeEach(seed);
  afterEach(() => useBuilderStore.getState().reset());

  it('shows the current store value and commits a valid edit live', async () => {
    render(<TextField label="Name" path={['meta', 'name']} />);
    const input = screen.getByLabelText('Name');
    expect(input).toHaveValue('Maison Oud');

    await userEvent.clear(input);
    await userEvent.type(input, 'Aurelia Parfums');
    expect(useBuilderStore.getState().definition!.meta.name).toBe('Aurelia Parfums');
  });

  it('keeps an invalid value on screen, surfaces the error, and does not commit it', async () => {
    render(<TextField label="Name" path={['meta', 'name']} />);
    const input = screen.getByLabelText('Name');

    await userEvent.clear(input); // empty violates min(1)
    expect(input).toHaveValue('');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(useBuilderStore.getState().definition!.meta.name).toBe('Maison Oud'); // unchanged
  });
});
