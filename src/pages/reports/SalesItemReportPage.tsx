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
import { useProduct } from "@/hooks/product/useProduct";
import { SalePaymentStatus, SaleStatus } from "@/types/sales/Sale";
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

const SalesItemReportPage = () => {
  const { Can } = usePermission();
  const canRead = Can(PERMISSION.REPORT.READ);

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [storeId, setStoreId] = useState<string>("all");
  const [productId, setProductId] = useState<string>("all");
  const [saleStatus, setSaleStatus] = useState<string>("all");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");

  const { data: storeData } = useStore.useGetAllStore({ page: 1, size: 1000 });
  const { data: productData } = useProduct.useGetAllProduct({ page: 1, size: 1000 });

  const stores = storeData?.payload?.data ?? [];
  const products = productData?.payload?.data ?? [];

  const filter = useMemo(
    () => ({
      page,
      size,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      storeId: storeId !== "all" ? Number(storeId) : undefined,
      productId: productId !== "all" ? Number(productId) : undefined,
      saleStatus: saleStatus !== "all" ? saleStatus : undefined,
      paymentStatus: paymentStatus !== "all" ? paymentStatus : undefined,
    }),
    [page, size, startDate, endDate, storeId, productId, saleStatus, paymentStatus],
  );

  const { data: itemsData } = useReport.useSalesItemsReport(filter, { page, size });

  const rows = useMemo(() => {
    if (!itemsData) return [];
    const payload = itemsData.payload ?? itemsData;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  }, [itemsData]);

  const filterGroups = useMemo(
    () => [
      {
        key: "storeId",
        label: "Store",
        options: stores.map((store: any) => ({ label: store.name, value: String(store.id) })),
      },
      {
        key: "productId",
        label: "Product",
        options: products.map((product: any) => ({ label: product.name, value: String(product.id) })),
      },
      {
        key: "saleStatus",
        label: "Sale Status",
        options: Object.values(SaleStatus).map((status) => ({ label: status, value: status })),
      },
      {
        key: "paymentStatus",
        label: "Payment Status",
        options: Object.values(SalePaymentStatus).map((status) => ({ label: status, value: status })),
      },
    ],
    [stores, products],
  );

  const searchFilteredRows = useSearch(rows, search, [
    "saleReference",
    "productName",
    "saleDate",
    "serialNumbers",
  ]);

  const filteredRows = useMemo(() => {
    return searchFilteredRows.filter((row: any) => {
      if (storeId !== "all" && String(row.storeId) !== storeId) return false;
      if (productId !== "all" && String(row.productId) !== productId) return false;
      if (saleStatus !== "all" && row.status !== saleStatus) return false;
      if (paymentStatus !== "all" && row.paymentStatus !== paymentStatus) return false;
      return true;
    });
  }, [searchFilteredRows, storeId, productId, saleStatus, paymentStatus]);

  const columns: ColumnDef<Record<string, unknown>>[] = [
    { accessorKey: "saleReference", header: "Sale Reference" },
    { accessorKey: "productName", header: "Product" },
    { accessorKey: "saleDate", header: "Date" },
    { accessorKey: "storeId", header: "Store ID" },
    { accessorKey: "quantity", header: "Qty" },
    {
      accessorKey: "price",
      header: "Unit Price",
      cell: ({ row }) => formatCurrency(row.original.price as number | undefined),
    },
    {
      accessorKey: "itemDiscount",
      header: "Discount",
      cell: ({ row }) => formatCurrency(row.original.itemDiscount as number | undefined),
    },
    {
      accessorKey: "subTotal",
      header: "Subtotal",
      cell: ({ row }) => formatCurrency(row.original.subTotal as number | undefined),
    },
    {
      accessorKey: "serialNumbers",
      header: "Serial Numbers",
      cell: ({ row }) =>
        (row.original.serialNumbers as string[] | undefined)?.join(", ") || "-",
    },
  ];

  const handleSearchFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    if (key === "storeId") setStoreId(value || "all");
    if (key === "productId") setProductId(value || "all");
    if (key === "saleStatus") setSaleStatus(value || "all");
    if (key === "paymentStatus") setPaymentStatus(value || "all");
  };

  const handleExportExcel = () => {
    exportTableToCsv(filteredRows, columns, "sales-item-report");
  };

  const handleDownloadPdf = () => {
    exportTableToPdf(filteredRows, columns, "sales-item-report", "Sales Item Report");
  };

  const handlePrint = () => {
    printTable("Sales Item Report");
  };

  if (!canRead) {
    return <AccessDenied resource="sales item reports" showBackButton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Item Reports"
        description="Detailed breakdown of each sold item by transaction"
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
              setProductId("all");
              setSaleStatus("all");
              setPaymentStatus("all");
            }}
          />
        </div>

        <div className="flex flex-col gap-3 border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">Filtered Sales Items</h2>
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
              value={productId}
              onChange={(e) => {
                setPage(1);
                setProductId(e.target.value);
              }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Products</option>
              {products.map((product: any) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
            <select
              value={saleStatus}
              onChange={(e) => {
                setPage(1);
                setSaleStatus(e.target.value);
              }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Sale Status</option>
              {Object.values(SaleStatus).map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              value={paymentStatus}
              onChange={(e) => {
                setPage(1);
                setPaymentStatus(e.target.value);
              }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Payment Status</option>
              {Object.values(SalePaymentStatus).map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
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

export default SalesItemReportPage;
