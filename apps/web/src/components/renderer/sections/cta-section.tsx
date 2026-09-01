'use client';

import type { Section } from '@xandevo/shared';
import { memo } from 'react';

import { cn } from '@/lib/utils';

import { useRenderer } from '../renderer-context';
import { CTA_EMPHASIS, CTA_SECTION_LAYOUT, pick } from '../recipes';
import { Heading, StoreButton } from '../sf-ui';
import { SectionShell } from './section-shell';

type CtaSection = Extract<Section, { type: 'cta' }>;

export const CtaSection = memo(function CtaSection({ section }: { section: CtaSection }) {
  const { theme, href } = useRenderer();
  return (
    <SectionShell id={section.id} layout={section.layout}>
      <div className={pick(CTA_SECTION_LAYOUT, section.ctaLayout, 'banner')}>
        <div className="space-y-1">
          <Heading level={2} className={cn(pick(CTA_EMPHASIS, section.emphasis, 'subtle'))}>
            {section.headline}
          </Heading>
          {section.description ? <p className="opacity-80">{section.description}</p> : null}
        </div>
        <StoreButton href={href(section.button.target)} style={theme.components.button}>
          {section.button.label}
        </StoreButton>
      </div>
    </SectionShell>
  );
});
