import { Button } from "@/components/ui/button";
import {
  Search,
  RotateCcw,
  ChevronDown,
  X,
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
import { DateRangePicker } from "@/components/ui/date-picker";
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

/** Shared style for toolbar actions (Columns, Print, PDF, CSV) — Figma "Filter button". */
const TOOLBAR_BUTTON_CLASS = "h-9 gap-1.5 px-3 text-[14px]";

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
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[200px]">
        {/* Search Input Box */}
        {showSearch && (
          <div className="relative flex items-center min-w-[200px] max-w-[280px] w-full sm:w-auto">
            <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
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
                "h-9 w-full rounded-lg border border-border bg-card pl-9 text-sm text-foreground placeholder:text-text-disabled shadow-2xs outline-none transition-[border-color,box-shadow] hover:border-border-strong focus:border-primary focus:ring-3 focus:ring-primary/15",
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
                className="absolute right-2 flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Date Range Inputs */}
        {(onStartDateChange || onEndDateChange) && (
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              onStartDateChange?.(start);
              onEndDateChange?.(end);
            }}
          />
        )}

        {/* Direct Filter Dropdowns (e.g. [Customer ⌄] [Status ⌄]) */}
        {filterGroups.map((group) => {
          // A page may list its own "All" option; PageFilter always renders one, so skip it here.
          const allValue = group.options.find((opt) => opt.value === "all" || opt.value === "")?.value ?? "";
          const options = group.options.filter((opt) => opt.value !== "all" && opt.value !== "");
          const currentValue = filterValues[group.key] || "";
          const isSelected = !!currentValue && currentValue !== "all" && currentValue !== "";
          const selectedOption = options.find(
            (opt) => String(opt.value) === String(currentValue),
          );

          return (
            <DropdownMenu key={group.key}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "h-9 pl-3 pr-2.5 rounded-lg border border-border bg-card text-[14px] font-medium text-text-secondary hover:border-border-strong hover:bg-muted/60 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer",
                    isSelected &&
                      "border-primary/30 bg-primary-light/60 text-primary hover:bg-primary-light/80",
                  )}
                >
                  <span className="truncate max-w-[160px]">
                    {group.label}:{" "}
                    <span className={isSelected ? "font-semibold" : "text-foreground"}>
                      {isSelected ? selectedOption?.label || currentValue : t("common.all")}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      isSelected && "text-primary",
                    )}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[160px] max-h-64 overflow-y-auto">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
                  {t("common.select")} {group.label}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={currentValue || allValue}
                  onValueChange={(val) => onFilterChange?.(group.key, val)}
                >
                  <DropdownMenuRadioItem value={allValue} className="text-[14px] cursor-pointer font-medium">
                    {t("common.all")} {group.label}
                  </DropdownMenuRadioItem>
                  {options.map((opt) => (
                    <DropdownMenuRadioItem
                      key={opt.value}
                      value={opt.value}
                      className="text-[14px] cursor-pointer"
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
              "size-9 text-muted-foreground",
              hasActiveFilters && "border-primary/30 text-primary",
            )}
            title={t("common.reset")}
          >
            <RotateCcw className="size-4" />
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
                className={TOOLBAR_BUTTON_CLASS}
              >
                <span>{t("common.columns")}</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
                {t("common.columns")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.visible}
                  onCheckedChange={() => onColumnToggle(col.id)}
                  className="text-[14px] cursor-pointer"
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
            className={TOOLBAR_BUTTON_CLASS}
            title={t("common.print")}
          >
            <Printer className="size-4 text-muted-foreground" />
            <span className="hidden sm:inline">{t("common.print")}</span>
          </Button>
        )}

        {/* Download PDF Button */}
        {onDownloadPdf && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onDownloadPdf}
            className={TOOLBAR_BUTTON_CLASS}
            title={t("common.download_pdf")}
          >
            <Download className="size-4 text-muted-foreground" />
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
            className={TOOLBAR_BUTTON_CLASS}
            title={t("common.export_csv")}
          >
            <FileSpreadsheet className="size-4 text-muted-foreground" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
        )}
      </div>
    </div>
  );
}