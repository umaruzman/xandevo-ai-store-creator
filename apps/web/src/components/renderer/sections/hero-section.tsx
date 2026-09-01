'use client';

import type { Section } from '@xandevo/shared';
import { memo } from 'react';

import { sectionPropsEqual } from './memo-compare';

import type { Path } from '@/lib/set-path';
import { cn } from '@/lib/utils';

import { EditableText } from '../editable-text';
import { useRenderer } from '../renderer-context';
import { HERO_HEIGHT, HERO_LAYOUT, pick } from '../recipes';
import { StoreButton } from '../sf-ui';
import { SectionShell } from './section-shell';

type HeroSection = Extract<Section, { type: 'hero' }>;

export const HeroSection = memo(function HeroSection({
  section,
  path = [],
}: {
  section: HeroSection;
  path?: Path;
}) {
  const { theme, href } = useRenderer();
  const overlay = section.heroLayout === 'fullbleed-overlay';
  const split = section.heroLayout === 'split-left' || section.heroLayout === 'split-right';
  const mediaFirst = section.heroLayout === 'split-right';

  const text = (
    <div className={cn('max-w-xl', pick(HERO_LAYOUT, section.heroLayout, 'centered'))}>
      <span
        aria-hidden
        className="block h-px w-14 bg-[var(--sf-secondary)]"
        style={{ opacity: 0.9 }}
      />
      <EditableText
        heading={1}
        path={[...path, 'headline']}
        value={section.headline}
        className="text-balance"
      />
      {section.subheadline ? (
        <EditableText
          as="p"
          path={[...path, 'subheadline']}
          value={section.subheadline}
          className={cn(
            'text-lg sm:text-xl',
            overlay ? 'text-[var(--sf-secondary)]' : 'text-[var(--sf-text)]/70',
          )}
        />
      ) : null}
      <EditableText
        as="p"
        multiline
        path={[...path, 'description']}
        value={section.description}
        className={cn('max-w-prose text-sm sm:text-base', overlay ? 'opacity-80' : 'opacity-60')}
      />
      <StoreButton
        href={href(section.cta.target)}
        style={{ ...theme.components.button, size: 'lg' }}
        className="mt-3 transition-transform duration-200 hover:-translate-y-0.5"
      >
        <EditableText path={[...path, 'cta', 'label']} value={section.cta.label} />
      </StoreButton>
    </div>
  );

  if (overlay) {
    return (
      <SectionShell id={section.id} layout={section.layout}>
        <div
          className={cn(
            'flex w-full flex-col items-center justify-center rounded-[var(--sf-radius)] px-6 py-20 sm:px-12 sm:py-28',
            'bg-[var(--sf-text)] text-[var(--sf-surface)]',
            pick(HERO_HEIGHT, section.height, 'standard'),
          )}
          data-overlay-strength={section.overlayStrength}
        >
          {text}
        </div>
      </SectionShell>
    );
  }

  if (split) {
    return (
      <SectionShell id={section.id} layout={section.layout}>
        <div
          className={cn(
            'grid w-full items-center gap-10 md:grid-cols-2 md:gap-16',
            pick(HERO_HEIGHT, section.height, 'standard'),
          )}
        >
          <div className={cn('flex flex-col justify-center', mediaFirst && 'md:order-2')}>
            {text}
          </div>
          <div
            aria-hidden
            className="relative hidden aspect-[4/5] w-full rounded-[var(--sf-radius)] border border-[var(--sf-border)] bg-[var(--sf-muted-bg)] md:block"
          >
            <span className="absolute inset-4 rounded-[calc(var(--sf-radius)-4px)] border border-[var(--sf-secondary)] opacity-40" />
          </div>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell id={section.id} layout={section.layout}>
      <div
        className={cn(
          'flex w-full flex-col justify-center',
          pick(HERO_HEIGHT, section.height, 'standard'),
        )}
      >
        {text}
      </div>
    </SectionShell>
  );
}, sectionPropsEqual);
