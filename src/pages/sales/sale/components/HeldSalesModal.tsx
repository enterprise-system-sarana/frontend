import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PauseCircle,
  Play,
  Trash2,
  Search,
  Clock,
  User,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  PackageCheck,
} from "lucide-react";

export interface HeldSaleItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  itemDiscount?: number;
  subtotal: number;
  serialNumberIds?: number[];
}

export interface HeldSale {
  id: string;
  reference: string;
  heldAt: string;
  note?: string;
  customerId: number | null;
  customerName: string;
  storeId: number;
  bankId: number | null;
  discount: number;
  items: HeldSaleItem[];
  totalAmount: number;
}

export interface HeldSalesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  heldSales: HeldSale[];
  onResume: (sale: HeldSale) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

function fmtCurrency(val: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(val) || 0);
}

function fmtTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

export default function HeldSalesModal({
  open,
  onOpenChange,
  heldSales,
  onResume,
  onDelete,
  onClearAll,
}: HeldSalesModalProps) {
  const { language } = useLanguage();
  const isKm = language === "km";
  const [search, setSearch] = useState("");

  const filteredSales = heldSales.filter((sale) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      sale.reference.toLowerCase().includes(q) ||
      sale.customerName?.toLowerCase().includes(q) ||
      sale.note?.toLowerCase().includes(q) ||
      sale.items.some((it) => it.productName?.toLowerCase().includes(q))
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-full p-0 overflow-hidden rounded-2xl bg-card shadow-2xl border border-border">
        <DialogHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-warning/10 text-warning-text flex items-center justify-center">
              <PauseCircle className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold text-foreground">
                  {isKm ? "ការលក់ដែលផ្អាកទុក" : "Held Sales Orders"}
                </DialogTitle>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-warning/10 text-warning-text">
                  {heldSales.length}
                </span>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isKm
                  ? "ប្រតិបត្តិការដែលបានផ្អាក រង់ចាំការបន្ត ឬទូទាត់ប្រាក់"
                  : "Parked transactions waiting to be resumed or checked out"}
              </DialogDescription>
            </div>
          </div>

          {heldSales.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (
                  window.confirm(
                    isKm
                      ? "តើអ្នកប្រាកដជាចង់លុបការលក់ដែលផ្អាកទាំងអស់មែនទេ?"
                      : "Are you sure you want to discard all held sales?"
                  )
                ) {
                  onClearAll();
                }
              }}
              className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 h-8 rounded-lg cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>{isKm ? "លុបទាំងអស់" : "Clear All"}</span>
            </Button>
          )}
        </DialogHeader>

        {/* Search Bar */}
        {heldSales.length > 0 && (
          <div className="px-6 py-2.5 border-b border-border bg-muted/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isKm
                    ? "ស្វែងរកការលក់ផ្អាកតាមលេខយោង អតិថិជន ផលិតផល..."
                    : "Search held orders by reference, customer, product..."
                }
                className="pl-9 h-8 text-xs bg-card rounded-lg border-border"
              />
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-3">
          {heldSales.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="size-14 rounded-2xl bg-warning/10 text-warning-text flex items-center justify-center mx-auto">
                <PauseCircle className="size-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">
                  {isKm ? "គ្មានការលក់ផ្អាកទុកទេ" : "No Sales on Hold"}
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {isKm ? (
                    <>
                      នៅពេលអតិថិជនត្រូវការពេលបន្ថែម សូមចុច{" "}
                      <strong className="text-foreground">"ផ្អាកការលក់"</strong> នៅលើរទេះទំនិញ POS ដើម្បីទុកការបញ្ជាទិញនេះសិន ហើយបម្រើអតិថិជនបន្ទាប់។
                    </>
                  ) : (
                    <>
                      When a customer steps away or needs more time, click{" "}
                      <strong className="text-foreground">"Hold Sale"</strong> on the POS cart to park their order and serve the next customer.
                    </>
                  )}
                </p>
              </div>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              {isKm
                ? `រកមិនឃើញការលក់ដែលផ្អាកត្រូវគ្នានឹង "${search}" ទេ`
                : `No held sales matching "${search}"`}
            </div>
          ) : (
            filteredSales.map((sale) => {
              const totalItems = sale.items.reduce(
                (sum, it) => sum + (Number(it.quantity) || 1),
                0
              );

              return (
                <div
                  key={sale.id}
                  className="rounded-xl border border-border bg-card hover:border-warning/30 p-4 transition-all shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums text-xs font-bold text-foreground">
                          #{sale.reference}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/10 text-warning-text">
                          <Clock className="size-2.5" />
                          {fmtTime(sale.heldAt)}
                        </span>
                        {sale.note && (
                          <span className="text-[12px] italic text-muted-foreground truncate max-w-xs">
                            — "{sale.note}"
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <User className="size-3 text-muted-foreground" />
                          {sale.customerName || (isKm ? "អតិថិជនទូទៅ" : "Walk-In Customer")}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <ShoppingBag className="size-3 text-muted-foreground" />
                          {isKm
                            ? `${totalItems} មុខទំនិញ`
                            : `${totalItems} item${totalItems !== 1 ? "s" : ""}`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold tabular-nums text-success">
                        {fmtCurrency(sale.totalAmount)}
                      </div>
                      {sale.discount > 0 && (
                        <div className="text-[11px] text-destructive tabular-nums">
                          {isKm ? "បញ្ចុះតម្លៃ:" : "Disc:"} -{fmtCurrency(sale.discount)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items Preview Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border">
                    {sale.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] bg-muted text-text-secondary border border-border"
                      >
                        <span className="font-semibold text-foreground">
                          {it.quantity}x
                        </span>
                        <span className="truncate max-w-[160px]">{it.productName}</span>
                      </span>
                    ))}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      {isKm ? "ផ្អាកនៅថ្ងៃ " : "Held on "}
                      {new Date(sale.heldAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(sale.id)}
                        className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer px-2.5"
                      >
                        <Trash2 className="size-3.5" />
                        <span className="hidden sm:inline">{isKm ? "បោះបង់" : "Discard"}</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onResume(sale)}
                        className="h-8 gap-1.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg text-xs font-semibold px-3 cursor-pointer shadow-xs"
                      >
                        <Play className="size-3 fill-current" />
                        <span>{isKm ? "បន្តការលក់" : "Resume Sale"}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
