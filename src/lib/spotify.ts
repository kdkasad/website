import {
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
    STATE_DIRECTORY,
    DISCORD_WEBHOOK_URL,
} from "astro:env/server";
import { z } from "zod";
import { readFile, writeFile } from "node:fs/promises";
import { TimedCache } from "./timed-cache";

const REFRESH_TOKEN_VALIDITY_MS = 1000 * 60 * 60 * 24 * 180; // 180 days

export class OauthError extends Error {
    constructor(...args: Parameters<ErrorConstructor>) {
        super(...args);
        this.name = "OauthError";
    }
}

export class SpotifyAPIError extends Error {
    constructor(...args: Parameters<ErrorConstructor>) {
        super(...args);
        this.name = "SpotifyAPIError";
    }
}

export function startOauth(redirectUri: URL): Response {
    // https://www.rfc-editor.org/info/rfc6749/#section-4.1.1
    const query = new URLSearchParams({
        response_type: "code",
        client_id: SPOTIFY_CLIENT_ID,
        redirect_uri: redirectUri.href,
        scope: "user-read-currently-playing user-read-email user-read-private",
    });
    return Response.redirect(
        `https://accounts.spotify.com/authorize?${query}`,
        303,
    );
}

// https://www.rfc-editor.org/info/rfc6749/#section-4.1.2
const AuthorizationResponseSchema = z.object({
    code: z.string(),
    state: z.string().optional(),
});

// https://www.rfc-editor.org/info/rfc6749/#section-4.1.2.1
const AuthorizationErrorSchema = z.object({
    error: z.enum([
        "invalid_request",
        "unauthorized_client",
        "access_denied",
        "unsupported_response_type",
        "invalid_scope",
        "server_error",
        "temporarily_unavailable",
    ]),
    error_description: z.string().optional(),
    error_uri: z.string().optional(),
    state: z.string().optional(),
});

const TokenResponseSchema = z.object({
    access_token: z.string(),
    token_type: z.literal("Bearer"),
    expires_in: z.number(),
    refresh_token: z.string(),
    scope: z.string().optional(),
});
type AuthToken = z.infer<typeof TokenResponseSchema>;

const RefreshTokenResponseSchema = z.object({
    access_token: z.string(),
    token_type: z.literal("Bearer"),
    expires_in: z.number(),
    refresh_token: z.string().optional(),
    scope: z.string().optional(),
});

function textResponse(status: number, content: string): Response {
    return new Response(content, {
        status,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });
}

export async function handleOauthRedirect(request: Request) {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    if (queryParams.error !== undefined) {
        // Error response
        const errorParseResult =
            AuthorizationErrorSchema.safeParse(queryParams);
        if (!errorParseResult.success) {
            throw new OauthError(
                "Invalid parameters for OAuth2 authorization error response",
                { cause: errorParseResult.error },
            );
        }
        throw new OauthError(
            `Authorization server returned error: ${JSON.stringify(errorParseResult.data)}`,
        );
    }

    // Successful response
    const parseResult = AuthorizationResponseSchema.safeParse(queryParams);
    if (!parseResult.success) {
        throw new OauthError(
            "Invalid parameters for OAuth2 authorization response",
            { cause: parseResult.data },
        );
    }
    const params = parseResult.data;
    return exchangeCodeForToken(params.code, new URL(".", url));
}

async function exchangeCodeForToken(
    code: string,
    redirectUri: URL,
): Promise<Credentials> {
    // Exchange code for a token
    let response: Response;
    try {
        // https://www.rfc-editor.org/info/rfc6749/#section-4.1.3
        response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code: code,
                redirect_uri: redirectUri.href,
                client_id: SPOTIFY_CLIENT_ID,
                client_secret: SPOTIFY_CLIENT_SECRET,
            }),
        });
    } catch (error) {
        throw new OauthError(`Error sending access token request`, {
            cause: error,
        });
    }

    if (response.status !== 200) {
        throw new OauthError(
            `Access token request returned error: ${await response.text()}`,
        );
    }

    let responseBody: unknown;
    try {
        responseBody = await response.json();
    } catch (error) {
        throw new Error("Error deserializing token response JSON", {
            cause: error,
        });
    }

    let responseData: AuthToken;
    try {
        responseData = TokenResponseSchema.parse(responseBody);
    } catch (error) {
        throw new Error("Invalid token response", { cause: error });
    }
    const credentials: Credentials = {
        accessToken: responseData.access_token,
        accessTokenExpiresAt: new Date(
            Date.now() + 1000 * (responseData.expires_in ?? 3600),
        ),
        refreshToken: responseData.refresh_token,
        refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TOKEN_VALIDITY_MS),
    };
    return credentials;
}

const isoDatetimeToDate = z.codec(z.iso.datetime(), z.date(), {
    decode: (isoString) => new Date(isoString),
    encode: (date) => date.toISOString(),
});
const CredentialsSchema = z.object({
    accessToken: z.string(),
    accessTokenExpiresAt: isoDatetimeToDate,
    refreshToken: z.string(),
    refreshTokenExpiresAt: isoDatetimeToDate,
});
export type Credentials = z.infer<typeof CredentialsSchema>;
const jsonCodec = <T extends z.core.$ZodType>(schema: T) =>
    z.codec(z.string(), schema, {
        decode: (jsonString, ctx) => {
            try {
                return JSON.parse(jsonString);
            } catch (err: any) {
                ctx.issues.push({
                    code: "invalid_format",
                    format: "json",
                    input: jsonString,
                    message: err.message,
                });
                return z.NEVER;
            }
        },
        encode: (value) => JSON.stringify(value),
    });

