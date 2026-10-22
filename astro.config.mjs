// @ts-check
import { defineConfig, envField } from "astro/config";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { rehypeHeadingIds, unified } from "@astrojs/markdown-remark";
import { rehypeGitHubStyleCallouts } from "@/lib/custom-markdown";
import mdx from "@astrojs/mdx";

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
        },
    },
    vite: {
        plugins: [tailwindcss()],
        resolve: {
            alias: {
                "@": fileURLToPath(new URL("./src", import.meta.url)),
            },
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
});
