const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/**', 'ios/**', 'android/**', '.expo/**'],
  },
  {
    // Deterministic guards against common LLM failure modes:
    // sprawling functions, deep nesting, and unstructured complexity.
    rules: {
      // NOTE: 'react-hooks/purity': 'warn' (used in sibling repos) is omitted —
      // eslint-config-expo ~10 ships eslint-plugin-react-hooks v5, which does
      // not define that rule. Re-add when upgrading to eslint-config-expo 57+.
      complexity: ['error', 15],
      'max-depth': ['error', 5],
      'max-lines-per-function': [
        'error',
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      'max-lines': ['error', { max: 1000, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // Supabase Edge Functions run on Deno and import from URLs, which the
    // Node resolver cannot follow.
    files: ['supabase/functions/**'],
    rules: {
      'import/no-unresolved': 'off',
    },
  },
]);
