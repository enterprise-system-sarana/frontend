import type { ProductResponse } from "@/types/product/Product";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PencilIcon, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { SortableHeader } from "@/utils/sort-table-header";

interface ProductColumnsProps {
    onEdit: (product: ProductResponse) => void;
    onDelete: (id: number) => void;
    canEdit: boolean;
    canDelete: boolean;
}


export const ProductColumns = ({ onEdit, onDelete, canEdit, canDelete }: ProductColumnsProps): ColumnDef<ProductResponse>[] => [
    // {
    //     accessorKey: "id",
    //     header: "Id",
    //     cell: ({ row }) => <p>{row.original.id}</p>
    // },
    {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Name" />,
        cell: ({ row }) => <p>{row.original.name}</p>
    },
    {
        accessorKey: "code",
        header: ({ column }) => <SortableHeader column={column} title="Code" />,
        cell: ({ row }) => <p>{row.original.code}</p>
    },
    {
        accessorKey: "salePrice",
        header: ({ column }) => <SortableHeader column={column} title="salePrice" />,
        cell: ({ row }) => <p>{row.original.salePrice}</p>
    },
    {
        accessorKey: "costPrice",
        header: ({ column }) => <SortableHeader column={column} title="costPrice" />,
        cell: ({ row }) => <p>{row.original.costPrice}</p>
    },
    {
        accessorKey: "alertQuantity",
        header: ({ column }) => <SortableHeader column={column} title="AlertQTY" />,
        cell: ({ row }) => <p>{row.original.alertQuantity}</p>
    },
    {
        accessorKey: "categoryName",
        header: ({ column }) => <SortableHeader column={column} title="CATNAME" />,
        cell: ({ row }) => <p>{row.original.categoryName}</p>
    },
    {
        accessorKey: "subCategoryName",
        header: ({ column }) => <SortableHeader column={column} title="SCNAME" />,
        cell: ({ row }) => <p>{row.original.subCategoryName}</p>
    },
    {
        accessorKey: "unitName",
        header: ({ column }) => <SortableHeader column={column} title="UnitName" />,
        cell: ({ row }) => <p>{row.original.unitName}</p>
    },
    // {
    //     accessorKey: "defaultSaleUnit",
    //     header: "defaultSaleUnit",
    //     cell: ({ row }) => <p>{row.original.defaultSaleUnit}</p>
    // },
    // {
    //     accessorKey: "defaultPurchaseUnit",
    //     header: "defaultPurchaseUnit",
    //     cell: ({ row }) => <p>{row.original.defaultPurchaseUnit}</p>
    // },
    // {
    //     accessorKey: "printer",
    //     header: "Printer",
    //     cell: ({ row }) => <p>{row.original.printer}</p>
    // },
    // {
    //     accessorKey: "image",
    //     header: "Image",
    //     cell: ({ row }) => {
    //         const url = row.original.image;
    //         return url ? (
    //             <img src={url} alt={row.original.name} className="w-10 h-10 rounded-md object-cover border" />
    //         ) : (
    //             <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-[10px] text-muted-foreground border">
    //                 No img
    //             </div>
    //         );
    //     }
    // },
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
                return <span className="text-muted-foreground text-sm">-</span>;
            }
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {canEdit && (
                            <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit(row.original)}><PencilIcon className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        )}
                        {canDelete && (
                            <DropdownMenuItem className="cursor-pointer text-destructive" onClick={() => onDelete(row.original.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    }
]