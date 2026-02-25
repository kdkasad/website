import type { APIRoute } from "astro";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { satoriAstroOG } from "satori-astro";
import { type CollectionEntry } from "astro:content";

const raleway900 = await readFile(
    fileURLToPath(
        import.meta
            .resolve("@fontsource/raleway/files/raleway-latin-900-normal.woff"),
    ),
);

const raleway500 = await readFile(
    fileURLToPath(
        import.meta
            .resolve("@fontsource/raleway/files/raleway-latin-500-normal.woff"),
    ),
);

const raleway700 = await readFile(
    fileURLToPath(
        import.meta
            .resolve("@fontsource/raleway/files/raleway-latin-700-normal.woff"),
    ),
);

const avatarBytes = await readFile(
    fileURLToPath(
        new URL(
            "../../../public/assets/laptoppfp2-offwhite-circle-small.png",
            import.meta.url,
        ),
    ),
);
const avatarDataUrl = `data:image/png;base64,${avatarBytes.toString("base64")}`;

function h(
    type: string,
    style: Record<string, string>,
    ...children: unknown[]
) {
    return { type, props: { style, children } };
}

export const GET: APIRoute<{ post: CollectionEntry<"blog" | "notes"> }> = ({
    props: { post },
}) => {
    const formattedDate =
        "date" in post.data
            ? post.data.date.toLocaleDateString("en-US", {
                  timeZone: "UTC",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
              })
            : "";

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
            },
            h("div", { display: "flex", fontSize: "20px" }, "kasad.com"),
            h("div", { flex: "1", display: "flex" }),
            h(
                "div",
                {
                    display: "flex",
                    fontSize: "84px",
                    fontWeight: "900",
                    lineHeight: "1.1",
                    textShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
                },
                post.data.title,
            ),
            h("div", { flex: "1", display: "flex" }),
            h("div", { display: "flex", fontSize: "22px" }, formattedDate),
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
                "author" in post.data ? post.data.author : "Kian Kasad",
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
                        src: avatarDataUrl,
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
