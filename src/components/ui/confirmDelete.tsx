import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    entityName?: string;
    confirmDelete: () => void;
}

const ConfirmDelete = ({
    isOpen,
    setIsOpen,
    entityName,
    confirmDelete,
}: Props) => {
    const { t } = useLanguage();

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent className="max-w-[420px] gap-0">
                <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-danger-soft text-destructive">
                        <Trash2 className="size-5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 space-y-1 pt-0.5">
                        <AlertDialogTitle>
                            {t("common.delete")} {entityName || t("common.item")}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("common.confirm_delete_desc")}
                        </AlertDialogDescription>
                    </div>
                </div>
                <AlertDialogFooter className="mt-6">
                    <AlertDialogCancel className="min-w-24">
                        {t("common.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        className="min-w-24"
                        onClick={() => confirmDelete()}
                    >
                        <Trash2 className="size-4" />
                        {t("common.delete")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ConfirmDelete;
