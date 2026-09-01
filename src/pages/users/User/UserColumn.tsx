import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { UserResponse } from "@/types/users/Users";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, PencilIcon, Trash2, Shield, Store } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { SortableHeader } from "@/utils/sort-table-header";
import { formatDate } from "@/utils/formatDate";
import type { TranslationKey } from "@/i18n/locales/en";

interface UserColumnsProps {
    onEdit: (user: UserResponse) => void;
    onDelete: (id: number) => void;
    canEdit?: boolean;
    canDelete?: boolean;
    t?: (key: TranslationKey, fallback?: string) => string;
}

export const UserColumns = ({
    onEdit,
    onDelete,
    canEdit = true,
    canDelete = true,
    t,
}: UserColumnsProps): ColumnDef<UserResponse>[] => [
        {
            accessorKey: "id",
            header: t ? t("common.id") : "Id",
            cell: ({ row }) => (
                <span className="font-semibold text-[#566a7f]">
                    #{row.original.id}
                </span>
            ),
        },
        {
            accessorKey: "username",
            header: ({ column }) => <SortableHeader column={column} title={t ? t("nav.user") : "User"} />,
            cell: ({ row }) => {
                const username = row.original.username || "User";
                const initial = username.slice(0, 2).toUpperCase();
                return (
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary border border-primary/20">
                            {initial}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground leading-tight truncate">
                                {username}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                                {row.original.email || "-"}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "storeName",
            header: ({ column }) => <SortableHeader column={column} title={t ? t("nav.store") : "Store / Branch"} />,
            cell: ({ row }) => {
                const store = row.original.storeName;
                if (!store) return <span className="text-muted-foreground text-xs">-</span>;
                return (
                    <div className="flex items-center gap-1.5 text-xs text-[#566a7f] font-medium">
                        <Store className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{store}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "roles",
            header: t ? t("nav.role") : "Roles",
            cell: ({ row }) => {
                const roles = row.original.roles;
                if (!roles || roles.length === 0) {
                    return <span className="text-muted-foreground text-xs">No role</span>;
                }
                return (
                    <div className="flex flex-wrap gap-1 max-w-/[300px]">
                        {roles.map((role) => (
                            <span
                                key={role}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20"
                            >
                                <Shield className="h-2.5 w-2.5" />
                                <span>{role}</span>
                            </span>
                        ))}
                    </div>
                );
            },
        },
        {
            accessorKey: "isActive",
            header: t ? t("common.status") : "Status",
            cell: ({ row }) => {
                return <StatusBadge status={row.original.isActive} />;
            },
        },
        //  {
        //         accessorKey: "status",
        //         header: "Status",
        //         cell: ({ row }) => <StatusBadge status={row.original.status} />,
        //     },
        {
            accessorKey: "createdAt",
            header: ({ column }) => <SortableHeader column={column} title={t ? t("common.created_at") : "Created Date"} />,
            cell: ({ row }) => (
                <span className="text-xs text-[#566a7f]">
                    {formatDate(row.original.createdAt)}
                </span>
            ),
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
                        <DropdownMenuContent align="end" className="w-40 shadow-[0_3px_12px_rgba(67,89,113,0.15)] border-[#e7e7e8]">
                            {canEdit && (
                                <DropdownMenuItem
                                    className="cursor-pointer text-[#697a8d] focus:text-[#696cff] focus:bg-[#696cff]/8"
                                    onClick={() => onEdit(row.original)}
                                >
                                    <PencilIcon className="mr-2 h-4 w-4" /> {t ? t("common.edit") : "Edit"}
                                </DropdownMenuItem>
                            )}
                            {canDelete && (
                                <DropdownMenuItem
                                    className="cursor-pointer text-[#ff3e1d] focus:text-[#ff3e1d] focus:bg-[#ff3e1d]/8"
                                    onClick={() => onDelete(row.original.id)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> {t ? t("common.delete") : "Delete"}
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
