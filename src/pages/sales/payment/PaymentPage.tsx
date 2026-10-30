import { useState, useMemo, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import { PageHeader } from "@/components/ui/page-header";
import { PageFilter } from "@/utils/PageFilter";
import { usePayment } from "@/hooks/sales/usePayment";
import { PaymentColumns } from "./PaymentColumn";
import { PaymentForm } from "./PaymentForm";
import type { PaymentResponse } from "@/types/sales/Payment";
import ConfirmDelete from "@/components/ui/confirmDelete";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import { Money, formatMoney } from "@/components/ui/money";
import { StatusBadge } from "@/components/ui/status-badge";
import { DetailGrid, DetailItem, DetailSection, SummaryRow } from "@/components/ui/detail-list";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatDate } from "@/utils/formatDate";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  DollarSign,
  Printer,
  Receipt,
} from "lucide-react";

export const PaymentPage = () => {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedPayment, setSelectedPayment] = useState<PaymentResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentResponse | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Debounce search input and reset page to 1
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Helper to ensure only Sale Payments are shown on this page
  const isSalePayment = (p: PaymentResponse) => {
    // 1. Immediately reject any purchase payment
    if (p.purchaseId && Number(p.purchaseId) > 0) return false;
    if (p.purchaseNo && String(p.purchaseNo).trim().length > 0) return false;
    if ((p as any).purchase_id && Number((p as any).purchase_id) > 0) return false;
    if ((p as any).purchase != null) return false;
    if (p.paymentNo?.toUpperCase().startsWith("PPAY")) return false;
    if (p.paymentNo?.toUpperCase().startsWith("PUR")) return false;

    const note = (p.note || "").toLowerCase();
    if (
      note.includes("purchase payment") ||
      note.includes("supplier bill") ||
      note.includes("purchase #") ||
      note.includes("po #")
    ) {
      return false;
    }

    // 2. Accept if it has explicit sale indicators
    if (p.saleId && Number(p.saleId) > 0) return true;
    if (p.saleNo && String(p.saleNo).trim().length > 0) return true;
    if ((p as any).sales != null || (p as any).sale_id != null) return true;
    if (p.paymentNo?.toUpperCase().startsWith("SPAY")) return true;
    if (p.paymentNo?.toUpperCase().startsWith("SALE")) return true;

    // 3. Fallback: If neither purchaseId nor saleId is specified, treat as sale payment
    return true;
  };

  // Fetch payments
  const { data, isLoading, isError, refetch } = usePayment.getAllPayments({
    page: 1,
    size: 500,
    paymentNo: debouncedSearch.trim() || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const deleteMutation = usePayment.deletePayment();

  // Extract list safely and keep STRICTLY sale payments
  const paymentList: PaymentResponse[] = useMemo(() => {
    if (!data) return [];
    const root = data as any;
    const payload = root.payload;
    const rawList: PaymentResponse[] = Array.isArray(data)
      ? data
      : Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.content)
      ? payload.content
      : Array.isArray(root.data)
      ? root.data
      : Array.isArray(root.content)
      ? root.content
      : [];

    return rawList.filter(isSalePayment);
  }, [data]);

  // Client-side search filtering on sale payments
  const filteredList = useMemo(() => {
    if (!search.trim()) return paymentList;
    const q = search.trim().toLowerCase();
    return paymentList.filter((p) => {
      const pNo = (p.paymentNo || "").toLowerCase();
      const user = (p.username || "").toLowerCase();
      const note = (p.note || "").toLowerCase();
      const saleRef = String(p.saleNo || p.saleId || "").toLowerCase();
      const lines = p.lines || p.paymentLines || [];
      const lineMatch = lines.some(
        (l) =>
          (l.paymentMethod || "").toLowerCase().includes(q) ||
          (l.bankName || "").toLowerCase().includes(q) ||
          (l.transactionNo || "").toLowerCase().includes(q)
      );
      return (
        pNo.includes(q) ||
        user.includes(q) ||
        note.includes(q) ||
        saleRef.includes(q) ||
        lineMatch
      );
    });
  }, [paymentList, search]);

  // Client-side pagination slicing
  const paginatedList = useMemo(() => {
    const start = (page - 1) * size;
    return filteredList.slice(start, start + size);
  }, [filteredList, page, size]);

  // Top KPI stats calculation for sales payments
  const stats = useMemo(() => {
    let totalCollected = 0;
    let paidCount = 0;
    let partialCount = 0;
    let totalDue = 0;

    paymentList.forEach((p) => {
      const amt = Number(p.totalAmount ?? p.amount ?? 0);
      const due = Number(p.dueAmount ?? 0);
      totalCollected += amt;
      totalDue += due;

      const isPaid = due <= 0.005 || String(p.status).toUpperCase() === "PAID";
      if (isPaid) {
        paidCount++;
      } else {
        partialCount++;
      }
    });

    return { totalCollected, paidCount, partialCount, totalDue };
  }, [paymentList]);

  // Pagination metadata
  const paginationMeta = useMemo(() => {
    return {
      totalElements: filteredList.length,
      totalPages: Math.max(1, Math.ceil(filteredList.length / size)),
    };
  }, [filteredList.length, size]);

  const handleView = (payment: PaymentResponse) => {
    setSelectedPayment(payment);
    setIsDetailOpen(true);
  };

  const handleEdit = (payment: PaymentResponse) => {
    setEditingPayment(payment);
    setIsEditOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      await deleteMutation.mutateAsync({ id: deleteTargetId });
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
      void refetch();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Dropdown filter configs for PageFilter
  const filterGroups = useMemo(
    () => [
      {
        key: "status",
        label: t("common.status", "Status"),
        options: [
          { label: t("common.paid", "Paid"), value: "PAID" },
          { label: t("common.partial", "Partial"), value: "PARTIAL" },
          { label: t("common.pending", "Pending"), value: "PENDING" },
          { label: t("payment.void", "Void"), value: "VOID" },
        ],
      },
    ],
    [t]
  );

  const filterValues = useMemo(
    () => ({
      status: statusFilter,
    }),
    [statusFilter]
  );

  const handleFilterChange = (key: string, value: string) => {
    if (key === "status") setStatusFilter(value);
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setStatusFilter("all");
    setPage(1);
  };

  const totalPayments = paymentList.length;
  const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

  const voucherLines = selectedPayment
    ? selectedPayment.lines?.length
      ? selectedPayment.lines
      : selectedPayment.paymentLines?.length
        ? selectedPayment.paymentLines
        : [
          {
            paymentMethod: selectedPayment.paymentMethod || "CASH",
            amount: selectedPayment.totalAmount ?? selectedPayment.amount ?? 0,
            bankName: selectedPayment.bankName,
            transactionNo: selectedPayment.transactionNo,
          },
        ]
    : [];

  return (
    <div className="space-y-5">
      {/* 1. Header */}
      <PageHeader
        title={t("payment.sale_payments", "Sale Payments")}
        description={t("payment.sale_payments_desc", "Every payment received against sales, with method, change and balance due.")}
        hideButton={true}
      />

      {/* 2. KPI cards (shared Figma KpiCard) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          featured
          icon={DollarSign}
          title={t("payment.total_collected", "Total Collected")}
          value={formatMoney(stats.totalCollected)}
          caption={`${totalPayments} ${t("payment.payments", "payments")}`}
          splits={[
            { label: t("payment.settled", "Settled"), value: stats.paidCount, color: "#4ade80" },
            { label: t("common.partial", "Partial"), value: stats.partialCount, color: "#fbbf24" },
          ]}
        />
        <KpiCard
          tone="green"
          icon={CheckCircle2}
          title={t("payment.fully_settled", "Fully Settled")}
          subtitle={t("payment.fully_settled_desc", "No balance remaining")}
          value={stats.paidCount}
          caption={`${t("payment.of", "of")} ${totalPayments} ${t("payment.payments", "payments")}`}
          percent={pct(stats.paidCount, totalPayments)}
        />
        <KpiCard
          tone="amber"
          icon={Clock}
          title={t("payment.partial_payments", "Partial Payments")}
          subtitle={t("payment.partial_payments_desc", "Customer still owes a balance")}
          value={stats.partialCount}
          caption={`${t("payment.of", "of")} ${totalPayments} ${t("payment.payments", "payments")}`}
          percent={pct(stats.partialCount, totalPayments)}
        />
        <KpiCard
          tone="red"
          icon={AlertCircle}
          title={t("payment.outstanding_due", "Outstanding Due")}
          subtitle={t("payment.outstanding_due_desc", "Unpaid balance on sales")}
          value={formatMoney(stats.totalDue)}
          caption={t("payment.of_billed", "of total billed")}
          percent={pct(stats.totalDue, stats.totalCollected)}
        />
      </div>

      {/* 3. Main Data Table with Filters */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <PageFilter
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t("payment.search_placeholder", "Search payment, sale or cashier…")}
            filterGroups={filterGroups}
            filterValues={filterValues}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
          />
        </div>

        <QueryBoundary isLoading={isLoading} isError={isError} onRetry={refetch}>
          <DataTable
            columns={PaymentColumns({
              mode: "sale",
              onView: handleView,
              onEdit: handleEdit,
              onDelete: handleDelete,
              t,
            })}
            data={paginatedList}
            pagination={{
              currentPage: page,
              pageSize: size,
              totalElements: paginationMeta.totalElements,
              totalPages: paginationMeta.totalPages,
              onPageChange: setPage,
              onPageSizeChange: (newSize) => {
                setPage(1);
                setSize(newSize);
              },
            }}
          />
        </QueryBoundary>
      </div>

      {/* 4. Delete Confirmation */}
      <ConfirmDelete
        isOpen={isDeleteOpen}
        setIsOpen={setIsDeleteOpen}
        entityName={t("payment.record", "Payment Record")}
        confirmDelete={confirmDelete}
      />

      {/* 5. Payment voucher (shared dialog + detail components) */}
      {selectedPayment && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <Receipt className="size-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <DialogTitle>{t("payment.voucher", "Payment Voucher")}</DialogTitle>
                  <DialogDescription>
                    {selectedPayment.paymentNo || `PAY-${selectedPayment.id}`}
                  </DialogDescription>
                </div>
                <StatusBadge status={selectedPayment.status || "COMPLETED"} className="ml-auto" />
              </div>
            </DialogHeader>

            <DetailGrid>
              <DetailItem label={t("payment.sale_ref", "Sale Ref.")}>
                {selectedPayment.saleNo || (selectedPayment.saleId ? `SALE-${selectedPayment.saleId}` : t("payment.pos_sale", "POS Sale"))}
              </DetailItem>
              <DetailItem label={t("common.date", "Date")}>
                {formatDate(selectedPayment.paymentDate)}
              </DetailItem>
              <DetailItem label={t("payment.processed_by", "Processed By")}>
                {selectedPayment.username || (selectedPayment.userId ? `User #${selectedPayment.userId}` : "System")}
              </DetailItem>
              <DetailItem label={t("payment.payment_id", "Payment ID")}>
                #{selectedPayment.id}
              </DetailItem>
            </DetailGrid>

            <DetailSection title={t("payment.payment_methods", "Payment Methods")}>
              <div className="divide-y divide-border rounded-xl border border-border">
                {voucherLines.map((line: any, i: number) => {
                  const isCash = String(line.paymentMethod).toUpperCase().includes("CASH");
                  return (
                    <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${isCash ? "bg-warning/10 text-warning-text" : "bg-primary-light text-primary"}`}>
                          {isCash ? <Coins className="size-4" /> : <CreditCard className="size-4" />}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {String(line.paymentMethod || "CASH").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                            {line.bankName && <span className="font-normal text-muted-foreground"> · {line.bankName}</span>}
                          </p>
                          {line.transactionNo && (
                            <p className="truncate text-xs text-muted-foreground">TX {line.transactionNo}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Money value={line.amount} />
                        {line.currencyCode && line.currencyCode !== "USD" && (
                          <p className="text-xs text-muted-foreground">{line.currencyCode}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </DetailSection>

            <div className="space-y-2.5">
              <SummaryRow label={t("payment.total_bill", "Total Bill")}>
                <Money value={selectedPayment.totalAmount ?? selectedPayment.amount} />
              </SummaryRow>
              <SummaryRow label={t("payment.total_received", "Total Received")}>
                <Money value={selectedPayment.receivedAmount ?? selectedPayment.totalAmount ?? selectedPayment.amount} tone="success" />
              </SummaryRow>
              <SummaryRow label={t("payment.change_return", "Change Return")}>
                <Money value={selectedPayment.returnAmount ?? 0} tone="warning" />
              </SummaryRow>
              <SummaryRow label={t("payment.remaining_due", "Remaining Due")} emphasis>
                <Money value={selectedPayment.dueAmount ?? 0} tone={Number(selectedPayment.dueAmount ?? 0) > 0.005 ? "danger" : "default"} />
              </SummaryRow>
            </div>

            {selectedPayment.note && (
              <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-text">
                <p className="mb-0.5 font-medium">{t("payment.note", "Note")}</p>
                <p className="leading-relaxed">{selectedPayment.note}</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="size-4" />
                {t("payment.print_voucher", "Print Voucher")}
              </Button>
              <Button onClick={() => setIsDetailOpen(false)}>{t("common.close", "Close")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 6. Edit Payment Modal */}
      {editingPayment && (
        <PaymentForm
          open={isEditOpen}
          setOpen={(open) => {
            setIsEditOpen(open);
            if (!open) setEditingPayment(null);
          }}
          payment={editingPayment}
          mode="sale"
          saleId={editingPayment.saleId ?? undefined}
          orderRef={
            editingPayment.saleNo || (editingPayment.saleId ? `Sale #${editingPayment.saleId}` : undefined)
          }
          amount={editingPayment.totalAmount ?? editingPayment.amount}
          onComplete={() => {
            void refetch();
          }}
        />
      )}
    </div>
  );
};

export default PaymentPage;