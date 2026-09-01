import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RoleResponse } from "@/types/users/Role";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, PencilIcon, Trash2, KeyRound } from "lucide-react";
import { SortableHeader } from "@/utils/sort-table-header";
import { formatDate } from "@/utils/formatDate";
import type { TranslationKey } from "@/i18n/locales/en";
import { StatusBadge } from "@/components/ui/status-badge";

interface RoleColumnsProps {
  onEdit: (role: RoleResponse) => void;
  onDelete: (id: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  t?: (key: TranslationKey, fallback?: string) => string;
}

export const RoleColumns = ({
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  t,
}: RoleColumnsProps): ColumnDef<RoleResponse>[] => [
  {
    accessorKey: "id",
    header: t ? t("common.id") : "Id",
    cell: ({ row }) => (
      <span className="font-semibold text-[#566a7f]">#{row.original.id}</span>
    ),
  },
  {
    accessorKey: "code",
    header: ({ column }) => (
      <SortableHeader
        column={column}
        title={t ? t("common.code") : "Role Code"}
      />
    ),
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
        {row.original.code}
      </span>
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
      <span className="font-semibold text-foreground">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "permissions",
    header: t ? t("nav.role_permissions") : "Permissions",
    cell: ({ row }) => {
      const count = row.original.permissionIds?.length || 0;
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/60">
          <KeyRound className="h-3 w-3 text-muted-foreground" />
          <span>
            {count} {count === 1 ? "permission" : "permissions"}
          </span>
        </span>
      );
    },
  },
//   {
//     accessorKey: "description",
//     header: t ? t("common.description") : "Description",
//     cell: ({ row }) => (
//       <span className="truncate max-w-\[280px] block text-muted-foreground text-xs">
//         {row.original.description || "-"}
//       </span>
//     ),
//   },
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
          <DropdownMenuContent
            align="end"
            className="w-40 shadow-[0_3px_12px_rgba(67,89,113,0.15)] border-[#e7e7e8]"
          >
            {canEdit && (
              <DropdownMenuItem
                className="cursor-pointer text-[#697a8d] focus:text-[#696cff] focus:bg-[#696cff]/8"
                onClick={() => onEdit(row.original)}
              >
                <PencilIcon className="mr-2 h-4 w-4" />{" "}
                {t ? t("common.edit") : "Edit"}
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                className="cursor-pointer text-[#ff3e1d] focus:text-[#ff3e1d] focus:bg-[#ff3e1d]/8"
                onClick={() => onDelete(row.original.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />{" "}
                {t ? t("common.delete") : "Delete"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
