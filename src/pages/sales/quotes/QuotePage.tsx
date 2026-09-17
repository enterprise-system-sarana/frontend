import { useMemo, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import {
  DataTable,
  exportTableToCsv,
  exportTableToPdf,
  printTable,
  getColumnsForVisibility,
} from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import { PERMISSION } from "@/constants/Permission";
import { useQuote } from "@/hooks/sales/useQuote";
import { useCustomer } from "@/hooks/sales/useCustomer";
import type { QuoteResponse } from "@/types/quote/Quote";
import { usePermission } from "@/utils/UsePermission";
import { useSearch } from "@/utils/useSearch";
import { QuoteColumns } from "./QuoteColumn";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { PageFilter, type FilterGroup } from "@/utils/PageFilter";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { AccessDenied } from "@/components/ui/access-denied";
import { ROUTERS } from "@/constants/Route";

export const QuotePage = () => {
  const navigate = useNavigate();
  const { Can } = usePermission();
  const canCreate = Can(PERMISSION.QUOTE?.CREATE || PERMISSION.SALE?.CREATE);
  const canRead = Can(PERMISSION.QUOTE?.READ || PERMISSION.SALE?.READ);
  const canUpdate = Can(PERMISSION.QUOTE?.UPDATE || PERMISSION.SALE?.UPDATE);
  const canDelete = Can(PERMISSION.QUOTE?.DELETE || PERMISSION.SALE?.DELETE);

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  const { data: customerData } = useCustomer.useGetAllCustomer({ page: 1, size: 100 });
  const customers = customerData?.payload?.data || [];

  const { data, isError, isLoading } = useQuote.useGetAllQuote({
    page,
    size,
    reference: search || undefined,
    customerId: filterValues.customerId ? Number(filterValues.customerId) : undefined,
    status: filterValues.status || undefined,
  });

  const { mutate: deleteQuoteMutate } = useQuote.useDeleteQuote();

  // Filter groups for toolbar
  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: "status",
        label: "Status",
        options: [
          { label: "Pending", value: "PENDING" },
          { label: "Approved", value: "APPROVED" },
          { label: "Ordered", value: "ORDERED" },
          { label: "Completed", value: "COMPLETED" },
          { label: "Rejected", value: "REJECTED" },
        ],
      },
      {
        key: "customerId",
        label: "Customer",
        options: customers.map((c: any) => ({
          label: c.name,
          value: String(c.id),
        })),
      },
    ],
    [customers]
  );

  const handleColumnToggle = (columnId: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: prev[columnId] === false ? true : false,
    }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => {
      const next = { ...prev };
      if (!value) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setFilterValues({});
    setPage(1);
  };

  const searchedQuotes = useSearch<QuoteResponse>(
    data?.payload?.data,
    search,
    ["reference", "no", "customerName", "status"]
  );

  const filteredQuotes = useMemo(() => {
    return searchedQuotes.filter((item) => {
      if (filterValues.status && item.status !== filterValues.status) {
        return false;
      }
      if (
        filterValues.customerId &&
        String(item.customerId) !== filterValues.customerId
      ) {
        return false;
      }
      return true;
    });
  }, [searchedQuotes, filterValues]);

  const handleEdit = (q: QuoteResponse) => {
    navigate(`/quote/edit/${q.id}`);
  };

  const handleDelete = (id: number) => {
    const selected = data?.payload?.data?.find(
      (u: QuoteResponse) => u.id === id
    );
    if (selected) {
      setQuote(selected);
      setOpenConfirmDelete(true);
    }
  };

  const confirmDelete = () => {
    if (quote?.id) {
      deleteQuoteMutate(quote.id, {
        onSuccess: () => {
          setOpenConfirmDelete(false);
        },
      });
    }
  };

  const columns = useMemo(
    () =>
      QuoteColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        canEdit: canUpdate,
        canDelete: canDelete,
      }),
    [canUpdate, canDelete]
  );

  const handleExportCsv = () => {
    exportTableToCsv(filteredQuotes, columns, "Quotes");
  };

  const handleDownloadPdf = () => {
    exportTableToPdf(filteredQuotes, columns, "Quotes", "Quotes List");
  };

  const handlePrintPdf = () => {
    printTable("Quotes List");
  };

  if (!canRead) {
    return <AccessDenied resource="quotes" showBackButton />;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Top Header */}
        <PageHeader
          title="Quotes"
          featureName="Quote"
          buttonLabel="Add Quote"
          onCreate={
            canCreate
              ? () => navigate(ROUTERS.QUOTE_CREATE || "/quote/create")
              : undefined
          }
          hideButton={!canCreate}
        />

        {/* Main Card with Toolbar & Table */}
        <div className="overflow-hidden border rounded-2xl border-border/60 bg-card shadow-2xs">
          {/* Toolbar row with Search, Filter+, Columns, Print, CSV */}
          <div className="p-4 border-b border-border/60">
            <PageFilter
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search reference or quote no..."
              filterGroups={filterGroups}
              filterValues={filterValues}
              onFilterChange={handleFilterChange}
              columns={getColumnsForVisibility(columns, columnVisibility)}
              onColumnToggle={handleColumnToggle}
              onPrintPdf={handlePrintPdf}
              onDownloadPdf={handleDownloadPdf}
              onDownloadCsv={handleExportCsv}
              onReset={handleReset}
            />
          </div>

          {/* Table View */}
          <div className="px-0">
            <QueryBoundary isLoading={isLoading} isError={isError}>
              <DataTable
                columns={columns}
                data={filteredQuotes}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                pagination={{
                  currentPage: page,
                  pageSize: size,
                  totalElements:
                    data?.payload?.pagination?.totalElements ||
                    filteredQuotes.length,
                  totalPages: data?.payload?.pagination?.totalPages || 1,
                  onPageChange: setPage,
                  onPageSizeChange: setSize,
                }}
              />
            </QueryBoundary>
          </div>
        </div>
      </div>

      <ConfirmDelete
        isOpen={openConfirmDelete}
        setIsOpen={setOpenConfirmDelete}
        entityName={"Quote"}
        confirmDelete={confirmDelete}
      />
    </>
  );
};

export default QuotePage;
