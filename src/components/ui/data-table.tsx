import {
  type ColumnDef,
  type VisibilityState,
  type OnChangeFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CustomPagination } from "@/components/ui/custom-pagination";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  // DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Columns3, Inbox } from "lucide-react";
import { getColumnHeaderLabel } from "@/utils/export";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** Horizontal alignment of the header and cells, e.g. "right" for money. */
    align?: "left" | "center" | "right";
  }
}

const alignClass = { left: "", center: "text-center", right: "text-right" } as const;

export {
  exportTableToCsv,
  exportToCsv,
  exportTableToPdf,
  exportToPdf,
  printTable,
  getColumnsForVisibility,
  getColumnHeaderLabel,
} from "@/utils/export";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  showColumnVisibility?: boolean;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  currentPage?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  columnVisibility,
  onColumnVisibilityChange,
  showColumnVisibility = false,
  pagination,
  currentPage: propCurrentPage,
  pageSize: propPageSize,
  totalElements: propTotalElements,
  totalPages: propTotalPages,
  onPageChange: propOnPageChange,
  onPageSizeChange: propOnPageSizeChange,
}: DataTableProps<TData, TValue>) {
  const { t } = useLanguage();

  // Support both nested pagination object and flat props
  const resolvedPagination = pagination ?? (
    propCurrentPage !== undefined || propPageSize !== undefined || propOnPageChange !== undefined
      ? {
          currentPage: propCurrentPage ?? 1,
          pageSize: propPageSize ?? 10,
          totalElements: propTotalElements ?? data.length,
          totalPages: propTotalPages ?? Math.max(1, Math.ceil((propTotalElements ?? data.length) / (propPageSize ?? 10))),
          onPageChange: propOnPageChange ?? (() => {}),
          onPageSizeChange: propOnPageSizeChange,
        }
      : undefined
  );

  const isManualPagination = Boolean(
    resolvedPagination &&
      (resolvedPagination.totalElements > data.length ||
        (resolvedPagination.currentPage ?? 1) > 1)
  );

  const table = useReactTable({
    data,
    columns,
    manualPagination: isManualPagination,
    pageCount: isManualPagination ? resolvedPagination?.totalPages : undefined,
    state: {
      columnVisibility,
      ...(resolvedPagination
        ? {
            pagination: {
              pageIndex: isManualPagination
                ? 0
                : Math.max(0, (resolvedPagination.currentPage ?? 1) - 1),
              pageSize: resolvedPagination.pageSize ?? 10,
            },
          }
        : {}),
    },
    onColumnVisibilityChange,
    onPaginationChange: resolvedPagination
      ? (updater) => {
          const next =
            typeof updater === "function"
              ? updater({
                  pageIndex: Math.max(0, (resolvedPagination.currentPage ?? 1) - 1),
                  pageSize: resolvedPagination.pageSize ?? 10,
                })
              : updater;

          if (resolvedPagination.onPageChange) {
            resolvedPagination.onPageChange(next.pageIndex + 1);
          }
          if (
            resolvedPagination.onPageSizeChange &&
            next.pageSize !== resolvedPagination.pageSize
          ) {
            resolvedPagination.onPageSizeChange(next.pageSize);
          }
        }
      : undefined,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const currentPage = resolvedPagination
    ? resolvedPagination.currentPage
    : (table.getState().pagination?.pageIndex ?? 0) + 1;

  const pageSize = resolvedPagination
    ? resolvedPagination.pageSize
    : (table.getState().pagination?.pageSize ?? 10);

  const totalElements = resolvedPagination
    ? resolvedPagination.totalElements
    : table.getFilteredRowModel().rows.length;

  const totalPages = resolvedPagination
    ? resolvedPagination.totalPages
    : (table.getPageCount() || 1);

  const handlePageChange = (page: number) => {
    if (resolvedPagination) {
      resolvedPagination.onPageChange(page);
    } else {
      table.setPageIndex(page - 1);
    }
  };

  const handlePageSizeChange = (size: number) => {
    if (resolvedPagination?.onPageSizeChange) {
      resolvedPagination.onPageSizeChange(size);
    } else {
      table.setPageSize(size);
    }
  };

  return (
    <div>
      {/* Optional Standalone Column Toggle Toolbar */}
      {showColumnVisibility && (
        <div className="flex items-center justify-end border-b border-border px-5 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Columns3 className="h-4 w-4" />
                {t("common.columns")}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuSeparator />

              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const label = getColumnHeaderLabel(column.columnDef);

                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      className="text-xs capitalize"
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(alignClass[header.column.columnDef.meta?.align ?? "left"])}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(alignClass[cell.column.columnDef.meta?.align ?? "left"])}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="h-56 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Inbox className="size-6" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">
                        {t("common.no_results")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("common.no_results_hint", "Try adjusting your search or filters.")}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="border-t border-border">
        <CustomPagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          totalElements={totalElements}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}
