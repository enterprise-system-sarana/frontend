import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  exportTableToCsv,
  exportTableToPdf,
  printTable,
} from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { AccessDenied } from "@/components/ui/access-denied";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { useReport } from "@/hooks/reports/useReport";
import { useStore } from "@/hooks/inventory/useStore";
import { useBank } from "@/hooks/finance/useBank";
import { useExpenseType } from "@/hooks/expense/useExpenseType";
import { PageFilter } from "@/utils/PageFilter";
import { useSearch } from "@/utils/useSearch";

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

const ExpenseReportPage = () => {
  const { Can } = usePermission();
  const canRead = Can(PERMISSION.REPORT.READ);

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [storeId, setStoreId] = useState<string>("all");
  const [bankId, setBankId] = useState<string>("all");
  const [expenseTypeId, setExpenseTypeId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const { data: storeData } = useStore.useGetAllStore({ page: 1, size: 1000 });
  const { data: bankData } = useBank.useGetAllBank({ page: 1, size: 1000 });
  const { data: expenseTypeData } = useExpenseType.useGetAllExpenseType({ page: 1, size: 1000 });

  const stores = storeData?.payload?.data ?? [];
  const banks = bankData?.payload?.data ?? [];
  const expenseTypes = expenseTypeData?.payload?.data ?? [];

  const filter = useMemo(
    () => ({
      page,
      size,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      storeId: storeId !== "all" ? Number(storeId) : undefined,
      bankId: bankId !== "all" ? Number(bankId) : undefined,
      expenseTypeId: expenseTypeId !== "all" ? Number(expenseTypeId) : undefined,
      status: status !== "all" ? status : undefined,
    }),
    [page, size, startDate, endDate, storeId, bankId, expenseTypeId, status],
  );

  const { data: expenseData } = useReport.useExpenseReport(filter);

  const rows = useMemo(() => {
    if (!expenseData) return [];
    const payload = expenseData.payload ?? expenseData;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  }, [expenseData]);

  const filterGroups = useMemo(
    () => [
      {
        key: "storeId",
        label: "Store",
        options: stores.map((store: any) => ({ label: store.name, value: String(store.id) })),
      },
      {
        key: "bankId",
        label: "Bank",
        options: banks.map((bank: any) => ({ label: bank.name, value: String(bank.id) })),
      },
      {
        key: "expenseTypeId",
        label: "Expense Type",
        options: expenseTypes.map((expenseType: any) => ({ label: expenseType.name, value: String(expenseType.id) })),
      },
      {
        key: "status",
        label: "Status",
        options: [
          { label: "PENDING", value: "PENDING" },
          { label: "APPROVED", value: "APPROVED" },
          { label: "PAID", value: "PAID" },
          { label: "REJECTED", value: "REJECTED" },
        ],
      },
    ],
    [stores, banks, expenseTypes],
  );

  const searchFilteredRows = useSearch(rows, search, [
    "reference",
    "storeName",
    "bankName",
    "expenseTypeName",
    "description",
    "status",
  ]);

  const filteredRows = useMemo(() => {
    return searchFilteredRows.filter((row: any) => {
      if (storeId !== "all" && String(row.storeId) !== storeId) return false;
      if (bankId !== "all" && String(row.bankId) !== bankId) return false;
      if (expenseTypeId !== "all" && String(row.expenseTypeId) !== expenseTypeId) return false;
      if (status !== "all" && row.status !== status) return false;
      return true;
    });
  }, [searchFilteredRows, storeId, bankId, expenseTypeId, status]);

  const totalElements =
    (expenseData as any)?.payload?.totalElements ??
    (expenseData as any)?.payload?.pagination?.totalElements ??
    rows.length;

  const columns: ColumnDef<Record<string, unknown>>[] = [
    { accessorKey: "reference", header: "Reference" },
    { accessorKey: "storeName", header: "Store" },
    { accessorKey: "expenseTypeName", header: "Expense Type" },
    { accessorKey: "bankName", header: "Bank" },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "status", header: "Status" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.original.amount as number | undefined),
    },
    { accessorKey: "createdAt", header: "Created At" },
  ];

  const handleSearchFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    if (key === "storeId") setStoreId(value || "all");
    if (key === "bankId") setBankId(value || "all");
    if (key === "expenseTypeId") setExpenseTypeId(value || "all");
    if (key === "status") setStatus(value || "all");
  };

  const handleExportExcel = () => {
    exportTableToCsv(filteredRows, columns, "expense-report");
  };

  const handleDownloadPdf = () => {
    exportTableToPdf(filteredRows, columns, "expense-report", "Expense Report");
  };

  const handlePrint = () => {
    printTable("Expense Report");
  };

  if (!canRead) {
    return <AccessDenied resource="expense reports" showBackButton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Reports"
        description="Overview of expenses by store, payment account, and type"
      />

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="border-b p-4">
          <PageFilter
            search={search}
            onSearchChange={setSearch}
            filterGroups={filterGroups}
            filterValues={filterValues}
            onFilterChange={handleSearchFilterChange}
            onPrintPdf={handlePrint}
            onDownloadPdf={handleDownloadPdf}
            onDownloadCsv={handleExportExcel}
            onReset={() => {
              setSearch("");
              setFilterValues({});
              setStoreId("all");
              setBankId("all");
              setExpenseTypeId("all");
              setStatus("all");
            }}
          />
        </div>

        <div className="flex flex-col gap-3 border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">Filtered Expense Transactions</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setPage(1);
                setStartDate(e.target.value);
              }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setPage(1);
                setEndDate(e.target.value);
              }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <select
              value={storeId}
              onChange={(e) => {
                setPage(1);
                setStoreId(e.target.value);
              }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Stores</option>
              {stores.map((store: any) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
            <select
              value={bankId}
              onChange={(e) => {
                setPage(1);
                setBankId(e.target.value);
              }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Banks</option>
              {banks.map((bank: any) => (
                <option key={bank.id} value={bank.id}>{bank.name}</option>
              ))}
            </select>
            <select
              value={expenseTypeId}
              onChange={(e) => {
                setPage(1);
                setExpenseTypeId(e.target.value);
              }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Expense Types</option>
              {expenseTypes.map((expenseType: any) => (
                <option key={expenseType.id} value={expenseType.id}>{expenseType.name}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="PAID">PAID</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredRows}
          pagination={{
            currentPage: page,
            pageSize: size,
            totalElements: filteredRows.length,
            totalPages: Math.max(1, Math.ceil(filteredRows.length / size)),
            onPageChange: setPage,
            onPageSizeChange: (nextSize) => {
              setPage(1);
              setSize(nextSize);
            },
          }}
        />
      </div>
    </div>
  );
};

export default ExpenseReportPage;
