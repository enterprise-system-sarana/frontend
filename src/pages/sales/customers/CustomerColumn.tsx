import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/utils/sort-table-header";
import type { CustomerResponse } from "@/types/sales/Customer";
import { formatDate } from "@/utils/formatDate";
import { TableActions } from "@/components/ui/table-actions";
import type { TranslationKey } from "@/i18n/locales/en";

interface CustomerColumnsProps {
    onEdit: (customer: CustomerResponse) => void;
    onDelete: (id: number) => void;
    canEdit?: boolean;
    canDelete?: boolean;
    t?: (key: TranslationKey, fallback?: string) => string;
}

export const CustomerColumns = ({
    onEdit,
    onDelete,
    canEdit = true,
    canDelete = true,
    t,
}: CustomerColumnsProps): ColumnDef<CustomerResponse>[] => [
    {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title={t ? t("common.name") : "Name"} />,
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.name}</span>
    },
    {
        accessorKey: "code",
        header: t ? t("common.code") : "Code",
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.code}</span>
    },
    {
        accessorKey: "email",
        header: t ? t("common.email") : "Email",
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.email}</span>
    },
    {
        accessorKey: "phone",
        header: t ? t("common.phone") : "Phone",
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.phone || "-"}</span>
    },
    {
        accessorKey: "note",
        header: t ? t("common.notes") : "Note",
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.note || "-"}</span>
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => <SortableHeader column={column} title={t ? t("common.created_date") : "Created Date"} />,
        cell: ({ row }) => <span className="text-xs text-[#566a7f]">{formatDate(row.original.createdAt)}</span>
    },
    {
        accessorKey: "status",
        header: t ? t("common.status") : "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
        accessorKey: "Action",
        header: t ? t("common.action") : "Action",
        enableHiding: false,
        cell: ({ row }) => {
            if (!canEdit && !canDelete) {
                return <span className="text-[#a1acb8] text-sm">-</span>;
            }
            return (
                <TableActions
                    onEdit={() => onEdit(row.original)}
                    onDelete={() => onDelete(row.original.id)}
                    t={t}
                />
            );
        },
    }
];
