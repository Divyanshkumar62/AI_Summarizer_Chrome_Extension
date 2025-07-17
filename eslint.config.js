import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["dist/**"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        chrome: "readonly",
        SpeechSynthesisVoice: "readonly",
        SpeechSynthesisUtterance: "readonly",
        speechSynthesis: "readonly",
      },
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": "off", // TypeScript handles this
      "no-console": "off", // Allow console for debugging in extensions
      "prefer-const": "error",
      "no-var": "error",
      "@typescript-eslint/no-explicit-any": "warn", // Warn about any types
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        module: "readonly",
        __dirname: "readonly",
        require: "readonly",
      },
    },
  },
];
