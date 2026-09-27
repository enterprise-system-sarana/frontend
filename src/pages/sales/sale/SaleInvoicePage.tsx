import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSale } from "@/hooks/sales/useSale";
import { useStore } from "@/hooks/inventory/useStore";
import { useCustomer } from "@/hooks/sales/useCustomer";
import { useAuth } from "@/store/useAuth";
import { ROUTERS } from "@/constants/Route";
import { ShieldCheck } from "lucide-react";
import { fileService } from "@/services/file/file.service";

/* ─── types (loose — API payload shapes vary by wrapper) ─── */
interface SaleItem {
  productId?: number;
  productName?: string;
  quantity?: number;
  qty?: number;
  count?: number;
  productQty?: number;
  price?: number;
  unitPrice?: number;
  itemDiscount?: number;
  discount?: number;
  subtotal?: number;
  subTotal?: number;
  total?: number;
  serialNumberIds?: number[];
  serialNumbers?: (string | number)[];
  serials?: any[];
}

/* ─── helpers ─── */
function fmt(val: number, decimals = 2) {
  return Number(val || 0).toFixed(decimals);
}

function money(val: number) {
  return `$${fmt(val)}`;
}

function fmtDateTime(d?: string | null) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return d;
  }
}

function fmtDateTimeFull(d?: string | null) {
  const date = d ?? new Date().toISOString();
  try {
    return new Date(date).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
  } catch {
    return d ?? "";
  }
}

export function getItemQty(item: any): number {
  if (!item) return 1;
  const directQty = Number(
    item.quantity ??
    item.qty ??
    item.productQty ??
    item.count ??
    item.quantitySold ??
    item.itemQty
  );
  if (!isNaN(directQty) && directQty > 0) {
    return directQty;
  }
  if (Array.isArray(item.serialNumberIds) && item.serialNumberIds.length > 0) {
    return item.serialNumberIds.length;
  }
  if (Array.isArray(item.serialNumbers) && item.serialNumbers.length > 0) {
    return item.serialNumbers.length;
  }
  if (Array.isArray(item.serials) && item.serials.length > 0) {
    return item.serials.length;
  }
  const price = Number(item.price ?? item.unitPrice ?? item.salePrice ?? 0);
  const subtotal = Number(item.subtotal ?? item.subTotal ?? item.total ?? item.lineTotal ?? item.amount ?? 0);
  if (price > 0 && subtotal > 0) {
    return Math.max(1, Math.round(subtotal / price));
  }
  return 1;
}

export function getItemPrice(item: any): number {
  if (!item) return 0;
  const directPrice = Number(item.price ?? item.unitPrice ?? item.salePrice ?? 0);
  if (!isNaN(directPrice) && directPrice > 0) {
    return directPrice;
  }
  const qty = getItemQty(item);
  const subtotal = Number(item.subtotal ?? item.subTotal ?? item.total ?? item.lineTotal ?? item.amount ?? 0);
  if (qty > 0 && subtotal > 0) {
    return subtotal / qty;
  }
  return 0;
}

export function getItemDiscount(item: any): number {
  if (!item) return 0;
  return Number(item.itemDiscount ?? item.discount ?? item.discountAmount ?? 0) || 0;
}

export function lineTotal(item: any): number {
  if (!item) return 0;
  const rawSubtotal = Number(
    item.subtotal ??
    item.subTotal ??
    item.total ??
    item.lineTotal ??
    item.amount ??
    item.totalAmount ??
    0
  );
  if (!isNaN(rawSubtotal) && rawSubtotal > 0) {
    return rawSubtotal;
  }
  const unitPrice = getItemPrice(item);
  const qty = getItemQty(item);
  const itemDisc = getItemDiscount(item);
  const calculated = unitPrice * qty - itemDisc;
  return Math.max(calculated, 0);
}

