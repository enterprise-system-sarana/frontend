import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdjustmentResponse } from "@/types/inventory/Adjutment";
import { SortableHeader } from "@/utils/sort-table-header";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PencilIcon, Trash2 } from "lucide-react";

export interface AdjustmentColumnProps {
  onEdit: (adjustment: AdjustmentResponse) => void;
  onDelete: (id: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const AdjustmentColumns = ({
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: AdjustmentColumnProps): ColumnDef<AdjustmentResponse>[] => [
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader column={column} title="ID" />,
    cell: ({ row }) => <p>{row.original.id}</p>,
  },
  {
    accessorKey: "referenceNo",
    header: ({ column }) => (
      <SortableHeader column={column} title="Reference No" />
    ),
    cell: ({ row }) => <p>{row.original.referenceNo}</p>,
  },
  {
    accessorKey: "storeName",
    header: "Store",
    cell: ({ row }) => <p>{row.original.storeName}</p>,
  },
  {
    accessorKey: "note",
    header: "Note",
    cell: ({ row }) => <p>{row.original.note}</p>,
  },
  {
    accessorKey: "totalItems",
    header: "Total Items",
    cell: ({ row }) => <p>{row.original.items?.length ?? 0}</p>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <p>{row.original.status}</p>,
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
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit && (
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onEdit(row.original)}
              >
                <PencilIcon className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                className="cursor-pointer text-destructive"
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
