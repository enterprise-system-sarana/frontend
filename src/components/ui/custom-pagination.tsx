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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      {/* Showing range details */}
      <div className="text-sm text-muted-foreground font-medium">
        Showing <span className="text-foreground font-semibold">{startRow}</span> to{" "}
        <span className="text-foreground font-semibold">{endRow}</span> of{" "}
        <span className="text-foreground font-semibold">{total}</span> entries
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* Rows per page select */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Rows per page
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger className="h-8 w-[70px] border-border/80 focus:ring-primary/20">
                <SelectValue placeholder={String(pageSize)} />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Buttons Controls */}
        <div className="flex items-center gap-1.5">
          {/* First Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
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
                    className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground select-none"
                  >
                    ...
                  </span>
                );
              }

              const isActive = pageNum === currentPage;
              return (
                <Button
                  key={`page-${pageNum}`}
                  variant={isActive ? "default" : "outline"}
                  className={`h-8 w-8 p-0 text-sm font-medium transition-all duration-200 active:scale-95 ${isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary/95 shadow-xs"
                      : "hover:bg-muted dark:hover:bg-muted/30"
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
            variant="outline"
            size="icon"
            className="h-8 w-8 transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pagesCount}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
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
