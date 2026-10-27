import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import { PageHeader } from "@/components/ui/page-header";
import { PageFilter } from "@/utils/PageFilter";
import { usePayment } from "@/hooks/sales/usePayment";
import { PaymentColumns } from "@/pages/sales/payment/PaymentColumn";
import { PaymentForm } from "@/pages/sales/payment/PaymentForm";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/formatDate";
import {
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Printer,
  ReceiptText,
  ShoppingBag,
  Wallet,
  X,
} from "lucide-react";

const formatCurrency = (value: number | string | null | undefined) =>
  `$${(Number(value) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getPaymentLines = (payment: PaymentResponse) => {
  if (payment.lines?.length) return payment.lines;
  if (payment.paymentLines?.length) return payment.paymentLines;

  return [
    {
      paymentMethod: payment.paymentMethod || "CASH",
      amount: payment.totalAmount ?? payment.amount ?? 0,
      bankName: payment.bankName,
      transactionNo: payment.transactionNo,
    },
  ];
};

const isPurchasePayment = (payment: PaymentResponse) => {
  const candidate = payment as PaymentResponse & Record<string, unknown>;
  const saleId = Number(payment.saleId ?? candidate.sale_id ?? 0);
  const saleNo = String(payment.saleNo ?? "").trim();
  const paymentNo = String(payment.paymentNo ?? "").toUpperCase();
  const note = String(payment.note ?? "").toLowerCase();

  if (saleId > 0 || saleNo || candidate.sales != null) return false;
  if (paymentNo.startsWith("SPAY") || paymentNo.startsWith("SALE")) return false;
  if (
    note.includes("sale payment") ||
    note.includes("pos sale") ||
    note.includes("customer bill") ||
    note.includes("sale #")
  ) {
    return false;
  }

  if (
    Number(payment.purchaseId ?? candidate.purchase_id ?? 0) > 0 ||
    String(payment.purchaseNo ?? "").trim().length > 0 ||
    candidate.purchase != null ||
    candidate.purchases != null ||
    paymentNo.startsWith("PPAY") ||
    paymentNo.startsWith("PUR")
  ) {
    return true;
  }

  return (
    note.includes("purchase") ||
    note.includes("supplier") ||
    note.includes("po #") ||
    note.includes("supplier bill")
  );
};

type SummaryCardProps = {
  label: string;
  value: string;
  description: string;
  icon: React.ElementType;
  tone: "green" | "blue" | "amber" | "red";
};

const toneClasses: Record<SummaryCardProps["tone"], string> = {
  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  red: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
};

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: SummaryCardProps) {
  return (
    <section className="min-w-0 rounded-xl border border-border/70 bg-card p-4 shadow-2xs transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-xl font-semibold tracking-tight tabular-nums text-foreground">
            {value}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>
        </div>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </section>
  );
}

function PaymentStatusBadge({ status }: { status?: string | null }) {
  const normalized = String(status ?? "COMPLETED").toUpperCase();
  const styles =
    normalized === "PAID" || normalized === "COMPLETED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
      : normalized === "PARTIAL"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400"
        : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";

  return (
    <Badge
      variant="outline"
      className={`rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles}`}
    >
      {normalized}
    </Badge>
  );
}

export const PurchasePaymentPage = () => {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedPayment, setSelectedPayment] = useState<PaymentResponse | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentResponse | null>(
    null,
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const { data, isLoading, isError, refetch } = usePayment.getAllPayments({
    page: 1,
    size: 500,
    paymentNo: debouncedSearch.trim() || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const deleteMutation = usePayment.deletePayment();

  const paymentList = useMemo<PaymentResponse[]>(() => {
    if (!data) return [];

    const root = data as Record<string, any>;
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

    return rawList.filter(isPurchasePayment);
  }, [data]);

  const filteredList = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return paymentList;

    return paymentList.filter((payment) => {
      const paymentNo = String(payment.paymentNo ?? "").toLowerCase();
      const username = String(payment.username ?? "").toLowerCase();
      const note = String(payment.note ?? "").toLowerCase();
      const purchaseRef = String(
        payment.purchaseNo ?? payment.purchaseId ?? "",
      ).toLowerCase();
      const lines = getPaymentLines(payment);

      const lineMatch = lines.some(
        (line) =>
          String(line.paymentMethod ?? "").toLowerCase().includes(query) ||
          String(line.bankName ?? "").toLowerCase().includes(query) ||
          String(line.transactionNo ?? "").toLowerCase().includes(query),
      );

      return (
        paymentNo.includes(query) ||
        username.includes(query) ||
        note.includes(query) ||
        purchaseRef.includes(query) ||
        lineMatch
      );
    });
  }, [paymentList, search]);

  const paginatedList = useMemo(() => {
    const start = (page - 1) * size;
    return filteredList.slice(start, start + size);
  }, [filteredList, page, size]);

  const stats = useMemo(() => {
    let totalPaid = 0;
    let paidCount = 0;
    let partialCount = 0;
    let totalDue = 0;

    paymentList.forEach((payment) => {
      const amount = Number(
        payment.receivedAmount ?? payment.totalAmount ?? payment.amount ?? 0,
      );
      const due = Number(payment.dueAmount ?? 0);

      totalPaid += amount;
      totalDue += due;

      if (due <= 0.005 || String(payment.status).toUpperCase() === "PAID") {
        paidCount += 1;
      } else {
        partialCount += 1;
      }
    });

    return { totalPaid, paidCount, partialCount, totalDue };
  }, [paymentList]);

  const paginationMeta = useMemo(
    () => ({
      totalElements: filteredList.length,
      totalPages: Math.max(1, Math.ceil(filteredList.length / size)),
    }),
    [filteredList.length, size],
  );

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
    if (deleteTargetId == null) return;

    await deleteMutation.mutateAsync({ id: deleteTargetId });
    setIsDeleteOpen(false);
    setDeleteTargetId(null);
    void refetch();
  };

  const handleReset = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setPage(1);
  };

  const filterGroups = useMemo(
    () => [
      {
        key: "status",
        label: "Status",
        options: [
          { label: "All Status", value: "all" },
          { label: "Paid", value: "PAID" },
          { label: "Partial", value: "PARTIAL" },
          { label: "Pending", value: "PENDING" },
        ],
      },
    ],
    [],
  );

  const filterValues = useMemo(() => ({ status: statusFilter }), [statusFilter]);

  const handleFilterChange = (key: string, value: string) => {
    if (key === "status") setStatusFilter(value);
    setPage(1);
  };

  const paymentLines = selectedPayment ? getPaymentLines(selectedPayment) : [];
  const paidAmount = selectedPayment
    ? Number(
      selectedPayment.receivedAmount ??
      selectedPayment.totalAmount ??
      selectedPayment.amount ??
      0,
    )
    : 0;

  return (
    <div className="space-y-5 pb-6">
      <PageHeader title="Purchase Payments" hideButton />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Paid"
          value={formatCurrency(stats.totalPaid)}
          description=""
          icon={Wallet}
          tone="green"
        />
        <SummaryCard
          label="Fully Paid"
          value={String(stats.paidCount)}
          description=""
          icon={CheckCircle2}
          tone="blue"
        />
        <SummaryCard
          label="Partial / Pending"
          value={String(stats.partialCount)}
          description=""
          icon={Clock3}
          tone="amber"
        />
        <SummaryCard
          label="Outstanding Due"
          value={formatCurrency(stats.totalDue)}
          description=""
          icon={Building2}
          tone="red"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xs">


        <div className="border-b border-border px-3 py-3 sm:px-4">
          <PageFilter
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search payment, purchase, user, bank..."
            filterGroups={filterGroups}
            filterValues={filterValues}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
          />
        </div>

        <QueryBoundary isLoading={isLoading} isError={isError} onRetry={refetch}>
          <DataTable
            columns={PaymentColumns({
              mode: "purchase",
              onView: handleView,
              onEdit: handleEdit,
              onDelete: handleDelete,
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
      </section>

      <ConfirmDelete
        isOpen={isDeleteOpen}
        setIsOpen={setIsDeleteOpen}
        entityName="Purchase Payment Record"
        confirmDelete={confirmDelete}
      />

      {selectedPayment && (
        <Dialog
          open={isDetailOpen}
          onOpenChange={(open) => {
            setIsDetailOpen(open);
            if (!open) setSelectedPayment(null);
          }}
        >
          <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-none border-border p-0">
            <DialogHeader className="border-b border-border px-5 py-4 text-left">
              <div className="flex items-start justify-between gap-3 pr-7">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <ReceiptText className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <DialogTitle className="text-base font-semibold">
                      Payment voucher
                    </DialogTitle>
                    <DialogDescription className="mt-1 truncate font-mono text-xs">
                      {selectedPayment.paymentNo ||
                        `PPAY-${selectedPayment.id}`}
                    </DialogDescription>
                  </div>
                </div>
                <PaymentStatusBadge status={selectedPayment.status} />
              </div>
            </DialogHeader>

            <div className="space-y-5 px-5 py-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Purchase reference
                  </p>
                  <p className="mt-1 flex items-center gap-2 break-words text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    <ShoppingBag className="size-4 shrink-0" />
                    {selectedPayment.purchaseNo ||
                      (selectedPayment.purchaseId
                        ? `Purchase #${selectedPayment.purchaseId}`
                        : "Supplier bill")}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Payment date
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                    <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                    {formatDate(selectedPayment.paymentDate)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Processed by
                  </p>
                  <p className="mt-1 break-words text-sm font-medium">
                    {selectedPayment.username ||
                      (selectedPayment.userId
                        ? `User #${selectedPayment.userId}`
                        : "Accountant")}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Payment ID
                  </p>
                  <p className="mt-1 font-mono text-sm font-medium">
                    #{selectedPayment.id}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Payment breakdown
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {paymentLines.length}{" "}
                    {paymentLines.length === 1 ? "method" : "methods"}
                  </span>
                </div>

                <div className="divide-y divide-border border border-border">
                  {paymentLines.map((line: any, index: number) => {
                    const isCash = String(line.paymentMethod)
                      .toUpperCase()
                      .includes("CASH");

                    return (
                      <div
                        key={`${line.paymentMethod}-${line.transactionNo ?? index}-${index}`}
                        className="flex items-center justify-between gap-3 px-3 py-3"
                      >
                        <div className="flex min-w-0 items-start gap-2.5">
                          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center bg-muted text-muted-foreground">
                            {isCash ? (
                              <Banknote className="size-4" />
                            ) : (
                              <CreditCard className="size-4" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">
                              {line.paymentMethod || "Payment"}
                            </p>
                            {line.bankName && (
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                <Building2 className="size-3" />
                                {line.bankName}
                              </p>
                            )}
                            {line.transactionNo && (
                              <p className="mt-0.5 break-all font-mono text-[11px] text-muted-foreground">
                                Ref: {line.transactionNo}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold tabular-nums">
                            {formatCurrency(line.amount)}
                          </p>
                          {line.currencyCode &&
                            line.currencyCode !== "USD" && (
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {line.currencyCode}
                              </p>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Total bill</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(
                      selectedPayment.totalAmount ?? selectedPayment.amount,
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Amount paid</span>
                  <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(paidAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Change returned</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(selectedPayment.returnAmount ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-dashed border-border pt-3 text-sm">
                  <span className="font-semibold">Remaining due</span>
                  <span className="text-base font-bold tabular-nums text-rose-600 dark:text-rose-400">
                    {formatCurrency(selectedPayment.dueAmount ?? 0)}
                  </span>
                </div>
              </div>

              {selectedPayment.note && (
                <div className="flex gap-2 border border-amber-200 bg-amber-50/70 p-3 text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                  <FileText className="mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">Payment note</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed">
                      {selectedPayment.note}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-none"
                onClick={() => window.print()}
              >
                <Printer className="mr-2 size-4" />
                Print voucher
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-none bg-[#04912E] text-white hover:bg-[#037a26]"
                onClick={() => setIsDetailOpen(false)}
              >
                <X className="mr-1.5 size-4" />
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {editingPayment && (
        <PaymentForm
          open={isEditOpen}
          setOpen={(open) => {
            setIsEditOpen(open);
            if (!open) setEditingPayment(null);
          }}
          payment={editingPayment}
          mode="purchase"
          purchaseId={editingPayment.purchaseId ?? undefined}
          orderRef={
            editingPayment.purchaseNo ||
            (editingPayment.purchaseId
              ? `Purchase #${editingPayment.purchaseId}`
              : undefined)
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

export const PurchasePayment = PurchasePaymentPage;
export default PurchasePaymentPage;
