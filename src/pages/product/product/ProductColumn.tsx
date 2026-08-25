import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, PencilIcon, Trash2 } from "lucide-react";
import { SortableHeader } from "@/utils/sort-table-header";
import ImageCell from "@/components/file/ImageCell";
import type { ProductResponse } from "@/types/product/Product";
import { formatDate } from "@/utils/formatDate";
import type { TranslationKey } from "@/i18n/locales/en";

interface ProductColumnsProps {
    onEdit: (product: ProductResponse) => void;
    onDelete: (id: number) => void;
    t?: (key: TranslationKey, fallback?: string) => string;
}

export const ProductColumns = ({ onEdit, onDelete, t }: ProductColumnsProps): ColumnDef<ProductResponse>[] => [
        {
            accessorKey: "id",
            header: t ? t("common.id") : "Id",
            cell: ({ row }) => <span className="font-semibold text-[#566a7f]">#{row.original.id}</span>
        },
        {
            accessorKey: "code",
            header: ({ column }) => <SortableHeader column={column} title={t ? t("common.code") : "Code"} />,
            cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.code}</span>
        },
        {
            accessorKey: "imageUrl",
            header: t ? t("common.image") : "Image",
            cell: ({ row }) => (
                <ImageCell fileName={row.original.imageUrl} name={row.original.code} bucketName="product" />
            )
        },
        {
            accessorKey: "modelName",
            header: ({ column }) => <SortableHeader column={column} title={t ? t("product.model") : "Model"} />,
            cell: ({ row }) =>
                <>
                    <p className="text-[#566a7f]">{row.original.categoryName || "-"}</p>
                    <p className="text-[#566a7f]">{row.original.brandName || "-"}</p>
                    <p className="font-semibold text-[#566a7f]">{row.original.modelName || "-"}</p>
                </>
        },
        {
            accessorKey: "variantValues",
            header: t ? t("product.variants") : "Variants",
            cell: ({ row }) => {
                const variants = row.original.variantValues;
                if (!variants || variants.length === 0) {
                    return <span className="text-muted-foreground text-xs">-</span>;
                }
                return (
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {variants.map((v) => (
                            <span
                                key={v.id}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20"
                            >
                                {v.name}
                            </span>
                        ))}
                    </div>
                );
            }
        },
        {
            accessorKey: "reorderLevel",
            header: ({ column }) => <SortableHeader column={column} title={t ? t("product.reorder_level") : "Reorder Level"} />,
            cell: ({ row }) => <span className="text-[#566a7f]">{row.original.reorderLevel ?? "-"}</span>
        },
        {
            accessorKey: "noted",
            header: t ? t("common.notes") : "Noted",
            cell: ({ row }) => <span className="text-[#566a7f] max-w-[160px] truncate block">{row.original.noted || "-"}</span>
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => <SortableHeader column={column} title={t ? t("common.created_at") : "Created Date"} />,
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-[#697a8d] hover:text-[#566a7f] hover:bg-[#f5f5f9]">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 shadow-[0_3px_12px_rgba(67,89,113,0.15)] border-[#e7e7e8]">
                            <DropdownMenuItem className="cursor-pointer text-[#697a8d] focus:text-[#696cff] focus:bg-[#696cff]/8" onClick={() => onEdit(row.original)}>
                                <PencilIcon className="mr-2 h-4 w-4" /> {t ? t("common.edit") : "Edit"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-[#ff3e1d] focus:text-[#ff3e1d] focus:bg-[#ff3e1d]/8" onClick={() => onDelete(row.original.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> {t ? t("common.delete") : "Delete"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        }
    ];
