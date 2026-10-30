import type { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/utils/sort-table-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/utils/formatDate";
import ImageCell from "@/components/file/ImageCell";
import type { StockItemReportResponse, StockMovementItemResponse } from "@/types/reports/StockReport";
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Smartphone } from "lucide-react";

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

export const StockItemReportColumns = (
  props?: { t?: (key: any, fallback?: string) => string }
): ColumnDef<StockItemReportResponse>[] => {
  const t = props?.t ?? ((_k: any, fallback?: string) => fallback ?? "");

  return [
    {
      accessorKey: "productName",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("product.name", "Product")} />
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2.5 min-w-[200px]">
            <ImageCell
              fileName={item.imageUrl}
              name={item.productName || item.productCode}
              bucketName="product"
              preview={true}
              className="h-9 w-9 rounded-md object-cover border border-border/60 shrink-0"
              fallbackSrc="/default-product-img.png"
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm text-foreground truncate max-w-[160px]">
                  {item.productName || "-"}
                </span>
                {item.hasSerial && (
                  <span
                    title={t("product.serialized", "Serialized")}
                    className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0"
                  >
                    <Smartphone className="size-2.5" /> SN
                  </span>
                )}
              </div>
              <span className="text-[12px] tabular-nums text-muted-foreground truncate">
                {item.productCode || "-"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "storeName",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("store.name", "Store")} />
      ),
      cell: ({ row }) => (
        <span className="font-medium text-xs text-foreground">
          {row.original.storeName || "-"}
        </span>
      ),
    },
    {
      accessorKey: "categoryName",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("category.name", "Category & Brand")} />
      ),
      cell: ({ row }) => {
        const { categoryName, brandName, modelName } = row.original;
        const brandOrModel = [brandName, modelName].filter(Boolean).join(" · ");
        return (
          <div className="flex flex-col text-xs leading-tight">
            <span className="font-medium text-foreground">{categoryName || "-"}</span>
            {brandOrModel && (
              <span className="text-[12px] text-muted-foreground">{brandOrModel}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "currentQuantity",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("inventory.current_quantity", "Stock Qty")} />
      ),
      cell: ({ row }) => {
        const item = row.original;
        const qty = Number(item.currentQuantity ?? 0);
        const reorder = item.reorderLevel ?? item.alertQuantity ?? 5;
        const isLow = qty > 0 && qty <= reorder;
        const isOut = qty <= 0;

        return (
          <div className="flex flex-col">
            <span
              className={`font-bold text-sm ${isOut
                ? "text-destructive"
                : isLow
                  ? "text-warning-text"
                  : "text-foreground"
                }`}
            >
              {qty.toLocaleString()}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Min: {reorder}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "costPrice",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("product.cost_price", "Cost / Sale")} />
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col text-xs">
            <span className="font-medium text-muted-foreground">
              Cost: {formatCurrency(item.costPrice)}
            </span>
            <span className="font-semibold text-foreground">
              Sale: {formatCurrency(item.salePrice)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "totalCostValue",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("inventory.valuation", "Total Valuation")} />
      ),
      cell: ({ row }) => {
        const item = row.original;
        const costVal = Number(item.totalCostValue ?? (Number(item.currentQuantity ?? 0) * Number(item.costPrice ?? 0)));
        const saleVal = Number(item.totalSaleValue ?? (Number(item.currentQuantity ?? 0) * Number(item.salePrice ?? 0)));

        return (
          <div className="flex flex-col text-xs tabular-nums">
            <span className="font-semibold text-foreground">
              {formatCurrency(costVal)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Retail: {formatCurrency(saleVal)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "potentialProfit",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("inventory.margin", "Margin & Profit")} />
      ),
      cell: ({ row }) => {
        const item = row.original;
        const profit = Number(item.potentialProfit ?? 0);
        const margin = Number(item.marginPercentage ?? 0);

        return (
          <div className="flex flex-col text-xs">
            <span className="font-semibold text-success">
              {formatCurrency(profit)}
            </span>
            {/* <span className="text-[11px] font-medium text-muted-foreground">
              {margin.toFixed(1)}%
            </span> */}
          </div>
        );
      },
    },
    {
      accessorKey: "stockStatus",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("common.status", "Status")} />
      ),
      cell: ({ row }) => {
        const item = row.original;
        const qty = Number(item.currentQuantity ?? 0);
        const reorder = item.reorderLevel ?? item.alertQuantity ?? 5;

        let statusText = item.stockStatus;
        if (!statusText) {
          if (qty <= 0) statusText = "OUT_OF_STOCK";
          else if (qty <= reorder) statusText = "LOW_STOCK";
          else statusText = "IN_STOCK";
        }

        return <StatusBadge status={statusText} />;
      },
    },
  ];
};

