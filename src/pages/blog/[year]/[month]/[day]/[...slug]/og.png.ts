import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { getBlogPostParams } from "@/lib/content";
import { generateOGImage } from "@/lib/opengraph";

export const getStaticPaths = (async () => {
    const posts = await getCollection("blog");
    return posts.map((post) => ({
        params: getBlogPostParams(post) as unknown as Record<string, string>,
        props: { post },
    }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ post: CollectionEntry<"blog"> }> = ({
    props: { post },
}) =>
    generateOGImage(post.data.title, post.data.date, post.data.description, {
        name: post.data.author,
    });
