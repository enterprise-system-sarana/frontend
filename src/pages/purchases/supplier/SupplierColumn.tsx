import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SupplierResponse } from "@/types/purchases/Supplier";
import { SortableHeader } from "@/utils/sort-table-header";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, PencilIcon, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/utils/formatDate";

export interface SupplierColumnProps {
  onEdit: (supplier: SupplierResponse) => void;
  onDelete: (id: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const SupplierColumns = ({
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: SupplierColumnProps): ColumnDef<SupplierResponse>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} title="Supplier" />,
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
    accessorKey: "address",
    header: "Location",
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
    header: ({ column }) => <SortableHeader column={column} title="Note" />,
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
    header: ({ column }) => <SortableHeader column={column} title="Created Date" />,
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg"
            >
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40 shadow-lg border-border/60 rounded-xl"
          >
            {canEdit && (
              <DropdownMenuItem
                className="cursor-pointer text-muted-foreground focus:text-primary focus:bg-primary/10 rounded-lg"
                onClick={() => onEdit(row.original)}
              >
                <PencilIcon className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg"
                onClick={() => onDelete(row.original.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
