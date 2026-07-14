import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

export interface DropdownFilter {
    key: string;
    placeholder: string;
    allLabel?: string;
    options: { label: string; value: string }[];
    disabled?: boolean;
}

interface PageToolbarProps {
    search?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    dropdowns?: DropdownFilter[];
    dropdownValues?: Record<string, string>;
    onDropdownChange?: (key: string, value: string) => void;
    onReset?: () => void;
}

export function PageFilter({
    search,
    onSearchChange,
    searchPlaceholder = "Search...",
    dropdowns = [],
    dropdownValues = {},
    onDropdownChange,
    onReset,
}: PageToolbarProps) {
    const hasFilters = onSearchChange || dropdowns.length > 0;

    return (
        <>
            {hasFilters && (
                <div className="flex gap-4 mb-4 items-center">
                    {onSearchChange && (
                        <div className="relative hidden md:block w-48 lg:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={searchPlaceholder}
                                value={search ?? ""}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full pl-9 pr-4 h-9 rounded-full bg-card border border-border/80 shadow-sm focus-visible:ring-primary text-xs"
                            />
                        </div>
                    )}
                    {dropdowns.map((dd) => (
                        <Select
                            key={dd.key}
                            value={dropdownValues[dd.key] ?? ""}
                            onValueChange={(val) => onDropdownChange?.(dd.key, val)}
                            disabled={dd.disabled}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder={dd.placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{dd.allLabel ?? "All"}</SelectItem>
                                {dd.options.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ))}

                    {onReset && (
                        <Button variant="outline" onClick={onReset}>
                            Reset
                        </Button>
                    )}
                </div>
            )}
        </>
    );
}
