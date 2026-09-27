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
import { DollarSign, AlertCircle, Package, Wallet } from "lucide-react";
import { IMPORTANCE_CONFIG, type ImportanceLevel } from "./PurchaseForm";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

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
  const [importanceFilter, setImportanceFilter] = useState<string>("ALL");

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

  const { data: allPurchasesData } = usePurchase.GetAll({
    page: 1,
    size: 1000,
    supplierId: supplierId && supplierId !== "all" ? Number(supplierId) : undefined,
    storeId: storeId && storeId !== "all" ? Number(storeId) : undefined,
    status: status,
  });

  const allPurchases: PurchaseResponse[] =
    allPurchasesData?.payload?.data || data?.payload?.data || [];

  const summary = useMemo(() => {
    const list = allPurchases;
    const totalGrandTotal = list.reduce(
      (sum, p) => sum + (Number(p.grandTotal) || 0),
      0,
    );
    const totalSubtotal = list.reduce(
      (sum, p) => sum + (Number(p.total ?? p.grandTotal) || 0),
      0,
    );
    const totalDiscount = list.reduce(
      (sum, p) => sum + (Number(p.discount) || 0),
      0,
    );
    const totalPaid = list.reduce(
      (sum, p) => sum + (Number(p.paidAmount) || 0),
      0,
    );
    const totalBalanceDue = list.reduce(
      (sum, p) =>
        sum +
        (Number(
          p.dueAmount ?? Math.max((p.grandTotal || 0) - (p.paidAmount || 0), 0),
        ) || 0),
      0,
    );
    const totalUnits = list.reduce((sum, p) => {
      const itemsQty = (p.items || []).reduce(
        (iSum: number, item: any) => iSum + (Number(item.quantity) || 0),
        0,
      );
      return sum + (itemsQty > 0 ? itemsQty : 1);
    }, 0);

    const counts = { ALL: list.length, LOW: 0, NORMAL: 0, HIGH: 0, URGENT: 0 };
    for (const p of list) {
      const note = (p.note || "").toUpperCase();
      if (note.includes("[IMPORTANCE: URGENT]")) counts.URGENT++;
      else if (note.includes("[IMPORTANCE: HIGH]")) counts.HIGH++;
      else if (note.includes("[IMPORTANCE: LOW]")) counts.LOW++;
      else counts.NORMAL++;
    }

    const paymentStatus =
      totalBalanceDue === 0 && totalGrandTotal > 0
        ? "PAID"
        : totalPaid > 0
          ? "PARTIAL"
          : "PENDING";

    return {
      totalGrandTotal,
      totalSubtotal,
      totalDiscount,
      totalPaid,
      totalBalanceDue,
      totalUnits,
      totalOrders: data?.payload?.pagination?.totalElements || list.length,
      counts,
      paymentStatus,
    };
  }, [allPurchases, data?.payload?.pagination?.totalElements]);

  const basePurchases = useSearch<PurchaseResponse>(
    data?.payload?.data,
    search,
    ["referenceNo", "supplierName", "storeName"],
  );

  const filteredPurchases = useMemo(() => {
    if (importanceFilter === "ALL") return basePurchases;
    return basePurchases.filter((p) => {
      const note = (p.note || "").toUpperCase();
      if (importanceFilter === "NORMAL") {
        return (
          note.includes("[IMPORTANCE: NORMAL]") ||
          (!note.includes("[IMPORTANCE: URGENT]") &&
            !note.includes("[IMPORTANCE: HIGH]") &&
            !note.includes("[IMPORTANCE: LOW]"))
        );
      }
      return note.includes(`[IMPORTANCE: ${importanceFilter}]`);
    });
  }, [basePurchases, importanceFilter]);

  const dropdowns = useMemo(
    () => [
      {
        key: "supplierId",
        placeholder: "Filter by Supplier",
        allLabel: "All",
        options: suppliers.map((sup: SupplierResponse) => ({
          label: sup.name,
          value: String(sup.id),
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
    setImportanceFilter("ALL");
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

        {/* ================================================================ */}
        {/* TOP SUMMARY & IMPORTANCE KPI BAR                                  */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* 1. Total Purchase Hero Card */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-card p-4.5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800/80 dark:text-emerald-300/80">
                    Total Purchase
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    Grand Total
                  </span>
                </div>
                <h3 className="mt-1.5 text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(summary.totalGrandTotal)}
                </h3>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600 shadow-inner dark:text-emerald-400">
                <DollarSign className="size-6" />
              </div>
            </div>
            <div className="mt-3.5 flex items-center justify-between border-t border-emerald-500/15 pt-2.5 text-xs text-muted-foreground">
              <span>
                Subtotal: <strong className="text-foreground">{formatCurrency(summary.totalSubtotal)}</strong>
              </span>
              {summary.totalDiscount > 0 ? (
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  Disc: -{formatCurrency(summary.totalDiscount)}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground/80">No discount applied</span>
              )}
            </div>
          </div>

          {/* 2. Purchase Importance Selector Card */}
          <div className="relative overflow-hidden rounded-2xl border bg-card p-4.5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Importance / Priority
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  {importanceFilter === "ALL" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                      <span className="size-1.5 rounded-full bg-blue-500" />
                      All Priorities ({summary.counts.ALL})
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                        IMPORTANCE_CONFIG[importanceFilter as ImportanceLevel]?.badgeClass
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          IMPORTANCE_CONFIG[importanceFilter as ImportanceLevel]?.dotClass
                        }`}
                      />
                      {IMPORTANCE_CONFIG[importanceFilter as ImportanceLevel]?.label} Priority (
                      {summary.counts[importanceFilter as ImportanceLevel]})
                    </span>
                  )}
                </div>
              </div>
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted/70 ${
                  importanceFilter !== "ALL"
                    ? IMPORTANCE_CONFIG[importanceFilter as ImportanceLevel]?.iconColor
                    : "text-muted-foreground"
                }`}
              >
                <AlertCircle className="size-6" />
              </div>
            </div>

            {/* Interactive Priority Filter Buttons */}
            <div className="mt-3.5 border-t pt-2.5">
              <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted/60 p-1">
                {(["LOW", "NORMAL", "HIGH", "URGENT"] as ImportanceLevel[]).map((level) => {
                  const isSelected = importanceFilter === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        setImportanceFilter((prev) => (prev === level ? "ALL" : level));
                        setPage(1);
                      }}
                      title={`Filter by ${IMPORTANCE_CONFIG[level].label} priority (${summary.counts[level]} records)`}
                      className={`cursor-pointer rounded-lg py-1 text-center text-xs font-semibold transition-all ${
                        isSelected
                          ? IMPORTANCE_CONFIG[level].buttonActiveClass + " ring-1 ring-black/5 dark:ring-white/10"
                          : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
                      }`}
                    >
                      {IMPORTANCE_CONFIG[level].label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Intake Volume & Units Card */}
          <div className="relative overflow-hidden rounded-2xl border bg-card p-4.5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Intake Volume
                </span>
                <h3 className="mt-1.5 text-2xl font-bold tracking-tight">
                  {summary.totalUnits}{" "}
                  <span className="text-sm font-normal text-muted-foreground">units</span>
                </h3>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Package className="size-6" />
              </div>
            </div>
            <div className="mt-3.5 flex items-center justify-between border-t pt-2.5 text-xs text-muted-foreground">
              <span>
                Total Lines: <strong className="text-foreground">{summary.totalOrders}</strong> items
              </span>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                Ready to intake
              </span>
            </div>
          </div>

          {/* 4. Payment & Balance Due Card */}
          <div className="relative overflow-hidden rounded-2xl border bg-card p-4.5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payment Balance
                </span>
                <h3 className="mt-1.5 text-2xl font-bold tracking-tight">
                  {formatCurrency(summary.totalBalanceDue)}
                </h3>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Wallet className="size-6" />
              </div>
            </div>
            <div className="mt-3.5 flex items-center justify-between border-t pt-2.5 text-xs">
              <span className="text-muted-foreground">
                Paid: <strong className="text-foreground">{formatCurrency(summary.totalPaid)}</strong>
              </span>
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                  summary.paymentStatus === "PAID"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : summary.paymentStatus === "PARTIAL"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                }`}
              >
                {summary.paymentStatus}
              </span>
            </div>
          </div>
        </div>

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
