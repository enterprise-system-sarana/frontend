import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  MoreVertical,
  PencilIcon,
  Trash2,
  Tag,
  Building2,
} from "lucide-react";
import { SortableHeader } from "@/utils/sort-table-header";
import ImageCell from "@/components/file/ImageCell";
import type { ProductResponse } from "@/types/product/Product";
import { formatDate } from "@/utils/formatDate";
import type { TranslationKey } from "@/i18n/locales/en";

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
    accessorKey: "code",
    header: ({ column }) => (
      <SortableHeader
        column={column}
        title={t ? t("common.code") : "Product"}
      />
    ),
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex items-center gap-3 min-w-[220px]">
          <ImageCell
            fileName={product.imageUrl}
            name={product.code}
            bucketName="product"
            className="h-10 w-10 rounded-lg shadow-sm flex-shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-foreground truncate">
              {product.modelName || product.code}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {product.code}
            </span>
          </div>
        </div>
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
    header: ({ column }) => (
      <SortableHeader
        column={column}
        title={t ? t("product.category") : "Category / Brand"}
      />
    ),
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex flex-col gap-1">
          {product.categoryName ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {product.categoryName}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
          {product.brandName ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              {product.brandName}
            </span>
          ) : null}
          {product.name ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              {product.brandName}
            </span>
          ) : null}
        </div>
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
    accessorKey: "variantValues",
    header: t ? t("product.variants") : "Variants",
    cell: ({ row }) => {
      const variants = row.original.variantValues;
      if (!variants || variants.length === 0) {
        return <span className="text-xs text-muted-foreground">-</span>;
      }
      return (
        <div className="flex flex-wrap gap-1 max-w-/[240px]">
          {variants.map((v) => (
            <span
              key={v.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/8 text-primary border border-primary/15 transition-colors hover:bg-primary/15"
              title={`${v.variantTypeName}: ${v.name}`}
            >
              <span className="text-primary/60">{v.variantTypeName}:</span>
              {v.name}
            </span>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "reorderLevel",
    header: ({ column }) => (
      <SortableHeader
        column={column}
        title={t ? t("product.reorder_level") : "Reorder"}
      />
    ),
    cell: ({ row }) => {
      const level = row.original.reorderLevel;
      return level != null ? (
        <span className="inline-flex items-center justify-center min-w-/[28px] px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200/60 dark:border-amber-700/30 tabular-nums">
          {level}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      );
    },
  },
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
        title={t ? t("common.created_at") : "Created"}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md"
            >
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {onView && (
              <>
                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-muted-foreground focus:text-foreground"
                  onClick={() => onView(row.original)}
                >
                  <Eye className="h-4 w-4" />
                  {"View Details"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-muted-foreground focus:text-foreground"
              onClick={() => onEdit(row.original)}
            >
              <PencilIcon className="h-4 w-4" />
              {t ? t("common.edit") : "Edit"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={() => onDelete(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
              {t ? t("common.delete") : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
