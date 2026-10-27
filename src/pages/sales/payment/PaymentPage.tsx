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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/formatDate";
import {
  CreditCard,
  Coins,
  Building2,
  Receipt,
  ShoppingCart,
  ShoppingBag,
  Hash,
  User,
  Calendar,
  DollarSign,
  Printer,
  CheckCircle2,
  Clock,
} from "lucide-react";

const formatCurrency = (val: number | null | undefined) => `$${(Number(val) || 0).toFixed(2)}`;

export const PaymentPage = () => {
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
        label: "Status",
        options: [
          { label: "All Status", value: "all" },
          { label: "Paid", value: "PAID" },
          { label: "Partial", value: "PARTIAL" },
          { label: "Pending", value: "PENDING" },
          { label: "Void", value: "VOID" },
        ],
      },
    ],
    []
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

  return (
    <div className="space-y-4">
      {/* 1. Header */}
      <PageHeader
        title="Sale Payments"
        hideButton={true}
      />

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Collected */}
        <div className="bg-card border border-border/70 rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="size-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-900/50">
            <DollarSign className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Total Sales Collected
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
              {formatCurrency(stats.totalCollected)}
            </p>
          </div>
        </div>

        {/* Fully Settled Sales */}
        <div className="bg-card border border-border/70 rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="size-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-900/50">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Fully Settled
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
              {stats.paidCount} sales
            </p>
          </div>
        </div>

        {/* Partial Payments */}
        <div className="bg-card border border-border/70 rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="size-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/50 dark:border-amber-900/50">
            <Clock className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Partial Payments
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
              {stats.partialCount} sales
            </p>
          </div>
        </div>

        {/* Outstanding Due */}
        <div className="bg-card border border-border/70 rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="size-10 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/50 dark:border-rose-900/50">
            <DollarSign className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Outstanding Sales Due
            </p>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
              {formatCurrency(stats.totalDue)}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Data Table with Filters */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-border/60">
          <PageFilter
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search payment #, sale invoice #, processed by..."
            filterGroups={filterGroups}
            filterValues={filterValues}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
          />
        </div>

        <div className="px-0">
          <QueryBoundary isLoading={isLoading} isError={isError} onRetry={refetch}>
            <DataTable
              columns={PaymentColumns({
                mode: "sale",
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
        </div>
      </div>

      {/* 4. Delete Confirmation */}
      <ConfirmDelete
        isOpen={isDeleteOpen}
        setIsOpen={setIsDeleteOpen}
        entityName="Payment Record"
        confirmDelete={confirmDelete}
      />

      {/* 5. Payment Details Receipt Modal */}
      {selectedPayment && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-md w-full p-0 overflow-hidden rounded-2xl bg-white text-slate-800">
            {/* Modal Header */}
            <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Receipt className="size-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-900">
                      Payment Voucher
                    </DialogTitle>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">
                      {selectedPayment.paymentNo || `PAY-${selectedPayment.id}`}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    selectedPayment.status === "PAID"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }
                >
                  {selectedPayment.status || "COMPLETED"}
                </Badge>
              </div>
            </DialogHeader>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Order Context */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Sale Reference
                  </span>
                  <span className="font-semibold text-blue-700 dark:text-sky-400 mt-0.5 block flex items-center gap-1">
                    <ShoppingCart className="size-3.5" />
                    {selectedPayment.saleNo || (selectedPayment.saleId ? `Sale #${selectedPayment.saleId}` : "POS Sale")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Date & Time
                  </span>
                  <span className="font-medium text-slate-700 mt-0.5 block">
                    {formatDate(selectedPayment.paymentDate)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Processed By
                  </span>
                  <span className="font-medium text-slate-700 mt-0.5 block">
                    {selectedPayment.username || (selectedPayment.userId ? `User #${selectedPayment.userId}` : "System")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Payment ID
                  </span>
                  <span className="font-mono text-slate-700 mt-0.5 block">
                    #{selectedPayment.id}
                  </span>
                </div>
              </div>

              {/* Payment Lines Breakdown */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Tendered Breakdown
                </h4>
                <div className="rounded-xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
                  {(selectedPayment.lines?.length
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
                  ).map((line: any, i: number) => (
                    <div key={i} className="p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {String(line.paymentMethod).toUpperCase().includes("CASH") ? (
                          <Coins className="size-4 text-amber-500 shrink-0" />
                        ) : (
                          <CreditCard className="size-4 text-indigo-500 shrink-0" />
                        )}
                        <div>
                          <p className="font-bold text-slate-800">
                            {line.paymentMethod}
                            {line.bankName && (
                              <span className="font-normal text-slate-500 ml-1">
                                ({line.bankName})
                              </span>
                            )}
                          </p>
                          {line.transactionNo && (
                            <p className="font-mono text-[10px] text-slate-400">
                              TX: {line.transactionNo}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-800 text-sm">
                          {formatCurrency(line.amount)}
                        </span>
                        {line.currencyCode && line.currencyCode !== "USD" && (
                          <p className="text-[10px] text-slate-500 font-mono">
                            {line.currencyCode}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amount Summary */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Total Bill:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(selectedPayment.totalAmount ?? selectedPayment.amount)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Received Amount:</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    {formatCurrency(selectedPayment.receivedAmount ?? selectedPayment.totalAmount ?? selectedPayment.amount)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Return / Change:</span>
                  <span className="font-mono font-semibold text-amber-600">
                    {formatCurrency(selectedPayment.returnAmount ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Remaining Due:</span>
                  <span className="font-mono font-bold text-rose-600">
                    {formatCurrency(selectedPayment.dueAmount ?? 0)}
                  </span>
                </div>
              </div>

              {/* Note */}
              {selectedPayment.note && (
                <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/50 text-amber-900 text-xs">
                  <span className="font-semibold block mb-0.5">Note:</span>
                  <p className="text-[11px] leading-relaxed">{selectedPayment.note}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 cursor-pointer text-xs"
              >
                <Printer className="size-3.5" />
                Print Voucher
              </Button>
              <Button
                size="sm"
                onClick={() => setIsDetailOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
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