// ESLint (flat config): рекомендовані правила + глобальні змінні Node.js.
// eslint-config-prettier вимикає правила форматування — ними займається Prettier.
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default defineConfig([
  { ignores: ['node_modules/'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      // req, res, next часто потрібні лише заради сигнатури middleware
      'no-unused-vars': ['error', { argsIgnorePattern: '^(req|res|next|_)' }],
      eqeqeq: 'error',
      'prefer-const': 'error',
    },
  },
  prettier,
]);
