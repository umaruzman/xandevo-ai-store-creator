import { type StoreDefinitionInput } from '../store-definition/store-definition.js';

/**
 * A complete, valid `StoreDefinitionInput` — the shape `POST /generate` produces
 * before normalization. Used by pipeline tests, mapper round-trip tests, and the
 * FakeAiProvider (Phase 5). Deep-cloned on each call so tests can mutate freely.
 */
export function validStoreDefinitionInput(): StoreDefinitionInput {
  return JSON.parse(JSON.stringify(BASE)) as StoreDefinitionInput;
}

const BASE: StoreDefinitionInput = {
  meta: {
    name: 'Maison Oud',
    tagline: 'Rare fragrances, delivered across the UAE',
    locale: 'en-AE',
    currency: 'AED',
  },
  theme: {
    preset: 'luxury',
    colors: {
      primary: '#1A1A1A',
      secondary: '#C9A24B',
      background: '#FAF8F4',
      surface: '#FFFFFF',
      text: '#1A1A1A',
      muted: '#6B6B6B',
      accent: '#C9A24B',
      border: '#E4DFD6',
    },
    style: { radius: 'sm', spacing: 'roomy' },
  },
  navigation: {
    links: [
      { label: 'Shop', target: { type: 'page', slug: 'home' } },
      { label: 'About', target: { type: 'page', slug: 'about' } },
      { label: 'Contact', target: { type: 'page', slug: 'contact' } },
    ],
  },
  header: { variant: 'centered-logo', sticky: true, transparentOverHero: true },
  footer: {
    columns: [
      {
        title: 'Explore',
        links: [
          { label: 'About', target: { type: 'page', slug: 'about' } },
          { label: 'Contact', target: { type: 'page', slug: 'contact' } },
        ],
      },
    ],
    social: [{ platform: 'instagram', handle: 'maisonoud' }],
    showPaymentIcons: true,
    showNewsletter: true,
  },
  announcementBar: {
    text: 'Complimentary UAE delivery on orders over AED 500',
    tone: 'dark',
    dismissible: true,
  },
  categories: [
    { name: 'Oud & Agarwood', slug: 'oud', description: 'Deep, resinous signature scents' },
    { name: 'Floral', slug: 'floral', description: 'Rose, jasmine, orange blossom' },
    { name: 'Amber & Musk', slug: 'amber', description: 'Warm, long-lasting bases' },
  ],
  products: [
    {
      name: 'Royal Oud 50ml',
      slug: 'royal-oud-50',
      description: 'Aged Cambodian oud layered with saffron and rose.',
      priceMinor: 89900,
      currency: 'AED',
      categorySlug: 'oud',
      image: { kind: 'placeholder', seed: 'royal-oud-50' },
      featured: true,
      badge: 'bestseller',
    },
    {
      name: 'Hindi Oud Intense',
      slug: 'hindi-oud-intense',
      description: 'Uncompromising barnyard Hindi oud for the connoisseur.',
      priceMinor: 129900,
      currency: 'AED',
      categorySlug: 'oud',
      image: { kind: 'placeholder', seed: 'hindi-oud-intense' },
      featured: false,
    },
    {
      name: 'Rose Taif',
      slug: 'rose-taif',
      description: 'Taif rose absolute, bright, dewy and lifted.',
      priceMinor: 64900,
      currency: 'AED',
      categorySlug: 'floral',
      image: { kind: 'placeholder', seed: 'rose-taif' },
      featured: true,
      badge: 'new',
    },
    {
      name: 'Amber Noir',
      slug: 'amber-noir',
      description: 'Labdanum, tonka and musk in a velvet base.',
      priceMinor: 74900,
      currency: 'AED',
      categorySlug: 'amber',
      image: { kind: 'placeholder', seed: 'amber-noir' },
      featured: false,
    },
  ],
  pages: [
    {
      slug: 'home',
      title: 'Home',
      sections: [
        {
          type: 'hero',
          headline: 'The Art of Oud',
          subheadline: 'House of rare Arabian perfumery',
          description: 'Hand-blended fragrances sourced from Cambodia, Taif and Hindi oud.',
          heroLayout: 'fullbleed-overlay',
          height: 'tall',
          overlayStrength: 2,
          cta: { label: 'Explore the collection', target: { type: 'page', slug: 'home' } },
        },
        {
          type: 'categories',
          title: 'Shop by family',
          categoriesLayout: 'grid',
          columns: 3,
          categorySlugs: ['oud', 'floral', 'amber'],
        },
        {
          type: 'productGrid',
          title: 'Bestsellers',
          productGridLayout: 'grid',
          columns: 3,
          limit: 6,
          categorySlug: 'oud',
          showViewAll: true,
        },
        {
          type: 'cta',
          headline: 'Free UAE delivery over AED 500',
          ctaLayout: 'banner',
          emphasis: 'bold',
          button: { label: 'Shop now', target: { type: 'page', slug: 'home' } },
        },
      ],
    },
    {
      slug: 'about',
      title: 'About',
      sections: [
        {
          type: 'richText',
          title: 'Our house',
          body: 'Founded in Sharjah, Maison Oud works directly with distillers across the region to bring rare oud to modern perfumery.',
          width: 'prose',
        },
      ],
    },
    {
      slug: 'contact',
      title: 'Contact',
      sections: [
        {
          type: 'contact',
          title: 'Get in touch',
          description: 'Our concierge replies within one business day.',
          email: 'hello@example.com',
          phone: '+971 4 000 0000',
          address: 'Dubai Design District, Dubai, UAE',
          showForm: true,
          contactLayout: 'form-right',
        },
      ],
    },
  ],
};
