import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/utils/sort-table-header";
import ImageCell from "@/components/file/ImageCell";
import type { ProductResponse } from "@/types/product/Product";
import { formatDate } from "@/utils/formatDate";
import type { TranslationKey } from "@/i18n/locales/en";
import { TableActions } from "@/components/ui/table-actions";

interface ProductColumnsProps {
  onView?: (product: ProductResponse) => void;
  onEdit: (product: ProductResponse) => void;
  onDelete: (id: number) => void;
  t?: (key: TranslationKey, fallback?: string) => string;
}

export const ProductColumns = ({
  onView,
  onEdit,
  onDelete,
  t,
}: ProductColumnsProps): ColumnDef<ProductResponse>[] => [
    {
      accessorKey: "imageUrl",
      header: "Images",
      enableSorting: false,
      cell: ({ row }) => (
        <ImageCell
          fileName={row.original.imageUrl}
          name={row.original.name || row.original.code}
          bucketName="product"
          className="h-10 w-10 rounded-lg shadow-sm"
        />
      ),
    },
    {
      accessorKey: "code",
      header: ({ column }) => (
        <SortableHeader
          column={column}
          title={t ? t("common.code") : "Code"}
        />
      ),
      cell: ({ row }) => {
        const product = row.original;
        return (
          <button
            type="button"
            onClick={() => onView?.(product)}
            className="font-semibold text-sm text-foreground whitespace-nowrap text-left hover:underline hover:text-primary transition-colors cursor-pointer"
          >
            {product.code}
          </button>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title={"Name"} />,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <span className="text-sm font-medium text-foreground">
            {product.name}
          </span>
        );
      },
    },
    {
      accessorKey: "categoryName",
      header: ({ column }) => <SortableHeader column={column} title={"Category"} />,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <span className="text-sm font-medium text-foreground">
            {product.categoryName}
          </span>
        );
      },
    },
    {
      accessorKey: "brandName",
      header: ({ column }) => <SortableHeader column={column} title={"Brand"} />,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <span className="text-sm font-medium text-foreground">
            {product.brandName}
          </span>
        );
      },
    },

    {
      accessorKey: "costPrice",
      header: ({ column }) => <SortableHeader column={column} title={"Cost"} />,
      cell: ({ row }) => {
        const price = row.original.costPrice;
        return price != null ? (
          <span className="text-sm font-medium text-foreground tabular-nums">
            $
            {Number(price).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "salePrice",
      header: ({ column }) => <SortableHeader column={column} title={"Sale"} />,
      cell: ({ row }) => {
        const price = row.original.salePrice;
        return price != null ? (
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            $
            {Number(price).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "qty",
      header: ({ column }) => <SortableHeader column={column} title={"Quantity"} />,
      cell: ({ row }) => {
        const qty = row.original.qty ?? row.original.quantity;
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20 tabular-nums">
            {qty != null ? `${qty}` : "-"}
          </span>
        );
      },
    },
    // {
    //   accessorKey: "reorderLevel",
    //   header: ({ column }) => (
    //     <SortableHeader
    //       column={column}
    //       title={t ? t("product.reorder_level") : "Reorder"}
    //     />
    //   ),
    //   cell: ({ row }) => {
    //     const level = row.original.reorderLevel;
    //     return level != null ? (
    //       <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200/60 dark:border-amber-700/30 tabular-nums">
    //         {level}
    //       </span>
    //     ) : (
    //       <span className="text-xs text-muted-foreground">-</span>
    //     );
    //   },
    // },
    {
      accessorKey: "status",
      header: t ? t("common.status") : "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader
          column={column}
          title={"Date"}
        />
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: t ? t("common.action") : "Action",
      enableHiding: false,
      cell: ({ row }) => {
        return (
          <TableActions
            onView={onView ? () => onView(row.original) : undefined}
            onEdit={() => onEdit(row.original)}
            onDelete={() => onDelete(row.original.id)}
            t={t}
          />
        );
      },
    },
  ];
