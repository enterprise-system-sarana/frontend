import { useMemo, useState } from "react";
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
import { ExpenseReportColumns } from "./ExpenseReportColumn";

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
    const payload = (expenseData as any)?.payload ?? expenseData;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.expenses)) return payload.expenses;
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

  const columns = ExpenseReportColumns();

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

  const summary = useMemo(() => {
    let totalExpense = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let totalCount = rows.length;

    for (const r of rows) {
      const amt = Number(r.amount ?? 0);
      totalExpense += amt;
      const st = String(r.status ?? "").toUpperCase();
      if (st === "PAID") {
        paidAmount += amt;
      } else if (st === "PENDING") {
        pendingAmount += amt;
      }
    }

    return { totalExpense, paidAmount, pendingAmount, totalCount };
  }, [rows]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Reports"
        description="Overview of expenses by store, payment account, and type"
      />

      {/* Summary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Expenses",
            value: formatCurrency(summary.totalExpense),
          },
          {
            label: "Paid Expenses",
            value: formatCurrency(summary.paidAmount),
          },
          {
            label: "Pending Expenses",
            value: formatCurrency(summary.pendingAmount),
          },
          {
            label: "Transactions",
            value: Number(summary.totalCount).toLocaleString(),
          },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <h3 className="mt-2 text-2xl font-bold">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-2xs overflow-hidden">
        <div className="border-b border-border/60 p-4">
          <PageFilter
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search expense reference, type, store..."
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(value) => { setPage(1); setStartDate(value); }}
            onEndDateChange={(value) => { setPage(1); setEndDate(value); }}
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
              setStartDate("");
              setEndDate("");
              setPage(1);
            }}
          />
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
