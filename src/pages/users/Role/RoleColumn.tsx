import type { RoleResponse } from "@/types/users/Role";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
import { SortableHeader } from "@/utils/sort-table-header";
import { formatDate } from "@/utils/formatDate";
import type { TranslationKey } from "@/i18n/locales/en";
import { StatusBadge } from "@/components/ui/status-badge";
import { KeyRound } from "lucide-react";

interface RoleColumnsProps {
  onEdit: (role: RoleResponse) => void;
  onDelete: (id: number) => void;
  onViewPermissions?: (role: RoleResponse) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  t?: (key: TranslationKey, fallback?: string) => string;
}

export const RoleColumns = ({
  onEdit,
  onDelete,
  onViewPermissions,
  canEdit = true,
  canDelete = true,
  t,
}: RoleColumnsProps): ColumnDef<RoleResponse>[] => [

  {
    accessorKey: "code",
    header: ({ column }) => (
      <SortableHeader
        column={column}
        title={t ? t("common.code") : "Role Code"}
      />
    ),
    cell: ({ row }) => (
      <button
        type="button"
        onClick={() => onViewPermissions?.(row.original)}
        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-colors cursor-pointer text-left"
        title="View role permissions"
      >
        {row.original.code}
      </button>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader
        column={column}
        title={t ? t("common.name") : "Role Name"}
      />
    ),
    cell: ({ row }) => (
      <button
        type="button"
        onClick={() => onViewPermissions?.(row.original)}
        className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer text-left"
        title="View role permissions"
      >
        {row.original.name}
      </button>
    ),
  },
  {
    accessorKey: "permissions",
    header: t ? t("nav.role_permissions") : "Permissions",
    cell: ({ row }) => {
      const count = row.original.permissionIds?.length || 0;
      return (
        <button
          type="button"
          onClick={() => onViewPermissions?.(row.original)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/80 text-muted-foreground border border-border/60 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all cursor-pointer group select-none"
          title="Click to view & manage role permissions"
        >
          <KeyRound className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
          <span>
            {count} {count === 1 ? "permission" : "permissions"}
          </span>
        </button>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader
        column={column}
        title={t ? t("common.created_at") : "Created Date"}
      />
    ),
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
      if (!canEdit && !canDelete && !onViewPermissions) {
        return <span className="text-[#a1acb8] text-sm">-</span>;
      }
      return (
        <TableActions
          onView={onViewPermissions ? () => onViewPermissions(row.original) : undefined}
          onEdit={canEdit ? () => onEdit(row.original) : undefined}
          onDelete={canDelete ? () => onDelete(row.original.id) : undefined}
          t={t}
        />
      );
    },
  },
];
