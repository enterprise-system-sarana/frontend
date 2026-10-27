import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSale } from "@/hooks/sales/useSale";
import { useStore } from "@/hooks/inventory/useStore";
import { useCustomer } from "@/hooks/sales/useCustomer";
import { useAuth } from "@/store/useAuth";
import { ROUTERS } from "@/constants/Route";
import { ShieldCheck, Printer, ArrowLeft, Receipt, FileText } from "lucide-react";
import { fileService } from "@/services/file/file.service";

const WARRANTY_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

/* ─── formatting helpers ─── */
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const fmt = (v: number) => num(v).toFixed(2);
const money = (v: number) => `$${fmt(v)}`;

function parseDate(d?: string | null) {
  const date = d ? new Date(d) : new Date();
  return isNaN(date.getTime()) ? null : date;
}

function fmtDateTime(d?: string | null) {
  const date = parseDate(d);
  if (!date) return "";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function fmtDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/* ─── line item helpers (API payload shapes vary) ─── */
const pick = (item: any, keys: string[]) => {
  for (const k of keys) {
    const v = num(item?.[k]);
    if (v > 0) return v;
  }
  return 0;
};

export function getItemQty(item: any): number {
  if (!item) return 1;
  const direct = pick(item, ["quantity", "qty", "productQty", "count", "quantitySold", "itemQty"]);
  if (direct > 0) return direct;
  for (const key of ["serialNumberIds", "serialNumbers", "serials"]) {
    if (Array.isArray(item[key]) && item[key].length > 0) return item[key].length;
  }
  const price = pick(item, ["price", "unitPrice", "salePrice"]);
  const sub = pick(item, ["subtotal", "subTotal", "total", "lineTotal", "amount"]);
  return price > 0 && sub > 0 ? Math.max(1, Math.round(sub / price)) : 1;
}

export function getItemPrice(item: any): number {
  if (!item) return 0;
  const direct = pick(item, ["price", "unitPrice", "salePrice"]);
  if (direct > 0) return direct;
  const qty = getItemQty(item);
  const sub = pick(item, ["subtotal", "subTotal", "total", "lineTotal", "amount"]);
  return qty > 0 && sub > 0 ? sub / qty : 0;
}

export function getItemDiscount(item: any): number {
  return item ? num(item.itemDiscount ?? item.discount ?? item.discountAmount) : 0;
}

export function lineTotal(item: any): number {
  if (!item) return 0;
  const raw = pick(item, ["subtotal", "subTotal", "total", "lineTotal", "amount", "totalAmount"]);
  if (raw > 0) return raw;
  return Math.max(getItemPrice(item) * getItemQty(item) - getItemDiscount(item), 0);
}

function getSerials(item: any): string[] {
  const list = item?.serialNumbers ?? item?.serials ?? [];
  if (!Array.isArray(list)) return [];
  return list
    .map((s: any) => (typeof s === "object" && s ? s.serialNumber ?? s.serial ?? s.number : s))
    .filter((s) => s !== undefined && s !== null && s !== "")
    .map(String);
}

function resolveLogo(logo?: string | null) {
  if (!logo) return "/logo.png";
  if (/^(https?:|\/|data:|blob:)/.test(logo)) return logo;
  return fileService.getPreviewUrl("store", logo);
}

/* ─── small UI pieces ─── */
function Row({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "danger" | "success";
}) {
  const toneCls =
    tone === "danger" ? "text-red-600" : tone === "success" ? "text-emerald-700" : "text-slate-800";
  return (
    <div className={`flex justify-between py-0.5 ${strong ? "font-semibold" : ""} ${toneCls}`}>
      <span className={tone ? "" : "text-slate-600"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className="font-medium text-slate-900 break-words">{value}</dd>
    </div>
  );
}

const STATUS_STYLE = {
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-300",
  PARTIAL: "bg-amber-50 text-amber-700 border-amber-300",
  UNPAID: "bg-red-50 text-red-700 border-red-300",
} as const;

/* ─── page ─── */
export default function SaleInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paper, setPaper] = useState<"a5" | "thermal">("a5");

  const { data: saleData, isLoading, isError } = useSale.GetSaleById(Number(id), {
    enabled: Boolean(id),
  });
  const { data: storesData } = useStore.useGetAllStore({ page: 0, size: 100 });
  const { data: customersData } = useCustomer.useGetAllCustomer({ page: 0, size: 1000 });

  const sale = saleData?.payload?.data ?? saleData?.payload ?? saleData?.data ?? saleData;
  const storeList: any[] = storesData?.payload?.data ?? [];
  const customerList: any[] = customersData?.payload?.data ?? [];

  const store = useMemo(
    () => (sale ? storeList.find((s) => s.id === Number(sale.storeId)) ?? storeList[0] ?? null : null),
    [sale, storeList]
  );
  const customer = useMemo(
    () => (sale ? customerList.find((c) => c.id === Number(sale.customerId)) ?? null : null),
    [sale, customerList]
  );

  const items: any[] = sale?.items ?? sale?.saleItems ?? sale?.details ?? [];

  const totals = useMemo(() => {
    const computed = items.reduce((s, i) => s + lineTotal(i), 0);
    const discount = num(sale?.discount ?? sale?.discountAmount);
    const tax = num(sale?.tax ?? sale?.taxAmount);
    const rawGrand = num(sale?.grandTotal ?? sale?.total);
    const rawSub = num(sale?.totalAmount ?? sale?.subtotal ?? sale?.subTotal ?? sale?.totalPrice);

    const subtotal = rawSub > 0 ? rawSub : computed > 0 ? computed : rawGrand > 0 ? rawGrand + discount - tax : 0;
    const grand = rawGrand > 0 ? rawGrand : Math.max(subtotal - discount + tax, 0);
    const paid = num(sale?.paidAmount ?? (sale?.paymentStatus === "PAID" ? grand : 0));
    const change = Math.max(paid - grand, 0);
    const due = num(sale?.dueAmount ?? Math.max(grand - paid, 0));
    const qty = items.reduce((s, i) => s + getItemQty(i), 0);
    const status: keyof typeof STATUS_STYLE = due > 0 ? (paid > 0 ? "PARTIAL" : "UNPAID") : "PAID";
    return { subtotal, discount, tax, grand, paid, change, due, qty, status };
  }, [items, sale]);

  const logoUrl = useMemo(() => resolveLogo(store?.logo), [store?.logo]);

  const saleDateRaw = sale?.saleDate || sale?.createdAt;
  const warrantyUntil = useMemo(() => {
    const base = parseDate(saleDateRaw);
    return base ? fmtDate(new Date(base.getTime() + WARRANTY_DAYS * DAY_MS)) : `${WARRANTY_DAYS} days from purchase`;
  }, [saleDateRaw]);

  /* ── states ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3" role="status">
          <div className="size-9 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading receipt…</p>
        </div>
      </div>
    );
  }

  if (isError || !sale) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Receipt className="size-10 mx-auto text-slate-300" />
          <div>
            <p className="text-base font-semibold text-slate-800">We couldn’t load this receipt</p>
            <p className="text-sm text-slate-500 mt-1">It may have been deleted, or the link is wrong.</p>
          </div>
          <button
            onClick={() => navigate(ROUTERS.SALE_CREATE)}
            className="px-5 py-2 bg-amber-600 text-white text-sm font-semibold rounded hover:bg-amber-700 transition"
          >
            Back to POS
          </button>
        </div>
      </div>
    );
  }

  const thermal = paper === "thermal";
  const cashier = sale.cashierName ?? sale.createdByName ?? sale.createdBy ?? user?.username ?? "Staff";
  const paymentMethod = sale.paymentMethod ?? sale.paymentType ?? "Cash";
  const customerName = customer?.name ?? sale.customerName ?? "Walk-in customer";
  const address = [store?.address1, store?.city].filter(Boolean).join(", ");

  return (
    <div
      className="min-h-screen bg-slate-200 flex flex-col items-center px-3 py-6 print:bg-white print:p-0"
      style={{ fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif" }}
    >
      {/* Paper size switch (screen only) */}
      <div className="w-full max-w-lg mb-3 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(ROUTERS.SALE_CREATE)}
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" /> Back to POS
        </button>
        <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5 text-xs font-medium" role="group" aria-label="Paper size">
          {(
            [
              ["a5", "Invoice", FileText],
              ["thermal", "80mm receipt", Receipt],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setPaper(key)}
              aria-pressed={paper === key}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded ${paper === key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      <article
        id="receipt"
        data-paper={paper}
        className={`bg-white w-full shadow-md print:shadow-none ${thermal ? "max-w-[302px] text-xs" : "max-w-lg text-sm print:max-w-none"
          }`}
      >
        {/* Header */}
        <header className="text-center py-5 px-4 border-b border-slate-200">
          <img
            src={logoUrl}
            alt={store?.name ?? "Store logo"}
            onError={(e) => {
              const t = e.currentTarget;
              if (!t.src.endsWith("/logo.png")) t.src = "/logo.png";
            }}
            className={`mx-auto mb-2 object-contain ${thermal ? "h-12" : "h-16"} max-w-[200px]`}
          />
          <h1 className="text-base font-bold text-slate-900">{store?.name ?? "Store"}</h1>
          {address && <p className="text-slate-600 mt-0.5">{address}</p>}
          {store?.phone && <p className="text-slate-600">Tel: {store.phone}</p>}
        </header>

        {/* Title + status */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div>
            <p className="text-lg font-bold text-slate-900 leading-tight">Sales invoice</p>
            <p className="text-slate-500 tabular-nums">#{String(sale.id).padStart(4, "0")}</p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold ${STATUS_STYLE[totals.status]}`}
          >
            {totals.status === "PAID" ? "Paid" : totals.status === "PARTIAL" ? "Partly paid" : "Unpaid"}
          </span>
        </div>

        {/* Meta */}
        <dl className={`px-5 py-3 grid gap-y-1 gap-x-4 ${thermal ? "grid-cols-1" : "grid-cols-2"}`}>
          <Meta label="Date:" value={fmtDateTime(saleDateRaw)} />
          <Meta label="Customer:" value={customerName} />
          <Meta label="Cashier:" value={cashier} />
          <Meta label="Payment:" value={paymentMethod} />
          {sale.reference && <Meta label="Order ref:" value={sale.reference} />}
          <Meta label="Items:" value={totals.qty || items.length} />
        </dl>

        {/* Items */}
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr className="border-y-2 border-slate-900 text-slate-900">
              <th scope="col" className="text-left pl-5 pr-2 py-2 font-semibold">Item</th>
              <th scope="col" className="text-right px-2 py-2 font-semibold w-10">Qty</th>
              {!thermal && <th scope="col" className="text-right px-2 py-2 font-semibold">Price</th>}
              <th scope="col" className="text-right pl-2 pr-5 py-2 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={thermal ? 3 : 4} className="px-5 py-5 text-center text-slate-400">
                  This sale has no items.
                </td>
              </tr>
            )}
            {items.map((item, i) => {
              const qty = getItemQty(item);
              const unit = getItemPrice(item);
              const disc = getItemDiscount(item);
              const serials = getSerials(item);
              return (
                <tr key={i} className="border-b border-slate-100 align-top break-inside-avoid">
                  <td className="pl-5 pr-2 py-2 text-slate-900">
                    <span className="font-medium">{item.productName ?? `Product #${item.productId}`}</span>
                    {thermal && (
                      <span className="block text-[11px] text-slate-500 tabular-nums">
                        {qty} × {fmt(unit)}
                      </span>
                    )}
                    {disc > 0 && (
                      <span className="block text-[11px] text-amber-700">Discount −{money(disc)}</span>
                    )}
                    {serials.length > 0 && (
                      <span className="block text-[11px] text-slate-500 font-mono break-all">
                        S/N: {serials.join(", ")}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-slate-700">{qty}</td>
                  {!thermal && (
                    <td className="px-2 py-2 text-right tabular-nums text-slate-700">{fmt(unit)}</td>
                  )}
                  <td className="pl-2 pr-5 py-2 text-right tabular-nums font-medium text-slate-900">
                    {fmt(lineTotal(item))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <section className="px-5 py-3 border-t-2 border-slate-900 mt-[-1px]">
          <Row label="Subtotal" value={money(totals.subtotal)} />
          {totals.discount > 0 && <Row label="Discount" value={`−${money(totals.discount)}`} />}
          {totals.tax > 0 && <Row label="Tax" value={money(totals.tax)} />}

          <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-900">Grand total</span>
            <span className={`font-bold tabular-nums text-slate-900 ${thermal ? "text-lg" : "text-2xl"}`}>
              {money(totals.grand)}
            </span>
          </div>

          <div className="mt-2">
            <Row label={`Paid (${paymentMethod})`} value={money(totals.paid)} />
            {totals.change > 0 && <Row label="Change" value={money(totals.change)} tone="success" />}
            {totals.due > 0 && <Row label="Amount due" value={money(totals.due)} strong tone="danger" />}
          </div>
        </section>

        {/* Warranty */}
        <section className="mx-4 mt-2 mb-3 p-3 bg-slate-50 border border-slate-200 rounded break-inside-avoid">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
            <span>{WARRANTY_DAYS}-day warranty</span>
          </div>
          <p className="text-slate-700 mt-1">
            Covered until <strong>{warrantyUntil}</strong>.
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            Covers manufacturer and technical defects only. Bring this invoice
            {items.some((i) => getSerials(i).length) ? " and the item serial number" : ""} to make a claim.
          </p>
        </section>

        {/* Footer */}
        <footer className="mx-4 mb-4 pt-3 border-t border-dashed border-slate-300 text-center break-inside-avoid">
          <p className="font-semibold text-slate-800">Thank you for shopping with us.</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Printed {fmtDateTime(new Date().toISOString())}
          </p>
        </footer>
      </article>

      {/* Actions (screen only) */}
      <div className="w-full max-w-lg mt-3 grid grid-cols-2 gap-2 print:hidden">
        <button
          onClick={() => navigate(ROUTERS.SALE_CREATE)}
          className="py-3 bg-white border border-slate-300 text-slate-800 text-sm font-semibold rounded hover:bg-slate-50 transition cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600"
        >
          New sale
        </button>
        <button
          onClick={() => window.print()}
          className="py-3 bg-slate-900 text-white text-sm font-semibold rounded hover:bg-slate-800 transition cursor-pointer inline-flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600"
        >
          <Printer className="size-4" /> Print
        </button>
      </div>

      <style>{`
        @media print {
          @page { margin: ${thermal ? "0" : "10mm"}; size: ${thermal ? "80mm auto" : "A5"}; }
          html, body { background: #fff !important; margin: 0; }
          #receipt {
            box-shadow: none !important;
            max-width: 100% !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}