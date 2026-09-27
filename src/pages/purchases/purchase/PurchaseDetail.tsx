import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePurchase } from "@/hooks/purchases/usePurchase";
import { useSupplier } from "@/hooks/purchases/useSupplier";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/formatDate";
import { ROUTERS } from "@/constants/Route";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Hash } from "lucide-react";
import type { PurchaseResponse } from "@/types/purchases/Purchase";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

interface PurchaseDetailModalProps {
  purchaseId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (purchase: PurchaseResponse) => void;
  initialPurchase?: PurchaseResponse | null;
}

export const PurchaseDetailModal = ({
  purchaseId,
  open,
  onOpenChange,
  onEdit,
  initialPurchase,
}: PurchaseDetailModalProps) => {
  const navigate = useNavigate();

  const validId = purchaseId ?? initialPurchase?.id ?? 0;
  const { data, isLoading, isError } = usePurchase.GetPurchaseById(validId, {
    enabled: open && Boolean(validId && validId > 0),
  });

  const { data: supplierData } = useSupplier.useGetAllSupplier({
    page: 1,
    size: 200,
  });

  const purchase: PurchaseResponse | undefined =
    data?.payload?.data ??
    data?.payload ??
    data?.data ??
    initialPurchase ??
    undefined;

  const supplierList = supplierData?.payload?.data || [];
  const matchedSupplier = useMemo(() => {
    if (!purchase?.supplierId) return null;
    return supplierList.find((s: any) => s.id === purchase.supplierId) || null;
  }, [supplierList, purchase?.supplierId]);

  const handleEditClick = () => {
    onOpenChange(false);
    if (purchase) {
      if (onEdit) {
        onEdit(purchase);
      } else {
        navigate(ROUTERS.PURCHASE_EDIT.replace(":id", String(purchase.id)));
      }
    }
  };

  const items = purchase?.items || [];
  const statusUpper = (purchase?.status || "").toUpperCase();
  const isPaid = (purchase?.paymentStatus || "").toUpperCase() === "PAID";

  // Consolidate items with same productId / productName and collect serial numbers
  const groupedItems = useMemo(() => {
    const map = new Map<
      number | string,
      {
        productId: number;
        productName: string;
        costPrice: number;
        quantity: number;
        subtotal: number;
        serials: string[];
      }
    >();

    for (const item of items) {
      const key = item.productId || item.productName;
      const itemSerials: string[] = [];
      if (Array.isArray(item.serialNumbers)) {
        for (const s of item.serialNumbers) {
          const val =
            typeof s === "string"
              ? s
              : s?.barcode || (s as any)?.serialNumber || (s?.id ? `SN-${s.id}` : "");
          if (val) itemSerials.push(val);
        }
      }

      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.quantity += Number(item.quantity || 0);
        existing.subtotal += Number(item.subtotal || 0);
        existing.serials.push(...itemSerials);
      } else {
        map.set(key, {
          productId: item.productId,
          productName: item.productName,
          costPrice: item.costPrice,
          quantity: Number(item.quantity || 0),
          subtotal: Number(item.subtotal || 0),
          serials: itemSerials,
        });
      }
    }

    return Array.from(map.values());
  }, [items]);

  const handlePrint = () => {
    if (!purchase) return;

    const itemsRows = groupedItems
      .map((item, idx) => {
        const serialsHtml =
          item.serials && item.serials.length > 0
            ? `<div style="font-family: monospace; font-size: 11px; color: #334155; line-height: 1.5; margin-top: 2px;">
                ${item.serials.map((s, sIdx) => `<div>${sIdx + 1}. ${s}</div>`).join("")}
               </div>`
            : `<span style="color: #94a3b8;">-</span>`;

        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 10px; color: #64748b; font-family: monospace; font-size: 11px; vertical-align: top;">${idx + 1}</td>
            <td style="padding: 8px 10px; font-weight: 600; color: #0f172a; font-size: 12px; vertical-align: top;">
              ${item.productName || `Product #${item.productId}`}
            </td>
            <td style="padding: 8px 10px; vertical-align: top;">${serialsHtml}</td>
            <td style="padding: 8px 10px; text-align: center; font-weight: 600; color: #1e293b; font-size: 12px; vertical-align: top;">${item.quantity}</td>
            <td style="padding: 8px 10px; text-align: right; color: #334155; font-size: 12px; vertical-align: top;">$${Number(item.costPrice || 0).toFixed(2)}</td>
            <td style="padding: 8px 10px; text-align: right; font-weight: 700; color: #0f172a; font-size: 12px; vertical-align: top;">$${Number(item.subtotal || 0).toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Purchase Invoice - ${purchase.referenceNo}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 14mm 15mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #1e293b;
              background: #ffffff;
              margin: 0;
              padding: 0;
              font-size: 12px;
              line-height: 1.5;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding-bottom: 14px;
              border-bottom: 2px solid #0f172a;
              margin-bottom: 20px;
            }
            .title {
              font-size: 22px;
              font-weight: 800;
              color: #0f172a;
              margin: 0;
              letter-spacing: -0.5px;
            }
            .ref-no {
              font-size: 12px;
              color: #64748b;
              margin-top: 4px;
            }
            .company-info {
              text-align: right;
              font-size: 11px;
              color: #475569;
              line-height: 1.4;
            }
            .company-name {
              font-size: 15px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 2px;
            }
            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 24px;
            }
            .info-col {
              width: 48%;
            }
            .info-col-title {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #64748b;
              margin-bottom: 6px;
            }
            .info-item {
              margin-bottom: 3px;
              font-size: 12px;
              color: #334155;
            }
            .info-item strong {
              color: #0f172a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 12px;
            }
            th {
              border-bottom: 2px solid #0f172a;
              padding: 8px 10px;
              text-align: left;
              font-weight: 700;
              font-size: 11px;
              text-transform: uppercase;
              color: #0f172a;
            }
            td {
              padding: 8px 10px;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: top;
            }
            .totals-section {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 30px;
            }
            .totals-table {
              width: 260px;
              font-size: 12px;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              color: #475569;
            }
            .totals-row.grand {
              border-top: 2px solid #0f172a;
              border-bottom: 2px solid #0f172a;
              padding: 8px 0;
              margin: 4px 0;
              font-weight: 800;
              font-size: 14px;
              color: #0f172a;
            }
            .footer {
              border-top: 1px solid #e2e8f0;
              padding-top: 14px;
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">PURCHASE INVOICE</h1>
              <div class="ref-no">Invoice #${purchase.referenceNo}</div>
            </div>
            <div class="company-info">
              <div class="company-name">${purchase.storeName || "Sarana Restaurant System"}</div>
              <div>123 Business Street, Phnom Penh, Cambodia</div>
              <div>Tel: +855 12 345 678</div>
            </div>
          </div>

          <div class="info-section">
            <div class="info-col">
              <div class="info-col-title">BILL FROM (SUPPLIER)</div>
              <div class="info-item"><strong>${purchase.supplierName || "N/A"}</strong></div>
              ${matchedSupplier?.phone ? `<div class="info-item">Phone: ${matchedSupplier.phone}</div>` : ""}
              ${matchedSupplier?.email ? `<div class="info-item">Email: ${matchedSupplier.email}</div>` : ""}
              ${matchedSupplier?.note ? `<div class="info-item">Address: ${matchedSupplier.note}</div>` : ""}
            </div>

            <div class="info-col" style="text-align: right;">
              <div class="info-col-title">DETAILS</div>
              <div class="info-item"><strong>Date:</strong> ${purchase.purchaseDate ? formatDate(purchase.purchaseDate, "fullDate") : "-"}</div>
              <div class="info-item"><strong>Store:</strong> ${purchase.storeName || "N/A"}</div>
              ${purchase.bankName ? `<div class="info-item"><strong>Bank:</strong> ${purchase.bankName}</div>` : ""}
              <div class="info-item"><strong>Status:</strong> ${purchase.status || "COMPLETED"}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th>Product</th>
                <th>Serial Number</th>
                <th style="text-align: center; width: 60px;">Qty</th>
                <th style="text-align: right; width: 100px;">Unit Price</th>
                <th style="text-align: right; width: 110px;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals-section">
            <div class="totals-table">
              <div class="totals-row">
                <span>Subtotal</span>
                <span>$${Number(purchase.grandTotal || 0).toFixed(2)}</span>
              </div>
              <div class="totals-row">
                <span>Discount</span>
                <span>- $${Number(purchase.discount || 0).toFixed(2)}</span>
              </div>
              <div class="totals-row grand">
                <span>Grand Total</span>
                <span>$${Number(purchase.grandTotal || 0).toFixed(2)}</span>
              </div>
              <div class="totals-row">
                <span>Paid Amount</span>
                <span style="color: #16a34a; font-weight: 600;">$${Number(purchase.paidAmount || 0).toFixed(2)}</span>
              </div>
              <div class="totals-row">
                <span>Balance Due</span>
                <span style="color: ${Number(purchase.dueAmount || 0) > 0 ? "#dc2626" : "#475569"}; font-weight: 600;">$${Number(purchase.dueAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <div>Thank you for your business. This invoice was generated by ${purchase.storeName || "Sarana Restaurant System"}.</div>
            <div style="margin-top: 3px;">Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
          </div>
        </body>
      </html>
    `;

    // Remove any previous print iframe to avoid state issues
    const oldIframe = document.getElementById("purchase-print-frame");
    if (oldIframe) {
      oldIframe.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = "purchase-print-frame";
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "1000px";
    iframe.style.height = "1000px";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(invoiceHtml);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.error("Print to machine failed:", err);
        }
      }, 350);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] p-0 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Purchase Details</DialogTitle>
        </DialogHeader>

        {isLoading && !purchase ? (
          <div className="p-8 space-y-4 animate-pulse">
            <div className="grid grid-cols-3 gap-6">
              <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-lg mt-6" />
          </div>
        ) : isError && !purchase ? (
          <div className="p-12 text-center text-muted-foreground">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Failed to load purchase details
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="mt-4"
            >
              Close
            </Button>
          </div>
        ) : purchase ? (
          <div className="p-6 sm:p-8 space-y-6 text-slate-800 dark:text-slate-100">
            {/* 1. Header Information Section (3 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              {/* Supplier Info */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Supplier Info
                </h4>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                  {purchase.supplierName || "Supplier Name"}
                </p>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 mt-1 leading-relaxed">
                  <p>
                    {matchedSupplier?.note || "3103 Trainer Avenue Peoria, IL 61602"}
                  </p>
                  <p>
                    Email: {matchedSupplier?.email || "supplier@example.com"}
                  </p>
                  <p>
                    Phone: {matchedSupplier?.phone || "+1 987 471 6589"}
                  </p>
                </div>
              </div>

              {/* Company Info */}
              {/* <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Company Info
                </h4>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                  {purchase.storeName || "DGT"}
                </p>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 mt-1 leading-relaxed">
                  <p>2077 Chicago Avenue Orosi, CA 93647</p>
                  <p>Email: admin@example.com</p>
                  <p>Phone: +1 893 174 0385</p>
                </div>
              </div> */}

              {/* Invoice Info */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Invoice Info
                </h4>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 mt-1.5">
                  <p>
                    Reference:{" "}
                    <span className="font-semibold text-[#f97316]">
                      {purchase.referenceNo || `PO0101`}
                    </span>
                  </p>
                  <p>
                    Date:{" "}
                    <span className="text-slate-700 dark:text-slate-300">
                      {purchase.purchaseDate
                        ? formatDate(purchase.purchaseDate)
                        : "Dec 24, 2024"}
                    </span>
                  </p>
                  {purchase.note && (
                    <div className="pt-1">
                      {(() => {
                        const match = purchase.note.match(/\[Importance:\s*(LOW|NORMAL|HIGH|URGENT)\]/i);
                        const cleanNote = purchase.note.replace(/\[Importance:\s*(LOW|NORMAL|HIGH|URGENT)\]\s*/gi, "").trim();
                        const imp = match ? match[1].toUpperCase() : null;
                        return (
                          <div className="space-y-1">
                            {imp && (
                              <p className="flex items-center gap-1.5">
                                <span>Importance:</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  imp === "URGENT"
                                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25"
                                    : imp === "HIGH"
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                                    : imp === "LOW"
                                    ? "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/25"
                                    : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25"
                                }`}>
                                  {imp} Priority
                                </span>
                              </p>
                            )}
                            {cleanNote && (
                              <p className="text-slate-600 dark:text-slate-400">
                                Note: <span className="italic">{cleanNote}</span>
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {/* <div className="flex items-center gap-1.5">
                    <span>Status:</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold text-white ${statusUpper === "COMPLETED"
                        ? "bg-[#10b981]"
                        : statusUpper === "PENDING"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                        }`}
                    >
                      {purchase.status || "Completed"}
                    </span>
                  </div> */}
                  {/* <div className="flex items-center gap-1.5">
                    <span>Payment Status:</span>
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
                      {purchase.paymentStatus || "Paid"}
                    </span>
                  </div> */}
                </div>
              </div>
            </div>

            {/* 2. Order Summary Title */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
                Order Summary
              </h3>

              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#eef2f6] dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                    <tr>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Serial Number</th>
                      <th className="py-2.5 px-3 text-right">Cost Price($)</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Total Cost($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {groupedItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-6 text-center text-slate-400 italic"
                        >
                          No products in this purchase.
                        </td>
                      </tr>
                    ) : (
                      groupedItems.map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors align-top"
                        >
                          <td className="py-3 px-3">
                            <div className="font-medium text-slate-800 dark:text-slate-100">
                              {item.productName || `Product #${item.productId}`}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono text-xs">
                            {item.serials && item.serials.length > 0 ? (
                              <div className="space-y-0.5">
                                {item.serials.map((sn, sIdx) => (
                                  <div key={sIdx} className="leading-relaxed">
                                    {sn}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-sans">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300">
                            {Number(item.costPrice || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-center font-medium text-slate-700 dark:text-slate-200">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-900 dark:text-white">
                            {Number(item.subtotal || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Totals Summary Table (Bottom Right) */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-80 border border-slate-200 dark:border-slate-800 text-xs divide-y divide-slate-200 dark:divide-slate-800">
                <div className="grid grid-cols-2 p-2.5">
                  <span className="text-slate-600 dark:text-slate-400">
                    Discount
                  </span>
                  <span className="text-right font-medium text-slate-800 dark:text-slate-200">
                    {formatCurrency(purchase.discount || 0)}
                  </span>
                </div>
                <div className="grid grid-cols-2 p-2.5">
                  <span className="text-slate-600 dark:text-slate-400">
                    Grand Total
                  </span>
                  <span className="text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrency(purchase.grandTotal || 0)}
                  </span>
                </div>
                <div className="grid grid-cols-2 p-2.5">
                  <span className="text-slate-600 dark:text-slate-400">
                    Paid
                  </span>
                  <span className="text-right font-medium text-slate-800 dark:text-slate-200">
                    {formatCurrency(purchase.paidAmount || 0)}
                  </span>
                </div>
                <div className="grid grid-cols-2 p-2.5">
                  <span className="text-slate-600 dark:text-slate-400">
                    Due
                  </span>
                  <span className="text-right font-medium text-slate-800 dark:text-slate-200">
                    {formatCurrency(purchase.dueAmount || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Action Buttons (Cancel / Print / Submit) */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="bg-[#1e293b] hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-medium text-xs sm:text-sm h-9 cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handlePrint}
                className="bg-[#f59e0b] hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium text-xs sm:text-sm h-9 cursor-pointer"
              >
                Print
              </Button>

              {onEdit && (
                <Button
                  type="button"
                  onClick={handleEditClick}
                  className="bg-[#10b981] hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium text-xs sm:text-sm h-9 cursor-pointer"
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDetailModal;

