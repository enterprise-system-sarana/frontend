import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import { PageHeader } from "@/components/ui/page-header";
import { AccessDenied } from "@/components/ui/access-denied";
import { PageFilter } from "@/utils/PageFilter";
import { useSale } from "@/hooks/sales/useSale";
import { useCustomer } from "@/hooks/sales/useCustomer";
import { useStore } from "@/hooks/inventory/useStore";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { ROUTERS } from "@/constants/Route";
import type { SaleResponse, SaleReturnRequest } from "@/types/sales/Sale";
import type { CustomerResponse } from "@/types/sales/Customer";
import type { StoreResponse } from "@/types/inventory/Store";
import { SaleColumns } from "./SaleCulumn";
import { SaleDetailModal } from "./SaleDetailModal";
import ReturnSaleModal from "./components/ReturnSaleModal";

const statusTotal = (rows: SaleResponse[], total: number | undefined, expectedStatus: string, fallback: number) =>
  Math.max(rows.every((sale) => sale.status?.toUpperCase() === expectedStatus) ? (total ?? rows.length) : 0, fallback);

const SaleReturnPage = () => {
  const navigate = useNavigate();
  const { Can } = usePermission();
  const canRead = Can(PERMISSION.SALE.READ);
  const canUpdate = Can(PERMISSION.SALE.UPDATE);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [status, setStatus] = useState("RETURNED");
  const [selectedSale, setSelectedSale] = useState<SaleResponse | null>(null);
  const [returningSale, setReturningSale] = useState<SaleResponse | null>(null);

  const { data: customerData } = useCustomer.useGetAllCustomer();
  const { data: storeData } = useStore.useGetAllStore();
  const customers: CustomerResponse[] = customerData?.payload?.data ?? [];
  const stores: StoreResponse[] = storeData?.payload?.data ?? [];

  // Fetch enough of each status to fill the requested page after the lists are merged.
  const filter = {
    page: 1,
    size: page * size,
    reference: search.trim() || undefined,
    customerId: customerId ? Number(customerId) : undefined,
    storeId: storeId ? Number(storeId) : undefined,
  };
  const completed = useSale.GetAll({ ...filter, status: "COMPLETED" });
  const partial = useSale.GetAll({ ...filter, status: "PARTIAL_RETURNED" });
  const returned = useSale.GetAll({ ...filter, status: "RETURNED" });
  const unfiltered = useSale.GetAll({ ...filter, size: Math.max(100, page * size * 3) });
  const { mutate: returnSale, isPending: isReturning } = useSale.ReturnSale();

  const unfilteredSales: SaleResponse[] = unfiltered.data?.payload?.data ?? [];
  const unfilteredCounts = {
    COMPLETED: unfilteredSales.filter((sale) => sale.status?.toUpperCase() === "COMPLETED").length,
    PARTIAL_RETURNED: unfilteredSales.filter((sale) => sale.status?.toUpperCase() === "PARTIAL_RETURNED").length,
    RETURNED: unfilteredSales.filter((sale) => sale.status?.toUpperCase() === "RETURNED").length,
  };

  const totalByStatus = {
    COMPLETED: statusTotal(completed.data?.payload?.data ?? [], completed.data?.payload?.pagination?.totalElements, "COMPLETED", unfilteredCounts.COMPLETED),
    PARTIAL_RETURNED: statusTotal(partial.data?.payload?.data ?? [], partial.data?.payload?.pagination?.totalElements, "PARTIAL_RETURNED", unfilteredCounts.PARTIAL_RETURNED),
    RETURNED: statusTotal(returned.data?.payload?.data ?? [], returned.data?.payload?.pagination?.totalElements, "RETURNED", unfilteredCounts.RETURNED),
  };
  const totalElements = status
    ? totalByStatus[status as keyof typeof totalByStatus] ?? 0
    : Object.values(totalByStatus).reduce((sum, count) => sum + count, 0);

  const sales = useMemo(() => {
    const all: SaleResponse[] = [
      ...(completed.data?.payload?.data ?? []),
      ...(partial.data?.payload?.data ?? []),
      ...(returned.data?.payload?.data ?? []),
      ...unfilteredSales,
    ];
    return [...new Map(all.map((sale) => [sale.id, sale])).values()]
      .filter((sale) => !status || sale.status?.toUpperCase() === status)
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  }, [completed.data, partial.data, returned.data, unfiltered.data, status]);

  const filterGroups = useMemo(() => [
    { key: "customerId", label: "Customer", options: customers.map((item) => ({ label: item.name, value: String(item.id) })) },
    { key: "storeId", label: "Store", options: stores.map((item) => ({ label: item.name, value: String(item.id) })) },
    { key: "status", label: "Status", options: [
      { label: "Completed", value: "COMPLETED" },
      { label: "Partial Returned", value: "PARTIAL_RETURNED" },
      { label: "Returned", value: "RETURNED" },
    ] },
  ], [customers, stores]);

  const handleFilterChange = (key: string, value: string) => {
    if (key === "customerId") setCustomerId(value);
    if (key === "storeId") setStoreId(value);
    if (key === "status") setStatus(value);
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setCustomerId("");
    setStoreId("");
    setStatus("RETURNED");
    setPage(1);
  };

  const handleReturnConfirm = (payload: SaleReturnRequest) => {
    if (!returningSale) return;
    returnSale({ id: returningSale.id, payload }, {
      onSuccess: () => {
        toast.success(`Sale #${returningSale.reference} return processed successfully.`);
        setReturningSale(null);
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || error?.message || "Failed to return sale.");
      },
    });
  };

  if (!canRead) return <AccessDenied resource="sales returns" showBackButton />;

  return (
    <div className="sale-return-list space-y-4">
      <PageHeader
        title="Sales Return"
        description="Returned sales are shown by default. Use Status to view completed or partially returned sales."
        hideButton
        actions={<Button variant="outline" onClick={() => navigate(ROUTERS.SALE)} className="gap-2"><ArrowLeft className="h-4 w-4" />Back to Sales</Button>}
      />

      <div className="sale-return-card rounded-2xl border border-border/60 bg-card shadow-2xs overflow-hidden">
        <div className="border-b border-border/60 p-4">
          <PageFilter
            search={search}
            onSearchChange={(value) => { setSearch(value); setPage(1); }}
            searchPlaceholder="Search reference..."
            filterGroups={filterGroups}
            filterValues={{ customerId, storeId, status }}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
          />
        </div>

        <QueryBoundary isLoading={returned.isLoading && unfiltered.isLoading} isError={returned.isError && unfiltered.isError} fullScreen={false}>
          <DataTable
            columns={SaleColumns({
              onView: setSelectedSale,
              onReturn: canUpdate ? (id) => setReturningSale(sales.find((sale) => sale.id === id) ?? null) : undefined,
              canEdit: false,
              canDelete: false,
            })}
            data={sales}
            pagination={{
              currentPage: page,
              pageSize: size,
              totalElements,
              totalPages: Math.max(1, Math.ceil(totalElements / size)),
              onPageChange: setPage,
              onPageSizeChange: (value) => { setSize(value); setPage(1); },
            }}
          />
        </QueryBoundary>
      </div>

      <SaleDetailModal saleId={selectedSale?.id ?? null} initialSale={selectedSale} open={Boolean(selectedSale)} onOpenChange={(open) => { if (!open) setSelectedSale(null); }} />
      {returningSale && <ReturnSaleModal
        open={Boolean(returningSale)}
        onOpenChange={(open) => { if (!open) setReturningSale(null); }}
        sale={returningSale}
        saleId={returningSale.id}
        saleReference={returningSale.reference}
        grandTotal={returningSale.grandTotal}
        onConfirm={handleReturnConfirm}
        isPending={isReturning}
      />}
    </div>
  );
};

export default SaleReturnPage;
