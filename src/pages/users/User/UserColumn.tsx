import type { UserResponse } from "@/types/users/Users";
import { TableActions } from "@/components/ui/table-actions";
import type { ColumnDef } from "@tanstack/react-table";
import { Shield, Store } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { SortableHeader } from "@/utils/sort-table-header";
import { formatDate } from "@/utils/formatDate";
import type { TranslationKey } from "@/i18n/locales/en";
import { ImageCell } from "@/components/file/ImageCell";

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
            id: "user",
            accessorKey: "username",
            header: ({ column }) => <SortableHeader column={column} title={t ? t("nav.user") : "User"} />,
            cell: ({ row }) => {
                const user = row.original;
                const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;

                return (
                    <div className="flex items-center gap-3 min-w-[220px]">
                        <ImageCell
                            fileName={user.profileImage}
                            name={fullName}
                            bucketName="user"
                            className="h-10 w-10 rounded-lg shadow-sm flex-shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-foreground truncate">
                                {fullName || "-"}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono truncate">
                                {user.username || "-"}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            id: "email",
            accessorKey: "email",
            header: ({ column }) => <SortableHeader column={column} title={"Email"} />,
            cell: ({ row }) => <span className="text-xs text-[#566a7f]">{row.original.email || "-"}</span>,
        },
        {
            id: "phone",
            accessorKey: "phone",
            header: ({ column }) => <SortableHeader column={column} title={"Phone"} />,
            cell: ({ row }) => <span className="text-xs text-[#566a7f]">{row.original.phone || "-"}</span>,
        },
        {
            id: "store",
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
            id: "roles",
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
            id: "status",
            accessorKey: "isActive",
            header: t ? t("common.status") : "Status",
            cell: ({ row }) => <StatusBadge status={row.original.isActive} />,
        },
        {
            id: "createdAt",
            accessorKey: "createdAt",
            header: ({ column }) => <SortableHeader column={column} title={t ? t("common.created_at") : "Created Date"} />,
            cell: ({ row }) => (
                <span className="text-xs text-[#566a7f]">
                    {formatDate(row.original.createdAt)}
                </span>
            ),
        },
        {
            id: "actions",
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