let cachedCredentials: Credentials | null = null;

export async function saveCredentials(credentials: Credentials) {
    console.log("Saving Spotify OAuth credentials");
    cachedCredentials = credentials;
    await writeFile(
        `${STATE_DIRECTORY}/spotify_creds.json`,
        jsonCodec(CredentialsSchema).encode(credentials),
        { encoding: "utf-8" },
    );
}

async function loadCredentials(): Promise<Credentials> {
    const isCached = cachedCredentials !== null;
    console.log(
        `Loading Spotify OAuth credentials (cache ${isCached ? "hit" : "miss"})`,
    );
    let creds: Credentials;
    if (isCached) {
        creds = cachedCredentials!;
    } else {
        const data = await readFile(`${STATE_DIRECTORY}/spotify_creds.json`, {
            encoding: "utf-8",
        });
        creds = jsonCodec(CredentialsSchema).decode(data);
        cachedCredentials = creds;
    }
    const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;
    if (Date.now() + ONE_WEEK >= creds.refreshTokenExpiresAt.getTime()) {
        await sendCredentialExpiryNotification(creds.refreshTokenExpiresAt);
    }
    return creds;
}

async function sendCredentialExpiryNotification(expiresAt: Date) {
    console.log(
        "Spotify refresh token expiring soon. Sending Discord message.",
    );
    const timestampInSeconds = Math.floor(expiresAt.getTime() / 1000);
    const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            content: `Spotify OAuth refresh token is expiring <t:${timestampInSeconds}:R>`,
        }),
    });
    if (!response.ok) {
        throw new Error(
            `Failed to send Discord message: ${await response.text()}`,
        );
    }
}

async function refreshAccessToken(oldCreds: Credentials): Promise<Credentials> {
    console.log("Refreshing Spotify OAuth2 acces token");
    let response: Response;
    try {
        response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                Authorization:
                    "Basic " +
                    btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: oldCreds.refreshToken,
            }),
        });
    } catch (cause) {
        throw new OauthError("Failed to send refresh request", { cause });
    }
    if (!response.ok) {
        throw new OauthError(
            `Refresh request returned error response: ${await response.text()}`,
        );
    }
    const body = await response.text();
    const data = jsonCodec(RefreshTokenResponseSchema).parse(body);
    const newCreds: Credentials = {
        ...oldCreds,
        accessToken: data.access_token,
        accessTokenExpiresAt: new Date(Date.now() + 1000 * data.expires_in),
        refreshToken: data.refresh_token ?? oldCreds.refreshToken,
    };
    await saveCredentials(newCreds);
    return newCreds;
}

export async function spotifyAPIRequest<T>(
    path: string,
    responseSchema: z.ZodType<T>,
    credentials?: Credentials,
    refreshAndRetryOn401: boolean = true,
): Promise<T> {
    const creds = credentials ?? (await loadCredentials());
    let response: Response;
    try {
        response = await fetch(`https://api.spotify.com${path}`, {
            headers: {
                Authorization: `Bearer ${creds.accessToken}`,
            },
        });
    } catch (cause) {
        throw new SpotifyAPIError("Failed to send request", { cause });
    }
    if (response.status === 401 && refreshAndRetryOn401) {
        console.warn(
            "Spotify API returned 401. Refreshing token and trying again",
        );
        const newCreds = await refreshAccessToken(creds);
        return spotifyAPIRequest(path, responseSchema, newCreds, false);
    }
    if (!response.ok) {
        throw new SpotifyAPIError(
            `Request returned error response: ${await response.text()}`,
        );
    }
    if (response.status === 204) {
        return responseSchema.parse(null);
    }
    const data = jsonCodec(responseSchema).parseAsync(await response.text());
    return data;
}

const ImageSchema = z.object({
    url: z.url(),
    height: z.number(),
    width: z.number(),
});

const AlbumSchema = z.object({
    images: z.array(ImageSchema),
    name: z.string(),
});

const ArtistSchema = z.object({
    name: z.string(),
});

const TrackSchema = z.object({
    duration_ms: z.number(),
    explicit: z.boolean(),
    name: z.string(),
    type: z.literal("track"),
    album: AlbumSchema,
    artists: z.array(ArtistSchema).default([]),
});

const EpisodeSchema = z.object({
    duration_ms: z.number(),
    images: z.array(ImageSchema),
    name: z.string(),
    type: z.literal("episode"),
    show: z.object({
        name: z.string(),
    }),
});

const CurrentlyPlayingSchema = z
    .object({
        item: z.union([TrackSchema, EpisodeSchema]).nullable(),
        progress_ms: z.number().nullable(),
    })
    .nullable();
export type NowPlaying = z.infer<typeof CurrentlyPlayingSchema>;

const nowPlayingCache = new TimedCache<NowPlaying>(1000 * 30); // 15-second TTL
export async function getNowPlaying(): Promise<NowPlaying> {
    const cached = nowPlayingCache.get();
    console.log(
        `Getting Spotify now playing (cache ${cached !== undefined ? "hit" : "miss"})`,
    );
    if (cached !== undefined) return cached;
    const data = await spotifyAPIRequest(
        "/v1/me/player/currently-playing",
        CurrentlyPlayingSchema,
    );
    nowPlayingCache.put(data);
    return data;
}
