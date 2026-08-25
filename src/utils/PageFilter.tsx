import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, Filter, ChevronDown, Printer, Download, FileDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface FilterOption {
    label: string;
    value: string;
}

export interface FilterGroup {
    key: string;
    label: string;
    options: FilterOption[];
}

export interface ColumnVisibilityItem {
    id: string;
    label: string;
    visible: boolean;
}

interface PageToolbarProps {
    search?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    onSearchSubmit?: () => void;

    // Filter configuration
    filterGroups?: FilterGroup[];
    filterValues?: Record<string, string>;
    onFilterChange?: (key: string, value: string) => void;

    // Columns toggle
    columns?: ColumnVisibilityItem[];
    onColumnToggle?: (columnId: string) => void;

    // Export and Print
    onPrintPdf?: () => void;
    onDownloadPdf?: () => void;
    onDownloadCsv?: () => void;

    // Reset
    onReset?: () => void;
}

import { useLanguage } from "@/i18n/LanguageContext";

export function PageFilter({
    search = "",
    onSearchChange,
    searchPlaceholder,
    onSearchSubmit,
    filterGroups = [],
    filterValues = {},
    onFilterChange,
    columns = [],
    onColumnToggle,
    onPrintPdf,
    onDownloadPdf,
    onDownloadCsv,
    onReset,
}: PageToolbarProps) {
    const { t } = useLanguage();
    const effectivePlaceholder = searchPlaceholder || t("common.search");
    // Track which filter pills are currently visible in the toolbar
    const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>([]);

    // Automatically add filter to activeFilterKeys if it has an initial non-empty value
    useEffect(() => {
        Object.entries(filterValues).forEach(([key, val]) => {
            if (val && !activeFilterKeys.includes(key)) {
                setActiveFilterKeys((prev) => [...prev, key]);
            }
        });
    }, [filterValues]);

    // Available filters that can still be added via "Filter +"
    const availableFilterGroups = filterGroups.filter(
        (g) => !activeFilterKeys.includes(g.key)
    );

    const handleAddFilter = (key: string) => {
        if (!activeFilterKeys.includes(key)) {
            setActiveFilterKeys((prev) => [...prev, key]);
        }
    };

    const handleRemoveFilter = (key: string) => {
        setActiveFilterKeys((prev) => prev.filter((k) => k !== key));
        onFilterChange?.(key, "");
    };

    const handleResetAll = () => {
        setActiveFilterKeys([]);
        onReset?.();
    };

    const hasActiveFilters =
        activeFilterKeys.length > 0 ||
        Object.values(filterValues).some((v) => !!v) ||
        !!search;

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            {/* Left toolbar section: Search + Filter Pills + Filter Add Dropdown + Reset */}
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                {/* Search Input Box */}
                <div className="relative flex items-center min-w-[220px] max-w-xs w-full sm:w-auto">
                    <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                onSearchSubmit?.();
                            }
                        }}
                        placeholder={effectivePlaceholder}
                        className={cn(
                            "h-9 w-full rounded-lg border border-border/80 bg-background pl-9 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all shadow-xs",
                            search ? "pr-8" : "pr-3"
                        )}
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => {
                                onSearchChange?.("");
                                onSearchSubmit?.();
                            }}
                            className="absolute right-2.5 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                            title="Clear search"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Active Filter Pills */}
                {activeFilterKeys.map((key) => {
                    const group = filterGroups.find((g) => g.key === key);
                    if (!group) return null;
                    const currentValue = filterValues[key] || "";
                    const selectedOption = group.options.find(
                        (opt) => opt.value === currentValue
                    );

                    return (
                        <div
                            key={key}
                            className="inline-flex items-center rounded-lg border border-border/80 bg-background h-9 shadow-xs overflow-hidden transition-all text-xs"
                        >
                            {/* Filter Dropdown Selection */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex items-center gap-1.5 px-2.5 h-full text-foreground hover:bg-muted/60 transition-colors font-medium border-r border-border/60"
                                    >
                                        <span className="text-muted-foreground font-normal">
                                            {group.label}:
                                        </span>
                                        <span className="max-w-[110px] truncate">
                                            {selectedOption ? selectedOption.label : t("common.all")}
                                        </span>
                                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-44">
                                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                        Select {group.label}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup
                                        value={currentValue}
                                        onValueChange={(val) => onFilterChange?.(key, val)}
                                    >
                                        <DropdownMenuRadioItem
                                            value=""
                                            className="text-xs cursor-pointer"
                                        >
                                            {t("common.all")}
                                        </DropdownMenuRadioItem>
                                        {group.options.map((opt) => (
                                            <DropdownMenuRadioItem
                                                key={opt.value}
                                                value={opt.value}
                                                className="text-xs cursor-pointer"
                                            >
                                                {opt.label}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Remove Filter Pill Button */}
                            <button
                                type="button"
                                onClick={() => handleRemoveFilter(key)}
                                className="h-full px-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                                title={`Remove ${group.label} filter`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    );
                })}

                {/* "Filter +" Button to add new filter pill */}
                {availableFilterGroups.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                type="button"
                                className="h-9 px-3 rounded-lg border-border/80 bg-background text-xs font-medium text-foreground hover:bg-muted/80 flex items-center gap-1.5 shadow-xs transition-all"
                            >
                                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{t("common.filter")}</span>
                                <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-44">
                            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                {t("common.filter")}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {availableFilterGroups.map((group) => (
                                <DropdownMenuItem
                                    key={group.key}
                                    onClick={() => handleAddFilter(group.key)}
                                    className="text-xs cursor-pointer"
                                >
                                    {group.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {/* Columns Visibility Dropdown */}
                {columns && columns.length > 0 && onColumnToggle && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                type="button"
                                className="h-9 px-3 rounded-lg border-border/80 bg-background text-xs font-medium text-foreground hover:bg-muted/80 flex items-center gap-1.5 shadow-xs transition-all"
                            >
                                <span>{t("common.columns")}</span>
                                <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                {t("common.columns")}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {columns.map((col) => (
                                <DropdownMenuCheckboxItem
                                    key={col.id}
                                    checked={col.visible}
                                    onCheckedChange={() => onColumnToggle(col.id)}
                                    className="text-xs cursor-pointer"
                                >
                                    {col.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {/* Reset Button */}
                {onReset && hasActiveFilters && (
                    <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={handleResetAll}
                        className="h-9 w-9 rounded-lg border-border/80 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/60 transition-all shadow-xs"
                        title={t("common.reset")}
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>

            {/* Right toolbar section: Print PDF + Download PDF + Download CSV */}
            <div className="flex items-center gap-2">
                {onPrintPdf && (
                    <Button
                        variant="outline"
                        type="button"
                        onClick={onPrintPdf}
                        className="h-9 px-3 rounded-lg border-border/80 bg-background text-xs font-medium text-foreground hover:bg-muted/80 flex items-center gap-1.5 shadow-xs transition-all"
                    >
                        <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{t("common.print")}</span>
                    </Button>
                )}

                {onDownloadPdf && (
                    <Button
                        variant="outline"
                        type="button"
                        onClick={onDownloadPdf}
                        className="h-9 px-3 rounded-lg border-border/80 bg-background text-xs font-medium text-foreground hover:bg-muted/80 flex items-center gap-1.5 shadow-xs transition-all"
                    >
                        <FileDown className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{t("common.download_pdf")}</span>
                    </Button>
                )}

                {onDownloadCsv && (
                    <Button
                        variant="outline"
                        type="button"
                        onClick={onDownloadCsv}
                        className="h-9 px-3 rounded-lg border-border/80 bg-background text-xs font-medium text-foreground hover:bg-muted/80 flex items-center gap-1.5 shadow-xs transition-all"
                    >
                        <Download className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{t("common.export_csv")}</span>
                    </Button>
                )}
            </div>
        </div>
    );
}
