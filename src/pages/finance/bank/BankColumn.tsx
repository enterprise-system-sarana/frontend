import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { BankResponse } from "@/types/finance/Bank";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, PencilIcon, Trash2 } from "lucide-react";
import { SortableHeader } from "@/utils/sort-table-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/utils/formatDate";

interface BankColumnsProps {
    onEdit: (bank: BankResponse) => void;
    onDelete: (id: number) => void;
    // canEdit?: boolean;
    // canDelete?: boolean;
}

export const BankColumns = ({
    onEdit,
    onDelete,
}: BankColumnsProps): ColumnDef<BankResponse>[] => [
        {
            accessorKey: "id",
            header: "Id",
            cell: ({ row }) => <span className="font-semibold text-[#566a7f]">#{row.original.id}</span>,
        },
        {
            accessorKey: "name",
            header: ({ column }) => <SortableHeader column={column} title="Bank Name" />,
            cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.name}</span>,
        },
        {
            accessorKey: "accountName",
            header: "Account Name",
            cell: ({ row }) => <span className="font-medium text-[#566a7f]">{row.original.accountName}</span>,
        },
        {
            accessorKey: "accountNumber",
            header: "Account Number",
            cell: ({ row }) => <span className="font-mono text-xs text-[#697a8d]">{row.original.accountNumber || "-"}</span>,
        },
        {
            accessorKey: "openingBalance",
            header: "Opening Balance",
            cell: ({ row }) => <span className="text-muted-foreground text-xs">${row.original.openingBalance || "0.00"}</span>,
        },
        {
            accessorKey: "currentBalance",
            header: "Current Balance",
            cell: ({ row }) => <span className="font-semibold text-emerald-600 dark:text-emerald-400">${row.original.currentBalance || "0.00"}</span>,
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => <SortableHeader column={column} title="Created Date" />,
            cell: ({ row }) => <span className="text-xs text-[#566a7f]">{formatDate(row.original.createdAt)}</span>,
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
                // if (!canEdit && !canDelete) {
                //     return <span className="text-[#a1acb8] text-sm">-</span>;
                // }
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-[#697a8d] hover:text-[#566a7f] hover:bg-[#f5f5f9]">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 shadow-[0_3px_12px_rgba(67,89,113,0.15)] border-[#e7e7e8]">
                            {/* {canEdit && ( */}
                            <DropdownMenuItem className="cursor-pointer text-[#697a8d] focus:text-[#696cff] focus:bg-[#696cff]/8" onClick={() => onEdit(row.original)}>
                                <PencilIcon className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            {/* )} */}
                            {/* {canDelete && ( */}
                            <DropdownMenuItem className="cursor-pointer text-[#ff3e1d] focus:text-[#ff3e1d] focus:bg-[#ff3e1d]/8" onClick={() => onDelete(row.original.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                            {/* )} */}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
