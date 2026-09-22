import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

export interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  serialNumberCodes?: string[];
}

export interface PosReceiptData {
  reference: string;
  saleDate: string;
  storeName?: string;
  storePhone?: string;
  storeAddress?: string;
  customerName?: string;
  cashierName?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paymentMethod?: string;
}

interface PosReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PosReceiptData | null;
}

export default function PosReceiptModal({
  isOpen,
  onClose,
  data,
}: PosReceiptModalProps) {
  if (!data) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(val) || 0);
  };

  const handlePrint = () => {
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${data.reference}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 4mm;
            }
            body {
              font-family: 'Courier New', Courier, monospace, sans-serif;
              color: #000;
              margin: 0;
              padding: 6px;
              font-size: 12px;
              line-height: 1.4;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .meta-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 8px 0; }
            th { border-bottom: 1px dashed #000; padding: 3px 0; text-align: left; }
            td { padding: 4px 0; vertical-align: top; }
            .total-row { display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px; }
            .grand-total { font-weight: bold; font-size: 14px; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0; margin-top: 6px; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <div class="font-bold" style="font-size: 15px;">${data.storeName || "360 POS SYSTEM"}</div>
            ${data.storeAddress ? `<div>${data.storeAddress}</div>` : ""}
            ${data.storePhone ? `<div>Tel: ${data.storePhone}</div>` : ""}
            <div class="font-bold" style="margin-top: 4px;">SALES RECEIPT</div>
          </div>

          <div class="divider"></div>

          <div class="meta-row"><span>Invoice:</span><span class="font-bold">${data.reference}</span></div>
          <div class="meta-row"><span>Date:</span><span>${data.saleDate}</span></div>
          <div class="meta-row"><span>Customer:</span><span>${data.customerName || "Walk-in Customer"}</span></div>
          ${data.cashierName ? `<div class="meta-row"><span>Cashier:</span><span>${data.cashierName}</span></div>` : ""}

          <div class="divider"></div>

          <table>
            <thead>
              <tr>
                <th>ITEM</th>
                <th style="text-align: center; width: 30px;">QTY</th>
                <th style="text-align: right; width: 50px;">PRICE</th>
                <th style="text-align: right; width: 55px;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map((item) => `
                <tr>
                  <td>
                    <div class="font-bold">${item.name}</div>
                    ${item.serialNumberCodes && item.serialNumberCodes.length > 0
        ? `<div style="font-size: 9px;">S/N: ${item.serialNumberCodes.join(", ")}</div>`
        : ""
      }
                  </td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">${formatCurrency(item.price)}</td>
                  <td style="text-align: right;" class="font-bold">${formatCurrency(item.subtotal)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="divider"></div>

          <div class="total-row"><span>Subtotal:</span><span>${formatCurrency(data.subtotal)}</span></div>
          ${data.discount > 0 ? `<div class="total-row"><span>Discount:</span><span>-${formatCurrency(data.discount)}</span></div>` : ""}
          <div class="total-row grand-total"><span>Grand Total:</span><span>${formatCurrency(data.grandTotal)}</span></div>
          ${data.paymentMethod ? `<div class="total-row" style="font-size: 11px;"><span>Payment:</span><span>${data.paymentMethod}</span></div>` : ""}

          <div class="divider"></div>

          <div class="text-center" style="font-size: 10px; margin-top: 10px;">
            <div>Thank you for shopping with us!</div>
            <div>Please keep this receipt for return or exchange</div>
          </div>
        </body>
      </html>
    `;

    const oldIframe = document.getElementById("pos-receipt-print-frame");
    if (oldIframe) {
      oldIframe.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = "pos-receipt-print-frame";
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "600px";
    iframe.style.height = "600px";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(receiptHtml);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.error("Print receipt failed:", err);
        }
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden bg-white dark:bg-slate-900 border shadow-2xl rounded-2xl">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Printer className="size-4 text-teal-600" />
            <span>Sales Receipt</span>
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </DialogHeader>

        {/* Printable Area */}
        <div className="p-6 max-h-[75vh] overflow-y-auto text-slate-800 dark:text-slate-200 text-xs font-mono select-text print:p-0 print:m-0">
          <div className="text-center space-y-1 mb-4 border-b pb-4">
            <h2 className="text-base font-bold tracking-wider uppercase text-slate-900 dark:text-white">
              {data.storeName || "360 POS SYSTEM"}
            </h2>
            {data.storeAddress && (
              <p className="text-[11px] text-muted-foreground">{data.storeAddress}</p>
            )}
            {data.storePhone && (
              <p className="text-[11px] text-muted-foreground">Tel: {data.storePhone}</p>
            )}
            <div className="inline-block mt-1 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-[10px]">
              RECEIPT
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-1 mb-4 pb-3 border-b text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice No:</span>
              <span className="font-semibold">{data.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>{data.saleDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer:</span>
              <span className="font-medium">{data.customerName || "Walk-in Customer"}</span>
            </div>
            {data.cashierName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cashier:</span>
                <span>{data.cashierName}</span>
              </div>
            )}
          </div>

          {/* Line items table */}
          <div className="mb-4 border-b pb-3">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-[10px] text-muted-foreground font-semibold">
                  <th className="pb-1">ITEM</th>
                  <th className="pb-1 text-center">QTY</th>
                  <th className="pb-1 text-right">PRICE</th>
                  <th className="pb-1 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed">
                {data.items.map((item, idx) => (
                  <tr key={idx} className="py-1.5">
                    <td className="py-1.5 pr-2 font-medium">
                      <div>{item.name}</div>
                      {item.serialNumberCodes && item.serialNumberCodes.length > 0 && (
                        <div className="text-[9px] text-muted-foreground">
                          S/N: {item.serialNumberCodes.join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 text-center">{item.quantity}</td>
                    <td className="py-1.5 text-right">{formatCurrency(item.price)}</td>
                    <td className="py-1.5 text-right font-semibold">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 mb-6 text-[12px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(data.subtotal)}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-{formatCurrency(data.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-2 border-t text-slate-900 dark:text-white">
              <span>Grand Total:</span>
              <span className="text-teal-600 dark:text-teal-400">
                {formatCurrency(data.grandTotal)}
              </span>
            </div>
            {data.paymentMethod && (
              <div className="flex justify-between text-[11px] pt-1 text-muted-foreground">
                <span>Payment Method:</span>
                <span className="font-semibold uppercase text-slate-700 dark:text-slate-300">
                  {data.paymentMethod}
                </span>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="text-center pt-2 border-t border-dashed text-[11px] text-muted-foreground space-y-1">
            <p className="font-medium text-slate-700 dark:text-slate-300">
              Thank you for shopping with us!
            </p>
            <p className="text-[10px]">Please keep this receipt for return or exchange</p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-5 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3 shrink-0 rounded-b-2xl">
          <div className="text-xs text-muted-foreground truncate">
            <span className="font-semibold text-foreground">{data.reference}</span> •{" "}
            <span className="font-bold text-primary">{formatCurrency(data.grandTotal)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onClose}
              className="h-9 px-4 text-xs font-medium rounded-xl border-border/60 hover:bg-muted transition cursor-pointer"
            >
              Close
            </Button>
            <Button
              type="button"
              size="default"
              onClick={handlePrint}
              className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <Printer className="size-3.5" />
              Print Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
