import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import { PageHeader } from "@/components/ui/page-header";
import { AccessDenied } from "@/components/ui/access-denied";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { PageFilter } from "@/utils/PageFilter";
import { Button } from "@/components/ui/button";
import { usePermission } from "@/utils/UsePermission";
import { useSearch } from "@/utils/useSearch";
import { PERMISSION } from "@/constants/Permission";
import { ROUTERS } from "@/constants/Route";
import { useSale } from "@/hooks/sales/useSale";
import { useCustomer } from "@/hooks/sales/useCustomer";
import { useStore } from "@/hooks/inventory/useStore";
import type { SaleResponse } from "@/types/sales/Sale";

const currency = (value?: number) => `$${Number(value ?? 0).toFixed(2)}`;

export default function SalePage() {
  const navigate = useNavigate();
  const { Can } = usePermission();
  const canRead = Can(PERMISSION.SALE.READ);
  const canCreate = Can(PERMISSION.SALE.CREATE);
  const canUpdate = Can(PERMISSION.SALE.UPDATE);
  const canDelete = Can(PERMISSION.SALE.DELETE);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [selectedSale, setSelectedSale] = useState<SaleResponse | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: customerData } = useCustomer.useGetAllCustomer({ page: 0, size: 1000 });
  const { data: storeData } = useStore.useGetAllStore({ page: 0, size: 1000 });
  const { data, isLoading, isError } = useSale.getAll({
    page,
    size,
    reference: search || undefined,
    customerId: customerId && customerId !== "all" ? Number(customerId) : undefined,
    storeId: storeId && storeId !== "all" ? Number(storeId) : undefined,
  });
  const deleteSale = useSale.remove();
  const sales: SaleResponse[] = data?.payload?.data ?? [];
  const filteredSales = useSearch(sales, search, ["reference", "customerName", "storeName"]);
  const customers = customerData?.payload?.data ?? [];
  const stores = storeData?.payload?.data ?? [];

  const dropdowns = useMemo(() => [
    { key: "customerId", label: "Customer", options: customers.map((customer: any) => ({ label: customer.name, value: String(customer.id) })) },
    { key: "storeId", label: "Store", options: stores.map((store: any) => ({ label: store.name, value: String(store.id) })) },
  ], [customers, stores]);

  const resetFilters = () => {
    setSearch("");
    setCustomerId("");
    setStoreId("");
    setPage(1);
  };

  const columns: ColumnDef<SaleResponse>[] = [
    { accessorKey: "reference", header: "Reference" },
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "storeName", header: "Store" },
    { accessorKey: "grandTotal", header: "Grand Total", cell: ({ row }) => currency(row.original.grandTotal) },
    { accessorKey: "paidAmount", header: "Paid", cell: ({ row }) => currency(row.original.paidAmount) },
    { accessorKey: "dueAmount", header: "Due", cell: ({ row }) => currency(row.original.dueAmount) },
    { id: "actions", header: "Actions", enableHiding: false, cell: ({ row }) => <div className="flex gap-1">{canUpdate && <Button variant="ghost" size="sm" onClick={() => navigate(ROUTERS.SALE_EDIT.replace(":id", String(row.original.id)))}>Edit</Button>}{canDelete && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setSelectedSale(row.original); setConfirmOpen(true); }}>Delete</Button>}</div> },
  ];

  const confirmDelete = () => {
    if (!selectedSale?.id) return;
    deleteSale.mutate(selectedSale.id, { onSuccess: () => { setConfirmOpen(false); setSelectedSale(null); } });
  };

  if (!canRead) return <AccessDenied resource="sales" showBackButton />;

  return <>
    <div className="space-y-4">
      <PageHeader title="Sales" buttonLabel="Add Sale" onCreate={canCreate ? () => navigate(ROUTERS.SALE_CREATE) : undefined} hideButton={!canCreate} />
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xs">
        <div className="border-b border-border/60 p-4"><PageFilter search={search} onSearchChange={setSearch} searchPlaceholder="Search reference, customer..." filterGroups={dropdowns} filterValues={{ customerId: customerId || "all", storeId: storeId || "all" }} onFilterChange={(key, value) => { if (key === "customerId") setCustomerId(value === "all" ? "" : value); if (key === "storeId") setStoreId(value === "all" ? "" : value); setPage(1); }} onReset={resetFilters} /></div>
        <QueryBoundary isLoading={isLoading} isError={isError}><DataTable columns={columns} data={filteredSales} pagination={{ currentPage: page, pageSize: size, totalElements: data?.payload?.pagination?.totalElements ?? filteredSales.length, totalPages: data?.payload?.pagination?.totalPages ?? 1, onPageChange: setPage, onPageSizeChange: (newSize) => { setSize(newSize); setPage(1); } }} /></QueryBoundary>
      </div>
    </div>
    <ConfirmDelete isOpen={confirmOpen} setIsOpen={setConfirmOpen} entityName="Sale" confirmDelete={confirmDelete} />
  </>;
}
