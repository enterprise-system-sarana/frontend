import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X, CheckCircle2, Store, User, ShoppingBag, ShieldCheck } from "lucide-react";
import { fileService } from "@/services/file/file.service";
import type { StoreResponse } from "@/types/inventory/Store";
import type { CustomerResponse } from "@/types/sales/Customer";
import type { SaleItemResponse } from "@/types/sales/Sale";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */

export interface InvoiceData {
  reference: string;
  saleDate: string;
  paymentMethod: string;
  bankName?: string | null;
  transactionNo?: string | null;
  items: SaleItemResponse[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  cashierName?: string | null;
  store?: StoreResponse | null;
  customer?: CustomerResponse | null;
  customerName?: string | null;
}

interface SaleInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceData | null;
}

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */

function fmt(val: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(val) || 0);
}

function fmtDate(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ─────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────── */

export default function SaleInvoiceModal({
  open,
  onOpenChange,
  invoice,
}: SaleInvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoice?.reference ?? ""}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', system-ui, sans-serif; background: #fff; color: #1e293b; padding: 32px; }
            .invoice-wrap { max-width: 720px; margin: 0 auto; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body><div class="invoice-wrap">${content}</div></body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  if (!invoice) return null;

  const isPaid = invoice.paymentStatus?.toUpperCase() === "PAID";
  const store = invoice.store;

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
    const rawDate = invoice?.saleDate;
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

  const computedSubtotal = (invoice.items || []).reduce((sum, item: any) => {
    const q = Number(item.quantity ?? item.qty ?? item.productQty ?? (item.serialNumberIds?.length > 0 ? item.serialNumberIds.length : null) ?? 1);
    const p = Number(item.price ?? item.unitPrice ?? 0);
    const d = Number(item.itemDiscount ?? item.discount ?? 0);
    const s = Number(item.subtotal ?? item.subTotal ?? item.total ?? 0);
    return sum + (s > 0 ? s : Math.max(p * q - d, 0));
  }, 0);

  const resolvedSubtotal = Number(
    invoice.subtotal > 0
      ? invoice.subtotal
      : computedSubtotal > 0
        ? computedSubtotal
        : invoice.grandTotal > 0
          ? invoice.grandTotal + (invoice.discount || 0)
          : 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl gap-0 overflow-hidden rounded-2xl border-border/60 p-0 shadow-2xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Invoice {invoice.reference}</DialogTitle>
        </DialogHeader>

        {/* Modal Toolbar */}
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-5 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-500" />
            <span className="text-sm font-bold text-foreground">
              Payment Successful
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="h-8 gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
            >
              <Printer className="size-3.5" />
              Print Invoice
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="size-8 rounded-lg hover:bg-muted"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Invoice Body */}
        <div className="max-h-[80vh] overflow-y-auto">
          <div ref={printRef} className="p-6 sm:p-8 space-y-6">

            {/* Header: Store + Invoice Info */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
              {/* Store Info & Logo */}
              <div className="flex items-start gap-3.5">
                <div className="size-14 shrink-0 rounded-xl bg-white border border-border/80 p-1 flex items-center justify-center shadow-xs overflow-hidden">
                  <img
                    src={logoUrl}
                    alt={store?.name ?? "Store Logo"}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== window.location.origin + "/logo.png") {
                        target.src = "/logo.png";
                      }
                    }}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-foreground leading-tight">
                    {store?.name ?? "Main Store"}
                  </h2>
                  {store?.email && (
                    <p className="text-xs text-muted-foreground">{store.email}</p>
                  )}
                  {store?.phone && (
                    <p className="text-xs text-muted-foreground">{store.phone}</p>
                  )}
                  {(store?.address1 || store?.city) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[store.address1, store.city, store.state, store.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                  {store?.receiptHeader && (
                    <p className="text-[11px] italic text-muted-foreground mt-1">
                      {store.receiptHeader}
                    </p>
                  )}
                </div>
              </div>

              {/* Invoice Badge */}
              <div className="sm:text-right shrink-0">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
                  <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                  {isPaid ? "PAID" : invoice.paymentStatus}
                </div>
                <p className="text-xl font-extrabold text-foreground font-mono">
                  #{invoice.reference}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {fmtDate(invoice.saleDate)}
                </p>
              </div>
            </div>

            {/* Cashier + Customer Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cashier */}
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="size-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Cashier
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {invoice.cashierName ?? "Staff"}
                </p>
              </div>

              {/* Customer */}
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="size-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Customer
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {invoice.customer?.name ?? invoice.customerName ?? "Walk-in Customer"}
                </p>
                {invoice.customer?.phone && (
                  <p className="text-xs text-muted-foreground">{invoice.customer.phone}</p>
                )}
                {invoice.customer?.email && (
                  <p className="text-xs text-muted-foreground">{invoice.customer.email}</p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-hidden rounded-xl border border-border/60">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider">Product</th>
                    <th className="px-4 py-2.5 text-center font-semibold uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-2.5 text-right font-semibold uppercase tracking-wider">Price</th>
                    <th className="px-4 py-2.5 text-right font-semibold uppercase tracking-wider">Disc.</th>
                    <th className="px-4 py-2.5 text-right font-semibold uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {invoice.items.map((item: any, i) => {
                    const itemQty = Number(
                      item.quantity ??
                      item.qty ??
                      item.productQty ??
                      item.count ??
                      (item.serialNumberIds && item.serialNumberIds.length > 0 ? item.serialNumberIds.length : null) ??
                      (item.serialNumbers && item.serialNumbers.length > 0 ? item.serialNumbers.length : null) ??
                      1
                    );
                    const itemPrice = Number(item.price ?? item.unitPrice ?? 0);
                    const itemDisc = Number(item.itemDiscount ?? item.discount ?? 0);
                    const rawSub = Number(item.subtotal ?? item.subTotal ?? item.total ?? 0);
                    const itemSubtotal = rawSub > 0 ? rawSub : Math.max(itemPrice * itemQty - itemDisc, 0);

                    return (
                      <tr key={i} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.productName || `Product #${item.productId}`}
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">
                          {itemQty}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                          {fmt(itemPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                          {itemDisc > 0 ? `-${fmt(itemDisc)}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-foreground tabular-nums">
                          {fmt(itemSubtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals + Payment */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              {/* Payment method */}
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">Payment:</span>{" "}
                  {invoice.paymentMethod}
                  {invoice.bankName ? ` - ${invoice.bankName}` : ""}
                </p>
                {invoice.transactionNo && (
                  <p>
                    <span className="font-semibold text-foreground">Txn #:</span>{" "}
                    {invoice.transactionNo}
                  </p>
                )}
              </div>

              {/* Totals */}
              <div className="w-full sm:w-72 rounded-xl border border-border/60 overflow-hidden text-xs">
                <div className="flex justify-between px-4 py-2.5 border-b border-border/40">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums font-medium">{fmt(resolvedSubtotal)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between px-4 py-2.5 border-b border-border/40">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="tabular-nums font-medium text-rose-500">-{fmt(invoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-3 bg-primary/5 border-b border-border/40">
                  <span className="font-bold text-foreground">Grand Total</span>
                  <span className="tabular-nums font-extrabold text-foreground text-sm">{fmt(invoice.grandTotal)}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5 border-b border-border/40">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">{fmt(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">Balance Due</span>
                  <span className={`tabular-nums font-semibold ${invoice.dueAmount > 0 ? "text-rose-500" : "text-muted-foreground"}`}>
                    {fmt(invoice.dueAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* 14-Day Warranty Policy Banner */}
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">14-Day Warranty Guarantee</p>
                  <p className="text-[11px] text-muted-foreground">
                    Valid until <span className="font-semibold text-foreground">{warrantyUntilDate}</span> • Covers hardware & manufacturer defects
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-bold tracking-wide">
                14 DAYS
              </span>
            </div>

            {/* Footer */}
            {store?.receiptFooter && (
              <p className="text-center text-[11px] italic text-muted-foreground border-t border-border/40 pt-4">
                {store.receiptFooter}
              </p>
            )}
            <p className="text-center text-[11px] text-muted-foreground">
              Thank you for your purchase!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
