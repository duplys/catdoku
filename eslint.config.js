import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['src/game/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', 'document', 'window', 'localStorage'],
      'no-restricted-imports': ['error', { patterns: ['../ui/*', '**/ui/**'] }],
    },
  },
);
