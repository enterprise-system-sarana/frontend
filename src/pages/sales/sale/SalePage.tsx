import { DataTable } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import { PERMISSION } from "@/constants/Permission";
import { useSale } from "@/hooks/sales/useSale";
import { useCustomer } from "@/hooks/sales/useCustomer"; // Verify export structure in useCustomer
import { useStore } from "@/hooks/inventory/useStore";
import type { SaleResponse } from "@/types/sales/Sale";
import { usePermission } from "@/utils/UsePermission";
import { useSearch } from "@/utils/useSearch";
import { useState, useMemo, useEffect } from "react";
import { SaleColumns } from "./SaleCulumn";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { PageFilter } from "@/utils/PageFilter";
import { useNavigate } from "react-router-dom";
import type { Status } from "@/types/enum/status";
import { PageHeader } from "@/components/ui/page-header";
import { AccessDenied } from "@/components/ui/access-denied";
import { ROUTERS } from "@/constants/Route";
import type { StoreResponse } from "@/types/inventory/Store";
import type { CustomerResponse } from "@/types/sales/Customer";

const SalePage = () => {
  const navigate = useNavigate();
  const { Can } = usePermission();
  const canCreate = Can(PERMISSION.SALE.CREATE);
  const canRead = Can(PERMISSION.SALE.READ);
  const canUpdate = Can(PERMISSION.SALE.UPDATE);
  const canDelete = Can(PERMISSION.SALE.DELETE);

  const [sale, setSale] = useState<SaleResponse | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [status, setStatus] = useState<Status | undefined>(undefined);

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const { data: customerData } = useCustomer.useGetAllCustomer();
  const { data: storeData } = useStore.useGetAllStore();

  const customers = customerData?.payload?.data || [];
  const stores = storeData?.payload?.data || [];

  const { data, isError, isLoading } = useSale.GetAll({
    page,
    size,
    reference: search || undefined,
    customerId:
      customerId && customerId !== "all" ? Number(customerId) : undefined,
    storeId: storeId && storeId !== "all" ? Number(storeId) : undefined,
    status: status,
  });

  const { mutate: deleteSaleMutate } = useSale.Delete();
  const { mutate: completeSaleMutate } = useSale.Complete();
  const { mutate: cancelSaleMutate } = useSale.Cancel();
  const { mutate: returnSaleMutate } = useSale.ReturnSale();

  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  const filteredSales = useSearch<SaleResponse>(
    data?.payload?.data,
    search,
    ["reference", "customerName", "storeName"],
  );

  const dropdowns = useMemo(
    () => [
      {
        key: "customerId",
        placeholder: "Filter by Customer",
        allLabel: "All Customers",
        options: customers.map((cust: CustomerResponse) => ({
          label: cust.name,
          value: String(cust.id),
        })),
      },
      {
        key: "storeId",
        placeholder: "Filter by Store",
        allLabel: "All Stores",
        options: stores.map((store: StoreResponse) => ({
          label: store.name,
          value: String(store.id),
        })),
      },
      {
        key: "status",
        placeholder: "Filter by Status",
        allLabel: "All Statuses",
        options: [
          { label: "Pending", value: "PENDING" },
          { label: "Completed", value: "COMPLETED" },
          { label: "Cancelled", value: "CANCELLED" },
          { label: "Returned", value: "RETURNED" },
        ],
      },
    ],
    [customers, stores],
  );

  const dropdownValues = useMemo(
    () => ({
      customerId: customerId || "all",
      storeId: storeId || "all",
      status: status || "all",
    }),
    [customerId, storeId, status],
  );

  const handleDropdownChange = (key: string, value: string) => {
    const actualValue = value === "all" ? undefined : (value as Status);
    if (key === "customerId") {
      setCustomerId(value === "all" ? "" : value);
    } else if (key === "storeId") {
      setStoreId(value === "all" ? "" : value);
    } else if (key === "status") {
      setStatus(actualValue);
    }
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setCustomerId("");
    setStoreId("");
    setStatus(undefined);
    setPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPage(1);
    setSize(newSize);
  };

  const handleEdit = (selectedSale: SaleResponse) => {
    navigate(ROUTERS.SALE_EDIT.replace(":id", String(selectedSale.id)));
  };

  const handleDelete = (id: number) => {
    const selected = data?.payload?.data?.find(
      (u: SaleResponse) => u.id === id,
    );
    if (selected) {
      setSale(selected);
      setOpenConfirmDelete(true);
    }
  };

  const handleComplete = (id: number) => {
    completeSaleMutate(id);
  };

  const handleCancel = (id: number) => {
    cancelSaleMutate(id);
  };

  const handleReturn = (id: number) => {
    returnSaleMutate(id);
  };

  const confirmDelete = () => {
    if (sale?.id) {
      deleteSaleMutate(sale.id, {
        onSuccess: () => {
          setOpenConfirmDelete(false);
        },
      });
    }
  };

  if (!canRead) {
    return <AccessDenied resource="sales" showBackButton />;
  }

  return (
    <>
      <div className="space-y-4">
        <PageHeader
          title="Sales"
          buttonLabel="Add Sale"
          onCreate={
            canCreate ? () => navigate(ROUTERS.SALE_CREATE) : undefined
          }
          hideButton={!canCreate}
        />

        <div className="rounded-2xl border border-border/60 bg-card shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-border/60">
            <PageFilter
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search reference..."
              filterGroups={dropdowns.map((dropdown) => ({
                key: dropdown.key,
                label: dropdown.placeholder.replace("Filter by ", ""),
                options: dropdown.options,
              }))}
              filterValues={dropdownValues}
              onFilterChange={handleDropdownChange}
              onReset={handleReset}
            />
          </div>

          <div className="px-0">
            <QueryBoundary isLoading={isLoading} isError={isError}>
              <DataTable
                columns={SaleColumns({
                  onEdit: handleEdit,
                  onDelete: handleDelete,
                  onComplete: handleComplete,
                  onCancel: handleCancel,
                  onReturn: handleReturn,
                  canEdit: canUpdate,
                  canDelete: canDelete,
                })}
                data={filteredSales}
                pagination={{
                  currentPage: page,
                  pageSize: size,
                  totalElements: data?.payload?.pagination?.totalElements || 0,
                  totalPages: data?.payload?.pagination?.totalPages || 1,
                  onPageChange: setPage,
                  onPageSizeChange: handlePageSizeChange,
                }}
              />
            </QueryBoundary>
          </div>
        </div>
      </div>

      <ConfirmDelete
        isOpen={openConfirmDelete}
        setIsOpen={setOpenConfirmDelete}
        entityName={"Sale"}
        confirmDelete={confirmDelete}
      />
    </>
  );
};

export default SalePage;