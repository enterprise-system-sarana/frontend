import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSale } from "@/hooks/sales/useSale";
import { useCustomer } from "@/hooks/sales/useCustomer";
import { useStore } from "@/hooks/inventory/useStore";
import { useProductSerial } from "@/hooks/product/useProductSerial";
import { ROUTERS } from "@/constants/Route";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { formatDate } from "@/utils/formatDate";
import type { SaleResponse } from "@/types/sales/Sale";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Hash,
  RotateCcw,
  WalletCards,
  Printer,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Store,
  User,
  CreditCard,
  Building2,
  Phone,
  Mail,
  Receipt,
  X,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import ReturnSaleModal from "./components/ReturnSaleModal";
import PrintBillModal, { type BillData } from "./components/PrintBillModal";

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(val) || 0);
}

export interface SaleDetailModalProps {
  saleId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (sale: SaleResponse) => void;
  initialSale?: SaleResponse | null;
}

export const SaleDetailModal = ({
  saleId,
  open,
  onOpenChange,
  onEdit,
  initialSale,
}: SaleDetailModalProps) => {
  const navigate = useNavigate();
  const { Can } = usePermission();
  const canUpdate = Can(PERMISSION.SALE.UPDATE);

  const validId = saleId ?? initialSale?.id ?? 0;
  const isQueryEnabled = open && Boolean(validId && validId > 0);

  const { data, isLoading, isError } = useSale.GetSaleById(validId, {
    enabled: isQueryEnabled,
  });

  const { data: customerData } = useCustomer.useGetAllCustomer({
    page: 1,
    size: 200,
  });

  const { data: serialsData } = useProductSerial.useGetAllProductSerial(
    { page: 1, size: 1000 },
    { enabled: open }
  );

  const { mutate: completeSaleMutate, isPending: isCompleting } = useSale.Complete();
  const { mutate: returnSaleMutate, isPending: isReturning } = useSale.ReturnSale();
  
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [openReturnModal, setOpenReturnModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const sale: SaleResponse | undefined =
    data?.payload?.data ||
    data?.payload ||
    data?.data ||
    initialSale ||
    undefined;

  const storeId = sale?.storeId;
  const { data: storeData } = useStore.useGetStoreById(
    storeId || 0,
    Boolean(open && storeId && storeId > 0)
  );
  const store = storeData?.payload?.data || storeData?.payload || null;

  const customerList = customerData?.payload?.data || [];
  const matchedCustomer = useMemo(() => {
    if (!sale?.customerId) return null;
    return customerList.find((c: any) => c.id === sale.customerId) || null;
  }, [customerList, sale?.customerId]);

  const serialLookup = useMemo(() => {
    const map = new Map<number, string>();
    const list =
      (serialsData as any)?.payload?.data ??
      (serialsData as any)?.payload?.content ??
      (serialsData as any)?.payload?.items ??
      (serialsData as any)?.payload ??
      [];

    if (Array.isArray(list)) {
      for (const s of list) {
        if (s?.id) {
          map.set(
            s.id,
            s.serialNumber ?? s.serial_number ?? s.barcode ?? `SN-${s.id}`
          );
        }
      }
    }
    return map;
  }, [serialsData]);

  const handleCopyRef = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (sale?.reference) {
      navigator.clipboard.writeText(sale.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Invoice reference copied to clipboard");
    }
  };

  const handleComplete = () => {
    if (!sale?.id) return;
    completeSaleMutate(sale.id, {
      onSuccess: () => {
        toast.success("Sale marked as completed");
        onOpenChange(false);
      },
      onError: (err: any) =>
        toast.error(err?.response?.data?.message || "Failed to complete sale"),
    });
  };

  const handleEditClick = () => {
    onOpenChange(false);
    if (sale) {
      if (onEdit) {
        onEdit(sale);
      } else {
        navigate(ROUTERS.SALE_EDIT.replace(":id", String(sale.id)));
      }
    }
  };

  const items = sale?.items || [];
  const statusUpper = (sale?.status || "").toUpperCase();
  const isPending =
    statusUpper === "PENDING" ||
    statusUpper === "ACT" ||
    statusUpper === "ACTIVE";
  const isReturnable = statusUpper === "COMPLETED" || statusUpper === "PARTIAL_RETURNED";
  const isPaid = (sale?.paymentStatus || "").toUpperCase() === "PAID";

  const handleReturn = (returnData: any) => {
    if (!sale?.id) return;
    returnSaleMutate(
      { id: sale.id, payload: returnData },
      {
        onSuccess: () => {
          toast.success(`Sale #${sale.reference} return processed successfully.`);
          setOpenReturnModal(false);
          onOpenChange(false);
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ||
            (typeof err?.response?.data === "string" ? err.response.data : null) ||
            err?.message ||
            "Failed to return sale. Please try again.";
          toast.error(msg);
        },
      }
    );
  };

  const billData: BillData | null = useMemo(() => {
    if (!sale) return null;
    const formattedDate = sale.saleDate
      ? formatDate(sale.saleDate, "dateTime")
      : sale.createdAt
      ? formatDate(sale.createdAt, "dateTime")
      : formatDate(new Date(), "dateTime");

    return {
      reference: sale.reference || `SL-${sale.id}`,
      date: formattedDate,
      cashierName: (sale as any).createdByName || (sale as any).cashierName || "Staff",
      customerName: sale.customerName || matchedCustomer?.name || "Walk-in Customer",
      customerPhone: matchedCustomer?.phone || (sale as any).customerPhone || null,
      store: store || {
        id: sale.storeId || 1,
        name: sale.storeName || "Primary Store",
        address1: "",
        city: "",
        phone: "",
      },
      items: (sale.items || []).map((item) => {
        const itemPrice = Number((item as any).price ?? (item as any).unitPrice ?? 0);
        const itemQty = (() => {
          const q = Number(
            item.quantity ??
              (item as any).qty ??
              (item.serialNumberIds?.length ? item.serialNumberIds.length : null)
          );
          return !isNaN(q) && q > 0 ? q : 1;
        })();
        const itemDisc = Number(
          (item as any).itemDiscount ?? (item as any).discount ?? 0
        );
        const rawSub = Number(
          item.subtotal ?? (item as any).subTotal ?? (item as any).total ?? 0
        );
        const computedSub =
          rawSub > 0 ? rawSub : Math.max(itemPrice * itemQty - itemDisc, 0);

        return {
          productName: item.productName || `Product #${item.productId}`,
          quantity: itemQty,
          price: itemPrice,
          itemDiscount: itemDisc,
          subtotal: computedSub,
          serialNumbers: (item.serialNumberIds || []).map(
            (sId) => serialLookup.get(sId) || `SN-${sId}`
          ),
        };
      }),
      subtotal: Number(
        sale.totalAmount ??
          (Number(sale.grandTotal || 0) + Number(sale.discount || 0))
      ),
      discount: Number(sale.discount || 0),
      grandTotal: Number(sale.grandTotal || 0),
      noted: sale.noted || null,
    };
  }, [sale, matchedCustomer, store, serialLookup]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Sale Details #{sale?.reference ?? validId}</DialogTitle>
          </DialogHeader>

          {isLoading && !sale ? (
            <div className="p-8 space-y-6 animate-pulse">
              <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-28 bg-slate-100 dark:bg-slate-800 rounded-xl"
                  />
                ))}
              </div>
              <div className="h-52 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              <div className="flex justify-end">
                <div className="h-32 w-80 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              </div>
            </div>
          ) : isError && !sale ? (
            <div className="p-16 text-center">
              <div className="mx-auto size-14 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Failed to load sale details
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Please try again or contact support.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="mt-5 rounded-lg"
              >
                Close
              </Button>
            </div>
          ) : sale ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* 1. Modal Top Banner Header */}
              <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-xs">
                    <Receipt className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Sale Order Details
                      </h2>
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        #{sale.reference}
                        <button
                          type="button"
                          onClick={handleCopyRef}
                          className="hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer ml-0.5 transition"
                          title="Copy Reference"
                        >
                          {copied ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </span>

                      {/* Sale status badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white ${
                          statusUpper === "COMPLETED"
                            ? "bg-emerald-600"
                            : statusUpper === "PENDING"
                            ? "bg-amber-500"
                            : statusUpper === "RETURNED" || statusUpper === "CANCELLED"
                            ? "bg-rose-500"
                            : "bg-blue-600"
                        }`}
                      >
                        <span className="size-1.5 rounded-full bg-white inline-block animate-pulse" />
                        {sale.status || "Completed"}
                      </span>

                      {/* Payment status badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                            : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            isPaid ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        {isPaid
                          ? "Paid in Full"
                          : `Due: ${formatCurrency(sale.dueAmount || 0)}`}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Recorded on{" "}
                      {sale.saleDate
                        ? formatDate(sale.saleDate, "dateTime")
                        : sale.createdAt
                        ? formatDate(sale.createdAt, "dateTime")
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-800 dark:text-slate-100 flex-1">
                {/* 2. Three Information Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Customer Info Card */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <User className="size-3.5 text-blue-500" />
                          Customer Info
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                          {matchedCustomer?.type || "Retail"}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {sale.customerName || matchedCustomer?.name || "Walk-in Customer"}
                      </p>
                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 mt-2.5">
                        <p className="flex items-center gap-1.5">
                          <Phone className="size-3 text-slate-400 shrink-0" />
                          <span>
                            {matchedCustomer?.phone ||
                              (sale as any).customerPhone ||
                              "No phone provided"}
                          </span>
                        </p>
                        {matchedCustomer?.email && (
                          <p className="flex items-center gap-1.5">
                            <Mail className="size-3 text-slate-400 shrink-0" />
                            <span className="truncate">{matchedCustomer.email}</span>
                          </p>
                        )}
                        {(matchedCustomer?.address || matchedCustomer?.note) && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                            {matchedCustomer?.address || matchedCustomer?.note}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Store & Terminal Card */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Store className="size-3.5 text-amber-500" />
                          Store & Branch
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
                          Branch
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {store?.name || sale.storeName || "Primary Store"}
                      </p>
                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 mt-2.5">
                        <p className="flex items-center gap-1.5">
                          <Building2 className="size-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {[store?.address1, store?.city].filter(Boolean).join(", ") ||
                              "Main Branch"}
                          </span>
                        </p>
                        {store?.phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="size-3 text-slate-400 shrink-0" />
                            <span>{store.phone}</span>
                          </p>
                        )}
                        <p className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <User className="size-3 text-slate-400 shrink-0" />
                          <span>
                            Cashier:{" "}
                            <strong className="font-semibold text-slate-800 dark:text-slate-200">
                              {(sale as any).createdByName ||
                                (sale as any).cashierName ||
                                "Staff"}
                            </strong>
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment & Billing Card */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <CreditCard className="size-3.5 text-emerald-500" />
                          Payment & Billing
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                          {sale.paymentStatus || "PAID"}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Method / Bank:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {sale.bankName ||
                              (sale.paidAmount > 0 ? "Cash / Standard" : "Unpaid")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Register:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {sale.cashRegisterNo
                              ? `Reg #${sale.cashRegisterNo}`
                              : "Standard POS"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 dark:border-slate-700/60">
                          <span className="text-slate-500 font-medium">Grand Total:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(sale.grandTotal || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Order Summary Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Package className="size-4 text-amber-500" />
                      <span>Order Items ({items.length})</span>
                    </h3>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="py-3 px-4 w-12 text-center">#</th>
                            <th className="py-3 px-4">Product</th>
                            <th className="py-3 px-4 text-right">Price</th>
                            <th className="py-3 px-4 text-center">Qty</th>
                            <th className="py-3 px-4 text-right">Discount</th>
                            <th className="py-3 px-4 text-right">Total Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {items.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="py-12 text-center text-slate-400 italic"
                              >
                                No products found in this order.
                              </td>
                            </tr>
                          ) : (
                            items.map((item, idx) => {
                              const price = Number(
                                (item as any).price ?? (item as any).unitPrice ?? 0
                              );
                              const qty = (() => {
                                const q = Number(
                                  item.quantity ??
                                    (item as any).qty ??
                                    (item.serialNumberIds?.length
                                      ? item.serialNumberIds.length
                                      : null)
                                );
                                return !isNaN(q) && q > 0 ? q : 1;
                              })();
                              const itemDiscount = Number(
                                (item as any).itemDiscount ?? (item as any).discount ?? 0
                              );
                              const total = (() => {
                                const rawSub = Number(
                                  item.subtotal ??
                                    (item as any).subTotal ??
                                    (item as any).total ??
                                    0
                                );
                                if (rawSub > 0) return rawSub;
                                return Math.max(price * qty - itemDiscount, 0);
                              })();

                              return (
                                <tr
                                  key={item.id ?? idx}
                                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                  <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs">
                                    {idx + 1}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="font-semibold text-slate-800 dark:text-slate-100">
                                      {item.productName || `Product #${item.productId}`}
                                    </div>
                                    {item.serialNumberIds &&
                                      item.serialNumberIds.length > 0 && (
                                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                          {item.serialNumberIds.map((sId) => (
                                            <span
                                              key={sId}
                                              className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                                            >
                                              <Hash className="size-2.5 text-slate-400" />
                                              {serialLookup.get(sId) || `SN-${sId}`}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    {Number(item.returnedQuantity || 0) > 0 && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 mt-1">
                                        <RotateCcw className="size-2.5" />
                                        Returned: {item.returnedQuantity}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-300 tabular-nums">
                                    {formatCurrency(price)}
                                  </td>
                                  <td className="py-3.5 px-4 text-center font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs">
                                      {qty}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-right tabular-nums text-slate-600 dark:text-slate-300">
                                    {itemDiscount > 0 ? (
                                      <span className="text-rose-600 dark:text-rose-400 font-medium">
                                        -{formatCurrency(itemDiscount)}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">$0.00</span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                                    {formatCurrency(total)}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 4. Notes & Totals Breakdown Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Left: Notes & Metadata */}
                  <div className="space-y-4">
                    {sale.noted ? (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                          <FileText className="size-3.5 text-slate-400" />
                          <span>Sale Note / Remark</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {sale.noted}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                        <FileText className="size-4 text-slate-300" />
                        <span>No additional notes recorded for this sale.</span>
                      </div>
                    )}

                    {/* Quick stats badges */}
                    <div className="flex items-center gap-3 text-xs">
                      <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                        <span className="text-slate-500 dark:text-slate-400">Total Items: </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {items.length}
                        </span>
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                        <span className="text-slate-500 dark:text-slate-400">Total Units: </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Financial Totals Box */}
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 shadow-xs">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                        {formatCurrency(
                          sale.totalAmount ||
                            (Number(sale.grandTotal || 0) + Number(sale.discount || 0))
                        )}
                      </span>
                    </div>

                    {Number(sale.discount || 0) > 0 && (
                      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-rose-600 dark:text-rose-400">
                        <span className="font-medium">Discount</span>
                        <span className="font-semibold tabular-nums">
                          -{formatCurrency(sale.discount || 0)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Grand Total
                      </span>
                      <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(sale.grandTotal || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Paid Amount</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(sale.paidAmount || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-slate-500 dark:text-slate-400">Due Balance</span>
                      <span
                        className={`font-bold tabular-nums ${
                          Number(sale.dueAmount || 0) > 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {formatCurrency(sale.dueAmount || 0)}
                      </span>
                    </div>

                    {Number(sale.returnAmount || 0) > 0 && (
                      <div className="flex justify-between items-center px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">
                        <span className="font-medium">Refunded / Returned</span>
                        <span className="font-semibold tabular-nums">
                          {formatCurrency(sale.returnAmount || 0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. Sticky Action Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm">
                {/* Left: Print Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => setIsReceiptOpen(true)}
                    className="gap-2 bg-[#f59e0b] hover:bg-amber-600 text-white px-4 rounded-xl font-medium text-xs sm:text-sm h-9 cursor-pointer shadow-xs transition"
                  >
                    <Printer className="size-4" />
                    <span>Print Bill</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (sale?.id) {
                        window.open(
                          ROUTERS.SALE_INVOICE.replace(":id", String(sale.id)),
                          "_blank"
                        );
                      }
                    }}
                    className="gap-1.5 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 rounded-xl font-medium text-xs sm:text-sm h-9 cursor-pointer"
                    title="Open full A4 invoice in new window"
                  >
                    <FileText className="size-3.5 text-slate-500" />
                    <span>A4 Invoice</span>
                    <ExternalLink className="size-3 text-slate-400 ml-0.5" />
                  </Button>
                </div>

                {/* Right: Management Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 rounded-xl font-medium text-xs sm:text-sm h-9 cursor-pointer"
                  >
                    Close
                  </Button>

                  {canUpdate &&
                    (sale.paymentStatus !== "PAID" ||
                      (sale.dueAmount && sale.dueAmount > 0)) && (
                      <Button
                        type="button"
                        onClick={() => {
                          onOpenChange(false);
                          navigate(
                            ROUTERS.SALE_COMPLETE.replace(":id", sale.id.toString())
                          );
                        }}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl font-medium text-xs sm:text-sm h-9 cursor-pointer shadow-xs"
                      >
                        <WalletCards className="size-4" />
                        Payment / Settle
                      </Button>
                    )}

                  {canUpdate && isReturnable && (
                    <Button
                      type="button"
                      onClick={() => setOpenReturnModal(true)}
                      disabled={isReturning}
                      className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 rounded-xl font-medium text-xs sm:text-sm h-9 cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="size-4" />
                      Return
                    </Button>
                  )}

                  {canUpdate && isPending && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleEditClick}
                      className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 rounded-xl font-medium text-xs sm:text-sm h-9 cursor-pointer"
                    >
                      Edit
                    </Button>
                  )}

                  {canUpdate && isPending && (
                    <Button
                      type="button"
                      onClick={handleComplete}
                      disabled={isCompleting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 rounded-xl font-medium text-xs sm:text-sm h-9 cursor-pointer shadow-xs"
                    >
                      {isCompleting ? "Submitting..." : "Complete Sale"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Return Sale Confirmation Modal */}
      {sale && openReturnModal && (
        <ReturnSaleModal
          open={openReturnModal}
          onOpenChange={setOpenReturnModal}
          sale={sale}
          saleId={sale.id}
          saleReference={sale.reference}
          grandTotal={sale.grandTotal}
          onConfirm={handleReturn}
          isPending={isReturning}
        />
      )}

      {/* Print Bill Receipt Modal */}
      {sale && billData && (
        <PrintBillModal
          open={isReceiptOpen}
          onOpenChange={setIsReceiptOpen}
          billData={billData}
        />
      )}
    </>
  );
};

export default SaleDetailModal;