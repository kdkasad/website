import { startOauth } from "@/lib/spotify";
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
    return startOauth(new URL("../redirect/", ctx.url));
};
