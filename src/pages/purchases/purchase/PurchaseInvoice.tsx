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
      const rawSerials =
        item.serialNumbers ??
        (item as any).productSerials ??
        (item as any).serials ??
        (item as any).barcodes ??
        (item as any).serialNumberList ??
        [];
      if (Array.isArray(rawSerials)) {
        for (const s of rawSerials) {
          const val =
            typeof s === "string"
              ? s
              : s?.barcode ||
                s?.serialNumber ||
                (s as any)?.serial ||
                (s as any)?.serialNo ||
                (s as any)?.code ||
                (s as any)?.imei ||
                (s as any)?.value ||
                (s?.id ? `SN-${s.id}` : "");
          if (val) itemSerials.push(val);
        }
      }

      const qty = Number(item.quantity || 0);
      const sub = Number(item.subtotal || 0);
      const rawCost = Number(item.cost ?? item.costPrice ?? 0);
      const cost = rawCost > 0 ? rawCost : (qty > 0 && sub > 0 ? sub / qty : 0);

      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.quantity += qty;
        existing.subtotal += sub;
        existing.serials.push(...itemSerials);
        if (!existing.costPrice && cost > 0) {
          existing.costPrice = cost;
        }
      } else {
        map.set(key, {
          productId: item.productId,
          productName: item.productName,
          costPrice: cost,
          quantity: qty,
          subtotal: sub,
          serials: itemSerials,
        });
      }
    }

    return Array.from(map.values());
  }, [purchase?.items]);

  const handlePrint = () => window.print();
  const handleBack = () => navigate(ROUTERS.PURCHASE);

  const statusStyles: Record<string, string> = {
    PAID: "bg-success/10 text-success ring-success/25",
    PARTIAL: "bg-warning/10 text-warning-text ring-warning/25",
    UNPAID: "bg-destructive/10 text-destructive ring-destructive/25",
    PENDING: "bg-muted/50 text-text-secondary ring-border",
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
      <div className="no-print flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-9 w-9 rounded-lg hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Purchase Invoice
          </h1>
          <p className="text-xs text-muted-foreground">
            Review, print, or export this purchase record
          </p>
        </div>
        <Button
          onClick={handlePrint}
          className="shadow-sm bg-primary hover:bg-primary-hover text-primary-foreground"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      <QueryBoundary isLoading={isLoading} isError={isError}>
        {purchase ? (
          <div
            id="purchase-invoice"
            className="max-w-3xl mx-auto bg-card text-foreground p-8 sm:p-10 border border-border rounded-lg"
            style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
          >
            {/* ===== Header ===== */}
            <div className="flex items-start justify-between pb-6 mb-6 border-b-2 border-border">
              <div className="flex items-center gap-4">
                <img
                  src="/logo.png"
                  alt="Company Logo"
                  className="h-14 max-w-[160px] object-contain"
                />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight uppercase">
                    Purchase Invoice
                  </h1>
                  <p className="text-xs text-muted-foreground mt-1">
                    Invoice: {purchase.referenceNo}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-base font-bold text-foreground leading-tight">
                  {purchase.storeName || "Sarana Restaurant System"}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground mt-1">
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Bill From (Supplier)
                </h3>
                <p className="font-semibold text-sm text-foreground">
                  {purchase.supplierName ?? "N/A"}
                </p>
              </div>

              <div className="text-right">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Details
                </h3>
                <div className="space-y-1 text-xs text-text-secondary">
                  <div>
                    <span className="text-muted-foreground">Date: </span>
                    <span className="font-medium text-foreground">
                      {formatDate(purchase.purchaseDate, "fullDate")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Store: </span>
                    <span className="font-medium text-foreground">
                      {purchase.storeName ?? "N/A"}
                    </span>
                  </div>
                  {purchase.bankName && (
                    <div>
                      <span className="text-muted-foreground">Bank: </span>
                      <span className="font-medium text-foreground">
                        {purchase.bankName}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Status: </span>
                    <span className="font-semibold text-foreground uppercase">
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
                  <tr className="border-b-2 border-border text-foreground">
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
                <tbody className="divide-y divide-border">
                  {groupedItems.map((item, index: number) => (
                    <tr key={item.productId ?? index} className="align-top">
                      <td className="py-2.5 px-2 text-muted-foreground tabular-nums">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="font-semibold text-foreground">
                          {item.productName}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 tabular-nums text-[11px] text-text-secondary">
                        {item.serials && item.serials.length > 0 ? (
                          <div className="space-y-0.5">
                            {item.serials.map((s, sIdx) => (
                              <div key={sIdx}>
                                {s}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground font-sans">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center font-medium text-foreground">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-2 text-right text-text-secondary">
                        {formatCurrency(item.costPrice)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold text-foreground">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                  {groupedItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
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
                <div className="flex justify-between py-1 text-text-secondary">
                  <span>Subtotal</span>
                  <span className="text-foreground">
                    {formatCurrency(purchase.total || purchase.grandTotal)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-text-secondary">
                  <span>Discount</span>
                  <span>- {formatCurrency(purchase.discount || 0)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-t-2 border-b-2 border-border my-1 font-bold text-sm text-foreground">
                  <span>Grand Total</span>
                  <span>{formatCurrency(purchase.grandTotal)}</span>
                </div>

                <div className="flex justify-between py-1 text-text-secondary">
                  <span>Paid Amount</span>
                  <span className="text-success font-medium">
                    {formatCurrency(purchase.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-text-secondary">
                  <span>Balance Due</span>
                  <span className={Number(purchase.dueAmount || 0) > 0 ? "text-destructive font-semibold" : ""}>
                    {formatCurrency(purchase.dueAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* ===== Notes ===== */}
            {purchase.note && (
              <div className="mb-6 text-xs text-text-secondary border-t border-border pt-3">
                <span className="font-semibold text-foreground">Note: </span>
                {purchase.note}
              </div>
            )}

            {/* ===== Footer ===== */}
            <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
              <p>
                Thank you for your business. This invoice was generated by{" "}
                {purchase.storeName || "Sarana Restaurant System"}.
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Generated on {formatDate(new Date(), "fullDate")}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            Purchase not found.
          </div>
        )}
      </QueryBoundary>
    </>
  );
}