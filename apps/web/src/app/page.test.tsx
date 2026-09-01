import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomePage from './page';

describe('HomePage (landing)', () => {
  it('shows the value proposition and entry points', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('heading', { level: 1, name: /a real storefront out/i }),
    ).toBeInTheDocument();

    const createLinks = screen.getAllByRole('link', { name: /create your store/i });
    expect(createLinks.length).toBeGreaterThan(0);
    for (const link of createLinks) expect(link).toHaveAttribute('href', '/dashboard');

    const signInLinks = screen.getAllByRole('link', { name: 'Sign in' });
    expect(signInLinks.length).toBeGreaterThan(0);
    for (const link of signInLinks) expect(link).toHaveAttribute('href', '/sign-in');

    expect(
      screen.getByRole('heading', { name: /from a sentence to a storefront/i }),
    ).toBeInTheDocument();
  });
});
