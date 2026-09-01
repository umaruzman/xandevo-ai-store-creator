import base from '@xandevo/config/eslint/base';

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
    },
  },
];
