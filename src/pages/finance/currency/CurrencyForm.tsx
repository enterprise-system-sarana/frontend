import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useEffect } from "react";
import { CurrencySchema } from "@/types/finance/Currency";
import type { CurrencyResponse, CurrencyRequest } from "@/types/finance/Currency";
import { Status } from "@/types/enum/status";
import FormTextField, { FormRadioGroupField } from "@/components/ui/FormTextField";
import { useCurrency } from "@/hooks/finance/useCurrency";
import { useLanguage } from "@/i18n/LanguageContext";
import { ArrowRightLeft, Coins, Loader2, Sparkles } from "lucide-react";

type FormCurrencyProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    currency: CurrencyResponse | null;
};

// Popular currency quick presets for 1-click configuration
const PRESET_CURRENCIES = [
    { flag: "🇰🇭", code: "KHR", name: "Cambodian Riel", symbol: "៛", rate: 4100, operation: "Multiply" },
    { flag: "🇺🇸", code: "USD", name: "US Dollar", symbol: "$", rate: 1.0, operation: "Base Currency" },

];

const FormCurrency = ({ open, setOpen, currency }: FormCurrencyProps) => {
    const { t } = useLanguage();
    const { mutate: createCurrencyMutate, isPending: isCreating } = useCurrency.CreateCurrency();
    const { mutate: updateCurrencyMutate, isPending: isUpdating } = useCurrency.UpdateCurrency();

    const isPending = isCreating || isUpdating;

    const form = useForm({
        defaultValues: {
            code: currency?.code || "",
            name: currency?.name || "",
            operation: currency?.operation || "",
            rate: currency?.rate || 1.0,
            symbol: currency?.symbol || "",
            status: (currency?.status as Status) || Status.ACTIVE,
        } as CurrencyRequest,

        validators: {
            onSubmit: CurrencySchema as any,
        },

        onSubmit: async ({ value }) => {
            const payload: CurrencyRequest = {
                ...value,
                code: value.code.trim().toUpperCase(),
                rate: Number(value.rate),
            };

            const handleSuccess = () => {
                setOpen(false);
                form.reset();
            };

            if (currency) {
                updateCurrencyMutate(
                    { id: currency.id, req: payload },
                    { onSuccess: handleSuccess }
                );
            } else {
                createCurrencyMutate(payload, { onSuccess: handleSuccess });
            }
        },
    });

    useEffect(() => {
        if (open) {
            form.reset();
        }
    }, [currency, open, form]);

    // Code generator: cycles through popular currency presets or generates a random 3-letter code
    const handleGenerateCode = () => {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const currentCode = form.getFieldValue("code");

        // Check if matching an existing preset to pick the next one
        const currentIdx = PRESET_CURRENCIES.findIndex((p) => p.code === currentCode);
        if (currentIdx >= 0 && currentIdx < PRESET_CURRENCIES.length - 1) {
            const nextPreset = PRESET_CURRENCIES[currentIdx + 1];
            form.setFieldValue("code", nextPreset.code);
            form.setFieldValue("name", nextPreset.name);
            form.setFieldValue("symbol", nextPreset.symbol);
            form.setFieldValue("rate", nextPreset.rate);
            form.setFieldValue("operation", nextPreset.operation);
            return;
        }

        if (!currentCode) {
            // Default to first preset if empty
            const first = PRESET_CURRENCIES[0];
            form.setFieldValue("code", first.code);
            form.setFieldValue("name", first.name);
            form.setFieldValue("symbol", first.symbol);
            form.setFieldValue("rate", first.rate);
            form.setFieldValue("operation", first.operation);
            return;
        }

        // Generate clean 3-character ISO code
        const random3 = Array.from({ length: 3 }, () =>
            letters[Math.floor(Math.random() * letters.length)]
        ).join("");
        form.setFieldValue("code", random3);
    };

    const handleSelectPreset = (preset: (typeof PRESET_CURRENCIES)[0]) => {
        form.setFieldValue("code", preset.code);
        form.setFieldValue("name", preset.name);
        form.setFieldValue("symbol", preset.symbol);
        form.setFieldValue("rate", preset.rate);
        form.setFieldValue("operation", preset.operation);
    };

    const statusOptions = [
        { value: Status.ACTIVE, label: t("common.active", "Active") },
        { value: Status.INACTIVE, label: t("common.inactive", "Inactive") },
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <Coins className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold font-heading">
                                {currency ? t("common.edit") : t("common.create")}{" "}
                                {t("finance.currency", "Currency")}
                            </DialogTitle>

                        </div>
                    </div>
                </DialogHeader>

                <form
                    id="currency-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="space-y-4 pt-1"
                >
                    {/* Quick Preset Buttons (Create mode) */}
                    {!currency && (
                        <div className="rounded-xl border border-border/70  p-2 ">
                            {/* <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                    <Sparkles className="size-3.5 text-primary" />
                                    {t("finance.quick_presets", "Quick Presets")}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                    {t("common.click_to_autofill", "Click to autofill")}
                                </span>
                            </div> */}
                            <div className="flex flex-wrap gap-1.5">
                                {PRESET_CURRENCIES.map((p) => (
                                    <button
                                        key={p.code}
                                        type="button"
                                        onClick={() => handleSelectPreset(p)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-2.5 py-1 text-xs font-semibold hover:border-primary hover:bg-primary/5 hover:text-primary transition-all cursor-pointer shadow-2xs"
                                    >
                                        <span>{p.flag}</span>
                                        <span>{p.code}</span>
                                        <span className="text-muted-foreground font-normal">
                                            ({p.symbol})
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Form Fields Grid */}
                    <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                        {/* Code Field with Generate Button */}
                        <div className="flex items-end gap-2">
                            <div className="min-w-0 flex-1">
                                <FormTextField
                                    form={form}
                                    name="code"
                                    label={t("common.code", "Currency Code")}
                                    placeholder="e.g. USD, KHR"
                                    type="text"
                                    autoComplete="off"
                                    required
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="shrink-0 h-11 w-11 rounded-md border-border/70 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all cursor-pointer"
                                title={t("common.generate_code", "Generate / Next Code")}
                                onClick={handleGenerateCode}
                            >
                                <Sparkles className="size-4 text-primary" />
                            </Button>
                        </div>

                        {/* Currency Name */}
                        <FormTextField
                            form={form}
                            name="name"
                            label={t("finance.currency", "Currency Name")}
                            placeholder="e.g. US Dollar, Cambodian Riel"
                            type="text"
                            autoComplete="off"
                            required
                        />

                        {/* Symbol */}
                        <FormTextField
                            form={form}
                            name="symbol"
                            label={t("finance.symbol", "Symbol")}
                            placeholder="e.g. $, ៛, €, ฿"
                            type="text"
                            autoComplete="off"
                        />

                        {/* Exchange Rate */}
                        <FormTextField
                            form={form}
                            name="rate"
                            label={t("finance.exchange_rate", "Exchange Rate")}
                            placeholder="e.g. 1.0 or 4100"
                            type="number"
                            step="any"
                            autoComplete="off"
                            required
                        />

                        {/* Operation / Calculation Info */}
                        <FormTextField
                            form={form}
                            name="operation"
                            label={t("finance.operation", "Calculation Operation")}
                            placeholder="e.g. Base Currency, Multiply, Divide"
                            type="text"
                            autoComplete="off"
                        />

                        {/* Status Radio Selector */}

                    </FieldGroup>

                    {/* Live Currency Conversion Preview */}
                    <form.Subscribe
                        selector={(state) => [
                            state.values.code,
                            state.values.symbol,
                            state.values.rate,
                        ]}
                    >
                        {([code, symbol, rate]) => {
                            if (!code && !rate) return null;
                            const numericRate = Number(rate || 1);
                            return (
                                <div className="flex items-center justify-between rounded-xl border border-primary/25 bg-primary/5 px-4 py-2.5 text-xs transition-all">
                                    <div className="flex items-center gap-2 text-primary font-medium">
                                        <ArrowRightLeft className="size-3.5" />
                                        <span>{t("finance.rate_preview", "Exchange Rate Preview")}:</span>
                                    </div>
                                    <div className="font-mono font-bold text-foreground">
                                        1 USD = {numericRate.toLocaleString()} {symbol || ""}{" "}
                                        {code ? `(${code.toUpperCase()})` : ""}
                                    </div>
                                </div>
                            );
                        }}
                    </form.Subscribe>
                </form>

                <DialogFooter showCloseButton={false}>
                    <DialogClose asChild>
                        <Button variant="outline" className="rounded-xl" disabled={isPending}>
                            {t("common.cancel", "Cancel")}
                        </Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        form="currency-form"
                        disabled={isPending}
                        className="rounded-xl"
                    >
                        {isPending ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="size-4 animate-spin" />
                                {t("common.saving", "Saving...")}
                            </span>
                        ) : currency ? (
                            t("common.save", "Save Changes")
                        ) : (
                            t("common.create", "Create Currency")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FormCurrency;
