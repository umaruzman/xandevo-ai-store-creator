'use client';

import type { Section } from '@xandevo/shared';
import { memo } from 'react';

import { CONTACT_LAYOUT, pick } from '../recipes';
import { Heading } from '../sf-ui';
import { SectionShell } from './section-shell';

type ContactSection = Extract<Section, { type: 'contact' }>;

export const ContactSection = memo(function ContactSection({
  section,
}: {
  section: ContactSection;
}) {
  return (
    <SectionShell id={section.id} layout={section.layout}>
      {section.title ? <Heading level={2}>{section.title}</Heading> : null}
      <div className={pick(CONTACT_LAYOUT, section.contactLayout, 'stacked')}>
        <div className="space-y-2 text-sm">
          {section.description ? <p className="opacity-80">{section.description}</p> : null}
          {section.email ? <p>Email: {section.email}</p> : null}
          {section.phone ? <p>Phone: {section.phone}</p> : null}
          {section.address ? <p>{section.address}</p> : null}
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
});
