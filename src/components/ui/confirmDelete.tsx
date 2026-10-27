import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
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
            <AlertDialogContent>
                <AlertDialogHeader className="sm:text-left">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                            <Trash2 className="h-5 w-5" />
                        </div>
                        <div>
                            <AlertDialogTitle className="text-base font-bold font-heading">
                                {t("common.delete")} {entityName || t("common.item")}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-xs text-muted-foreground">
                                {t("common.confirm_delete_desc")}
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl font-medium">
                        {t("common.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        className="rounded-xl font-medium shadow-sm shadow-destructive/20"
                        onClick={() => confirmDelete()}
                    >
                        {t("common.delete")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ConfirmDelete;