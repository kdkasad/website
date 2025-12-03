// @ts-check
import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
    site: "https://kasad.com",
    env: {
        // Defines the schema for environment variables
        schema: {
            GH_API_TOKEN: envField.string({
                context: "server",
                access: "secret",
            }),
            SKIP_PROJECTS: envField.boolean({
                context: "server",
                access: "public",
                default: false,
            }),
        },
    },
    vite: {
        plugins: [tailwindcss()],
    },
    integrations: [icon()],
});
