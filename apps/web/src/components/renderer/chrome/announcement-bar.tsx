'use client';

import type { AnnouncementBar as AnnouncementBarData } from '@xandevo/shared';
import { memo } from 'react';

import { useRenderer } from '../renderer-context';
import { ANNOUNCEMENT_TONE, pick } from '../recipes';

export const AnnouncementBar = memo(function AnnouncementBar({
  data,
}: {
  data: AnnouncementBarData;
}) {
  const { href } = useRenderer();
  const link = data.link ? href(data.link) : undefined;
  return (
    <div className={`px-4 py-2 text-center text-xs ${pick(ANNOUNCEMENT_TONE, data.tone, 'dark')}`}>
      {link ? (
        <a href={link} className="underline-offset-2 hover:underline">
          {data.text}
        </a>
      ) : (
        data.text
      )}
    </div>
  );
});
