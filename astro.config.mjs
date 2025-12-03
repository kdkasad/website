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
            // GitHub API token for fetching data like contributions and README badges
            GH_API_TOKEN: envField.string({
                context: "server",
                access: "secret",
            }),

            // If set, skips fetching of remote content (e.g. data from GitHub)
            SKIP_REMOTE: envField.boolean({
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
