import { DataTable } from "@/components/ui/data-table";
import PageHeader from "@/components/ui/page-header";
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
import { toast } from "sonner";
import type { Status } from "@/types/enum/status";

export const PurchasePage = () => {
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
  const { data, isError, isLoading } = usePurchase.useGetAllPurchase({
    page,
    size,
    reference: search || undefined,
    supplierId:
      supplierId && supplierId !== "all" ? Number(supplierId) : undefined,
    storeId: storeId && storeId !== "all" ? Number(storeId) : undefined,
    status: status,
  });

  const { mutate: deletePurchaseMutate } = usePurchase.useDeletePurchase();
  const { mutate: approvePurchaseMutate } =
    usePurchase.useApprovePurchase?.() || { mutate: () => {} };
  const { mutate: completePurchaseMutate } =
    usePurchase.useCompletePurchase?.() || { mutate: () => {} };
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  const filteredPurchases = useSearch<PurchaseResponse>(
    data?.payload?.data,
    search,
    ["reference", "supplierName", "storeName"],
  );

  const dropdowns = useMemo(
    () => [
      {
        key: "supplierId",
        placeholder: "Filter by Supplier",
        allLabel: "All Suppliers",
        options: suppliers.map((sup: any) => ({
          label: sup.name,
          value: String(sup.id),
        })),
      },
      {
        key: "storeId",
        placeholder: "Filter by Store",
        allLabel: "All Stores",
        options: stores.map((store: any) => ({
          label: store.name,
          value: String(store.id),
        })),
      },
      {
        key: "status",
        placeholder: "Filter by Status",
        allLabel: "All Statuses",
        options: [
          { label: "Approved", value: "APPROVED" },
          { label: "Completed", value: "COMPLETED" },
          { label: "Ordered", value: "ORDERED" },
        ],
      },
    ],
    [suppliers, stores],
  );

  const dropdownValues = useMemo(
    () => ({
      supplierId: supplierId || "all",
      storeId: storeId || "all",
      status: status || ("all" as any),
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

  const handleEdit = (purchase: PurchaseResponse) => {
    navigate(`/purchase/edit/${purchase.id}`);
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

  const handleApprove = (id: number) => {
    approvePurchaseMutate(id, {
      onError: (error: any) => {
        toast.error(error?.message || "Failed to approve purchase");
      },
    });
  };

  const handleComplete = (id: number) => {
    completePurchaseMutate(id, {
      onError: (error: any) => {
        toast.error(error?.message || "Failed to complete purchase");
      },
    });
  };

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
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
        <h2 className="text-xl font-semibold text-destructive mb-2">
          Access Denied
        </h2>
        <p className="text-muted-foreground">
          You do not have permission to view purchases.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Purchases"
        buttonText={canCreate ? "Add Purchase" : undefined}
        onButtonClick={
          canCreate ? () => navigate("/purchase/create") : undefined
        }
      />
      <PageFilter
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search reference..."
        dropdowns={dropdowns}
        dropdownValues={dropdownValues}
        onDropdownChange={handleDropdownChange}
        onReset={handleReset}
      />

      <QueryBoundary isLoading={isLoading} isError={isError}>
        <DataTable
          columns={PurchaseColumns({
            onEdit: handleEdit,
            onDelete: handleDelete,
            onApprove: handleApprove,
            onComplete: handleComplete,
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
            onPageSizeChange: setSize,
          }}
        />
      </QueryBoundary>

      <ConfirmDelete
        isOpen={openConfirmDelete}
        setIsOpen={setOpenConfirmDelete}
        entityName={"Purchase"}
        confirmDelete={confirmDelete}
      />
    </>
  );
};
