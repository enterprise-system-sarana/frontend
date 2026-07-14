import { useMemo } from "react";
export function useSearch<T>(
    data: T[] | undefined | null,
    search: string,
    fields: (keyof T)[]
): T[] {
    return useMemo(() => {
        const list = data || [];
        if (!search.trim()) return list;

        const query = search.toLowerCase().trim();

        return list.filter((item) => {
            if (!item) return false;
            return fields.some((field) => {
                const value = item[field];
                if (value === undefined || value === null) return false;
                return String(value).toLowerCase().includes(query);
            });
        });
    }, [data, search, fields]);
}
