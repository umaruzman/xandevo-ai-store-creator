import {
  buildStoreDefinition,
  sequentialIdFactory,
  validStoreDefinitionInput,
} from '@xandevo/shared';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders as render } from '@/test/render';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { GenerateResult } from '@/app/(dashboard)/stores/new/actions';
import { useBuilderStore } from '@/lib/store/builder';

const generateStoreAction = vi.fn<(prev: unknown, fd: FormData) => Promise<GenerateResult>>();
vi.mock('@/app/(dashboard)/stores/new/actions', () => ({
  generateStoreAction: (prev: unknown, fd: FormData) => generateStoreAction(prev, fd),
}));

import { CreateStoreFlow } from './create-store-flow';

const definition = buildStoreDefinition(validStoreDefinitionInput(), {
  idFactory: sequentialIdFactory(),
});

describe('CreateStoreFlow', () => {
  afterEach(() => {
    useBuilderStore.getState().reset();
    vi.clearAllMocks();
  });

  it('generates, loads the definition and shows the live preview', async () => {
    generateStoreAction.mockResolvedValue({
      ok: true,
      data: { definition, promptVersion: 'store@v1', usage: { inputTokens: 0, outputTokens: 0 } },
      prompt: 'a store',
    });

    render(<CreateStoreFlow />);
    await userEvent.type(
      screen.getByLabelText('Describe your store'),
      'a luxury perfume store for UAE customers',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Generate store' }));

    await waitFor(() =>
      expect(screen.getByRole('group', { name: 'Preview width' })).toBeInTheDocument(),
    );
    expect(screen.getAllByText('Maison Oud').length).toBeGreaterThan(0);
    expect(useBuilderStore.getState().definition?.meta.name).toBe('Maison Oud');
    expect(useBuilderStore.getState().generation.status).toBe('success');
  });

  it('surfaces a generation error and stays on the form', async () => {
    generateStoreAction.mockResolvedValue({
      ok: false,
      error: 'The AI service is busy right now.',
    });

    render(<CreateStoreFlow />);
    await userEvent.type(
      screen.getByLabelText('Describe your store'),
      'a minimal stationery store',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Generate store' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('The AI service is busy right now.'),
    );
    expect(screen.queryByRole('group', { name: 'Preview width' })).not.toBeInTheDocument();
    expect(useBuilderStore.getState().generation.status).toBe('error');
  });

  it('"Start over" clears the builder store and returns to the form', async () => {
    generateStoreAction.mockResolvedValue({
      ok: true,
      data: { definition, promptVersion: 'store@v1', usage: { inputTokens: 0, outputTokens: 0 } },
      prompt: 'a store',
    });
    render(<CreateStoreFlow />);
    await userEvent.type(screen.getByLabelText('Describe your store'), 'a tech gadget store');
    await userEvent.click(screen.getByRole('button', { name: 'Generate store' }));
    await waitFor(() => screen.getByRole('group', { name: 'Preview width' }));

    await userEvent.click(screen.getByRole('button', { name: 'Start over' }));
    expect(screen.getByLabelText('Describe your store')).toBeInTheDocument();
    expect(useBuilderStore.getState().definition).toBeNull();
  });
});
