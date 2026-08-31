import base from '@xandevo/config/eslint/base';

export default [
  ...base,
  {
    ignores: ['dist/**', 'coverage/**', 'eslint.config.mjs', 'jest.config.*'],
  },
  {
    files: ['**/*.ts'],
    rules: {
      // Nest DI relies on parameter decorators + design:paramtypes metadata.
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
];
