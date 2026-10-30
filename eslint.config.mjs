import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

// The suite runs against the deployed site, so it can only rely on what a user
// (or a screen reader) sees: roles and accessible names. Raw CSS/XPath, list
// positions and fixed sleeps are what made it break whenever the markup moved.
export default [
  { ignores: ['node_modules/**', 'test-results/**', 'playwright-report/**', 'scripts/attach-screens.mjs'] },
  {
    files: ['tests/**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { playwright },
    rules: {
      'playwright/no-raw-locators': 'error',
      'playwright/no-nth-methods': 'error',
      'playwright/no-wait-for-timeout': 'error',
    },
  },
  // Run and report scripts are plain TypeScript: only parsed here, the Playwright rules do not apply
  { files: ['scripts/**/*.ts'], languageOptions: { parser: tseslint.parser } },
];
