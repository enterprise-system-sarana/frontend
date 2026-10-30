import type { Column } from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SortableHeaderProps<TData> {
    column: Column<TData>
    title: string
    className?: string
}

/** Column header that toggles sorting; inherits the table header typography. */
export function SortableHeader<TData>({ column, title, className }: SortableHeaderProps<TData>) {
    const sorted = column.getIsSorted()

    return (
        <button
            type="button"
            onClick={() => column.toggleSorting(sorted === "asc")}
            className={cn(
                "-ml-1.5 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-1.5 uppercase tracking-[inherit] transition-colors hover:bg-muted hover:text-foreground",
                sorted && "text-foreground",
                className
            )}
        >
            <span>{title}</span>
            {sorted === "asc" ? (
                <ArrowUp className="size-3.5 shrink-0 text-primary" />
            ) : sorted === "desc" ? (
                <ArrowDown className="size-3.5 shrink-0 text-primary" />
            ) : (
                <ArrowUpDown className="size-3.5 shrink-0 opacity-50" />
            )}
        </button>
    )
}
