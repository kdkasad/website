import { generateOGImage } from "@/lib/opengraph";
import type { APIRoute } from "astro";

export const GET: APIRoute = () =>
    generateOGImage(
        "Reading\nlist",
        undefined,
        "A collection of saved articles and my to-read list.",
    );
