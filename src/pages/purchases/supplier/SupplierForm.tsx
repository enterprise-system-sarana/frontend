import { useEffect, useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FormTextField, {
  FormRadioGroupField,
} from "@/components/ui/FormTextField";
import {
  SupplierSchema,
  type SupplierResponse,
} from "@/types/purchases/Supplier";
import { useSupplier } from "@/hooks/purchases/useSupplier";
import { Status } from "@/types/enum/status";
import { useLanguage } from "@/i18n/LanguageContext";
import { RefreshCw } from "lucide-react";

import { generateSupplierCode } from "@/utils/codeGenerator";

export { generateSupplierCode };

type FormSupplierProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  supplier: SupplierResponse | null;
  onCreated?: (
    supplier: SupplierResponse | { payload?: SupplierResponse },
  ) => void;
};

const FormSupplier = ({
  open,
  setOpen,
  supplier,
  onCreated,
}: FormSupplierProps) => {
  const { t } = useLanguage();
  const { mutate: createSupplierMutate, isPending: isCreating } =
    useSupplier.useCreateSupplier();
  const { mutate: updateSupplierMutate, isPending: isUpdating } =
    useSupplier.useUpdateSupplier();

  const isPending = isCreating || isUpdating;

  // Fetch existing suppliers to generate the next unique code
  const { data: supplierData } = useSupplier.useGetAllSupplier({
    page: 1,
    size: 1000,
  });
  const supplierList: SupplierResponse[] = useMemo(() => {
    const payload = (supplierData as any)?.payload ?? supplierData;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload)) return payload;
    return [];
  }, [supplierData]);

  const form = useForm({
    defaultValues: {
      code: supplier?.code ?? generateSupplierCode(supplierList),
      name: supplier?.name ?? "",
      phone: supplier?.phone ?? "",
      email: supplier?.email ?? "",
      address: supplier?.address ?? "",
      city: supplier?.city ?? "",
      country: supplier?.country ?? "",
      note: supplier?.note ?? "",
      status: supplier?.status ?? Status.ACTIVE,
    },
    validators: {
      onSubmit: SupplierSchema,
    },
    onSubmit: async ({ value }) => {
      const handleSuccess = (response: SupplierResponse) => {
        if (!supplier) onCreated?.(response);
        setOpen(false);
        form.reset();
      };

      if (supplier) {
        updateSupplierMutate(
          { id: supplier.id, request: value },
          { onSuccess: handleSuccess },
        );
      } else {
        createSupplierMutate(value, { onSuccess: handleSuccess });
      }
    },
  });

  // Automatically generate supplier code when the dialog opens in Create mode
  useEffect(() => {
    if (open) {
      if (supplier) {
        form.reset({
          code: supplier.code ?? "",
          name: supplier.name ?? "",
          phone: supplier.phone ?? "",
          email: supplier.email ?? "",
          address: supplier.address ?? "",
          city: supplier.city ?? "",
          country: supplier.country ?? "",
          note: supplier.note ?? "",
          status: supplier.status ?? Status.ACTIVE,
        });
      } else {
        const nextCode = generateSupplierCode(supplierList);
        form.reset({
          code: nextCode,
          name: "",
          phone: "",
          email: "",
          address: "",
          city: "",
          country: "",
          note: "",
          status: Status.ACTIVE,
        });
      }
    }
  }, [open, supplier, supplierList]);

  const statusOptions = [
    { value: Status.ACTIVE, label: t("common.active") },
    { value: Status.INACTIVE, label: t("common.inactive") },
    { value: Status.DELETE, label: t("common.deleted") },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold">
            {supplier ? t("common.edit") : t("common.create")} {t("nav.supplier")}
          </DialogTitle>
        </DialogHeader>

        <form
          id="supplier-form"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            {/* Code & Name */}
            <div className="flex items-end gap-1.5">
              <div className="flex-1 min-w-0">
                <FormTextField
                  form={form}
                  name="code"
                  label={t("common.code")}
                  placeholder="SUP-001"
                  type="text"
                  autoComplete="off"
                  required
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-md border border-border/70 hover:bg-muted transition-colors flex items-center justify-center"
                title={t("supplier.generate_code", "Generate supplier code")}
                onClick={() => {
                  const current = form.state.values.code;
                  const newCode = generateSupplierCode(supplierList, current);
                  form.setFieldValue("code", newCode);
                }}
              >
                <RefreshCw className="size-4 text-muted-foreground" />
              </Button>
            </div>
            <FormTextField
              form={form}
              name="name"
              label={t("common.name")}
              placeholder="e.g. APPLE"
              type="text"
              autoComplete="off"
              required
            />

            {/* Phone & Email */}
            <FormTextField
              form={form}
              name="phone"
              label={t("common.phone")}
              placeholder="Phone"
              type="text"
              autoComplete="off"
            />
            <FormTextField
              form={form}
              name="email"
              label={t("common.email")}
              placeholder="Email"
              type="email"
              autoComplete="off"
            />

            {/* City & Country */}
            <FormTextField
              form={form}
              name="city"
              label={t("common.city")}
              placeholder="e.g. Phnom Penh"
              type="text"
              autoComplete="off"
            />
            <FormTextField
              form={form}
              name="country"
              label={t("common.country")}
              placeholder="e.g. Cambodia"
              type="text"
              autoComplete="off"
            />

            {/* Address */}
            <div className="sm:col-span-2">
              <FormTextField
                form={form}
                name="address"
                label={t("common.address")}
                placeholder="e.g. #123, St. 271, Sangkat TTP"
                type="text"
                autoComplete="off"
              />
            </div>

            {/* Note */}
            <div className="sm:col-span-2">
              <FormTextField
                form={form}
                name="note"
                label={t("common.notes")}
                placeholder="Optional supplier notes..."
                type="text"
                autoComplete="off"
              />
            </div>

            {/* Status */}
            <div className="sm:col-span-2">
              <FormRadioGroupField
                form={form}
                name="status"
                label={t("common.status")}
                options={statusOptions}
              />
            </div>
          </FieldGroup>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={isPending}
            >
              {t("common.cancel")}
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="supplier-form"
            disabled={isPending}
            className="rounded-xl shadow-md shadow-primary/20"
          >
            {isPending
              ? t("common.saving")
              : supplier
                ? t("common.save")
                : `${t("common.create")} ${t("nav.supplier")}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormSupplier;
