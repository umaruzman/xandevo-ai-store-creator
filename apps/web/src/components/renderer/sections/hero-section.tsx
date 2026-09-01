'use client';

import type { Section } from '@xandevo/shared';
import { memo } from 'react';

import { cn } from '@/lib/utils';

import { useRenderer } from '../renderer-context';
import { HERO_HEIGHT, HERO_LAYOUT, pick } from '../recipes';
import { Heading, StoreButton } from '../sf-ui';
import { SectionShell } from './section-shell';

type HeroSection = Extract<Section, { type: 'hero' }>;

export const HeroSection = memo(function HeroSection({ section }: { section: HeroSection }) {
  const { theme, href } = useRenderer();
  const overlay = section.heroLayout === 'fullbleed-overlay';

  return (
    <SectionShell id={section.id} layout={section.layout}>
      <div
        className={cn(
          pick(HERO_LAYOUT, section.heroLayout, 'centered'),
          pick(HERO_HEIGHT, section.height, 'standard'),
          overlay && 'rounded-[var(--sf-radius)] bg-[var(--sf-muted-bg)] p-8',
        )}
        data-overlay-strength={section.overlayStrength}
      >
        <Heading level={1}>{section.headline}</Heading>
        {section.subheadline ? <p className="text-lg opacity-80">{section.subheadline}</p> : null}
        <p className="max-w-prose opacity-70">{section.description}</p>
        <StoreButton
          href={href(section.cta.target)}
          style={theme.components.button}
          className="mt-2"
        >
          {section.cta.label}
        </StoreButton>
      </div>
    </SectionShell>
  );
});
