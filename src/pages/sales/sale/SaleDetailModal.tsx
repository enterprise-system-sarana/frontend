import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSale } from "@/hooks/sales/useSale";
import { useCustomer } from "@/hooks/sales/useCustomer";
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
import { Hash, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import ReturnSaleModal from "./components/ReturnSaleModal";

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

  const sale: SaleResponse | undefined =
    data?.payload?.data ||
    data?.payload ||
    data?.data ||
    initialSale ||
    undefined;

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
  const isCompleted = statusUpper === "COMPLETED";
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

  const receiptData: PosReceiptData | null = sale
    ? {
      reference: sale.reference || `SL-${sale.id}`,
      saleDate:
        sale.saleDate || (sale.createdAt ? formatDate(sale.createdAt) : ""),
      storeName: sale.storeName || "Main Retail Store",
      customerName: sale.customerName,
      items: items.map((it) => ({
        name: it.productName || `Product #${it.productId}`,
        price: it.price,
        quantity: it.quantity,
        subtotal: it.subtotal,
        serialNumberCodes: (it.serialNumberIds || []).map(
          (sId) => serialLookup.get(sId) || `SN #${sId}`
        ),
      })),
      subtotal: sale.totalAmount || sale.grandTotal + (sale.discount || 0),
      discount: sale.discount || 0,
      grandTotal: sale.grandTotal || 0,
      paymentMethod: sale.paymentStatus || "CASH",
    }
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Sale Details</DialogTitle>
          </DialogHeader>

          {isLoading && !sale ? (
            <div className="p-8 space-y-6 animate-pulse">
              <div className="grid grid-cols-3 gap-6">
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
            <div className="flex flex-col max-h-[92vh]">
              {/* Scrollable body */}
              <div className="overflow-y-auto p-6 sm:p-8 space-y-8 text-slate-800 dark:text-slate-100">
                {/* 1. Header Information Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Customer Info */}
                  {/* <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Customer
                    </h4>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-2">
                      {sale.customerName || "Walk-in Customer"}
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mt-2 leading-relaxed">
                      <p>{matchedCustomer?.note || "3103 Trainer Avenue Peoria, IL 61602"}</p>
                      <p>Email: {matchedCustomer?.email || "customer@example.com"}</p>
                      <p>Phone: {matchedCustomer?.phone || "+1 987 471 6589"}</p>
                    </div>
                  </div> */}

                  {/* Company Info */}
                  {/* <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Company
                    </h4>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-2">
                      {sale.storeName || "DGT"}
                    </p>
                  </div> */}

                  {/* Invoice Info */}
                  {/* <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Invoice
                    </h4>
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 mt-2">
                      <p>
                        Reference:{" "}
                        <span className="font-semibold text-[#f97316]">
                          #{sale.reference || `SL0101`}
                        </span>
                      </p>
                      <p>
                        Date:{" "}
                        <span className="text-slate-700 dark:text-slate-300">
                          {sale.saleDate
                            ? formatDate(sale.saleDate)
                            : sale.createdAt
                              ? formatDate(sale.createdAt)
                              : "Dec 24, 2024"}
                        </span>
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span>Status:</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold text-white ${statusUpper === "COMPLETED"
                            ? "bg-[#10b981]"
                            : statusUpper === "PENDING"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                            }`}
                        >
                          {sale.status || "Completed"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>Payment:</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${isPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                            : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                            }`}
                        >
                          <span
                            className={`size-1.5 rounded-full inline-block ${isPaid ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                          />
                          {sale.paymentStatus || "Paid"}
                        </span>
                      </div>
                    </div>
                  </div> */}
                </div>

                {/* 2. Order Summary */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 ">
                    Order Summary
                  </h3>

                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-semibold text-[11px] uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Product</th>
                            <th className="py-3 px-4 text-right">Price($)</th>
                            <th className="py-3 px-4 text-center">Qty</th>
                            <th className="py-3 px-4 text-right">Discount($)</th>
                            <th className="py-3 px-4 text-right">Total Cost($)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {items.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="py-10 text-center text-slate-400 italic"
                              >
                                No products in this order.
                              </td>
                            </tr>
                          ) : (
                            items.map((item, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                              >
                                <td className="py-3.5 px-4">
                                  <div className="font-medium text-slate-800 dark:text-slate-100">
                                    {item.productName || `Product #${item.productId}`}
                                  </div>
                                  {item.serialNumberIds &&
                                    item.serialNumberIds.length > 0 && (
                                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                        {item.serialNumberIds.map((sId) => (
                                          <span
                                            key={sId}
                                            className="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                                          >
                                            <Hash className="size-2.5" />
                                            {serialLookup.get(sId) || `SN-${sId}`}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                </td>
                                <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-300 tabular-nums">
                                  {Number((item as any).price ?? (item as any).unitPrice ?? 0).toFixed(2)}
                                </td>
                                <td className="py-3.5 px-4 text-center font-medium text-slate-700 dark:text-slate-200 tabular-nums">
                                  {(() => {
                                    const q = Number(item.quantity ?? (item as any).qty ?? (item.serialNumberIds?.length ? item.serialNumberIds.length : null));
                                    return !isNaN(q) && q > 0 ? q : 1;
                                  })()}
                                </td>
                                <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-300 tabular-nums">
                                  {Number((item as any).itemDiscount ?? (item as any).discount ?? 0).toFixed(2)}
                                </td>
                                <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-white tabular-nums">
                                  {(() => {
                                    const rawSub = Number(item.subtotal ?? (item as any).subTotal ?? (item as any).total ?? 0);
                                    if (rawSub > 0) return rawSub.toFixed(2);
                                    const p = Number((item as any).price ?? (item as any).unitPrice ?? 0);
                                    const q = Number(item.quantity ?? (item as any).qty ?? (item.serialNumberIds?.length ? item.serialNumberIds.length : null) ?? 1);
                                    const d = Number((item as any).itemDiscount ?? (item as any).discount ?? 0);
                                    return Math.max(p * q - d, 0).toFixed(2);
                                  })()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 3. Totals Summary */}
                <div className="flex justify-end">
                  <div className="w-full sm:w-80 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="grid grid-cols-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Discount</span>
                      <span className="text-right font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                        {formatCurrency(sale.discount || 0)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">
                        Grand Total
                      </span>
                      <span className="text-right font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(sale.grandTotal || 0)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">Paid</span>
                      <span className="text-right font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(sale.paidAmount || 0)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 px-4 py-3">
                      <span className="text-slate-500 dark:text-slate-400">Due</span>
                      <span className="text-right font-medium text-rose-600 dark:text-rose-400 tabular-nums">
                        {formatCurrency(sale.dueAmount || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Sticky Action Footer */}
              <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-6 rounded-lg font-medium text-xs sm:text-sm h-9 cursor-pointer"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={() => setIsReceiptOpen(true)}
                  className="bg-[#f59e0b] hover:bg-amber-600 text-white px-6 rounded-lg font-medium text-xs sm:text-sm h-9 cursor-pointer shadow-sm"
                >
                  Print
                </Button>

                {canUpdate && isReturnable && (
                  <Button
                    type="button"
                    onClick={() => setOpenReturnModal(true)}
                    disabled={isReturning}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-5 rounded-lg font-medium text-xs sm:text-sm h-9 cursor-pointer shadow-sm"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Return
                  </Button>
                )}

                {canUpdate && isPending && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleEditClick}
                    className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-5 rounded-lg font-medium text-xs sm:text-sm h-9 cursor-pointer"
                  >
                    Edit
                  </Button>
                )}

                {canUpdate && isPending && (
                  <Button
                    type="button"
                    onClick={handleComplete}
                    disabled={isCompleting}
                    className="bg-[#10b981] hover:bg-emerald-600 text-white px-6 rounded-lg font-medium text-xs sm:text-sm h-9 cursor-pointer shadow-sm"
                  >
                    {isCompleting ? "Submitting..." : "Submit"}
                  </Button>
                )}
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
    </>
  );
};

export default SaleDetailModal;