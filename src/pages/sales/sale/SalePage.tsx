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
import { SaleDetailModal } from "./SaleDetailModal";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { PageFilter } from "@/utils/PageFilter";
import { useNavigate } from "react-router-dom";
import type { Status } from "@/types/enum/status";
import { PageHeader } from "@/components/ui/page-header";
import { AccessDenied } from "@/components/ui/access-denied";
import { ROUTERS } from "@/constants/Route";
import type { StoreResponse } from "@/types/inventory/Store";
import type { CustomerResponse } from "@/types/sales/Customer";
import PaymentForm from "@/pages/sales/payment/PaymentForm";
import ReturnSaleModal from "./components/ReturnSaleModal";
import { toast } from "sonner";

const SalePage = () => {
  const navigate = useNavigate();
  const { Can } = usePermission();
  const canCreate = Can(PERMISSION.SALE.CREATE);
  const canRead = Can(PERMISSION.SALE.READ);
  const canUpdate = Can(PERMISSION.SALE.UPDATE);
  const canDelete = Can(PERMISSION.SALE.DELETE);

  const [sale, setSale] = useState<SaleResponse | null>(null);
  const [detailSaleId, setDetailSaleId] = useState<number | null>(null);
  const [viewingSale, setViewingSale] = useState<SaleResponse | null>(null);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [paymentSale, setPaymentSale] = useState<SaleResponse | null>(null);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [returningSale, setReturningSale] = useState<SaleResponse | null>(null);
  const [openReturnModal, setOpenReturnModal] = useState(false);

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

  const customers = useMemo(
    () => customerData?.payload?.data ?? [],
    [customerData],
  );
  const stores = useMemo(
    () => storeData?.payload?.data ?? [],
    [storeData],
  );

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
  const { mutate: returnSaleMutate, isPending: isReturning } = useSale.ReturnSale();

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
        allLabel: "All",
        options: customers.map((cust: CustomerResponse) => ({
          label: cust.name,
          value: String(cust.id),
        })),
      },
      {
        key: "storeId",
        placeholder: "Filter by Store",
        allLabel: "All",
        options: stores.map((store: StoreResponse) => ({
          label: store.name,
          value: String(store.id),
        })),
      },
      {
        key: "status",
        placeholder: "Filter by Status",
        allLabel: "All",
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

  const handleView = (selectedSale: SaleResponse) => {
    setViewingSale(selectedSale);
    setDetailSaleId(selectedSale.id);
    setOpenDetailModal(true);
  };

  const handleEdit = (selectedSale: SaleResponse) => {
    if (!canUpdate) return;
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
    const selected = data?.payload?.data?.find((s: SaleResponse) => s.id === id);
    if (selected) {
      setReturningSale(selected);
      setOpenReturnModal(true);
    }
  };

  const handleReturnConfirm = (_reason: string) => {
    if (!returningSale?.id) return;
    returnSaleMutate(returningSale.id, {
      onSuccess: () => {
        toast.success(`Sale #${returningSale.reference} has been returned.`);
        setOpenReturnModal(false);
        setReturningSale(null);
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message ||
          (typeof err?.response?.data === "string" ? err.response.data : null) ||
          err?.message ||
          "Failed to return sale. Please try again.";
        toast.error(msg);
      },
    });
  };

  const handlePayment = (selectedSale: SaleResponse) => {
    setPaymentSale(selectedSale);
    setOpenPaymentModal(true);
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
          buttonLabel="Create Sale"
          onCreate={
            canCreate ? () => window.open(ROUTERS.SALE_CREATE, "_blank") : undefined
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
                  onView: handleView,
                  onEdit: handleEdit,
                  onDelete: handleDelete,
                  onComplete: handleComplete,
                  onCancel: handleCancel,
                  onReturn: handleReturn,
                  onPayment: handlePayment,
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

      <SaleDetailModal
        saleId={detailSaleId}
        initialSale={viewingSale}
        open={openDetailModal}
        onOpenChange={setOpenDetailModal}
        onEdit={handleEdit}
      />

      <PaymentForm
        open={openPaymentModal}
        setOpen={setOpenPaymentModal}
        payment={null}
        mode="sale"
        saleId={paymentSale?.id}
        amount={paymentSale?.dueAmount}
      />

      <ReturnSaleModal
        open={openReturnModal}
        onOpenChange={setOpenReturnModal}
        saleReference={returningSale?.reference}
        grandTotal={returningSale?.grandTotal}
        onConfirm={handleReturnConfirm}
        isPending={isReturning}
      />
    </>
  );
};

export default SalePage;
