import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
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
                <TableActions
              onEdit={() => onEdit(row.original)}
              onDelete={() => onDelete(row.original.id)}
            />
            );
        },
    },
];

export const VariantTypeColumn = VariantTypeColumns;
