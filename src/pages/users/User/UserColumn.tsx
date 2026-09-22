import type { UserResponse } from "@/types/users/Users";
import { TableActions } from "@/components/ui/table-actions";
import type { ColumnDef } from "@tanstack/react-table";
import { Shield, Store } from "lucide-react";
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
                    <div className="flex flex-wrap gap-1 max-w-[300px]">
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
                    <TableActions
              onEdit={() => onEdit(row.original)}
              onDelete={() => onDelete(row.original.id)}
              t={t}
            />
                );
            },
        },
    ];
