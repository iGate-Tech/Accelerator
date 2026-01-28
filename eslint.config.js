import js from '@eslint/js';
import solidPlugin from 'eslint-plugin-solid';
import jsx_a11yPlugin from 'eslint-plugin-jsx-a11y';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      solid: solidPlugin,
      'jsx-a11y': jsx_a11yPlugin
    },
    rules: {
      'solid/jsx-no-undef': 'error',
      'solid/prefer-classlist': 'warn',
      'solid/style-prop': 'warn',
      'jsx-quotes': ['error', 'prefer-double'],
      ...solidPlugin.configs.recommended.rules,
      ...jsx_a11yPlugin.configs.recommended.rules
    }
  }
];