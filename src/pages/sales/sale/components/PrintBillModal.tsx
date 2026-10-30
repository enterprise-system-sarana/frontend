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
import { useLanguage } from "@/i18n/LanguageContext";

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
  const { t, language } = useLanguage();

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
            .tabular-nums { font-family: monospace; }
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
      <DialogContent className="sm:max-w-md w-full p-0 overflow-hidden rounded-2xl bg-card shadow-2xl border border-border">
        <DialogHeader className="px-5 py-3.5 border-b border-border flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-success/10 text-success flex items-center justify-center">
              <Printer className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                Customer Bill Preview
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground tabular-nums">
                #{billData.reference}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mr-7">
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="h-8 gap-1.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg text-xs font-semibold px-3 cursor-pointer shadow-sm"
            >
              <Printer className="size-3.5" />
              <span>Print Bill</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Printable Area Preview */}
        <div className="max-h-[75vh] overflow-y-auto p-5 bg-muted/50">
          <div
            ref={printRef}
            className="bg-card border border-border rounded-xl p-5 shadow-xs max-w-sm mx-auto text-foreground text-xs"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            {/* Store Header */}
            <div className="text-center pb-4 border-b border-border">
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
              <h2 className="text-sm font-bold tracking-wide text-foreground">
                {store?.name ?? "360° Phone Shop"}
              </h2>
              {(store?.address1 || store?.city) && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {[store?.address1, store?.city].filter(Boolean).join(", ")}
                </p>
              )}
              {store?.phone && (
                <p className="text-[11px] text-muted-foreground">
                  Tel: {store.phone}
                </p>
              )}
            </div>

            {/* Bill Meta Row */}
            <div className="flex justify-between py-3 border-b border-border text-[11px]">
              <div className="space-y-0.5">
                <p>
                  {language === "km" ? "កាលបរិច្ឆេទ: " : "Date: "}
                  <span className="font-semibold text-warning-text">
                    {billData.date}
                  </span>
                </p>
                <p>
                  {language === "km" ? "អ្នកគិតប្រាក់: " : "Cashier: "}
                  <span className="font-semibold text-warning-text">
                    {billData.cashierName || "Staff"}
                  </span>
                </p>
                <p>
                  {language === "km" ? "អតិថិជន: " : "Customer: "}
                  <span className="font-semibold text-warning-text">
                    {billData.customerName || (language === "km" ? "អតិថិជនទូទៅ" : "Walk-In")}
                  </span>
                </p>
                {billData.customerPhone && (
                  <p className="text-muted-foreground">Tel: {billData.customerPhone}</p>
                )}
              </div>
              <div className="text-right space-y-0.5 shrink-0">
                <p>
                  {language === "km" ? "លេខវិក្កយបត្រ: " : "Bill Ref: "}
                  <span className="tabular-nums font-bold text-foreground">
                    #{billData.reference}
                  </span>
                </p>
                <p>
                  {language === "km" ? "ចំនួនមុខ: " : "Items: "}
                  <span className="font-bold">
                    {billData.items.reduce((s, it) => s + (Number(it.quantity) || 1), 0)}
                  </span>
                </p>
                <p>
                  {language === "km" ? "ការធានា: " : "Warranty: "}
                  <span className="font-semibold text-success">
                    {language === "km" ? "១៤ ថ្ងៃ" : "14 Days"}
                  </span>
                </p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-xs my-2.5" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-1.5 font-bold">{language === "km" ? "ឈ្មោះទំនិញ" : "Item Name"}</th>
                  <th className="text-right py-1.5 font-bold px-1">{language === "km" ? "ចំនួន" : "Qty"}</th>
                  <th className="text-right py-1.5 font-bold px-1">{language === "km" ? "តម្លៃ" : "Price"}</th>
                  <th className="text-right py-1.5 font-bold">{language === "km" ? "សរុប" : "subTotal"}</th>
                </tr>
              </thead>
              <tbody>
                {billData.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-border">
                    <td className="py-1.5 pr-1">
                      <div className="font-medium text-foreground">
                        {item.productName}
                      </div>
                      {item.serialNumbers && item.serialNumbers.length > 0 && (
                        <div className="text-[10px] text-muted-foreground tabular-nums">
                          SN: {item.serialNumbers.join(", ")}
                        </div>
                      )}
                      {Number(item.itemDiscount || 0) > 0 && (
                        <span className="block text-[10px] text-muted-foreground">
                          {language === "km" ? "ចុះ: " : "Disc: "}-{money(Number(item.itemDiscount))}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 text-right px-1 tabular-nums font-medium text-text-secondary">
                      {item.quantity}
                    </td>
                    <td className="py-1.5 text-right px-1 tabular-nums text-text-secondary">
                      {fmt(item.price)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums font-semibold text-foreground">
                      {fmt(
                        Number(item.subtotal) > 0
                          ? item.subtotal
                          : Math.max(
                              Number(item.price || 0) * Number(item.quantity || 1) -
                                Number(item.itemDiscount || 0),
                              0
                            )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="pt-2 border-t-2 border-border space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary">{language === "km" ? "សរុបបឋម:" : "Subtotal:"}</span>
                <span className="font-medium tabular-nums">{money(billData.subtotal)}</span>
              </div>
              {billData.discount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>{language === "km" ? "បញ្ចុះតម្លៃ:" : "Discount:"}</span>
                  <span className="font-medium tabular-nums">-{money(billData.discount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-border font-bold text-sm text-foreground">
                <span>{language === "km" ? "សរុបត្រូវបង់:" : "Total Due:"}</span>
                <span className="tabular-nums">{money(billData.grandTotal)}</span>
              </div>
            </div>

            {/* 14-Day Warranty Guarantee Box */}
            <div className="mt-3 p-2.5 bg-muted/50 border border-border-strong rounded-md text-center">
              <div className="flex items-center justify-center gap-1 font-bold text-[11px] text-foreground uppercase tracking-wider">
                <ShieldCheck className="size-3.5 text-success shrink-0" />
                <span>{language === "km" ? "ការធានារយៈពេល ១៤ ថ្ងៃ" : "14-Day Warranty Guarantee"}</span>
              </div>
              <p className="text-[10px] text-text-secondary mt-0.5">
                {language === "km"
                  ? `មានសុពលភាពដល់ ${warrantyUntilDate}។ សូមរក្សាទុកវិក្កយបត្រសម្រាប់ការធានា។`
                  : `Valid until ${warrantyUntilDate}. Original bill required for claims.`}
              </p>
            </div>

            {/* Thank You Footer */}
            <div className="mt-3 border border-dashed border-border-strong rounded-md py-2 text-center text-text-secondary text-[11px]">
              <p className="font-semibold text-foreground">
                {language === "km" ? "សូមអរគុណសម្រាប់ការជាវទំនិញ!" : "Thank you for your purchase!"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {language === "km" ? "វិក្កយបត្រអតិថិជន - សូមអញ្ជើញមកម្តងទៀត" : "Customer Bill - Please come again."}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