/* ─── component ─── */
export default function SaleInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: saleData, isLoading, isError } = useSale.GetSaleById(Number(id), {
    enabled: Boolean(id),
  });
  const { data: storesData } = useStore.useGetAllStore({ page: 0, size: 100 });
  const { data: customersData } = useCustomer.useGetAllCustomer({ page: 0, size: 1000 });

  const sale = saleData?.payload?.data ?? saleData?.payload ?? saleData?.data ?? saleData;

  const storeList: any[] = storesData?.payload?.data ?? [];
  const customerList: any[] = customersData?.payload?.data ?? [];

  const store = useMemo(() => {
    if (!sale) return null;
    return storeList.find((s: any) => s.id === Number(sale.storeId)) ?? storeList[0] ?? null;
  }, [sale, storeList]);

  const customer = useMemo(() => {
    if (!sale) return null;
    return customerList.find((c: any) => c.id === Number(sale.customerId)) ?? null;
  }, [sale, customerList]);

  const items: any[] = sale?.items ?? sale?.saleItems ?? sale?.details ?? [];

  const computedSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + lineTotal(item), 0),
    [items]
  );

  const discount = Number(sale?.discount ?? sale?.discountAmount ?? 0);
  const rawGrandTotal = Number(sale?.grandTotal ?? sale?.total ?? 0);
  const rawTotalAmount = Number(
    sale?.totalAmount ??
    sale?.subtotal ??
    sale?.subTotal ??
    sale?.totalPrice ??
    0
  );

  const subtotal = rawTotalAmount > 0
    ? rawTotalAmount
    : computedSubtotal > 0
      ? computedSubtotal
      : rawGrandTotal > 0
        ? rawGrandTotal + discount
        : 0;

  const grandTotal = rawGrandTotal > 0
    ? rawGrandTotal
    : subtotal > 0
      ? Math.max(subtotal - discount, 0)
      : 0;

  const paidAmount = Number(
    sale?.paidAmount ?? (sale?.paymentStatus === "PAID" ? grandTotal : 0)
  );
  const change = Math.max(paidAmount - grandTotal, 0);
  const dueAmount = Number(
    sale?.dueAmount ?? Math.max(grandTotal - paidAmount, 0)
  );

  const totalItemsCount = useMemo(
    () => items.reduce((sum, item) => sum + getItemQty(item), 0),
    [items]
  );

  const logoUrl = useMemo(() => {
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
  }, [store?.logo]);

  const warrantyUntilDate = useMemo(() => {
    const rawDate = sale?.saleDate || sale?.createdAt;
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
  }, [sale?.saleDate, sale?.createdAt]);

  /* ── loading / error ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="size-9 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading receipt…</p>
        </div>
      </div>
    );
  }

  if (isError || !sale) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-base font-semibold text-slate-700">Receipt not found</p>
          <button
            onClick={() => navigate(ROUTERS.SALE_CREATE)}
            className="px-5 py-2 bg-amber-500 text-white text-sm font-bold rounded hover:bg-amber-600 transition"
          >
            Back to POS
          </button>
        </div>
      </div>
    );
  }

  /* ── render ── */
  return (
    <div
      className="min-h-screen bg-slate-200 flex flex-col items-center py-6 print:bg-white print:py-0"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      <div id="receipt" className="bg-white w-full max-w-lg shadow print:shadow-none print:max-w-none">
        {/* ── Store Header ── */}
        <div className="text-center py-5 px-4 border-b border-slate-300">
          <img
            src={logoUrl}
            alt={store?.name ?? "Store Logo"}
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== window.location.origin + "/logo.png") {
                target.src = "/logo.png";
              }
            }}
            className="h-16 mx-auto mb-2 object-contain max-w-[200px]"
          />
          <p className="text-base font-bold text-slate-800 tracking-wide">{store?.name ?? "Store"}</p>
          {(store?.address1 || store?.city) && (
            <p className="text-sm text-slate-600 mt-0.5">
              {[store?.address1, store?.city].filter(Boolean).join(", ")}
            </p>
          )}
          {store?.phone && <p className="text-sm text-slate-600">Tel: {store.phone}</p>}
        </div>

        {/* ── Meta Row ── */}
        <div className="flex justify-between px-5 py-3 border-b border-slate-300 text-sm gap-4">
          <div className="space-y-0.5">
            <p className="text-slate-700">
              Date: <span className="font-bold text-amber-700">{fmtDateTime(sale.saleDate || sale.createdAt)}</span>
            </p>
            <p className="text-slate-700">
              Cashier: <span className="font-semibold text-amber-700">{user?.username ?? "Staff"}</span>
            </p>
            <p className="text-slate-700">
              Customer:{" "}
              <span className="font-semibold text-amber-700">
                {customer?.name ?? sale.customerName ?? "Walk-In"}
              </span>
            </p>
            {sale.reference && (
              <p className="text-slate-700">
                Order Ref: <span className="font-bold text-amber-700">{sale.reference}</span>
              </p>
            )}
          </div>

          <div className="text-right space-y-0.5 shrink-0">
            <p className="text-slate-700">
              Bill No: <span className="font-bold">#{String(sale.id).padStart(3, "0")}</span>
            </p>
            <p className="text-slate-700">
              Items: <span className="font-bold">{totalItemsCount || items.length}</span>
            </p>
            <p className="text-slate-700">
              Warranty: <span className="font-bold text-emerald-700">14 Days</span>
            </p>
          </div>
        </div>

        {/* ── Items Table ── */}
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr className="border-b-2 border-slate-800">
              <th className="text-left px-5 py-2 font-bold text-slate-800 w-[50%]">Item Name</th>
              <th className="text-right px-2 py-2 font-bold text-slate-800">Qty</th>
              <th className="text-right px-2 py-2 font-bold text-slate-800">Price</th>
              <th className="text-right px-5 py-2 font-bold text-slate-800">subTotal</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-4 text-center text-slate-400">
                  No items on this sale
                </td>
              </tr>
            )}
            {items.map((item, i) => {
              const unitPrice = getItemPrice(item);
              const qty = getItemQty(item);
              const itemDisc = getItemDiscount(item);
              const hasDiscount = itemDisc > 0;
              const total = lineTotal(item);

              return (
                <tr key={i} className="border-b border-slate-100 align-top">
                  <td className="px-5 py-1.5 text-slate-800">
                    <span className="font-medium">{item.productName ?? `Product #${item.productId}`}</span>
                    {hasDiscount && (
                      <span className="block text-xs text-slate-400">
                        Discount: -{money(itemDisc)}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-right text-slate-700 tabular-nums">{qty}</td>
                  <td className="px-2 py-1.5 text-right text-slate-700 tabular-nums">{fmt(unitPrice)}</td>
                  <td
                    className={`px-5 py-1.5 text-right tabular-nums font-medium ${hasDiscount ? "text-amber-700" : "text-slate-800"
                      }`}
                  >
                    {fmt(total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── Totals ── */}
        <div className="px-5 py-3 border-t-2 border-slate-800 text-sm">
          <div className="flex justify-between py-0.5">
            <span className="text-slate-600">Subtotal:</span>
            <span className="tabular-nums font-medium">{money(subtotal)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">Discount:</span>
              <span className="tabular-nums font-medium">-{money(discount)}</span>
            </div>
          )}

          <div className="flex justify-between py-1 mt-1 border-t border-slate-200 font-bold text-base">
            <span>Grand Total:</span>
            <span className="tabular-nums">{money(grandTotal)}</span>
          </div>

          <div className="flex justify-between py-0.5 mt-1">
            <span className="text-slate-600">Paid (Cash):</span>
            <span className="tabular-nums font-medium">{money(paidAmount)}</span>
          </div>

          {change > 0 ? (
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">Change:</span>
              <span className="tabular-nums font-medium">{money(change)}</span>
            </div>
          ) : dueAmount > 0 ? (
            <div className="flex justify-between py-0.5 text-red-600">
              <span className="font-semibold">Amount Due:</span>
              <span className="tabular-nums font-semibold">{money(dueAmount)}</span>
            </div>
          ) : null}
        </div>

        {/* ── 14-Day Warranty Guarantee Box ── */}
        <div className="mx-4 mt-3 mb-2 p-3 bg-slate-50 border border-slate-300 rounded text-center">
          <div className="flex items-center justify-center gap-1.5 font-bold text-slate-800 text-xs uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>14-Day Warranty Guarantee</span>
          </div>
          <p className="text-xs text-slate-700 mt-1">
            This purchase is covered by a <strong>14-day warranty</strong> valid until{" "}
            <strong>{warrantyUntilDate}</strong>.
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Warranty covers manufacturer and technical defects. Original invoice required for claims.
          </p>
        </div>

        {/* ── Thank You Box ── */}
        <div className="mx-4 mb-4 border border-dashed border-slate-300 rounded py-3 text-center text-sm text-slate-700">
          <p className="font-semibold">Thank you for your purchase!</p>
          <p className="text-slate-500 text-xs mt-0.5">Please come again.</p>
          <p className="text-slate-400 text-[11px] mt-1">{fmtDateTimeFull(sale.saleDate || sale.createdAt)}</p>
        </div>
      </div>

      {/* ── Action Buttons (hidden on print) ── */}
      <div className="w-full max-w-lg mt-3 space-y-2 print:hidden">
        <button
          onClick={() => window.print()}
          className="w-full py-3.5 bg-slate-900 text-white text-sm font-bold uppercase tracking-widest hover:bg-slate-800 transition cursor-pointer"
        >
          Print
        </button>
        <button
          onClick={() => navigate(ROUTERS.SALE_CREATE)}
          className="w-full py-3.5 bg-amber-600 text-white text-sm font-bold uppercase tracking-widest hover:bg-amber-700 transition cursor-pointer"
        >
          Back to POS
        </button>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 0; }
          body { background: white !important; margin: 0; }
          #receipt { 
            box-shadow: none !important; 
            max-width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}