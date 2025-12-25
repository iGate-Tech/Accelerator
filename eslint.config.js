import js from '@eslint/js';
import security from 'eslint-plugin-security';
import html from '@html-eslint/eslint-plugin';
import htmlParser from '@html-eslint/parser';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  security.configs.recommended,
  prettierConfig,
  {
    ignores: [
      'lib/components/idea-card.hbs',
      'lib/components/idea-creation.hbs',
      'lib/pages/auth/login.hbs',
      'lib/pages/dashboard/dashboard.hbs',
      'lib/pages/ideas/idea-detail.hbs',
      'lib/pages/ideas/shared-idea.hbs',
      'lib/pages/models/business.hbs',
      'lib/pages/models/financial.hbs',
      'lib/prompts/models/idea/sections/go-to-market-strategy/generate.hbs',
    ],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        fetch: 'readonly', // Node.js 18+ global
      },
    },
    rules: {
      'no-unused-vars': 'error',
      'no-console': 'off', // Allow console for logging
      'no-undef': 'warn', // Warn on undefined variables
      indent: 'off', // Disabled since Prettier handles indentation
      quotes: 'off', // Disabled since Prettier handles quotes
      semi: 'off', // Disabled since Prettier handles semicolons
      'no-var': 'warn', // Warn on var for modern JS
      'prefer-const': 'warn', // Warn on non-const
      curly: 'warn', // Warn on missing braces for control statements
      eqeqeq: 'warn', // Warn on ==
      'no-magic-numbers': [
        'warn',
        {
          ignore: [
            -4, -1, 0, 0.6, 0.7, 0.25, 1, 2, 3, 5, 7, 8, 10, 12, 15, 19, 20, 24,
            25, 30, 50, 60, 100, 120, 180, 201, 300, 350, 400, 401, 402, 403,
            404, 409, 500, 587, 600, 1000, 1024, 1500, 2000, 4000, 5000, 86400,
          ],
        },
      ],
      'no-process-exit': 'off',
      'require-await': 'warn', // Warn on async without await
      'no-eval': 'error', // Disallow eval() for security
      'no-shadow': 'off', // Allow variable shadowing
      'no-control-regex': 'off', // Allow control characters in regex for sanitization
      'security/detect-object-injection': 'warn', // Warn on potential object injection
      'security/detect-non-literal-fs-filename': 'off', // Safe in this context
      'security/detect-non-literal-regexp': 'off', // Safe patterns
      'security/detect-unsafe-regex': 'off', // RegEx are controlled
      'no-empty': 'off', // Allow empty blocks
    },
  },
  {
    files: ['**/*.hbs', '**/*.html'],
    plugins: {
      '@html-eslint': html,
    },
    languageOptions: {
      parser: htmlParser,
      parserOptions: {
        templateEngineSyntax: {
          '{{': '}}', // Handlebars syntax
        },
      },
    },
    rules: {
      '@html-eslint/indent': 'off', // Disable strict indentation for Handlebars templates
      '@html-eslint/attrs-newline': 'off', // Disable attribute newline for complex templates
      '@html-eslint/require-img-alt': 'warn', // Warn on missing alt for images
      '@html-eslint/no-extra-spacing-attrs': 'warn', // Warn on extra spacing in attrs
    },
  },
  {
    files: ['lib/services/ai.js'],
    rules: {
      'no-undef': 'off', // Disable for ai.js with dynamic imports
    },
  },
  {
    files: ['lib/services/**/*.js', 'lib/utils/**/*.js'],
    rules: {
      'no-undef': 'warn', // Warn for other services/utils
    },
  },
  {
    files: ['public/js/*.js'],
    languageOptions: {
      globals: {
        document: 'readonly',
        window: 'readonly',
        setTimeout: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
    },
  },
  {
    files: ['eslint.config.js'],
    rules: {
      quotes: 'off', // Disable quotes rule for config file
    },
  },
];
