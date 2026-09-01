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
    body: 'A full storefront in seconds: palette and type tokens, hero, categories, eight priced products, About and Contact.',
  },
  {
    n: '03',
    title: 'Refine & publish',
    body: 'Edit any headline, colour or price inline against a live preview, then save it to your workspace.',
  },
] as const;

export const CAPABILITIES = [
  {
    title: 'Structured, never scraped',
    body: 'The AI returns clean, validated data — never code or raw HTML. A safe renderer turns that data into the storefront, so nothing unexpected reaches the page.',
  },
  {
    title: 'Your choice of AI',
    body: 'Generate with Anthropic, OpenAI or Gemini behind one interface. API keys stay on the server and never reach the browser.',
  },
  {
    title: 'Live preview, no refresh',
    body: 'Colours, layouts and product grids repaint as you type — you are always editing the real storefront.',
  },
  {
    title: 'Saved and yours',
    body: 'Every store, page and product is stored properly in a database, not as a blob. Reopen and keep editing any time.',
  },
] as const;
