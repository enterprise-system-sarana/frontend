import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, PencilIcon, Trash2 } from "lucide-react";
import { SortableHeader } from "@/utils/sort-table-header";
import type { ModelResponse } from "@/types/product/Model";
import { formatDate } from "@/utils/formatDate";

interface ModelColumnsProps {
    onEdit: (model: ModelResponse) => void;
    onDelete: (id: number) => void;
    // canEdit: boolean;
    // canDelete: boolean;
}

export const ModelColumns = ({ onEdit, onDelete
}: ModelColumnsProps): ColumnDef<ModelResponse>[] => [
        {
            accessorKey: "id",
            header: "Id",
            cell: ({ row }) => <span className="font-semibold text-[#566a7f]">#{row.original.id}</span>
        },
        {
            accessorKey: "name",
            header: ({ column }) => <SortableHeader column={column} title="Name" />,
            cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.name}</span>
        },

        {
            accessorKey: "brandName",
            header: ({ column }) => <SortableHeader column={column} title="Brand" />,
            cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.brandName}</span>
        },

        {
            accessorKey: "categoryName",
            header: ({ column }) => <SortableHeader column={column} title="Category" />,
            cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.categoryName}</span>
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
        }
    ];
