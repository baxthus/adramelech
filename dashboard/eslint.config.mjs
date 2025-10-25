import withNuxt from './.nuxt/eslint.config.mjs';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default withNuxt(
  {
    plugins: {
      prettier,
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'vue/max-attributes-per-line': ['error', { singleline: 4 }],
      'sort-imports': ['error', { ignoreDeclarationSort: true }],
    },
  },
  prettierConfig,
);
