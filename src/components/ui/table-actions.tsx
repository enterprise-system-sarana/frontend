import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, MoreHorizontal, PencilIcon, Trash2 } from "lucide-react";
import type { TranslationKey } from "@/i18n/locales/en";

interface TableActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  t?: (key: TranslationKey, fallback?: string) => string;
}

export function TableActions({
  onView,
  onEdit,
  onDelete,
  t,
}: TableActionsProps) {
  if (!onView && !onEdit && !onDelete) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" title="Actions">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {onView && (
          <DropdownMenuItem onClick={onView} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4 text-[#03c3ec]" />
            <span>{t ? t("common.view" as TranslationKey, "View Details") : "View Details"}</span>
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
            <PencilIcon className="mr-2 h-4 w-4 text-[#697a8d]" />
            <span>{t ? t("common.edit" as TranslationKey, "Edit") : "Edit"}</span>
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            onClick={onDelete}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4 text-[#ff3e1d]" />
            <span>{t ? t("common.delete" as TranslationKey, "Delete") : "Delete"}</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
