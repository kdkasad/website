import type { GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { getBlogPostParams } from "@/lib/content";

export const getStaticPaths = (async () => {
    const posts = await getCollection("blog");
    return posts.map((post) => ({
        params: getBlogPostParams(post) as unknown as Record<string, string>,
        props: { post },
    }));
}) satisfies GetStaticPaths;

export { GET } from "@/lib/opengraph";
