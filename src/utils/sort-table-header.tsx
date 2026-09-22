import type { Column } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SortableHeaderProps<TData> {
    column: Column<TData>
    title: string
    className?: string
}

export function SortableHeader<TData>({ column, title, className }: SortableHeaderProps<TData>) {
    const sorted = column.getIsSorted()

    return (
        <Button
            variant="ghost"
            onClick={() => column.toggleSorting(sorted === "asc")}
            className={cn(
                "-ml-2 h-7 px-2 font-bold text-xs text-foreground hover:bg-muted/80 flex items-center justify-between gap-2.5 w-full min-w-max",
                sorted && "text-primary font-extrabold",
                className
            )}
        >
            <span>{title}</span>
            {sorted === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5 text-primary shrink-0" />
            ) : sorted === "desc" ? (
                <ArrowDown className="h-3.5 w-3.5 text-primary shrink-0" />
            ) : (
                <ArrowUpDown className="h-3.5 w-3.5 opacity-40 shrink-0 hover:opacity-80" />
            )}
        </Button>
    )
}

