'use client';

import type { Section } from '@xandevo/shared';
import { memo } from 'react';

import { sectionPropsEqual } from './memo-compare';

import type { Path } from '@/lib/set-path';

import { EditableText } from '../editable-text';
import { CONTACT_LAYOUT, pick } from '../recipes';
import { SectionShell } from './section-shell';

type ContactSection = Extract<Section, { type: 'contact' }>;

export const ContactSection = memo(function ContactSection({
  section,
  path = [],
}: {
  section: ContactSection;
  path?: Path;
}) {
  return (
    <SectionShell id={section.id} layout={section.layout}>
      {section.title ? (
        <EditableText heading={2} path={[...path, 'title']} value={section.title} />
      ) : null}
      <div className={pick(CONTACT_LAYOUT, section.contactLayout, 'stacked')}>
        <div className="space-y-2 text-sm">
          {section.description ? (
            <EditableText
              as="p"
              multiline
              path={[...path, 'description']}
              value={section.description}
              className="opacity-80"
            />
          ) : null}
          {section.email ? (
            <p>
              Email: <EditableText path={[...path, 'email']} value={section.email} />
            </p>
          ) : null}
          {section.phone ? (
            <p>
              Phone: <EditableText path={[...path, 'phone']} value={section.phone} />
            </p>
          ) : null}
          {section.address ? (
            <EditableText as="p" path={[...path, 'address']} value={section.address} />
          ) : null}
        </div>
        {section.showForm ? (
          <form className="space-y-2" aria-label="Contact form (preview — inert)">
            <input
              disabled
              placeholder="Your email"
              className="w-full rounded-[var(--sf-radius)] border p-2 text-sm"
            />
            <textarea
              disabled
              placeholder="Message"
              rows={3}
              className="w-full rounded-[var(--sf-radius)] border p-2 text-sm"
            />
          </form>
        ) : null}
      </div>
    </SectionShell>
  );
}, sectionPropsEqual);
