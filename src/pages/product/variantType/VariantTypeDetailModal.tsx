import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import type { VariantTypeResponse } from "@/types/product/VariantType";
import { useLanguage } from "@/i18n/LanguageContext";

type VariantTypeDetailModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    variantType: VariantTypeResponse | null;
};

const VariantTypeDetailModal = ({
    open,
    onOpenChange,
    variantType,
}: VariantTypeDetailModalProps) => {
    const { t } = useLanguage();
    const values = variantType?.values || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="border-b border-border/60 pb-4">
                    <div className="flex items-center justify-between gap-3 pr-6">
                        <div className="min-w-0">
                            <DialogTitle className="truncate">
                                {variantType?.name || t("variant.type", "Variant Type")}
                            </DialogTitle>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="rounded bg-muted px-2 py-0.5 font-medium text-foreground">
                                    {variantType?.code || "-"}
                                </span>
                                {variantType?.id && <span>ID #{variantType.id}</span>}
                            </div>
                        </div>
                        {variantType?.status && <StatusBadge status={variantType.status} />}
                    </div>
                </DialogHeader>

                <div className="min-h-0 overflow-y-auto py-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-foreground">
                            {t("variant.values", "Variant Values")}
                        </h3>
                        <Badge variant="secondary">{values.length}</Badge>
                    </div>

                    {values.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                            {t("variant.no_values", "No values")}
                        </div>
                    ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                            {values.map((value) => (
                                <div
                                    key={value.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {value.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {value.code || "-"}
                                        </p>
                                    </div>
                                    <StatusBadge status={value.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default VariantTypeDetailModal;
