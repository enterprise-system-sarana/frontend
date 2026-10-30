import type { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/utils/sort-table-header";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

export interface SaleItemRow {
  itemId?: number;
  saleId?: number;
  saleReference?: string;
  saleNo?: string;
  saleDate?: string;
  storeId?: number;
  storeName?: string;
  customerId?: number;
  customerName?: string;
  productId?: number;
  productName?: string;
  productCode?: string;
  modelId?: number;
  modelName?: string;
  brandId?: number;
  brandName?: string;
  categoryId?: number;
  categoryName?: string;
  quantity?: number;
  returnedQuantity?: number;
  price?: number;
  unitPrice?: number;
  unitCost?: number;
  itemDiscount?: number;
  subTotal?: number;
  totalCost?: number;
  totalProfit?: number;
  status?: string;
  saleStatus?: string;
  paymentStatus?: string;
  serialNumbers?: (string | number)[];
}

export const SalesItemReportColumns = (
  props?: {
    t?: (key: any, fallback?: string) => string;
    onViewSale?: (saleId: number) => void;
  }
): ColumnDef<SaleItemRow>[] => {
  const t = props?.t ?? ((_k: any, fallback?: string) => fallback ?? "");

  return [
    {
      accessorKey: "saleReference",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("report.sales_reference", "Sale Reference")} />
      ),
      cell: ({ row }) => {
        const ref = row.original.saleReference || row.original.saleNo || "-";
        const saleId = row.original.saleId;
        return (
          <div className="flex flex-col">
            <span
              onClick={() => saleId && props?.onViewSale?.(saleId)}
              className={`tabular-nums text-xs font-semibold ${
                props?.onViewSale && saleId
                  ? "text-primary hover:underline cursor-pointer"
                  : "text-primary"
              }`}
            >
              {ref}
            </span>
            {row.original.customerName && row.original.customerName !== "-" && (
              <span className="text-[12px] text-muted-foreground truncate max-w-[130px]">
                {row.original.customerName}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "productName",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("product.name", "Product")} />
      ),
      cell: ({ row }) => {
        const brand = row.original.brandName;
        const category = row.original.categoryName;
        const code = row.original.productCode;
        return (
          <div className="flex flex-col max-w-[200px]">
            <span className="font-medium text-foreground truncate">
              {row.original.productName || "-"}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              {code && (
                <span className="text-[11px] tabular-nums px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/50">
                  {code}
                </span>
              )}
              {brand && (
                <span className="text-[11px] text-muted-foreground">
                  {brand}
                </span>
              )}
              {category && (
                <span className="text-[11px] text-muted-foreground/80">
                  • {category}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "saleDate",
      header: ({ column }) => <SortableHeader column={column} title={t("common.date", "Date")} />,
      cell: ({ row }) => {
        const raw = row.original.saleDate;
        if (!raw || raw === "-") return <span className="text-muted-foreground text-xs">-</span>;
        const date = new Date(raw);
        return (
          <span className="text-xs text-text-secondary whitespace-nowrap">
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        );
      },
    },
    {
      accessorKey: "storeName",
      header: ({ column }) => <SortableHeader column={column} title={t("store.name", "Store")} />,
      cell: ({ row }) => (
        <span className="font-medium text-xs text-text-secondary whitespace-nowrap">
          {row.original.storeName || "-"}
        </span>
      ),
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => <SortableHeader column={column} title={t("product.quantity", "Qty")} />,
      cell: ({ row }) => {
        const qty = Number(row.original.quantity ?? 0);
        const returned = Number(row.original.returnedQuantity ?? 0);
        return (
          <div className="flex items-center gap-1">
            <span className="font-semibold text-sm text-text-secondary">{qty}</span>
            {returned > 0 && (
              <span className="text-[11px] text-destructive font-medium" title="Returned Quantity">
                (-{returned})
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("report.unit_price", "Unit Price")} />
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-xs text-text-secondary">
          {formatCurrency(row.original.price ?? row.original.unitPrice)}
        </span>
      ),
    },
    {
      accessorKey: "itemDiscount",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("quote.discount", "Discount")} />
      ),
      cell: ({ row }) => {
        const discount = Number(row.original.itemDiscount ?? 0);
        return (
          <span className={`text-xs ${discount > 0 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
            {formatCurrency(discount)}
          </span>
        );
      },
    },
    {
      accessorKey: "subTotal",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("quote.subtotal", "Subtotal")} />
      ),
      cell: ({ row }) => (
        <span className="text-xs text-success font-bold">
          {formatCurrency(row.original.subTotal)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: t("sale.status", "Sale Status"),
      cell: ({ row }) => {
        const status = row.original.status || row.original.saleStatus;
        return <StatusBadge status={status} />;
      },
    },
    {
      accessorKey: "paymentStatus",
      header: t("sale.payment_status", "Payment"),
      cell: ({ row }) => {
        const ps = (row.original.paymentStatus ?? "").toUpperCase();
        const isPaid = ps === "PAID";
        const isPartial = ps === "PARTIAL";
        return (
          <Badge
            variant="outline"
            className={
              isPaid
                ? "bg-success/10 text-success border-success/20"
                : isPartial
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-warning/10 text-warning-text border-warning/20"
            }
          >
            {row.original.paymentStatus || "-"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "serialNumbers",
      header: t("report.serial_ids", "Serial IDs"),
      cell: ({ row }) => {
        const ids = row.original.serialNumbers;
        return ids && ids.length > 0 ? (
          <span className="tabular-nums text-xs text-text-secondary max-w-[140px] truncate block" title={ids.join(", ")}>
            {ids.join(", ")}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        );
      },
    },
  ];
};
