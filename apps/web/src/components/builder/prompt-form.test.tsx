import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PromptForm } from './prompt-form';

describe('PromptForm', () => {
  it('labels the textarea and links the hint for a11y', () => {
    render(<PromptForm formAction={vi.fn()} isPending={false} error={null} />);
    const textarea = screen.getByLabelText('Describe your store');
    expect(textarea).toHaveAttribute('aria-describedby', 'prompt-hint');
    expect(screen.getByText(/10–1000 characters/)).toHaveAttribute('id', 'prompt-hint');
  });

  it('submits the form data to the action', async () => {
    const formAction = vi.fn();
    render(<PromptForm formAction={formAction} isPending={false} error={null} />);
    await userEvent.type(
      screen.getByLabelText('Describe your store'),
      'a luxury perfume store for the UAE',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Generate store' }));
    expect(formAction).toHaveBeenCalledTimes(1);
    const fd = formAction.mock.calls[0]![0] as FormData;
    expect(fd.get('prompt')).toBe('a luxury perfume store for the UAE');
  });

  it('fires onSubmitStart before the action runs', async () => {
    const onSubmitStart = vi.fn();
    render(
      <PromptForm
        formAction={vi.fn()}
        isPending={false}
        error={null}
        onSubmitStart={onSubmitStart}
      />,
    );
    await userEvent.type(screen.getByLabelText('Describe your store'), 'ten chars ok');
    await userEvent.click(screen.getByRole('button', { name: 'Generate store' }));
    expect(onSubmitStart).toHaveBeenCalled();
  });

  it('shows a live status and disables inputs while pending', () => {
    render(<PromptForm formAction={vi.fn()} isPending error={null} />);
    expect(screen.getByRole('status')).toHaveTextContent(/up to a minute/i);
    expect(screen.getByLabelText('Describe your store')).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders an error as an alert', () => {
    render(<PromptForm formAction={vi.fn()} isPending={false} error="rephrase please" />);
    expect(screen.getByRole('alert')).toHaveTextContent('rephrase please');
    expect(screen.getByLabelText('Describe your store')).toHaveAttribute('aria-invalid', 'true');
  });
});
