import {
  buildStoreDefinition,
  sequentialIdFactory,
  type StoreDefinition,
  validStoreDefinitionInput,
} from '@xandevo/shared';
import { render, screen } from '@testing-library/react';
import { memo } from 'react';
import { describe, expect, it } from 'vitest';

import { SECTION_REGISTRY } from './sections/section-registry';
import { StoreRenderer } from './store-renderer';

const def = (): StoreDefinition =>
  buildStoreDefinition(validStoreDefinitionInput(), { idFactory: sequentialIdFactory() });

describe('StoreRenderer', () => {
  it('renders announcement bar, header, home sections and footer', () => {
    const d = def();
    const { container } = render(<StoreRenderer definition={d} />);

    expect(screen.getByText(/Complimentary UAE delivery/)).toBeInTheDocument(); // announcement
    expect(screen.getAllByText('Maison Oud').length).toBeGreaterThan(0); // header + footer
    expect(screen.getByRole('heading', { level: 1, name: 'The Art of Oud' })).toBeInTheDocument();
    expect(screen.getByText('Shop by family')).toBeInTheDocument(); // categories section
    expect(screen.getByText('Bestsellers')).toBeInTheDocument(); // productGrid
    expect(screen.getByText('Royal Oud 50ml')).toBeInTheDocument(); // a product card
    expect(container.querySelector('footer')).toBeInTheDocument();
  });

  it('renders richText and contact sections on their pages', () => {
    render(<StoreRenderer definition={def()} pageSlug="about" />);
    expect(screen.getByText(/Founded in Sharjah/)).toBeInTheDocument();

    render(<StoreRenderer definition={def()} pageSlug="contact" />);
    expect(screen.getByText(/hello@example.com/)).toBeInTheDocument();
  });

  it('skips an unknown section type without throwing, and never injects HTML', () => {
    const d = def();
    // corrupt one section's type + smuggle markup into a text field
    const home = d.pages.find((p) => p.slug === 'home')!;
    (home.sections[1] as { type: string }).type = 'mystery-widget';
    const hero = home.sections[0]!;
    if (hero.type === 'hero') hero.headline = 'Art <script>alert(1)</script> of Oud';

    const { container } = render(<StoreRenderer definition={d} />);
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('<script>');
    expect(screen.queryByText('Shop by family')).not.toBeInTheDocument(); // unknown section gone
  });

  it('re-renders only the changed section on a single-field edit (memoization)', () => {
    let heroRenders = 0;
    let catRenders = 0;
    const CountingHero = memo(function CountingHero(props: { section: never }) {
      heroRenders += 1;
      const Real = SECTION_REGISTRY.hero;
      return <Real {...props} />;
    });
    const CountingCategories = memo(function CountingCategories(props: { section: never }) {
      catRenders += 1;
      const Real = SECTION_REGISTRY.categories;
      return <Real {...props} />;
    });
    const registry = { ...SECTION_REGISTRY, hero: CountingHero, categories: CountingCategories };

    const a = def();
    const { rerender } = render(<StoreRenderer definition={a} registry={registry} />);
    expect(heroRenders).toBe(1);
    expect(catRenders).toBe(1);

    // Immutable edit touching ONLY the hero headline; every other slice keeps identity.
    const b: StoreDefinition = {
      ...a,
      pages: a.pages.map((p, i) =>
        i === 0
          ? {
              ...p,
              sections: p.sections.map((s, j) =>
                j === 0 && s.type === 'hero' ? { ...s, headline: 'A New Headline' } : s,
              ),
            }
          : p,
      ),
    };
    rerender(<StoreRenderer definition={b} registry={registry} />);

    expect(screen.getByRole('heading', { level: 1, name: 'A New Headline' })).toBeInTheDocument();
    expect(heroRenders).toBe(2); // the edited section re-rendered
    expect(catRenders).toBe(1); // the untouched section did not
  });
});
