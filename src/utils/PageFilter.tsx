import { Button } from "@/components/ui/button";
import {
  Search,
  RotateCcw,
  ChevronDown,
  X,
  Calendar,
  Printer,
  Download,
  FileSpreadsheet,
} from "lucide-react";
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
import { useLanguage } from "@/i18n/LanguageContext";

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

export interface PageToolbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  onSearchSubmit?: () => void;
  showSearch?: boolean;

  // Date range filters
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;

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

export function PageFilter({
  search = "",
  onSearchChange,
  searchPlaceholder,
  onSearchSubmit,
  showSearch = true,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
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

  const handleResetAll = () => {
    onStartDateChange?.("");
    onEndDateChange?.("");
    onReset?.();
  };

  const hasActiveFilters =
    Object.entries(filterValues).some(([, v]) => v && v !== "all" && v !== "") ||
    !!search ||
    !!startDate ||
    !!endDate;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 w-full">
      {/* Left toolbar section: Search + Date Range + Direct Filter Buttons + Reset */}
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
        {/* Search Input Box */}
        {showSearch && (
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
                search ? "pr-8" : "pr-3",
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
        )}

        {/* Date Range Inputs */}
        {(onStartDateChange || onEndDateChange) && (
          <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 h-9 shadow-xs text-xs">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={startDate || ""}
              onChange={(e) => onStartDateChange?.(e.target.value)}
              className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
              title="Start Date"
            />
            <span className="text-muted-foreground">→</span>
            <input
              type="date"
              value={endDate || ""}
              onChange={(e) => onEndDateChange?.(e.target.value)}
              className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
              title="End Date"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  onStartDateChange?.("");
                  onEndDateChange?.("");
                }}
                className="ml-1 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear date range"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Direct Filter Dropdowns (e.g. [Customer ⌄] [Status ⌄]) */}
        {filterGroups.map((group) => {
          const currentValue = filterValues[group.key] || "";
          const isSelected = !!currentValue && currentValue !== "all" && currentValue !== "";
          const selectedOption = group.options.find(
            (opt) => String(opt.value) === String(currentValue),
          );

          return (
            <DropdownMenu key={group.key}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "h-9 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer",
                    isSelected &&
                      "border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold ring-1 ring-teal-500/20",
                  )}
                >
                  <span className="truncate max-w-[130px]">
                    {isSelected
                      ? `${group.label}: ${selectedOption?.label || currentValue}`
                      : group.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 text-slate-600 dark:text-slate-400 transition-transform",
                      isSelected && "text-teal-600 dark:text-teal-400",
                    )}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[160px] max-h-64 overflow-y-auto">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Select {group.label}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={currentValue}
                  onValueChange={(val) => onFilterChange?.(group.key, val)}
                >
                  <DropdownMenuRadioItem value="" className="text-xs cursor-pointer font-medium">
                    All {group.label}
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
          );
        })}

        {/* Reset Button */}
        {onReset && (
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={handleResetAll}
            className={cn(
              "h-9 w-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-2xs cursor-pointer",
              hasActiveFilters && "text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 border-slate-400",
            )}
            title={t("common.reset")}
          >
            <RotateCcw className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Right toolbar section: Columns + Export Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Columns Visibility Dropdown */}
        {columns && columns.length > 0 && onColumnToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                type="button"
                className="h-9 px-3 rounded-lg border-border/80 bg-background text-xs font-medium text-foreground hover:bg-muted/80 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <span>{t("common.columns")}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
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

        {/* Print PDF Button */}
        {onPrintPdf && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onPrintPdf}
            className="h-9 px-3 rounded-lg border-border/80 bg-background text-xs font-medium text-foreground hover:bg-muted/80 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Print PDF"
          >
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Print</span>
          </Button>
        )}

        {/* Download PDF Button */}
        {onDownloadPdf && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onDownloadPdf}
            className="h-9 px-3 rounded-lg border-border/80 bg-background text-xs font-medium text-foreground hover:bg-muted/80 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Download PDF"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
        )}

        {/* Download Excel/CSV Button */}
        {onDownloadCsv && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onDownloadCsv}
            className="h-9 px-3 rounded-lg border-border/80 bg-background text-xs font-medium text-foreground hover:bg-muted/80 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Export Excel / CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
        )}
      </div>
    </div>
  );
}