import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X, ShieldCheck, Store, User, ShoppingBag } from "lucide-react";
import { fileService } from "@/services/file/file.service";
import type { StoreResponse } from "@/types/inventory/Store";

export interface BillItem {
  productName: string;
  quantity: number;
  price: number;
  itemDiscount?: number;
  subtotal: number;
  serialNumbers?: string[];
}

export interface BillData {
  reference: string;
  date: string;
  cashierName?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  store?: StoreResponse | null;
  items: BillItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  noted?: string | null;
}

export interface PrintBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billData: BillData | null;
}

function fmt(val: number) {
  return Number(val || 0).toFixed(2);
}

function money(val: number) {
  return `$${fmt(val)}`;
}

export default function PrintBillModal({
  open,
  onOpenChange,
  billData,
}: PrintBillModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!billData) return null;

  const store = billData.store;
  const logoUrl = (() => {
    if (store?.logo) {
      if (
        store.logo.startsWith("http://") ||
        store.logo.startsWith("https://") ||
        store.logo.startsWith("/") ||
        store.logo.startsWith("data:") ||
        store.logo.startsWith("blob:")
      ) {
        return store.logo;
      }
      return fileService.getPreviewUrl("store", store.logo);
    }
    return "/logo.png";
  })();

  const warrantyUntilDate = (() => {
    const rawDate = billData.date;
    const baseDate = rawDate ? new Date(rawDate) : new Date();
    if (isNaN(baseDate.getTime())) return "14 days from purchase";
    const warrantyDate = new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    try {
      return warrantyDate.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "14 days from purchase";
    }
  })();

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) {
      window.print();
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${billData.reference}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1e293b; padding: 24px; font-size: 13px; line-height: 1.4; }
            .bill-wrap { max-width: 480px; margin: 0 auto; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; }
            th { text-align: left; padding: 6px 4px; border-bottom: 2px solid #0f172a; font-size: 11px; text-transform: uppercase; }
            td { padding: 6px 4px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .font-mono { font-family: monospace; }
            .totals-row { display: flex; justify-content: space-between; padding: 3px 0; }
            .warranty-box { margin-top: 14px; padding: 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; text-align: center; font-size: 11px; }
            .thank-you { margin-top: 14px; padding: 10px; border: 1px dashed #cbd5e1; border-radius: 6px; text-align: center; font-size: 12px; }
            @media print {
              body { padding: 0; }
              @page { margin: 6mm; }
            }
          </style>
        </head>
        <body><div class="bill-wrap">${content}</div></body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 350);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
        <DialogHeader className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Printer className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                Customer Bill Preview
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground font-mono">
                #{billData.reference}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="h-8 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold px-3 cursor-pointer shadow-sm"
            >
              <Printer className="size-3.5" />
              <span>Print Bill</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Printable Area Preview */}
        <div className="max-h-[75vh] overflow-y-auto p-5 bg-slate-50 dark:bg-slate-950/40">
          <div
            ref={printRef}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs max-w-sm mx-auto text-slate-800 dark:text-slate-100 text-xs"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            {/* Store Header */}
            <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
              <img
                src={logoUrl}
                alt="Store Logo"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== window.location.origin + "/logo.png") {
                    target.src = "/logo.png";
                  }
                }}
                className="h-12 mx-auto mb-2 object-contain max-w-[160px]"
              />
              <h2 className="text-sm font-bold tracking-wide text-slate-900 dark:text-white">
                {store?.name ?? "Store POS"}
              </h2>
              {(store?.address1 || store?.city) && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {[store?.address1, store?.city].filter(Boolean).join(", ")}
                </p>
              )}
              {store?.phone && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tel: {store.phone}
                </p>
              )}
            </div>

            {/* Bill Meta Row */}
            <div className="flex justify-between py-3 border-b border-slate-200 dark:border-slate-800 text-[11px]">
              <div className="space-y-0.5">
                <p>
                  Date:{" "}
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    {billData.date}
                  </span>
                </p>
                <p>
                  Cashier:{" "}
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    {billData.cashierName || "Staff"}
                  </span>
                </p>
                <p>
                  Customer:{" "}
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    {billData.customerName || "Walk-In"}
                  </span>
                </p>
                {billData.customerPhone && (
                  <p className="text-slate-500">Tel: {billData.customerPhone}</p>
                )}
              </div>
              <div className="text-right space-y-0.5 shrink-0">
                <p>
                  Bill Ref:{" "}
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    #{billData.reference}
                  </span>
                </p>
                <p>
                  Items:{" "}
                  <span className="font-bold">
                    {billData.items.reduce((s, it) => s + (Number(it.quantity) || 1), 0)}
                  </span>
                </p>
                <p>
                  Warranty:{" "}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    14 Days
                  </span>
                </p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-xs my-2.5" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr className="border-b-2 border-slate-800 dark:border-slate-600">
                  <th className="text-left py-1.5 font-bold">Item Name</th>
                  <th className="text-right py-1.5 font-bold px-1">Qty</th>
                  <th className="text-right py-1.5 font-bold px-1">Price</th>
                  <th className="text-right py-1.5 font-bold">subTotal</th>
                </tr>
              </thead>
              <tbody>
                {billData.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-1.5 pr-1">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {item.productName}
                      </div>
                      {item.serialNumbers && item.serialNumbers.length > 0 && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          SN: {item.serialNumbers.join(", ")}
                        </div>
                      )}
                      {Number(item.itemDiscount || 0) > 0 && (
                        <span className="block text-[10px] text-slate-400">
                          Disc: -{money(Number(item.itemDiscount))}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 text-right px-1 tabular-nums font-medium text-slate-700 dark:text-slate-300">
                      {item.quantity}
                    </td>
                    <td className="py-1.5 text-right px-1 tabular-nums text-slate-700 dark:text-slate-300">
                      {fmt(item.price)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                      {fmt(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="pt-2 border-t-2 border-slate-800 dark:border-slate-600 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                <span className="font-medium tabular-nums">{money(billData.subtotal)}</span>
              </div>
              {billData.discount > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Discount:</span>
                  <span className="font-medium tabular-nums">-{money(billData.discount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white">
                <span>Total Due:</span>
                <span className="tabular-nums font-mono">{money(billData.grandTotal)}</span>
              </div>
            </div>

            {/* 14-Day Warranty Guarantee Box */}
            <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-md text-center">
              <div className="flex items-center justify-center gap-1 font-bold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>14-Day Warranty Guarantee</span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                Valid until <strong>{warrantyUntilDate}</strong>. Original bill required for claims.
              </p>
            </div>

            {/* Thank You Footer */}
            <div className="mt-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-md py-2 text-center text-slate-600 dark:text-slate-400 text-[11px]">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Thank you for your purchase!
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Customer Bill - Please come again.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
