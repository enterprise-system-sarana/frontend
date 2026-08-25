import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, PencilIcon, Trash2 } from "lucide-react";
import { SortableHeader } from "@/utils/sort-table-header";
import type { VariantTypeResponse } from "@/types/product/VariantType";
import { formatDate } from "@/utils/formatDate";

interface VariantTypeColumnsProps {
    onEdit: (variantType: VariantTypeResponse) => void;
    onDelete: (id: number) => void;
}

export const VariantTypeColumns = ({
    onEdit,
    onDelete,
}: VariantTypeColumnsProps): ColumnDef<VariantTypeResponse>[] => [
    {
        accessorKey: "id",
        header: "Id",
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">#{row.original.id}</span>,
    },
    {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Name" />,
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.name}</span>,
    },
    {
        accessorKey: "code",
        header: ({ column }) => <SortableHeader column={column} title="Code" />,
        cell: ({ row }) => (
            <span className="font-mono text-xs font-medium text-[#566a7f]">
                {row.original.code || "-"}
            </span>
        ),
    },
    {
        accessorKey: "values",
        header: "Values",
        cell: ({ row }) => {
            const values = row.original.values || [];
            if (values.length === 0) {
                return <span className="text-muted-foreground text-xs italic">No values</span>;
            }
            const displayValues = values.slice(0, 4);
            const remaining = values.length - displayValues.length;
            return (
                <div className="flex flex-wrap items-center gap-1 max-w-[280px]">
                    {displayValues.map((v) => (
                        <span
                            key={v.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                            {v.name}
                        </span>
                    ))}
                    {remaining > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                            +{remaining} more
                        </span>
                    )}
                </div>
            );
        },
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
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 text-[#697a8d] hover:text-[#566a7f] hover:bg-[#f5f5f9]"
                        >
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-40 shadow-[0_3px_12px_rgba(67,89,113,0.15)] border-[#e7e7e8]"
                    >
                        <DropdownMenuItem
                            className="cursor-pointer text-[#697a8d] focus:text-[#696cff] focus:bg-[#696cff]/8"
                            onClick={() => onEdit(row.original)}
                        >
                            <PencilIcon className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer text-[#ff3e1d] focus:text-[#ff3e1d] focus:bg-[#ff3e1d]/8"
                            onClick={() => onDelete(row.original.id)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];

export const VariantTypeColumn = VariantTypeColumns;
