import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePurchase } from "@/hooks/purchases/usePurchase";
import { QueryBoundary } from "@/components/ui/query-boundary";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/formatDate";
import { ROUTERS } from "@/constants/Route";
import { ArrowLeft, Printer, Receipt, Building2, Calendar, Store, Landmark, BadgeCheck } from "lucide-react";
import type {
  PurchaseResponse,
  PurchaseItemResponse,
} from "@/types/purchases/Purchase";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

export default function PurchaseInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = usePurchase.GetPurchaseById(Number(id), {
    enabled: Boolean(id),
  });

  const purchase: PurchaseResponse | undefined =
    data?.payload?.data ?? data?.payload ?? data?.data ?? data;

  const groupedItems = useMemo(() => {
    const items = purchase?.items || [];
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
  }, [purchase?.items]);

  const handlePrint = () => window.print();
  const handleBack = () => navigate(ROUTERS.PURCHASE);

  const statusStyles: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    PARTIAL: "bg-amber-50 text-amber-700 ring-amber-200",
    UNPAID: "bg-rose-50 text-rose-700 ring-rose-200",
    PENDING: "bg-slate-50 text-slate-700 ring-slate-200",
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #purchase-invoice, #purchase-invoice * { visibility: visible; }
          #purchase-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print { display: none !important; }
          @page { margin: 14mm; size: A4; }
        }
      `}</style>

      {/* Top action bar */}
      <div className="no-print flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-9 w-9 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Purchase Invoice
          </h1>
          <p className="text-xs text-slate-500">
            Review, print, or export this purchase record
          </p>
        </div>
        <Button
          onClick={handlePrint}
          className="shadow-sm bg-slate-900 hover:bg-slate-800 text-white"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      <QueryBoundary isLoading={isLoading} isError={isError}>
        {purchase ? (
          <div
            id="purchase-invoice"
            className="max-w-3xl mx-auto bg-white text-slate-900 p-8 sm:p-10 border border-slate-200 rounded-lg"
            style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
          >
            {/* ===== Header ===== */}
            <div className="flex items-start justify-between pb-6 mb-6 border-b-2 border-slate-900">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight uppercase">
                  Purchase Invoice
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Invoice :{purchase.referenceNo}
                </p>
              </div>

              <div className="text-right">
                <p className="text-base font-bold text-slate-900 leading-tight">
                  {purchase.storeName || "Sarana Restaurant System"}
                </p>
                <p className="text-xs leading-relaxed text-slate-500 mt-1">
                  123 Business Street
                  <br />
                  Phnom Penh, Cambodia
                  <br />
                  Tel: +855 12 345 678
                </p>
              </div>
            </div>

            {/* ===== Info Section (NO CARDS) ===== */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Bill From (Supplier)
                </h3>
                <p className="font-semibold text-sm text-slate-900">
                  {purchase.supplierName ?? "N/A"}
                </p>
              </div>

              <div className="text-right">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Details
                </h3>
                <div className="space-y-1 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-500">Date: </span>
                    <span className="font-medium text-slate-800">
                      {formatDate(purchase.purchaseDate, "fullDate")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Store: </span>
                    <span className="font-medium text-slate-800">
                      {purchase.storeName ?? "N/A"}
                    </span>
                  </div>
                  {purchase.bankName && (
                    <div>
                      <span className="text-slate-500">Bank: </span>
                      <span className="font-medium text-slate-800">
                        {purchase.bankName}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Status: </span>
                    <span className="font-semibold text-slate-800 uppercase">
                      {purchase.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Items Table (Simple, No Card) ===== */}
            <div className="mb-8">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-slate-900">
                    <th className="text-left py-2.5 px-2 font-bold uppercase tracking-wider w-10">
                      #
                    </th>
                    <th className="text-left py-2.5 px-2 font-bold uppercase tracking-wider">
                      Product
                    </th>
                    <th className="text-left py-2.5 px-2 font-bold uppercase tracking-wider">
                      Serial Number
                    </th>
                    <th className="text-center py-2.5 px-2 font-bold uppercase tracking-wider w-16">
                      Qty
                    </th>
                    <th className="text-right py-2.5 px-2 font-bold uppercase tracking-wider w-24">
                      Unit Price
                    </th>
                    <th className="text-right py-2.5 px-2 font-bold uppercase tracking-wider w-24">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {groupedItems.map((item, index: number) => (
                    <tr key={item.productId ?? index} className="align-top">
                      <td className="py-2.5 px-2 text-slate-500 font-mono">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="font-semibold text-slate-900">
                          {item.productName}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-mono text-[11px] text-slate-600">
                        {item.serials && item.serials.length > 0 ? (
                          <div className="space-y-0.5">
                            {item.serials.map((s, sIdx) => (
                              <div key={sIdx}>
                                {s}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-sans">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center font-medium text-slate-800">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-700">
                        {formatCurrency(item.costPrice)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold text-slate-900">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                  {groupedItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ===== Summary (Simple, No Card) ===== */}
            <div className="flex justify-end mb-8">
              <div className="w-64 text-xs space-y-1.5">
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Subtotal</span>
                  <span className="text-slate-800">
                    {formatCurrency(purchase.total || purchase.grandTotal)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Discount</span>
                  <span>- {formatCurrency(purchase.discount || 0)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-t-2 border-b-2 border-slate-900 my-1 font-bold text-sm text-slate-900">
                  <span>Grand Total</span>
                  <span>{formatCurrency(purchase.grandTotal)}</span>
                </div>

                <div className="flex justify-between py-1 text-slate-600">
                  <span>Paid Amount</span>
                  <span className="text-emerald-600 font-medium">
                    {formatCurrency(purchase.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Balance Due</span>
                  <span className={Number(purchase.dueAmount || 0) > 0 ? "text-rose-600 font-semibold" : ""}>
                    {formatCurrency(purchase.dueAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* ===== Notes ===== */}
            {purchase.note && (
              <div className="mb-6 text-xs text-slate-600 border-t border-slate-200 pt-3">
                <span className="font-semibold text-slate-800">Note: </span>
                {purchase.note}
              </div>
            )}

            {/* ===== Footer ===== */}
            <div className="border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
              <p>
                Thank you for your business. This invoice was generated by{" "}
                {purchase.storeName || "Sarana Restaurant System"}.
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Generated on {formatDate(new Date(), "fullDate")}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400">
            Purchase not found.
          </div>
        )}
      </QueryBoundary>
    </>
  );
}