import base from '@xandevo/config/eslint/base';

const VENDOR_AI_SDKS = ['@anthropic-ai/sdk', 'openai', '@google/generative-ai'];

export default [
  ...base,
  {
    ignores: ['dist/**', 'coverage/**', 'eslint.config.mjs', 'jest.config.*'],
  },
  {
    files: ['**/*.ts'],
    rules: {
      // Nest DI relies on parameter decorators + design:paramtypes metadata, so
      // classes used as injection tokens must be value imports.
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      // ADR-004: vendor AI SDKs may only be imported inside src/ai/providers/.
      'no-restricted-imports': [
        'error',
        {
          paths: VENDOR_AI_SDKS.map((name) => ({
            name,
            message: 'Import AI vendor SDKs only inside src/ai/providers/ (ADR-004).',
          })),
          patterns: VENDOR_AI_SDKS.map((name) => `${name}/*`),
        },
      ],
    },
  },
  {
    files: ['src/ai/providers/**/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
];
