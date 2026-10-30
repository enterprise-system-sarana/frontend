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
import { useLanguage } from "@/i18n/LanguageContext";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { formatMoney } from "@/components/ui/money";
import { AlertCircle, CheckCircle2, DollarSign, Flame } from "lucide-react";
import { PaymentForm } from "@/pages/sales/payment/PaymentForm";
import { useQueryClient } from "@tanstack/react-query";


const PurchasePage = () => {
  const { t } = useLanguage();
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

  const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

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
        placeholder: t("purchase.supplier"),
        allLabel: t("common.all"),
        options: suppliers.map((sup: SupplierResponse) => ({
          label: sup.name,
          value: String(sup.id),
        })),
      },
      {
        key: "storeId",
        placeholder: t("purchase.store"),
        allLabel: t("common.all"),
        options: stores.map((store: StoreResponse) => ({
          label: store.name,
          value: String(store.id),
        })),
      },
      {
        key: "status",
        placeholder: t("common.status"),
        allLabel: t("common.all_status"),
        options: [
          { label: t("common.completed"), value: "COMPLETED" },
          { label: t("common.cancelled"), value: "CANCELLED" },
          { label: t("common.pending"), value: "PENDING" },
        ],
      },
    ],
    [suppliers, stores, t],
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
          title={t("purchase.title")}
          buttonLabel={t("purchase.create")}
          onCreate={
            canCreate ? () => navigate(ROUTERS.PURCHASE_CREATE) : undefined
          }
          hideButton={!canCreate}
        />

        {/* ================================================================ */}
        {/* TOP SUMMARY & IMPORTANCE KPI BAR                                  */}
        {/* ================================================================ */}

        <KpiGrid>
          <KpiCard
            featured
            icon={DollarSign}
            title={t("purchase.total_amount", "Total Amount")}
            value={formatMoney(summary.totalGrandTotal)}
            caption={`${summary.totalOrders} ${t("purchase.orders", "orders")}`}
            splits={[
              { label: t("purchase.paid_amount", "Paid Amount"), value: summary.totalPaid, color: "#4ade80" },
              { label: t("purchase.due_amount", "Due Amount"), value: summary.totalBalanceDue, color: "#fb7185" },
            ]}
          />
          <KpiCard
            tone="green"
            icon={CheckCircle2}
            title={t("purchase.paid_amount", "Paid Amount")}
            subtitle={t("purchase.paid_amount_desc", "Settled with suppliers")}
            value={formatMoney(summary.totalPaid)}
            caption={t("purchase.of_total", "of total amount")}
            percent={pct(summary.totalPaid, summary.totalGrandTotal)}
          />
          <KpiCard
            tone="red"
            icon={AlertCircle}
            title={t("purchase.due_amount", "Due Amount")}
            subtitle={t("purchase.due_amount_desc", "Still owed to suppliers")}
            value={formatMoney(summary.totalBalanceDue)}
            caption={t("purchase.of_total", "of total amount")}
            percent={pct(summary.totalBalanceDue, summary.totalGrandTotal)}
          />
          <KpiCard
            tone="amber"
            icon={Flame}
            title={t("purchase.high_priority", "High Priority")}
            subtitle={t("purchase.high_priority_desc", "Marked urgent or high importance")}
            value={summary.counts.URGENT + summary.counts.HIGH}
            caption={`${t("purchase.of", "of")} ${summary.counts.ALL} ${t("purchase.orders", "orders")}`}
            percent={pct(summary.counts.URGENT + summary.counts.HIGH, summary.counts.ALL)}
          />
        </KpiGrid>

        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <PageFilter
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder={t("common.search")}
              filterGroups={dropdowns.map((dropdown) => ({
                key: dropdown.key,
                label: dropdown.placeholder,
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
                  t,
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
        entityName={t("purchase.title")}
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
