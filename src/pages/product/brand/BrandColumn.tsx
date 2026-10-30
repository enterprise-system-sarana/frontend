import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
import { SortableHeader } from "@/utils/sort-table-header";
import type { BrandResponse } from "@/types/product/Brand";
import ImageCell from "@/components/file/ImageCell";
import { formatDate } from "@/utils/formatDate";
import type { TranslationKey } from "@/i18n/locales/en";

interface BrandColumnsProps {
    onEdit: (brand: BrandResponse) => void;
    onDelete: (id: number) => void;
    t?: (key: TranslationKey, fallback?: string) => string;
}

export const BrandColumns = ({ onEdit, onDelete, t }: BrandColumnsProps): ColumnDef<BrandResponse>[] => [
    {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title={t ? t("common.name") : "Name"} />,
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>
    },
    {
        accessorKey: "imageUrl",
        header: t ? t("common.image") : "Image",
        cell: ({ row }) => (
            <ImageCell fileName={row.original.imageUrl} name={row.original.name} bucketName="brand" />
        )
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => <SortableHeader column={column} title={t ? t("common.created_date") : "Created Date"} />,
        cell: ({ row }) => <span className="text-xs text-text-secondary">{formatDate(row.original.createdAt)}</span>
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
