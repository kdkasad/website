import { readdir } from "node:fs/promises";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import { visit } from "unist-util-visit";
import type { Element } from "hast";

const REDIRECT_TYPE = 301;

const parser = unified().use(rehypeParse);

function expect<T>(arg: T | null | undefined, msg: string): T {
    if (arg === null || arg === undefined) {
        throw new Error("msg");
    }
    return arg;
}

async function processHTMLFile(
    path: string,
    baseDir: string,
): Promise<string | null> {
    const file = Bun.file(baseDir + "/" + path);
    const html = await file.text();
    const ast = parser.parse(html);
    let url: string | null = null;
    visit(ast, { type: "element", tagName: "meta" }, (meta: Element) => {
        const httpEquiv = meta.properties.httpEquiv as
            | string[]
            | null
            | undefined;
        if (httpEquiv?.[0]?.toLowerCase() !== "refresh") return;
        const content = meta.properties.content as string | null | undefined;
        const match = content?.match(/^\d+\s*[,;]\s*url=(.*)$/);
        if (!match) return;
        url = match[1]!;
    });
    if (!url) return null;

    return createRedirect(path, url);
}

function createRedirect(filePath: string, destination: string): string {
    let config = `location = /${filePath} { return ${REDIRECT_TYPE} ${destination}; }`;
    const indexSuffix = "/index.html";
    if (filePath.endsWith(indexSuffix)) {
        config +=
            "\n" +
            createRedirect(
                filePath.slice(0, -indexSuffix.length + 1),
                destination,
            );
    }
    return config;
}

(async () => {
    const dir = expect(
        process.argv[2],
        "First argument must be the directory to search",
    );
    const allFiles = await readdir(dir, { recursive: true });
    const configPieces = await Promise.all(
        allFiles
            .filter((file) => file.endsWith(".html"))
            .map((file) => processHTMLFile(file, dir)),
    );
    const configContents =
        configPieces.filter((s) => s !== null).join("\n") + "\n";
    process.stdout.write(configContents);
})();
