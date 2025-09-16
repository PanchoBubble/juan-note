import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      prettier,
    },
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    ignores: [
      "dist/**",
      "src-tauri/**",
      "mcp-server/**",
      "node_modules/**",
      "*.config.js",
      "*.config.ts",
    ],
  },
];
