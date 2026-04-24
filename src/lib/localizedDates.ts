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
