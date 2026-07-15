import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const sourceFiles = ["src/**/*.{ts,tsx}", "worker/**/*.ts"];
const testAndConfigFiles = [
  "**/*.{test,spec}.{ts,tsx}",
  "tests/**/*.{ts,tsx}",
  "*.config.ts"
];

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "output/**", "playwright-report/**", "test-results/**", "tmp/**"]
  },
  {
    files: sourceFiles,
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.serviceworker
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports", prefer: "type-imports" }
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      complexity: ["error", { max: 25 }],
      eqeqeq: ["error", "always"],
      "max-depth": ["error", 4],
      "max-lines": ["error", { max: 520, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": [
        "error",
        { IIFEs: true, max: 310, skipBlankLines: true, skipComments: true }
      ],
      "max-params": ["error", 5],
      "no-console": ["error", { allow: ["error", "warn"] }],
      "no-eval": "error",
      "no-new-func": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "Do not inject raw HTML. Render structured React content instead."
        }
      ],
      "no-warning-comments": [
        "error",
        { location: "anywhere", terms: ["fixme", "hack", "todo", "xxx"] }
      ],
      "react-hooks/set-state-in-effect": "off"
    }
  },
  {
    files: ["src/**/*.ts", "worker/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-magic-numbers": [
        "error",
        {
          detectObjects: false,
          enforceConst: true,
          ignore: [-1, 0, 1, 2],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true
        }
      ]
    }
  },
  {
    files: testAndConfigFiles,
    extends: [js.configs.recommended, ...tseslint.configs.recommended, tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      complexity: "off",
      "max-lines": "off",
      "max-lines-per-function": "off",
      "no-magic-numbers": "off"
    }
  },
  {
    files: ["*.{js,mjs}", "scripts/**/*.mjs"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node
    }
  }
);
