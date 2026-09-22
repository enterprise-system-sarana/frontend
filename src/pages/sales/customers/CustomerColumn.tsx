import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { PencilIcon, Trash2 } from "lucide-react";
import { SortableHeader } from "@/utils/sort-table-header";
import type { CustomerResponse } from "@/types/sales/Customer";
import { formatDate } from "@/utils/formatDate";
import { TableActions } from "@/components/ui/table-actions";


interface CustomerColumnsProps {
    onEdit: (customer: CustomerResponse) => void;
    onDelete: (id: number) => void;
    canEdit?: boolean;
    canDelete?: boolean;
}

export const CustomerColumns = ({
    onEdit,
    onDelete,
    canEdit = true,
    canDelete = true,
}: CustomerColumnsProps): ColumnDef<CustomerResponse>[] => [

        {
            accessorKey: "name",
            header: ({ column }) => <SortableHeader column={column} title="Name" />,
            cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.name}</span>
        },
        {
            accessorKey: "code",
            header: "Code",
            cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.code}</span>
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.email}</span>
        },
        {
            accessorKey: "phone",
            header: "Phone",
            cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.phone || "-"}</span>
        },
        {
            accessorKey: "note",
            header: "Note",
            cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.note || "-"}</span>
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => <SortableHeader column={column} title="Created Date" />,
            cell: ({ row }) => <span className="text-xs text-[#566a7f]">{formatDate(row.original.createdAt)}</span>
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            accessorKey: "Action",
            header: "Action",
            enableHiding: false,
            cell: ({ row }) => {
                if (!canEdit && !canDelete) {
                    return <span className="text-[#a1acb8] text-sm">-</span>;
                }
                return (
                    <TableActions
                        onEdit={() => onEdit(row.original)}
                        onDelete={() => onDelete(row.original.id)}
                    />
                );
            },
        }
    ];
