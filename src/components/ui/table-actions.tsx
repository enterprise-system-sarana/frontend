import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, PencilLine, Trash2 } from "lucide-react";
import type { TranslationKey } from "@/i18n/locales/en";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface TableActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  t?: (key: TranslationKey, fallback?: string) => string;
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  className,
}: {
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={cn("text-muted-foreground", className)}
        >
          <Icon className="size-[18px]" strokeWidth={1.75} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Inline row actions (view / edit / delete) shown as icon buttons with tooltips. */
export function TableActions({
  onView,
  onEdit,
  onDelete,
  t: propT,
}: TableActionsProps) {
  const { t: contextT } = useLanguage();
  const t = propT || contextT;
  if (!onView && !onEdit && !onDelete) return null;

  return (
    <div className="flex items-center gap-0.5">
      {onView && (
        <ActionButton
          label={t("common.view" as TranslationKey, "View Details")}
          icon={Eye}
          onClick={onView}
          className="hover:bg-primary-light/60 hover:text-primary"
        />
      )}
      {onEdit && (
        <ActionButton
          label={t("common.edit" as TranslationKey, "Edit")}
          icon={PencilLine}
          onClick={onEdit}
          className="hover:bg-primary-light/60 hover:text-primary"
        />
      )}
      {onDelete && (
        <ActionButton
          label={t("common.delete" as TranslationKey, "Delete")}
          icon={Trash2}
          onClick={onDelete}
          className="hover:bg-danger-soft hover:text-destructive"
        />
      )}
    </div>
  );
}
