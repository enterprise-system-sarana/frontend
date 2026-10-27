import type { CategoryResponse } from "@/types/product/Category";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
import { SortableHeader } from "@/utils/sort-table-header";
import ImageCell from "@/components/file/ImageCell";
import { formatDate } from "@/utils/formatDate";
import type { TranslationKey } from "@/i18n/locales/en";

interface CategoryColumnsProps {
    onEdit: (category: CategoryResponse) => void;
    onDelete: (id: number) => void;
    t?: (key: TranslationKey, fallback?: string) => string;
}

export const CategoryColumns = ({
    onEdit,
    onDelete,
    t,
}: CategoryColumnsProps): ColumnDef<CategoryResponse>[] => [
    {
        accessorKey: "code",
        header: ({ column }) => <SortableHeader column={column} title={t ? t("common.code") : "Code"} />,
        cell: ({ row }) => <span className="text-xs text-mono font-semibold text-[#566a7f]">{row.original.code}</span>
    },
    {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title={t ? t("common.name") : "Name"} />,
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.name}</span>
    },
    {
        accessorKey: "imageUrl",
        header: t ? t("common.image") : "Image",
        cell: ({ row }) => (
            <ImageCell fileName={row.original.imageUrl} name={row.original.name} bucketName="category" />
        )
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
