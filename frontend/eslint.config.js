import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'src/shared/api/schema.d.ts'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**' },
        { type: 'pages', pattern: 'src/pages/**' },
        { type: 'feature', pattern: 'src/features/*', mode: 'folder', capture: ['featureName'] },
        { type: 'shared', pattern: 'src/shared/**' },
      ],
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: './tsconfig.app.json' },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      boundaries,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: ['shared'], allow: ['shared'] },
            { from: ['feature'], allow: ['shared', 'feature'] },
            { from: ['pages'], allow: ['shared', 'feature'] },
            { from: ['app'], allow: ['shared', 'feature', 'pages'] },
          ],
        },
      ],

      'boundaries/entry-point': [
        'error',
        {
          default: 'disallow',
          rules: [
            { target: ['feature'], allow: 'index.ts' },
            { target: ['shared'], allow: '**' },
            { target: ['app', 'pages'], allow: '**' },
          ],
        },
      ],
    },
  },
);
