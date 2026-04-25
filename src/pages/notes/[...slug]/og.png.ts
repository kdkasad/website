import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { generateOGImage } from "@/lib/opengraph";

export const getStaticPaths = (async () => {
    const notes = await getCollection("notes");
    return notes.map((note) => ({
        params: { slug: note.id },
        props: { note: note },
    }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ note: CollectionEntry<"notes"> }> = ({
    props: { note },
}) => generateOGImage(note.data.title);
