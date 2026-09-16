import vueJsx from "@vue-jsx/eslint";
import parser from "@typescript-eslint/parser";
export default [
  {
    ignores: [
      ".agents/**",
      ".codex/**",
      ".codegraph/**",
      "docs/**",
      "experiments/**",
      "**/dist/**",
      "artifacts/**",
      "playwright-report/**",
      "test-results/**",
      ".vitest/**",
    ],
  },
  vueJsx({
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: {
      "vue-jsx/jsx-sort-props": [
        2,
        {
          reservedFirst: ["v-if", "v-for", "v-show"],
          reservedLast: ["v-slot", "v-model"],
        },
      ],
      "vue-jsx/define-style": [1, { tabWidth: 2 }],
    },
  }),
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex:
                "^(?:lodash(?:-es|\\.[^/]+)?|@types/lodash(?:-es|\\.[^/]+)?)(?:/|$)",
              message: "Use native APIs or reviewed es-toolkit utilities.",
            },
          ],
        },
      ],
      "no-restricted-modules": [
        "error",
        {
          patterns: [
            "lodash",
            "lodash/*",
            "lodash-es",
            "lodash-es/*",
            "lodash.*",
            "lodash.*/*",
            "@types/lodash*",
          ],
        },
      ],
    },
  },
];
