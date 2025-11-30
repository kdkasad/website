import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import eslint from "@eslint/js";
import eslintPluginAstro from "eslint-plugin-astro";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig(
    // Ignore generated files & dependencies
    {
        ignores: ["dist/", "node_modules/", ".astro/", ".prettierrc.mjs"],
    },

    // Base JS
    eslint.configs.recommended,

    // TypeScript
    ...tseslint.configs.strictTypeChecked,
    // Parser settings for type-checked linting
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
    },

    // Astro
    ...eslintPluginAstro.configs.recommended,
    ...eslintPluginAstro.configs["jsx-a11y-strict"],

    // Disable rules that conflict with Prettier
    eslintConfigPrettier,
);
