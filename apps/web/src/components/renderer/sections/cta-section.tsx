'use client';

import type { Section } from '@xandevo/shared';
import { memo } from 'react';

import { sectionPropsEqual } from './memo-compare';

import type { Path } from '@/lib/set-path';
import { cn } from '@/lib/utils';

import { EditableText } from '../editable-text';
import { useRenderer } from '../renderer-context';
import { CTA_EMPHASIS, CTA_SECTION_LAYOUT, pick } from '../recipes';
import { StoreButton } from '../sf-ui';
import { SectionShell } from './section-shell';

type CtaSection = Extract<Section, { type: 'cta' }>;

export const CtaSection = memo(function CtaSection({
  section,
  path = [],
}: {
  section: CtaSection;
  path?: Path;
}) {
  const { theme, href } = useRenderer();
  return (
    <SectionShell id={section.id} layout={section.layout}>
      <div className={pick(CTA_SECTION_LAYOUT, section.ctaLayout, 'banner')}>
        <div className="space-y-1">
          <EditableText
            heading={2}
            path={[...path, 'headline']}
            value={section.headline}
            className={cn(pick(CTA_EMPHASIS, section.emphasis, 'subtle'))}
          />
          {section.description ? (
            <EditableText
              as="p"
              multiline
              path={[...path, 'description']}
              value={section.description}
              className="opacity-80"
            />
          ) : null}
        </div>
        <StoreButton href={href(section.button.target)} style={theme.components.button}>
          <EditableText path={[...path, 'button', 'label']} value={section.button.label} />
        </StoreButton>
      </div>
    </SectionShell>
  );
}, sectionPropsEqual);
