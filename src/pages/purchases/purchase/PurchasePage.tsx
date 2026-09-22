import { DataTable } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import { PERMISSION } from "@/constants/Permission";
import { usePurchase } from "@/hooks/purchases/usePurchase";
import { useSupplier } from "@/hooks/purchases/useSupplier";
import { useStore } from "@/hooks/inventory/useStore";
import type { PurchaseResponse } from "@/types/purchases/Purchase";
import { usePermission } from "@/utils/UsePermission";
import { useSearch } from "@/utils/useSearch";
import { useState, useMemo, useEffect } from "react";
import { PurchaseColumns } from "./PurchaseColumn";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { PageFilter } from "@/utils/PageFilter";
import { useNavigate } from "react-router-dom";
import type { Status } from "@/types/enum/status";
import { PageHeader } from "@/components/ui/page-header";
import { AccessDenied } from "@/components/ui/access-denied";
import { ROUTERS } from "@/constants/Route";
import type { StoreResponse } from "@/types/inventory/Store";
import type { SupplierResponse } from "@/types/purchases/Supplier";
import { PurchaseDetailModal } from "./PurchaseDetail";

const PurchasePage = () => {
  const navigate = useNavigate();
  const { Can } = usePermission();
  const canCreate = Can(PERMISSION.PURCHASE.CREATE);
  const canRead = Can(PERMISSION.PURCHASE.READ);
  const canUpdate = Can(PERMISSION.PURCHASE.UPDATE);
  const canDelete = Can(PERMISSION.PURCHASE.DELETE);

  const [purchase, setPurchase] = useState<PurchaseResponse | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [status, setStatus] = useState<Status | undefined>(undefined);

  // console.log("purchase : ", purchase)
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const { data: supplierData } = useSupplier.useGetAllSupplier();
  const { data: storeData } = useStore.useGetAllStore();

  const suppliers = supplierData?.payload?.data || [];
  const stores = storeData?.payload?.data || [];
  const { data, isError, isLoading, refetch } = usePurchase.GetAll({
    page,
    size,
    referenceNo: search || undefined,
    supplierId:
      supplierId && supplierId !== "all" ? Number(supplierId) : undefined,
    storeId: storeId && storeId !== "all" ? Number(storeId) : undefined,
    status: status,
  });

  const { mutate: deletePurchaseMutate } = usePurchase.Delete();
  // const { mutate: approvePurchaseMutate } =
  //   usePurchase.Approve() || { mutate: () => { } };
  // const { mutate: completePurchaseMutate } =
  //   usePurchase.Complete() || { mutate: () => { } };
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [detailPurchaseId, setDetailPurchaseId] = useState<number | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  const filteredPurchases = useSearch<PurchaseResponse>(
    data?.payload?.data,
    search,
    ["referenceNo", "supplierName", "storeName"],
  );
  console.log("filteredPurchases", filteredPurchases);

  const dropdowns = useMemo(
    () => [
      {
        key: "supplierId",
        placeholder: "Filter by Supplier",
        allLabel: "All Suppliers",
        options: suppliers.map((sup: SupplierResponse) => ({
          label: sup.name,
          value: String(sup.id),
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
          { label: "COMPLETED", value: "COMPLETED" },
          { label: "CANCELLED", value: "CANCELLED" },
          { label: "PENDING", value: "PENDING" },
        ],
      },
    ],
    [suppliers, stores],
  );

  const dropdownValues = useMemo(
    () => ({
      supplierId: supplierId || "all",
      storeId: storeId || "all",
      status: status || "all",
    }),
    [supplierId, storeId, status],
  );

  const handleDropdownChange = (key: string, value: string) => {
    const actualValue = value === "all" ? undefined : (value as Status);
    if (key === "supplierId") {
      setSupplierId(value === "all" ? "" : value);
    } else if (key === "storeId") {
      setStoreId(value === "all" ? "" : value);
    } else if (key === "status") {
      setStatus(actualValue);
    }
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setSupplierId("");
    setStoreId("");
    setStatus(undefined);
    setPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPage(1);
    setSize(newSize);
  };

  const handleView = (purchase: PurchaseResponse) => {
    setDetailPurchaseId(purchase.id);
    setOpenDetail(true);
  };

  const handleEdit = (purchase: PurchaseResponse) => {
    navigate(ROUTERS.PURCHASE_EDIT.replace(":id", String(purchase.id)));
  };

  const handleDelete = (id: number) => {
    const selected = data?.payload?.data?.find(
      (u: PurchaseResponse) => u.id === id,
    );
    if (selected) {
      setPurchase(selected);
      setOpenConfirmDelete(true);
    }
  };
  console.log(purchase);

  const confirmDelete = () => {
    if (purchase?.id) {
      deletePurchaseMutate(purchase.id, {
        onSuccess: () => {
          setOpenConfirmDelete(false);
        },
      });
    }
  };

  if (!canRead) {
    return <AccessDenied resource="purchases" showBackButton />;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Top Header */}
        <PageHeader
          title="Purchases"
          buttonLabel="Add Purchase"
          onCreate={
            canCreate ? () => navigate(ROUTERS.PURCHASE_CREATE) : undefined
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
            <QueryBoundary isLoading={isLoading} isError={isError} onRetry={refetch}>
              <DataTable
                columns={PurchaseColumns({
                  onView: handleView,
                  onEdit: handleEdit,
                  onDelete: handleDelete,
                  // onApprove: handleApprove,
                  // onComplete: handleComplete,
                  canEdit: canUpdate,
                  canDelete: canDelete,
                })}
                data={filteredPurchases}
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
        entityName={"Purchase"}
        confirmDelete={confirmDelete}
      />

      <PurchaseDetailModal
        purchaseId={detailPurchaseId}
        open={openDetail}
        onOpenChange={setOpenDetail}
        onEdit={handleEdit}
      />
    </>
  );
};

export default PurchasePage;
