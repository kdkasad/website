import { GH_API_TOKEN } from "astro:env/server";
import { z } from "zod";

function addYears(date: Date, years: number): Date {
    const newDate = new Date(date);
    newDate.setFullYear(date.getFullYear() + years);
    return newDate;
}

const QUERY = `
    query ($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
            contributionsCollection(from: $from, to: $to) {
                contributionCalendar {
                    totalContributions
                    weeks {
                        contributionDays {
                            contributionCount
                            date
                        }
                    }
                }
            }
        }
    }
`;

const ContributionDay = z.object({
    contributionCount: z.number().nonnegative(),
    date: z.coerce.date(),
});

const ApiResponseSchema = z.object({
    data: z.object({
        user: z.object({
            contributionsCollection: z.object({
                contributionCalendar: z.object({
                    totalContributions: z.number().nonnegative(),
                    weeks: z
                        .object({
                            contributionDays: ContributionDay.array(),
                        })
                        .array(),
                }),
            }),
        }),
    }),
});

/** Fetches one year of contribution data from the GitHub GraphQL API. */
async function fetchContributions(username: string, from: Date, to: Date) {
    const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${GH_API_TOKEN}`,
        },
        body: JSON.stringify({
            query: QUERY,
            variables: { username, from, to },
        }),
    });
    return ApiResponseSchema.parse(await response.json()).data.user
        .contributionsCollection.contributionCalendar;
}

type ContributionWeek = (z.infer<typeof ContributionDay> | null)[];

export interface ContributionInfo {
    totalContributions: number;
    weeks: ContributionWeek[];
}

/**
 * Fetches contributions for the given user
 * @param startDate
 */
export async function getGitHubContributionWeeks(
    username: string,
    startDate: Date,
): Promise<ContributionInfo> {
    const endDate = new Date();

    // Perform API requests concurrently, fetching one year at a time
    const apiRequests = [];
    for (let from = startDate; from < endDate; from = addYears(from, 1)) {
        const to = new Date(from);
        to.setUTCFullYear(from.getUTCFullYear(), 11, 31);
        apiRequests.push(fetchContributions(username, from, to));
    }
    const batches = await Promise.all(apiRequests);

    const totalContributions = batches
        .map((batch) => batch.totalContributions)
        .reduce((sum, count) => sum + count);
    const combinedWeeks: ContributionWeek[] = [];
    for (const batch of batches) {
        const batchWeeks = batch.weeks.map((week) => week.contributionDays);
        // Handle the case where a week is split across years
        if (
            batchWeeks.length > 0 &&
            batch.weeks[0].contributionDays.length < 7
        ) {
            const firstNewWeek = batchWeeks.shift()!;
            if (combinedWeeks.length > 0) {
                // Combine the first week of this year with the last week of the last year
                const lastWeek = combinedWeeks[combinedWeeks.length - 1];
                const combinedDays = lastWeek.length + firstNewWeek.length;
                if (combinedDays != 7) {
                    throw new Error(
                        `Weeks don't line up. Last week of last year + first week of this year = ${combinedDays} days`,
                    );
                }
                lastWeek.push(...firstNewWeek);
            } else {
                // Pad this week with nulls
                combinedWeeks.push([]);
                for (let i = firstNewWeek.length; i < 7; i++) {
                    combinedWeeks[0].push(null);
                }
                combinedWeeks[0].push(...firstNewWeek);
            }
        }
        combinedWeeks.push(...batchWeeks);
    }

    // Remove days/weeks in the future
    const lastGoodWeek = combinedWeeks.findLastIndex((week) =>
        week.some((day) => !day || day.date <= endDate),
    );
    combinedWeeks.splice(lastGoodWeek + 1);
    combinedWeeks[combinedWeeks.length - 1] = combinedWeeks[
        combinedWeeks.length - 1
    ].filter((day) => !day || day.date <= endDate);

    return {
        totalContributions,
        weeks: combinedWeeks,
    };
}
