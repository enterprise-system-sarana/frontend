import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export interface CustomPaginationProps {
  currentPage: number; // 1-based index
  pageSize: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

// Always 7 slots once there are more than 7 pages, so the bar keeps the same
// width while paging: 1 … 4 5 6 … 20
const getPageNumbers = (current: number, count: number) => {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", count];
  if (current >= count - 3)
    return [1, "...", count - 4, count - 3, count - 2, count - 1, count];
  return [1, "...", current - 1, current, current + 1, "...", count];
};

const pageButtonClass = "size-8 p-0 text-sm font-semibold tabular-nums sm:size-9";

export function CustomPagination({
  currentPage,
  pageSize,
  totalPages,
  totalElements,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 50, 100],
}: CustomPaginationProps) {
  const { t } = useLanguage();
  // Safe default calculations
  const total = totalElements || 0;
  const pagesCount = Math.max(totalPages || 1, 1);
  const startRow = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, total);
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= pagesCount;

  return (
    <nav
      aria-label={t("common.pagination", "Pagination")}
      className="flex flex-col items-center justify-between gap-3 px-5 py-3.5 sm:flex-row sm:gap-4"
    >
      {/* Showing range details */}
      <p className="text-sm text-muted-foreground tabular-nums">
        {t("common.showing")}{" "}
        <span className="font-semibold text-foreground">{startRow}</span>{" "}
        {t("common.to")}{" "}
        <span className="font-semibold text-foreground">{endRow}</span>{" "}
        {t("common.of")}{" "}
        <span className="font-semibold text-foreground">{total}</span>{" "}
        {t("common.entries")}
      </p>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
        {/* Rows per page select */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              {t("common.rows_per_page")}
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger className="w-[76px] font-medium tabular-nums">
                <SelectValue placeholder={String(pageSize)} />
              </SelectTrigger>
              <SelectContent className="min-w-[76px]">
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Page Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            className="h-8 px-2 sm:h-9 sm:px-3"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={isFirst}
            aria-label={t("common.previous", "Previous")}
          >
            <ChevronLeft />
            <span className="hidden sm:inline">
              {t("common.previous", "Previous")}
            </span>
          </Button>

          {getPageNumbers(currentPage, pagesCount).map((pageNum, idx) => {
            if (pageNum === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  aria-hidden
                  className="flex size-8 items-center justify-center text-muted-foreground sm:size-9"
                >
                  <MoreHorizontal className="size-4" />
                </span>
              );
            }

            const isActive = pageNum === currentPage;
            return (
              <Button
                key={`page-${pageNum}`}
                variant="outline"
                className={cn(
                  pageButtonClass,
                  isActive &&
                    "border-primary bg-primary-light text-primary hover:border-primary hover:bg-primary-light hover:text-primary",
                )}
                aria-current={isActive ? "page" : undefined}
                onClick={() => !isActive && onPageChange(Number(pageNum))}
              >
                {pageNum}
              </Button>
            );
          })}

          <Button
            variant="outline"
            className="h-8 px-2 sm:h-9 sm:px-3"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isLast}
            aria-label={t("common.next", "Next")}
          >
            <span className="hidden sm:inline">{t("common.next", "Next")}</span>
            <ChevronRight />
          </Button>
        </div>
      </div>
    </nav>
  );
}
