'use client';

import { type CSSProperties } from 'react';

import type { Path } from '@/lib/set-path';
import { cn } from '@/lib/utils';

import { useRenderer } from './renderer-context';

const HEADING_STYLE: CSSProperties = {
  fontFamily: 'var(--sf-font-heading)',
  fontWeight: 'var(--sf-heading-weight)',
  letterSpacing: 'var(--sf-letter-spacing)',
};

const HEADING_SIZE: Record<1 | 2 | 3, string> = {
  1: 'text-4xl leading-[1.05] sm:text-5xl lg:text-6xl',
  2: 'text-2xl sm:text-3xl',
  3: 'text-lg',
};

type Tag = 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';

/**
 * Text from the Store Definition. Read-only by default; when the renderer is in
 * edit mode it becomes editable in place — hover shows a pencil and a dashed
 * outline, blur (or Enter) commits `value` to `path` via the builder store.
 */
export function EditableText({
  path,
  value,
  as = 'span',
  heading,
  multiline = false,
  className,
  style,
}: {
  path: Path;
  value: string;
  as?: Tag;
  heading?: 1 | 2 | 3;
  multiline?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const { edit } = useRenderer();
  const As = heading ? (`h${heading}` as Tag) : as;
  const mergedStyle = heading
    ? { ...HEADING_STYLE, ...(heading === 1 ? { letterSpacing: '-0.02em' } : null), ...style }
    : style;
  const mergedClass = cn(heading && HEADING_SIZE[heading], className);

  if (!edit.enabled) {
    return (
      <As className={mergedClass} style={mergedStyle}>
        {value}
      </As>
    );
  }

  return (
    <As className={cn('group/edit relative', mergedClass)} style={mergedStyle}>
      <span
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        role="textbox"
        aria-label="Edit text"
        tabIndex={0}
        data-sf-editable=""
        className={cn(
          'cursor-text rounded-[3px] outline-dashed outline-1 outline-offset-2 outline-transparent',
          'transition-[outline-color] hover:outline-[var(--sf-border)]',
          'focus:outline-2 focus:outline-[var(--sf-primary)]',
        )}
        onClick={(e) => {
          // Don't let a click-to-edit follow a wrapping link or trigger the
          // preview's nav interception.
          e.preventDefault();
          e.stopPropagation();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') e.currentTarget.blur();
          if (!multiline && e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        onBlur={(e) => {
          const next = (e.currentTarget.textContent ?? '').replace(/\u00a0/g, ' ').trim();
          if (next !== value) edit.onText(path, next);
        }}
      >
        {value}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute -top-1 right-0 translate-x-[130%] text-[var(--sf-primary)] opacity-0 transition-opacity group-hover/edit:opacity-100"
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 20h4L19 9l-4-4L4 16z" />
          <path d="M14 5l4 4" />
        </svg>
      </span>
    </As>
  );
}
