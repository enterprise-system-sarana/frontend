/**
 * Utility functions for formatting dates across the project.
 */

export type DateFormatOption = "date" | "dateTime" | "time" | "isoDate" | "shortDate" | "fullDate";

/**
 * Formats a date string, timestamp, or Date object into a readable string.
 * @param date - The date value to format (string, number, Date, null, undefined)
 * @param format - Format option ('date' | 'dateTime' | 'time' | 'isoDate' | 'shortDate' | 'fullDate')
 * @param fallback - Fallback string if date is invalid or null/undefined (default: "-")
 */
export function formatDate(
    date: Date | string | number | null | undefined,
    format: DateFormatOption = "date",
    fallback = "-"
): string {
    if (!date) return fallback;

    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return fallback;

        switch (format) {
            case "isoDate":
                // e.g. 2026-08-25
                return d.toISOString().split("T")[0];

            case "dateTime":
                // e.g. 25 Aug 2026, 02:30 PM
                return d.toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                });

            case "time":
                // e.g. 02:30 PM
                return d.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                });

            case "shortDate":
                // e.g. 08/25/2026
                return d.toLocaleDateString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                });

            case "fullDate":
                // e.g. August 25, 2026
                return d.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                });

            case "date":
            default:
                // e.g. 25 Aug 2026 or YYYY-MM-DD
                return d.toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                });
        }
    } catch {
        return fallback;
    }
}

/**
 * Formats a date with time: "25 Aug 2026, 02:30 PM"
 */
export function formatDateTime(date: Date | string | number | null | undefined, fallback = "-"): string {
    return formatDate(date, "dateTime", fallback);
}

/**
 * Formats a date in ISO YYYY-MM-DD: "2026-08-25"
 */
export function formatIsoDate(date: Date | string | number | null | undefined, fallback = "-"): string {
    return formatDate(date, "isoDate", fallback);
}

export default formatDate;