export const StockMovementColumns = (
  props?: { t?: (key: any, fallback?: string) => string }
): ColumnDef<StockMovementItemResponse>[] => {
  const t = props?.t ?? ((_k: any, fallback?: string) => fallback ?? "");

  return [
    {
      accessorKey: "transactionId",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("common.id", "Tx ID")} />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-xs font-semibold text-muted-foreground">
          #{row.original.transactionId || "-"}
        </span>
      ),
    },
    {
      accessorKey: "transactionDate",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("common.date", "Date & Time")} />
      ),
      cell: ({ row }) => {
        const dateVal = row.original.transactionDate || row.original.createdAt;
        return (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {dateVal ? formatDate(dateVal) : "-"}
          </span>
        );
      },
    },
    {
      accessorKey: "productName",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("product.name", "Product")} />
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-2.5 min-w-[180px]">
            <ImageCell
              fileName={item.imageUrl}
              name={item.productName || item.productCode}
              bucketName="product"
              preview={true}
              className="h-8 w-8 rounded-md object-cover border border-border/60 shrink-0"
              fallbackSrc="/default-product-img.png"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-xs text-foreground truncate max-w-[150px]">
                {item.productName || "-"}
              </span>
              <span className="text-[11px] tabular-nums text-muted-foreground truncate">
                {item.productCode || "-"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "storeName",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("store.name", "Store")} />
      ),
      cell: ({ row }) => (
        <span className="text-xs font-medium text-foreground">
          {row.original.storeName || "-"}
        </span>
      ),
    },
    {
      accessorKey: "transactionType",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("inventory.transaction_type", "Type")} />
      ),
      cell: ({ row }) => {
        const type = (row.original.transactionType ?? "").toUpperCase();
        const isIn = ["IN", "PURCHASE", "RESTOCK", "RETURN_IN"].includes(type);
        const isOut = ["OUT", "SALE", "TRANSFER_OUT", "DAMAGE"].includes(type);

        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold border ${isIn
              ? "bg-success/10 text-success border-success/20"
              : isOut
                ? "bg-primary-light text-primary border-primary/20"
                : "bg-primary-light text-primary border-primary/20"
              }`}
          >
            {isIn && <ArrowDownLeft className="size-3" />}
            {isOut && <ArrowUpRight className="size-3" />}
            {!isIn && !isOut && <RefreshCw className="size-2.5" />}
            {type || "MOVEMENT"}
          </span>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("common.quantity", "Quantity")} />
      ),
      cell: ({ row }) => {
        const qty = Number(row.original.quantity ?? 0);
        const isPositive = qty > 0;
        return (
          <span
            className={`tabular-nums text-sm font-bold ${isPositive
              ? "text-success"
              : "text-destructive"
              }`}
          >
            {isPositive ? `+${qty.toLocaleString()}` : qty.toLocaleString()}
          </span>
        );
      },
    },
    {
      accessorKey: "referenceId",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("common.reference", "Reference")} />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-xs text-muted-foreground">
          {row.original.referenceId ? `#${row.original.referenceId}` : "-"}
        </span>
      ),
    },
    {
      accessorKey: "notes",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("common.notes", "Notes")} />
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground max-w-[180px] truncate block" title={row.original.notes}>
          {row.original.notes || "-"}
        </span>
      ),
    },
    {
      accessorKey: "createdBy",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("common.created_by", "Created By")} />
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.createdBy || "-"}
        </span>
      ),
    },
  ];
};
