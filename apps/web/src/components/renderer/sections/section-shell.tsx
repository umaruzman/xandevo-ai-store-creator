import type { SectionLayout } from '@xandevo/shared';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import {
  pick,
  SECTION_ALIGN,
  SECTION_BACKGROUND,
  SECTION_CONTAINER,
  SECTION_PADDING,
} from '../recipes';

/** Applies the shared section `layout` (background / container / paddingY / align). */
export function SectionShell({
  id,
  layout,
  children,
}: {
  id: string;
  layout: SectionLayout;
  children: ReactNode;
}) {
  return (
    <section id={id} className={pick(SECTION_BACKGROUND, layout.background, 'surface')}>
      <div
        className={cn(
          'flex flex-col gap-6',
          pick(SECTION_CONTAINER, layout.container, 'boxed'),
          pick(SECTION_PADDING, layout.paddingY, 'md'),
          pick(SECTION_ALIGN, layout.align, 'left'),
        )}
      >
        {children}
      </div>
    </section>
  );
}
