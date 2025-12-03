/**
 * Helper utilities to extract badges from the README files of GitHub projects.
 */

import { GH_API_TOKEN } from "astro:env/server";
import z from "zod";

export interface Badge {
    linkUrl: string;
    imageUrl: string;
    alt: string;
}

const Badge = z.object({
    linkUrl: z.string(),
    imageUrl: z.string(),
    alt: z.string(),
});

const FileResponse = z.object({
    content: z.string(),
    html_url: z.string().url(),
});

async function getGitHubFile(
    repoId: string,
    file: string,
): Promise<z.infer<typeof FileResponse>> {
    const url = `https://api.github.com/repos/${repoId}/contents/${file}`;
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${GH_API_TOKEN}`,
            Accept: "application/vnd.github.object+json",
        },
        redirect: "follow",
    });
    if (!response.ok) {
        throw new Error(
            `GitHub API returned ${response.status} ${response.statusText} for ${url}`,
        );
    }
    return FileResponse.parse(await response.json());
}

export async function getBadgesForRepo(repoId: string): Promise<Badge[]> {
    const fileInfo = await getGitHubFile(repoId, "README.md");
    const markdown = atob(fileInfo.content);

    // Extract badges from Markdown content
    const matches = markdown.matchAll(
        /\[!\[(?<alt>.*?)\]\((?<imageUrl>.*?)\)\]\((?<linkUrl>.*?)\)/g,
    );
    const badges = Array.from(matches, (match) => Badge.parse(match.groups));

    // Convert relative links to absolute ones
    for (const badge of badges) {
        if (badge.linkUrl.match(/https?:\/\//) === null) {
            // URL is relative; get absolute URL from GitHub API
            const fileInfo = await getGitHubFile(repoId, badge.linkUrl);
            badge.linkUrl = fileInfo.html_url;
        }
    }

    return badges;
}
