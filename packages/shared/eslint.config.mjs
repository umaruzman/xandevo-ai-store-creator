import base from '@xandevo/config/eslint/base';

export default [...base, { ignores: ['dist/**', 'vitest.config.ts'] }];
