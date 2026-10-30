import type { GroupPermission } from "@/types/users/Group";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
import { SortableHeader } from "@/utils/sort-table-header";
import { formatDate } from "@/utils/formatDate";

interface GroupPermissionColumnsProps {
    onEdit: (group: GroupPermission) => void;
    onDelete: (id: number) => void;
    canEdit: boolean;
    canDelete: boolean;
}

export const GroupPermissionColumns = ({ onEdit, onDelete, canEdit, canDelete }: GroupPermissionColumnsProps): ColumnDef<GroupPermission>[] => [

    {
        accessorKey: "code",
        header: ({ column }) => <SortableHeader column={column} title="Code" />,
        cell: ({ row }) => <span className="tabular-nums text-xs text-primary font-bold">{row.original.code}</span>,
    },
    {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Name" />,
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => <span className="truncate max-w-48 text-muted-foreground">{row.original.description || "-"}</span>,
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => <SortableHeader column={column} title="Created Date" />,
        cell: ({ row }) => <span className="text-xs text-text-secondary">{formatDate(row.original.createdAt)}</span>,
    },
    {
        accessorKey: "Action",
        header: "Action",
        enableHiding: false,
        cell: ({ row }) => {
            if (!canEdit && !canDelete) {
                return <span className="text-text-disabled text-sm">-</span>;
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
