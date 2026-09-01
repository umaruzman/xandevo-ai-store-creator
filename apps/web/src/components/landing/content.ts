/** Static copy + sample data for the marketing landing page. */

export const SAMPLE_PROMPTS = [
  'Create a luxury perfume house for Abu Dhabi with oud, bukhoor and gift sets',
  'A modern Emirati coffee roastery shipping across the GCC',
  'A minimalist abaya atelier with a made-to-measure booking page',
  'A dates and confectionery brand for Ramadan corporate gifting',
] as const;

export const STEPS = [
  {
    n: '01',
    title: 'Describe it',
    body: 'One sentence — the trade, the customer, the city. Arabic or English.',
  },
  {
    n: '02',
    title: 'Generate',
    body: 'In seconds: colours and fonts, a hero, category sections, eight priced products, and About & Contact pages.',
  },
  {
    n: '03',
    title: 'Refine & publish',
    body: 'Edit any headline, colour or price inline against a live preview, then save it to your workspace.',
  },
] as const;

export const CAPABILITIES = [
  {
    title: 'Designed around what you sell',
    body: 'Colours, typography and layout are chosen to fit your product and your customer — not dropped in from a stock theme.',
  },
  {
    title: 'A catalogue to start from',
    body: 'You get categories and priced sample products from the first generation, ready to rename, re-price and replace.',
  },
  {
    title: 'Change anything, see it now',
    body: 'Edit a headline, a colour or a price and the storefront updates in front of you. No rebuilds, no waiting.',
  },
  {
    title: 'It stays yours',
    body: 'Every store is saved to your account. Come back whenever you like to keep refining it.',
  },
] as const;
