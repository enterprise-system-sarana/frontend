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
import { Columns3 } from "lucide-react";
import { getColumnHeaderLabel } from "@/utils/export";

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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  columnVisibility,
  onColumnVisibilityChange,
  showColumnVisibility = false,
  pagination,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
      pagination: pagination
        ? {
            pageIndex: Math.max(0, (pagination.currentPage ?? 1) - 1),
            pageSize: pagination.pageSize ?? 10,
          }
        : undefined,
    },
    onColumnVisibilityChange,
    onPaginationChange: pagination
      ? (updater) => {
          const next =
            typeof updater === "function"
              ? updater({
                  pageIndex: Math.max(0, (pagination.currentPage ?? 1) - 1),
                  pageSize: pagination.pageSize ?? 10,
                })
              : updater;

          if (pagination.onPageChange) {
            pagination.onPageChange(next.pageIndex + 1);
          }
          if (
            pagination.onPageSizeChange &&
            next.pageSize !== pagination.pageSize
          ) {
            pagination.onPageSizeChange(next.pageSize);
          }
        }
      : undefined,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const currentPage = pagination
    ? pagination.currentPage
    : table.getState().pagination.pageIndex + 1;

  const pageSize = pagination
    ? pagination.pageSize
    : table.getState().pagination.pageSize;

  const totalElements = pagination
    ? pagination.totalElements
    : table.getFilteredRowModel().rows.length;

  const totalPages = pagination ? pagination.totalPages : table.getPageCount();

  const handlePageChange = (page: number) => {
    if (pagination) {
      pagination.onPageChange(page);
    } else {
      table.setPageIndex(page - 1);
    }
  };

  const handlePageSizeChange = (size: number) => {
    if (pagination?.onPageSizeChange) {
      pagination.onPageSizeChange(size);
    } else {
      table.setPageSize(size);
    }
  };

  return (
    <div>
      {/* Optional Standalone Column Toggle Toolbar */}
      {showColumnVisibility && (
        <div className="flex items-center justify-end border-b border-border/60 px-4 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <Columns3 className="h-4 w-4" />
                Columns
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
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="h-10 w-10 text-muted-foreground/40"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>

                    <span className="text-sm font-medium">
                      No results found
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="border-t border-border/60">
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
