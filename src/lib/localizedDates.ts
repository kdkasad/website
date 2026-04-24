export type Style = keyof typeof formatOptions;
const formatOptions = {
    "locale-long": { dateStyle: "long" },
    "locale-short": { dateStyle: "short" },
    "Monday, Jan 1, 2020": {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
    },
    "Jan 1, 2020": {
        month: "short",
        day: "numeric",
        year: "numeric",
    },
    "locale-long-time": { dateStyle: "long", timeStyle: "long" },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

export function getFormatterForStyle(
    style: Style,
    timeZone?: string,
): Intl.DateTimeFormat {
    return new Intl.DateTimeFormat(undefined, {
        ...formatOptions[style],
        timeZone,
    });
}

export function getRelativeTime(
    formatter: Intl.RelativeTimeFormat,
    date: Date,
    now: Date = new Date(),
) {
    const diff = date.getTime() - now.getTime();
    const absDiff = Math.abs(diff);
    const sign = Math.sign(diff);
    const seconds = absDiff / 1000;
    if (seconds < 60) {
        return "now";
    }
    const minutes = seconds / 60;
    if (minutes < 60) {
        return formatter.format(sign * Math.round(minutes), "minute");
    }
    const hours = minutes / 60;
    if (hours < 24) {
        return formatter.format(sign * Math.round(hours), "hour");
    }
    const days = hours / 24;
    if (days < 7) {
        return formatter.format(sign * Math.round(days), "day");
    }
    const weeks = days / 7;
    if (weeks < 4) {
        return formatter.format(sign * Math.round(weeks), "week");
    }
    const months = weeks / 4;
    if (months < 12) {
        return formatter.format(sign * Math.round(months), "month");
    }
    const years = months / 12;
    return formatter.format(sign * Math.round(years), "year");
}
