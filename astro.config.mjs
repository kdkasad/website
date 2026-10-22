// @ts-check
import { defineConfig, envField } from "astro/config";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { rehypeHeadingIds, unified } from "@astrojs/markdown-remark";
import { rehypeGitHubStyleCallouts } from "@/lib/custom-markdown";
import mdx from "@astrojs/mdx";

import node from "@astrojs/node";

const baseUrl = process.env.BASE_URL;
if (!baseUrl) throw new Error("BASE_URL is not set");

// https://astro.build/config
export default defineConfig({
    site: baseUrl,
    trailingSlash: "always",

    // Preserve HTML-aware whitespace handling from Astro 6.
    compressHTML: true,

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

            // Spotify OAuth2 client ID & secret
            SPOTIFY_CLIENT_ID: envField.string({
                context: "server",
                access: "public",
            }),
            SPOTIFY_CLIENT_SECRET: envField.string({
                context: "server",
                access: "secret",
            }),

            // Spotify account ID of Kian's account
            SPOTIFY_ACCOUNT_ID: envField.string({
                context: "server",
                access: "public",
            }),

            // Directory for storing state files (e.g. Spotify OAuth token)
            STATE_DIRECTORY: envField.string({
                context: "server",
                access: "public",
            }),

            // Discord webhook URL
            DISCORD_WEBHOOK_URL: envField.string({
                context: "server",
                access: "secret",
            }),
        },
    },

    vite: {
        plugins: [tailwindcss()],
        resolve: {
            alias: {
                "@": fileURLToPath(new URL("./src", import.meta.url)),
            },
        },
        ssr: {
            noExternal: true,
            external: ["sharp"],
        },
    },

    integrations: [icon(), mdx()],

    markdown: {
        processor: unified({
            rehypePlugins: [
                rehypeHeadingIds,
                [
                    rehypeAutolinkHeadings,
                    {
                        behavior: "wrap",
                        properties: { className: "not-prose" },
                    },
                ],
                rehypeGitHubStyleCallouts,
            ],
        }),
    },

    // Prefetch next page on link hover
    prefetch: {
        prefetchAll: true,
        defaultStrategy: "hover",
    },

    adapter: node({
        mode: "standalone",
        bodySizeLimit: 1 << 20,
    }),

    security: {
        allowedDomains: [
            // { hostname: "127.0.0.1", port: "4321", protocol: "http" },
            { protocol: "https", hostname: "kasad.com" },
        ],
    },
});
