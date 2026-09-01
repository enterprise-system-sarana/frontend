import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { useLanguage } from "@/i18n/LanguageContext";

export interface CustomPaginationProps {
  currentPage: number; // 1-based index
  pageSize: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

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
  const pagesCount = totalPages || 1;
  const startRow = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, total);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (pagesCount <= maxVisible) {
      for (let i = 1; i <= pagesCount; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(pagesCount - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = 4;
      } else if (currentPage >= pagesCount - 2) {
        start = pagesCount - 3;
      }

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < pagesCount - 1) {
        pages.push("...");
      }

      pages.push(pagesCount);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border/60">
      {/* Showing range details */}
      <div className="text-xs text-muted-foreground font-medium">
        {t("common.showing")}{" "}
        <span className="font-semibold text-foreground">{startRow}</span>{" "}
        {t("common.to")}{" "}
        <span className="font-semibold text-foreground">{endRow}</span>{" "}
        {t("common.of")}{" "}
        <span className="font-semibold text-foreground">{total}</span>{" "}
        {t("common.entries")}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
        {/* Rows per page select */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
              {t("common.rows_per_page")}
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger className="h-8 w-[72px] rounded-lg border-border/70 text-xs font-medium text-foreground focus:ring-primary/20 focus:border-primary">
                <SelectValue placeholder={String(pageSize)} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/70">
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
          {/* First Page */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:text-muted-foreground/30 disabled:hover:bg-transparent transition-all"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:text-muted-foreground/30 disabled:hover:bg-transparent transition-all"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((pageNum, idx) => {
              if (pageNum === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground select-none"
                  >
                    ···
                  </span>
                );
              }

              const isActive = pageNum === currentPage;
              return (
                <Button
                  key={`page-${pageNum}`}
                  variant="ghost"
                  className={`h-8 w-8 p-0 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30 hover:bg-primary/90 hover:text-primary-foreground"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                  onClick={() => onPageChange(Number(pageNum))}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          {/* Next Page */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:text-muted-foreground/30 disabled:hover:bg-transparent transition-all"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pagesCount}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:text-muted-foreground/30 disabled:hover:bg-transparent transition-all"
            onClick={() => onPageChange(pagesCount)}
            disabled={currentPage === pagesCount}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
