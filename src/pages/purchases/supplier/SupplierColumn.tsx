import type { SupplierResponse } from "@/types/purchases/Supplier";
import { SortableHeader } from "@/utils/sort-table-header";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/utils/formatDate";
import type { TranslationKey } from "@/i18n/locales/en";

export interface SupplierColumnProps {
  onEdit: (supplier: SupplierResponse) => void;
  onDelete: (id: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  t?: (key: TranslationKey, fallback?: string) => string;
}

export const SupplierColumns = ({
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  t,
}: SupplierColumnProps): ColumnDef<SupplierResponse>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} title={t ? t("nav.supplier") : "Supplier"} />,
    cell: ({ row }) => (
      <div className="flex flex-col min-w-0 py-0.5">
        <span className="font-semibold text-foreground text-sm truncate">
          {row.original.name}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {row.original.code || `#${row.original.id}`}
        </span>
      </div>
    ),
  },
  {
    id: "contact",
    accessorKey: "email",
    header: t ? t("common.contact") : "Contact",
    cell: ({ row }) => (
      <div className="flex flex-col text-xs space-y-0.5">
        <span className="text-foreground font-medium truncate">
          {row.original.phone || "-"}
        </span>
        <span className="text-muted-foreground truncate">
          {row.original.email || "-"}
        </span>
      </div>
    ),
  },
  {
    id: "location",
    accessorKey: "address",
    header: t ? t("common.location") : "Location",
    cell: ({ row }) => {
      const region = [row.original.city, row.original.country]
        .filter(Boolean)
        .join(", ");
      return (
        <div className="flex flex-col text-xs max-w-xs space-y-0.5">
          <span
            className="text-foreground truncate"
            title={row.original.address || undefined}
          >
            {row.original.address || "-"}
          </span>
          <span
            className="text-muted-foreground truncate"
            title={region || undefined}
          >
            {region || "-"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "note",
    header: ({ column }) => <SortableHeader column={column} title={t ? t("common.notes") : "Note"} />,
    cell: ({ row }) => (
      <span
        className="truncate max-w-xs text-muted-foreground text-xs block"
        title={row.original.note || undefined}
      >
        {row.original.note || "-"}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader column={column} title={t ? t("common.created_date") : "Created Date"} />,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: t ? t("common.status") : "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status || "ACTIVE"} />,
  },
  {
    accessorKey: "Action",
    header: t ? t("common.action") : "Action",
    enableHiding: false,
    cell: ({ row }) => {
      if (!canEdit && !canDelete) {
        return <span className="text-muted-foreground text-sm">-</span>;
      }
      return (
        <TableActions
          onEdit={() => onEdit(row.original)}
          onDelete={() => onDelete(row.original.id)}
          t={t}
        />
      );
    },
  },
];
