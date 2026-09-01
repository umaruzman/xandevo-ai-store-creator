import { buildStoreDefinition, validStoreDefinitionInput } from '@xandevo/shared';

/**
 * The prompt shown in the hero and the real, normalized Store Definition it
 * "produces". Built once through the same domain pipeline the API uses, then
 * fed to the actual `<StoreRenderer>` — a real component preview, not a mock.
 */
export const HERO_PROMPT =
  'Create a luxury oud house for Abu Dhabi — oud, bukhoor, perfume and gift sets, gold on ivory.';

function buildSample() {
  const input = validStoreDefinitionInput();
  input.meta.name = 'Bayt Al Oud';
  input.meta.tagline = 'House of rare Arabian perfumery, Abu Dhabi';
  const home = input.pages.find((p) => p.slug === 'home');
  const hero = home?.sections.find((s) => s.type === 'hero');
  if (hero && hero.type === 'hero') {
    hero.headline = 'The scent of the Empty Quarter';
    hero.subheadline = 'Aged oud, hand-blended in the capital';
    hero.description =
      'Cambodi, Hindi and Taifi oud, distilled for the modern wardrobe and the majlis.';
    hero.heroLayout = 'centered';
    hero.height = 'standard';
  }
  return buildStoreDefinition(input);
}

export const SAMPLE_STORE_DEFINITION = buildSample();
