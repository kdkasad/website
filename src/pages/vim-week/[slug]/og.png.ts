import { generateOGImage } from "@/lib/opengraph";
import type { APIRoute, GetStaticPaths } from "astro";
import { FrontmatterSchema } from "../_layout.astro";

export const getStaticPaths: GetStaticPaths = () =>
    [1, 2, 3, "setup"].map((slug) => ({ params: { slug: String(slug) } }));

export const GET: APIRoute = async (ctx) => {
    const post = await import(`../${ctx.params.slug}.md`);
    const { title, date, description } = FrontmatterSchema.parse(
        post?.frontmatter,
    );
    return await generateOGImage(title, date, description);
};
