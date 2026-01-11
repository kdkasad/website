import rss, { type RSSFeedItem } from "@astrojs/rss";
import { DESCRIPTION } from "./index.astro";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getBlogPostPath } from "@/lib/blog";

export const GET: APIRoute = async ({ site }) => {
    if (!site) throw new Error("'site' must be defined in astro.config.mjs");

    const blog = await getCollection("blog");
    return rss({
        title: "Kian's blog",
        description: DESCRIPTION,
        site,
        items: blog.map(
            (post) =>
                ({
                    title: post.data.title,
                    author: post.data.author,
                    pubDate: post.data.date,
                    description: post.data.description,
                    link: getBlogPostPath(post),
                }) satisfies RSSFeedItem,
        ),
    });
};
