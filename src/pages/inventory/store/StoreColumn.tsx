import type { StoreResponse } from "@/types/inventory/Store";
import { SortableHeader } from "@/utils/sort-table-header";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
import { StatusBadge } from "@/components/ui/status-badge";
import ImageCell from "@/components/file/ImageCell";
import { formatDate } from "@/utils/formatDate";

export interface StoreColumnProps {
  onEdit: (store: StoreResponse) => void;
  onDelete: (id: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const StoreColumns = ({
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: StoreColumnProps): ColumnDef<StoreResponse>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} title="Store" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3 py-0.5">
        <ImageCell
          fileName={row.original.logo || undefined}
          name={row.original.name}
          bucketName="store"
          className="w-9 h-9 rounded-lg shrink-0 shadow-2xs border border-border/50"
        />
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-foreground text-sm truncate">
            {row.original.name}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {row.original.code || `#${row.original.id}`}
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "contact",
    accessorKey: "email",
    header: "Contact",
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
    accessorKey: "city",
    header: "Location",
    cell: ({ row }) => {
      const address = [row.original.address1, row.original.address2]
        .filter(Boolean)
        .join(", ");
      const region = [
        row.original.city,
        row.original.state,
        row.original.country,
      ]
        .filter(Boolean)
        .join(", ");
      return (
        <div className="flex flex-col text-xs max-w-xs space-y-0.5">
          <span
            className="text-foreground truncate"
            title={address || undefined}
          >
            {address || "-"}
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
    accessorKey: "currencyCode",
    header: ({ column }) => <SortableHeader column={column} title="Currency" />,
    cell: ({ row }) => (
      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-muted text-foreground font-medium">
        {row.original.currencyCode || "-"}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader column={column} title="Created Date" />
    ),
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status || "ACTIVE"} />,
  },
  {
    accessorKey: "Action",
    header: "Action",
    enableHiding: false,
    cell: ({ row }) => {
      if (!canEdit && !canDelete) {
        return <span className="text-muted-foreground text-sm">-</span>;
      }
      return (
        <TableActions
              onEdit={() => onEdit(row.original)}
              onDelete={() => onDelete(row.original.id)}
            />
      );
    },
  },
];
