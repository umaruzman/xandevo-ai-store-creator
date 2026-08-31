import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';
import base from '@xandevo/config/eslint/base';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  { ignores: ['.next/**', 'dist/**', 'coverage/**', 'next-env.d.ts', '*.config.*'] },
  ...base,
  ...compat.extends('next/core-web-vitals'),
];
