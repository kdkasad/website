import { formatError } from "@/lib/api";
import {
    handleOauthRedirect,
    saveCredentials,
    spotifyAPIRequest,
    type Credentials,
} from "@/lib/spotify";
import type { APIRoute } from "astro";
import { SPOTIFY_ACCOUNT_ID } from "astro:env/server";
import { z } from "zod";

function textResponse(status: number, content: string): Response {
    return new Response(content, {
        status,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });
}

export const prerender = false;
export const GET: APIRoute = async (ctx) => {
    let credentials: Credentials;
    try {
        credentials = await handleOauthRedirect(ctx.request);
    } catch (error) {
        return textResponse(500, formatError(error as Error));
    }
    const userInfo = await spotifyAPIRequest(
        "/v1/me",
        z.object({ account_id: z.string() }),
        credentials,
    );
    if (userInfo.account_id !== SPOTIFY_ACCOUNT_ID) {
        return textResponse(403, "You're not Kian");
    }
    await saveCredentials(credentials);
    return Response.redirect(new URL("/", ctx.url));
};
