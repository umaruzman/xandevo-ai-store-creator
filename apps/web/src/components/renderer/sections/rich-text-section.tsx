'use client';

import type { Section } from '@xandevo/shared';
import { memo } from 'react';

import { sectionPropsEqual } from './memo-compare';

import type { Path } from '@/lib/set-path';
import { cn } from '@/lib/utils';

import { EditableText } from '../editable-text';
import { pick, RICH_TEXT_WIDTH } from '../recipes';
import { SectionShell } from './section-shell';

type RichTextSection = Extract<Section, { type: 'richText' }>;

export const RichTextSection = memo(function RichTextSection({
  section,
  path = [],
}: {
  section: RichTextSection;
  path?: Path;
}) {
  return (
    <SectionShell id={section.id} layout={section.layout}>
      {section.title ? (
        <EditableText heading={2} path={[...path, 'title']} value={section.title} />
      ) : null}
      {/* Plain text only — never dangerouslySetInnerHTML. */}
      <EditableText
        as="div"
        multiline
        path={[...path, 'body']}
        value={section.body}
        className={cn(
          'whitespace-pre-line opacity-80',
          pick(RICH_TEXT_WIDTH, section.width, 'prose'),
        )}
      />
    </SectionShell>
  );
}, sectionPropsEqual);
