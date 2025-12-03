import { defineCollection, z, reference } from "astro:content";

import { glob, file } from "astro/loaders";

export const collections = {
    // This collection is a mapping of devicon IDs to metadata used when
    // displaying them, such as a full name for what the icon represents and a
    // URL for more information about the technology
    deviconMappings: defineCollection({
        loader: file("src/content/devicons.yml"),
        schema: z.object({
            url: z.string().url().optional(),
            name: z.string().nonempty(),
            replaceWith: z.string().optional(),
        }),
    }),

    projects: defineCollection({
        loader: glob({ pattern: "**/*.md", base: "src/content/projects" }),
        schema: ({ image }) =>
            z.object({
                title: z.string(),
                tagline: z.string(),
                year: z.coerce.string(),
                image: z.object({
                    file: image(),
                    caption: z.string(),
                    alt: z.string().optional(),
                }),
                githubId: z
                    .string()
                    .regex(
                        /^[^/]+\/[^/]+$/,
                        "GitHub repository ID must be <user-or-org>/<repo-name>",
                    )
                    .optional(),
                links: z
                    .array(
                        z.object({
                            name: z.string(),
                            url: z.string().url(),
                            icon: z.string(),
                        }),
                    )
                    .default([]),
                devicons: z.array(reference("deviconMappings")),
            }),
    }),
};
