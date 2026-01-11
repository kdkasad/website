import type { CollectionEntry } from "astro:content";

export interface BlogPostParams {
    year: string;
    month: string;
    day: string;
    slug: string;
}

export function getBlogPostParams(
    post: CollectionEntry<"blog">,
): BlogPostParams {
    const date = post.data.date;
    return {
        slug: post.id,
        year: date.getUTCFullYear().toString().padStart(4, "0"),
        month: (date.getUTCMonth() + 1).toString().padStart(2, "0"),
        day: date.getUTCDate().toString().padStart(2, "0"),
    };
}

export function getBlogPostPath(post: CollectionEntry<"blog">): string {
    const params = getBlogPostParams(post);
    return `/blog/${params.year}/${params.month}/${params.day}/${params.slug}/`;
}
