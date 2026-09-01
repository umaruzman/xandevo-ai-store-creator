import type { Section } from '@xandevo/shared';

import type { Path } from '@/lib/set-path';

/**
 * `React.memo` comparator for section components: re-render only when the
 * section slice itself changes identity. The `path` prop is a fresh array on
 * every parent render but is logically derived from the section's position, so
 * ignoring it keeps section isolation intact (a text edit to one section does
 * not repaint its siblings).
 */
export function sectionPropsEqual(
  prev: { section: Section; path?: Path },
  next: { section: Section; path?: Path },
): boolean {
  return prev.section === next.section;
}
