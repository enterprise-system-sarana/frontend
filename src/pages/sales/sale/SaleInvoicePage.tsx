import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSale } from "@/hooks/sales/useSale";
import { useStore } from "@/hooks/inventory/useStore";
import { useCustomer } from "@/hooks/sales/useCustomer";
import { useAuth } from "@/store/useAuth";
import { ROUTERS } from "@/constants/Route";

/* ─── types (loose — API payload shapes vary by wrapper) ─── */
interface SaleItem {
  productId?: number;
  productName?: string;
  quantity?: number;
  price?: number;
  itemDiscount?: number;
  subtotal?: number;
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

function lineTotal(item: SaleItem) {
  const unitPrice = Number(item.price || 0);
  const qty = Number(item.quantity || 0);
  const itemDisc = Number(item.itemDiscount || 0);
  return Number(item.subtotal ?? unitPrice * qty - itemDisc);
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

  const items: SaleItem[] = sale?.items ?? [];

  const computedSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + lineTotal(item), 0),
    [items]
  );

  const subtotal = Number(sale?.totalAmount ?? computedSubtotal);
  const discount = Number(sale?.discount ?? 0);
  const grandTotal = Number(sale?.grandTotal ?? subtotal - discount);
  const paidAmount = Number(sale?.paidAmount ?? 0);
  const change = Math.max(paidAmount - grandTotal, 0);
  const dueAmount = Number(sale?.dueAmount ?? Math.max(grandTotal - paidAmount, 0));

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
          {store?.logo ? (
            <img src={store.logo} alt={store?.name} className="h-12 mx-auto mb-2 object-contain" />
          ) : (
            <p className="text-base font-bold text-slate-800">{store?.name ?? "Store"}</p>
          )}
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
              Items: <span className="font-bold">{items.length}</span>
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
              const unitPrice = Number(item.price || 0);
              const qty = Number(item.quantity || 0);
              const itemDisc = Number(item.itemDiscount || 0);
              const hasDiscount = itemDisc > 0;

              return (
                <tr key={i} className="border-b border-slate-100 align-top">
                  <td className="px-5 py-1.5 text-slate-800">
                    {item.productName ?? `Product #${item.productId}`}
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
                    {fmt(lineTotal(item))}
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

        {/* ── Thank You Box ── */}
        <div className="mx-4 mb-4 mt-1 border border-dashed border-slate-300 rounded py-4 text-center text-sm text-slate-700">
          <p className="font-semibold">Thank you for your purchase!</p>
          <p className="text-slate-500">Please come again.</p>
          <p className="text-slate-400 text-xs mt-1">{fmtDateTimeFull(sale.saleDate || sale.createdAt)}</p>
        </div>
      </div>

      {/* ── Action Buttons (hidden on print) ── */}
      <div className="w-full max-w-lg mt-3 space-y-2 print:hidden">
        <button
          onClick={() => window.print()}
          className="w-full py-3.5 bg-slate-900 text-white text-sm font-bold uppercase tracking-widest hover:bg-slate-800 transition"
        >
          Print
        </button>
        <button
          onClick={() => navigate(ROUTERS.SALE_CREATE)}
          className="w-full py-3.5 bg-amber-600 text-white text-sm font-bold uppercase tracking-widest hover:bg-amber-700 transition"
        >
          Back to POS
        </button>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 0; }
          body { background: white !important; margin: 0; }
          #receipt { box-shadow: none !important; max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}