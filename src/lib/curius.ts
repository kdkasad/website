import z from "zod";

export const CURIUS_USER_ID = 6974;

export const UserSchema = z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    userLink: z.string(),
    lastOnline: z.coerce.date(),
});

export const TopicSchema = z.object({
    id: z.number(),
    userId: z.number(),
    topic: z.string(),
    slug: z.string(),
    public: z.boolean(),
    createdDate: z.coerce.date(),
    modifiedDate: z.coerce.date(),
});

export const CommentSchema = z.object({
    id: z.number(),
    userId: z.number(),
    user: UserSchema,
    parentId: z.number().nullable(),
    text: z.string(),
    createdDate: z.coerce.date(),
    modifiedDate: z.coerce.date(),
    get replies() {
        return z.array(CommentSchema);
    },
});

export const HighlightSchema = z.object({
    id: z.number(),
    userId: z.number(),
    linkId: z.number(),
    highlight: z.string(),
    createdDate: z.coerce.date(),
    leftContext: z.string(),
    rightContext: z.string(),
    rawHighlight: z.string(),
    comment_ids: z.array(z.number().nullable()),
    comment: CommentSchema.nullable(),
});

export const SavedLinkSchema = z.object({
    id: z.number(),
    link: z.url(),
    title: z.string(),
    favorite: z.boolean(),
    snippet: z.string(),
    toRead: z
        .boolean()
        .nullable()
        .transform((toRead) => (toRead === null ? false : toRead)),
    createdBy: z.number(),
    createdDate: z.coerce.date(),
    modifiedDate: z.coerce.date(),
    lastCrawled: z.unknown().nullable(), // TODO: figure this out
    trails: z.array(z.unknown()), // TODO: figure this out
    comments: z.array(CommentSchema),
    mentions: z.array(z.unknown()), // TODO: figure this out
    topics: z.array(TopicSchema),
    highlights: z.array(HighlightSchema),
    userIds: z.array(z.number()).default([]),
});
export type SavedLink = z.output<typeof SavedLinkSchema>;

export class APIError extends Error {
    constructor(
        message: string,
        public readonly response: Response,
        public readonly url: string,
    ) {
        super(message);
        this.name = "APIError";
    }
}

export async function getSavedLinks(
    userId: number,
): Promise<{ saved: SavedLink[]; toRead: SavedLink[] }> {
    const ApiResponseSchema = z.object({ userSaved: z.array(SavedLinkSchema) });
    let lastResponse: SavedLink[];
    // Get saved links
    let saved: SavedLink[] = [];
    let page = 0;
    do {
        const response = await apiRequest(
            `/users/${userId}/links?toRead=0&page=${page}`,
            ApiResponseSchema,
        );
        lastResponse = response.userSaved;
        saved.push(...lastResponse);
        page += 1;
    } while (lastResponse.length > 0);
    // Get reading list
    let toRead: SavedLink[] = [];
    page = 0;
    do {
        const response = await apiRequest(
            `/users/${userId}/links?toRead=1&page=${page}`,
            ApiResponseSchema,
        );
        lastResponse = response.userSaved;
        toRead.push(...lastResponse);
        page += 1;
    } while (lastResponse.length > 0);
    return { saved, toRead };
}

async function apiRequest<T extends z.ZodType>(
    endpoint: string,
    responseSchema: T,
): Promise<z.output<T>> {
    const url = `https://curius.app/api${endpoint}`;
    const response = await fetch(url, {
        headers: { Accept: "application/json" },
    });
    if (!response.ok) {
        throw new APIError(
            `Curius API returned non-ok status: ${response.status} ${response.statusText}`,
            response,
            url,
        );
    }
    const data = await response.json();
    return responseSchema.parse(data);
}
