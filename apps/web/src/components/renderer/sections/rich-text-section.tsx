'use client';

import type { Section } from '@xandevo/shared';
import { memo } from 'react';

import { cn } from '@/lib/utils';

import { pick, RICH_TEXT_WIDTH } from '../recipes';
import { Heading } from '../sf-ui';
import { SectionShell } from './section-shell';

type RichTextSection = Extract<Section, { type: 'richText' }>;

export const RichTextSection = memo(function RichTextSection({
  section,
}: {
  section: RichTextSection;
}) {
  return (
    <SectionShell id={section.id} layout={section.layout}>
      {section.title ? <Heading level={2}>{section.title}</Heading> : null}
      {/* Plain text only — newlines become paragraphs. Never dangerouslySetInnerHTML. */}
      <div className={cn('space-y-4 opacity-80', pick(RICH_TEXT_WIDTH, section.width, 'prose'))}>
        {section.body.split(/\n{2,}/).map((para, i) => (
          <p key={i} className="whitespace-pre-line">
            {para}
          </p>
        ))}
      </div>
    </SectionShell>
  );
});
