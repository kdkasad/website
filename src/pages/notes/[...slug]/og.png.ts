import type { GetStaticPaths } from "astro";
import { getCollection } from "astro:content";

export const getStaticPaths = (async () => {
    const notes = await getCollection("notes");
    return notes.map((note) => ({
        params: { slug: note.id },
        props: { post: note },
    }));
}) satisfies GetStaticPaths;

export { GET } from "@/lib/opengraph";
