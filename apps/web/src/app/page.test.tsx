import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomePage from './page';

describe('HomePage (landing)', () => {
  it('shows the value proposition and entry points', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('heading', { level: 1, name: /Describe a store/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/sign-in');
    expect(screen.getByRole('heading', { name: 'How it works' })).toBeInTheDocument();
  });
});
