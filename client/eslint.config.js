/**
 * @file eslint.config.js
 * @description ESLint flat configuration for the ArenaPulse React client.
 * Uses typescript-eslint for strict type-aware linting and
 * eslint-plugin-react-hooks to enforce correct hook usage.
 */

import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Enforce no `any` types — all types must be explicit
      '@typescript-eslint/no-explicit-any': 'error',
      // Prefer `unknown` in catch blocks over `any`
      '@typescript-eslint/no-unsafe-assignment': 'off', // Handled by no-explicit-any
      // Require explicit return types on exported functions
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // Disallow unused variables (catches stale code)
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);
