import { defineConfig } from 'eslint-define-config';

export default defineConfig({
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended'
  ],
  ignorePatterns: ['dist'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }]
  },
  overrides: [
    {
      files: ['src/components/ui/*.tsx'],
      rules: {
        'react-refresh/only-export-components': 'off'
      }
    }
  ]
});