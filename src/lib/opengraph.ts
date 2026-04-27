import type { APIRoute } from "astro";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { satoriAstroOG } from "satori-astro";
import { type CollectionEntry } from "astro:content";
import avatarDataUrl from "../../public/assets/laptoppfp2-offwhite-circle-small.png?inline";

const require = createRequire(import.meta.url);

const raleway900 = await readFile(
    require.resolve("@fontsource/raleway/files/raleway-latin-900-normal.woff"),
);

const raleway500 = await readFile(
    require.resolve("@fontsource/raleway/files/raleway-latin-500-normal.woff"),
);

const raleway700 = await readFile(
    require.resolve("@fontsource/raleway/files/raleway-latin-700-normal.woff"),
);

function h(
    type: string,
    style: Record<string, string | number>,
    ...children: unknown[]
) {
    const filteredChildren = children.filter(Boolean);
    return {
        type,
        props: {
            style,
            children:
                filteredChildren.length === 0
                    ? undefined
                    : filteredChildren.length === 1
                      ? filteredChildren[0]
                      : filteredChildren,
        },
    };
}

export const generateOGImage = (
    title: string,
    date?: Date,
    description?: string,
    author: { name: string; avatarUrl?: string } = {
        name: "Kian Kasad",
    },
): Promise<Response> => {
    const formattedDate =
        date &&
        date.toLocaleDateString("en-US", {
            timeZone: "UTC",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

    const template = h(
        "div",
        {
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#f5f5f4",
            fontFamily: "Raleway",
            fontWeight: "700",
        },
        h(
            "div",
            {
                width: "100%",
                height: "484px",
                padding: "36px 112px 40px",
                backgroundColor: "#39A56F",
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                fontSize: "22px",
            },
            h("div", { display: "flex" }, "kasad.com"),
            h("div", { flex: "1" }),
            h(
                "div",
                {
                    display: "block",
                    fontSize: "84px",
                    fontWeight: "900",
                    lineHeight: "1.1",
                    textShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
                    lineClamp: formattedDate && description ? 2 : 3,
                },
                title,
            ),
            h("div", { flex: "1" }),
            description &&
                h("div", { display: "block", lineClamp: 2 }, description),
            formattedDate && description && h("div", { flex: "1" }),
            formattedDate && h("div", { display: "flex" }, formattedDate),
        ),
        h(
            "div",
            {
                width: "100%",
                height: "146px",
                padding: "0 36px",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
                color: "#1c1917",
            },
            h(
                "div",
                {
                    display: "flex",
                    fontSize: "32px",
                    fontWeight: "700",
                    marginRight: "20px",
                    textShadow: "0 2px 3px rgba(0, 0, 0, 0.25)",
                },
                author.name,
            ),
            h(
                "div",
                {
                    width: "81px",
                    height: "81px",
                    borderRadius: "50%",
                    border: "6px solid #39A56F",
                    display: "flex",
                    boxSizing: "content-box",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
                },
                {
                    type: "img",
                    props: {
                        src: author.avatarUrl ?? avatarDataUrl,
                        width: 81,
                        height: 81,
                        style: { borderRadius: "50%" },
                    },
                },
            ),
        ),
    );

    return satoriAstroOG({
        template,
        width: 1200,
        height: 630,
    }).toResponse({
        satori: {
            fonts: (
                [
                    [500, raleway500],
                    [700, raleway700],
                    [900, raleway900],
                ] satisfies [500 | 700 | 900, Buffer][]
            ).map(([weight, data]) => ({
                name: "Raleway",
                style: "normal",
                weight,
                data,
            })),
        },
    });
};
