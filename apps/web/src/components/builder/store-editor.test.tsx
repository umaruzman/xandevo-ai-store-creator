import {
  buildStoreDefinition,
  sequentialIdFactory,
  validStoreDefinitionInput,
} from '@xandevo/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { selectIsDirty, useBuilderStore } from '@/lib/store/builder';

import { StoreEditor } from './store-editor';

const seed = () =>
  useBuilderStore.getState().setGenerated({
    definition: buildStoreDefinition(validStoreDefinitionInput(), {
      idFactory: sequentialIdFactory(),
    }),
    promptVersion: 'store@v1',
  });

describe('StoreEditor (editor ↔ live preview)', () => {
  beforeEach(seed);
  afterEach(() => useBuilderStore.getState().reset());

  it('editing the hero headline updates the preview and the dirty badge', async () => {
    render(<StoreEditor onStartOver={() => {}} />);
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();

    const headline = screen.getByLabelText('Headline');
    await userEvent.clear(headline);
    await userEvent.type(headline, 'Rare Arabian Oud');

    // preview (StoreRenderer) reflects the new value
    expect(screen.getByRole('heading', { level: 1, name: 'Rare Arabian Oud' })).toBeInTheDocument();
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(selectIsDirty(useBuilderStore.getState())).toBe(true);
  });

  it('reordering a section changes the preview order', async () => {
    render(<StoreEditor onStartOver={() => {}} />);
    const home = useBuilderStore.getState().definition!.pages.find((p) => p.slug === 'home')!;
    const firstType = [...home.sections].sort((a, b) => a.order - b.order)[0]!.type;

    await userEvent.click(screen.getByRole('button', { name: `Move ${firstType} down` }));

    const after = useBuilderStore.getState().definition!.pages.find((p) => p.slug === 'home')!;
    expect([...after.sections].sort((a, b) => a.order - b.order)[0]!.type).not.toBe(firstType);
  });

  it('warns when text/background contrast drops below AA', async () => {
    render(<StoreEditor onStartOver={() => {}} />);
    const bg = screen.getByLabelText('Background'); // the hex text input
    await userEvent.clear(bg);
    await userEvent.type(bg, '#111111'); // near-black bg with the fixture's dark text
    expect(screen.getByText(/below the 4.5:1 minimum/)).toBeInTheDocument();
  });
});
