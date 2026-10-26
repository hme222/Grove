// Lint for the app source: correctness (js recommended, hooks rules, unused code) plus the
// accessibility rules that can be checked statically. Run with `npm run lint`.
const js = require('@eslint/js');
const globals = require('globals');
const react = require('eslint-plugin-react');
const hooks = require('eslint-plugin-react-hooks');
const a11y = require('eslint-plugin-jsx-a11y');

module.exports = [
  { ignores: ['build/**', 'node_modules/**', 'src/**/*.stories.jsx', 'src/styles/*.generated.*', 'storybook-static/**', '.storybook/**', 'craco.config.js', 'tailwind.config.js', 'tailwind.tokens.js', 'scripts/**', 'eslint.config.js'] },
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: { react, 'react-hooks': hooks, 'jsx-a11y': a11y },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node, ...globals.jest },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...js.configs.recommended.rules,
      ...hooks.configs.recommended.rules,
      ...a11y.flatConfigs.recommended.rules,
      'react/jsx-uses-vars': 'error',
      // A component used but never imported renders a blank app; no-undef does not see JSX names.
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'off',
      'no-unused-vars': ['warn', { varsIgnorePattern: '^(React|_)', argsIgnorePattern: '^_', caughtErrors: 'none' }],
      // New lime buttons and links go through buttonVariants() so the family keeps one radius, one face and one 44px floor.
      // Direct string and template className values on a raw <button>/<a> are checked (not state ternaries on chips/tabs;
      // a variant-prefixed class such as focus:bg-grove-lime is a state style and is allowed).
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXOpeningElement[name.name=/^(button|a)$/] > JSXAttribute[name.name='className'] > :matches(Literal, JSXExpressionContainer > Literal)[value=/(^|\\s)bg-grove-lime(\\s|$)/]",
          message: 'A lime-filled button or link must use buttonVariants() (src/components/ui/button) instead of a raw bg-grove-lime className.',
        },
        {
          selector: "JSXOpeningElement[name.name=/^(button|a)$/] > JSXAttribute[name.name='className'] > JSXExpressionContainer > TemplateLiteral > TemplateElement[value.raw=/(^|\\s)bg-grove-lime(\\s|$)/]",
          message: 'A lime-filled button or link must use buttonVariants() (src/components/ui/button) instead of a raw bg-grove-lime className.',
        },
        {
          selector: "JSXOpeningElement[name.name=/^(button|a|AppLink)$/] > JSXAttribute[name.name='className'] > :matches(Literal, JSXExpressionContainer > Literal)[value=/^(?=.*(^|\\s)rounded-control(\\s|$))(?=.*(^|\\s)border-grove-fernLine(\\s|$))/]",
          message: 'An outlined button or link must use buttonVariants({ variant: "outline" }) instead of a raw rounded-control border-grove-fernLine className.',
        },
      ],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
];
