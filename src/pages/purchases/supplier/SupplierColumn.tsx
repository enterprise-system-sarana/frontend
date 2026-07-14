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
import { MoreHorizontal, PencilIcon, Trash2 } from "lucide-react";

export interface SupplierColumnProps {
  onEdit: (supplier: SupplierResponse) => void;
  onDelete: (id: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const SupplierColumns = ({
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: SupplierColumnProps): ColumnDef<SupplierResponse>[] => [
    {
      accessorKey: "id",
      header: ({ column }) => <SortableHeader column={column} title="ID" />,
      cell: ({ row }) => <p>{row.original.id}</p>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ row }) => <p>{row.original.name}</p>,
    },
    {
      accessorKey: "addressOne",
      header: "Address One",
      cell: ({ row }) => (
        <p className="truncate max-w-48">{row.original.addressOne}</p>
      ),
    },
    {
      accessorKey: "addressTwo",
      header: "Address Two",
      cell: ({ row }) => (
        <p className="truncate max-w-48">{row.original.addressTwo}</p>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <p>{row.original.phone}</p>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <p>{row.original.email}</p>,
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => (
        <p className="truncate max-w-48">{row.original.address}</p>
      ),
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
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
