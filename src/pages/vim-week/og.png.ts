import { generateOGImage } from "@/lib/opengraph";
import type { APIRoute } from "astro";
import { frontmatter } from "./index.md";
import { FrontmatterSchema } from "./_layout.astro";

export const GET: APIRoute = async (ctx) => {
    const { title, date, description } = FrontmatterSchema.parse(frontmatter);
    return await generateOGImage(title, date, description);
};
