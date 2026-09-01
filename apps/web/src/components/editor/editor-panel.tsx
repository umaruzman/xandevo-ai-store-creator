'use client';

import { HERO_LAYOUTS, THEME_PRESETS } from '@xandevo/shared';

import { AA_NORMAL, contrastRatio } from '@/lib/contrast';
import { useBuilderStore } from '@/lib/store/builder';

import { ColorField } from './fields/color-field';
import { PriceField } from './fields/number-field';
import { SelectField } from './fields/select-field';
import { TextField } from './fields/text-field';

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-b pb-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function SectionOrder({ pageId, pageIndex }: { pageId: string; pageIndex: number }) {
  const sections = useBuilderStore((s) => s.definition!.pages[pageIndex]!.sections);
  const moveSection = useBuilderStore((s) => s.moveSection);
  const ordered = [...sections].sort((a, b) => a.order - b.order);

  return (
    <ul className="space-y-1">
      {ordered.map((section, i) => (
        <li
          key={section.id}
          className="flex items-center justify-between rounded border px-2 py-1 text-xs"
        >
          <span className="capitalize">{section.type}</span>
          <span className="flex gap-1">
            <button
              type="button"
              aria-label={`Move ${section.type} up`}
              disabled={i === 0}
              onClick={() => moveSection(pageId, section.id, 'up')}
              className="rounded px-1 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`Move ${section.type} down`}
              disabled={i === ordered.length - 1}
              onClick={() => moveSection(pageId, section.id, 'down')}
              className="rounded px-1 disabled:opacity-30"
            >
              ↓
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function EditorPanel() {
  const definition = useBuilderStore((s) => s.definition);
  const text = useBuilderStore((s) => s.definition?.theme.colors.text);
  const background = useBuilderStore((s) => s.definition?.theme.colors.background);
  if (!definition) return null;

  const homeIndex = definition.pages.findIndex((p) => p.slug === 'home');
  const homePage = definition.pages[homeIndex]!;
  const heroIndex = homePage.sections.findIndex((s) => s.type === 'hero');
  const aboutIndex = definition.pages.findIndex((p) => p.slug === 'about');
  const contactIndex = definition.pages.findIndex((p) => p.slug === 'contact');
  const aboutRichIndex = definition.pages[aboutIndex]?.sections.findIndex(
    (s) => s.type === 'richText',
  );
  const contactSecIndex = definition.pages[contactIndex]?.sections.findIndex(
    (s) => s.type === 'contact',
  );

  const contrast = text && background ? contrastRatio(text, background) : undefined;

  return (
    <div className="space-y-5 overflow-y-auto p-4" style={{ maxHeight: '70vh' }}>
      <Group title="Store">
        <TextField label="Name" path={['meta', 'name']} />
        <TextField label="Tagline" path={['meta', 'tagline']} />
      </Group>

      <Group title="Theme">
        <SelectField label="Preset" path={['theme', 'preset']} options={THEME_PRESETS} />
        <ColorField label="Primary" path={['theme', 'colors', 'primary']} />
        <ColorField label="Accent" path={['theme', 'colors', 'accent']} />
        <ColorField label="Background" path={['theme', 'colors', 'background']} />
        <ColorField label="Surface" path={['theme', 'colors', 'surface']} />
        <ColorField label="Text" path={['theme', 'colors', 'text']} />
        {contrast !== undefined && contrast < AA_NORMAL ? (
          <p role="alert" className="text-destructive text-xs">
            Text on background contrast is {contrast}:1 — below the {AA_NORMAL}:1 minimum.
          </p>
        ) : null}
      </Group>

      {heroIndex >= 0 ? (
        <Group title="Hero">
          <SelectField
            label="Layout"
            path={['pages', homeIndex, 'sections', heroIndex, 'heroLayout']}
            options={HERO_LAYOUTS}
          />
          <TextField
            label="Headline"
            path={['pages', homeIndex, 'sections', heroIndex, 'headline']}
          />
          <TextField
            label="Subheadline"
            path={['pages', homeIndex, 'sections', heroIndex, 'subheadline']}
          />
          <TextField
            label="Description"
            path={['pages', homeIndex, 'sections', heroIndex, 'description']}
            multiline
          />
          <TextField
            label="Button label"
            path={['pages', homeIndex, 'sections', heroIndex, 'cta', 'label']}
          />
        </Group>
      ) : null}

      <Group title="Home layout">
        <SectionOrder pageId={homePage.id} pageIndex={homeIndex} />
      </Group>

      <Group title="Categories">
        {definition.categories.map((c, i) => (
          <TextField key={c.id} label={`Category ${i + 1}`} path={['categories', i, 'name']} />
        ))}
      </Group>

      <Group title="Products">
        {definition.products.map((p, i) => (
          <div key={p.id} className="space-y-2 rounded border p-2">
            <TextField label={`Product ${i + 1} name`} path={['products', i, 'name']} />
            <TextField label="Description" path={['products', i, 'description']} multiline />
            <PriceField label={`Price (${p.currency})`} path={['products', i, 'priceMinor']} />
          </div>
        ))}
      </Group>

      {aboutIndex >= 0 && aboutRichIndex !== undefined && aboutRichIndex >= 0 ? (
        <Group title="About page">
          <TextField
            label="Body"
            path={['pages', aboutIndex, 'sections', aboutRichIndex, 'body']}
            multiline
          />
        </Group>
      ) : null}

      {contactIndex >= 0 && contactSecIndex !== undefined && contactSecIndex >= 0 ? (
        <Group title="Contact page">
          <TextField
            label="Description"
            path={['pages', contactIndex, 'sections', contactSecIndex, 'description']}
            multiline
          />
          <TextField
            label="Email"
            path={['pages', contactIndex, 'sections', contactSecIndex, 'email']}
          />
          <TextField
            label="Phone"
            path={['pages', contactIndex, 'sections', contactSecIndex, 'phone']}
          />
          <TextField
            label="Address"
            path={['pages', contactIndex, 'sections', contactSecIndex, 'address']}
          />
        </Group>
      ) : null}
    </div>
  );
}
