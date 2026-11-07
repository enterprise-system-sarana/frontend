import { useEffect, useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  FormTextareaField,
} from "@/components/ui/FormTextField";
import { FileUpload } from "@/pages/FileUpload";
import {
  StoreSchema,
  type StoreRequest,
  type StoreResponse,
} from "@/types/inventory/Store";
import { useStore } from "@/hooks/inventory/useStore";
import { Status, StatusOptions } from "@/types/enum/status";
import { ROUTERS } from "@/constants/Route";
import { Loader2, RefreshCw } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { generateSequentialCode } from "@/utils/codeGenerator";

export type StoreFormProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  store?: StoreResponse | null;
  onSuccess?: (store: StoreResponse) => void;
};

export default function StoreForm({
  open = true,
  setOpen,
  store: propStore = null,
  onSuccess,
}: Partial<StoreFormProps>) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // If opened via URL /store/edit/:id and no propStore provided, fetch by id
  const shouldFetchById = !propStore && Boolean(id);
  const { data: storeDetailData, isLoading: isLoadingStore } =
    useStore.useGetStoreById(Number(id), shouldFetchById);
  const { data: storeListData } = useStore.useGetAllStore({
    page: 1,
    size: 1000,
  });

  const storeList: StoreResponse[] = useMemo(() => {
    const payload = (storeListData as any)?.payload ?? storeListData;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload)) return payload;
    return [];
  }, [storeListData]);

  const store =
    propStore ??
    storeDetailData?.payload?.data ??
    storeDetailData?.payload ??
    storeDetailData?.data ??
    null;

  const isEditing = Boolean(store?.id || (id && shouldFetchById));

  const { mutate: createStoreMutate, isPending: isCreating } =
    useStore.useCreateStore();
  const { mutate: updateStoreMutate, isPending: isUpdating } =
    useStore.useUpdateStore();
  const isPending = isCreating || isUpdating || isLoadingStore;

  const form = useForm({
    defaultValues: {
      name: "",
      code: "",
      logo: "",
      email: "",
      phone: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      currencyCode: "",
      receiptHeader: "",
      receiptFooter: "",
      status: Status.ACTIVE,
    } as StoreRequest,
    validators: {
      onSubmit: StoreSchema as any,
    },
    onSubmit: async ({ value }) => {
      const payload = {
        name: value.name?.trim() || "",
        code: value.code?.trim() || "",
        logo: value.logo || "",
        email: value.email?.trim() || "",
        phone: value.phone?.trim() || "",
        address1: value.address1?.trim() || "",
        address2: value.address2?.trim() || "",
        city: value.city?.trim() || "",
        state: value.state?.trim() || "",
        postalCode: value.postalCode?.trim() || "",
        country: value.country?.trim() || "",
        currencyCode: value.currencyCode?.trim() || "",
        receiptHeader: value.receiptHeader?.trim() || "",
        receiptFooter: value.receiptFooter?.trim() || "",
        status: value.status || Status.ACTIVE,
      } as StoreRequest;

      const handleSuccess = (response: any) => {
        const savedStore =
          response?.payload?.data ??
          response?.payload ??
          response?.data ??
          response;
        if (setOpen) {
          setOpen(false);
        } else {
          navigate(ROUTERS.STORE);
        }
        form.reset();
        onSuccess?.(savedStore as StoreResponse);
      };

      const storeId = store?.id ?? (id ? Number(id) : undefined);
      if (isEditing && storeId) {
        updateStoreMutate(
          { id: storeId, req: payload },
          { onSuccess: handleSuccess },
        );
      } else {
        createStoreMutate(payload, {
          onSuccess: handleSuccess,
        });
      }
    },
  });

  // Populate form fields in edit mode or reset on new store / open
  useEffect(() => {
    if (!open) return;

    if (store && typeof store === "object") {
      form.setFieldValue("name", store.name || "");
      form.setFieldValue("code", store.code || "");
      form.setFieldValue("logo", store.logo || "");
      form.setFieldValue("email", store.email || "");
      form.setFieldValue("phone", store.phone || "");
      form.setFieldValue("address1", store.address1 || "");
      form.setFieldValue("address2", store.address2 || "");
      form.setFieldValue("city", store.city || "");
      form.setFieldValue("state", store.state || "");
      form.setFieldValue("postalCode", store.postalCode || "");
      form.setFieldValue("country", store.country || "");
      form.setFieldValue("currencyCode", store.currencyCode || "");
      form.setFieldValue("receiptHeader", store.receiptHeader || "");
      form.setFieldValue("receiptFooter", store.receiptFooter || "");
      form.setFieldValue("status", (store.status as Status) || Status.ACTIVE);
    } else {
      form.reset({
        name: "",
        code: generateSequentialCode(storeList, "STR"),
        logo: "",
        email: "",
        phone: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        currencyCode: "",
        receiptHeader: "",
        receiptFooter: "",
        status: Status.ACTIVE,
      });
    }
  }, [store, open, storeList]);

  const handleClose = () => {
    if (isPending) return;
    if (setOpen) {
      setOpen(false);
    } else {
      navigate(ROUTERS.STORE);
    }
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => (!val ? handleClose() : setOpen?.(val))}>
      <DialogContent className="w-[calc(100%-1.5rem)] !max-w-[1100px] max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col gap-0 rounded-2xl border border-border/60 bg-background p-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="shrink-0 border-b border-border/60 bg-muted/20 px-6 py-5">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {isEditing ? t("common.edit") : t("common.create")}{" "}
            {t("inventory.store")}
          </DialogTitle>
        </DialogHeader>

        {/* Form Body - scrollable */}
        <form
          id="store-form"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8"
        >
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left Column: Basic Information & Receipt */}
            <section className="space-y-5 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <h3 className="border-b border-border/50 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("common.general_info", "General Information")}
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <FormTextField
                      form={form}
                      name="code"
                      label={t("common.code")}
                      placeholder="e.g. STR-001"
                      type="text"
                      autoComplete="off"
                      required
                    />
                  </div>
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="mb-0.5 size-10 shrink-0"
                      title="Generate store code"
                      aria-label="Generate store code"
                      onClick={() =>
                        form.setFieldValue(
                          "code",
                          generateSequentialCode(
                            storeList,
                            "STR",
                            form.state.values.code,
                          ),
                        )
                      }
                    >
                      <RefreshCw className="size-4" />
                    </Button>
                  )}
                </div>
                <FormTextField
                  form={form}
                  name="name"
                  label={t("common.name")}
                  placeholder="e.g. Main Branch Store"
                  type="text"
                  autoComplete="off"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormTextField
                  form={form}
                  name="email"
                  label={t("common.email")}
                  placeholder="e.g. store@example.com"
                  type="email"
                  autoComplete="off"
                  required
                />
                <FormTextField
                  form={form}
                  name="phone"
                  label={t("common.phone")}
                  placeholder="e.g. +855 12 345 678"
                  type="text"
                  autoComplete="off"
                />
              </div>

              <FormTextareaField
                form={form}
                name="receiptHeader"
                label="Receipt Header Text"
                placeholder="e.g. Welcome to Sarana Store!"
              />

              <FormTextareaField
                form={form}
                name="receiptFooter"
                label="Receipt Footer Text"
                placeholder="e.g. Thank you for shopping with us!"
              />
            </section>

            {/* Right Column: Location, Logo & Status */}
            <section className="space-y-5 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <h3 className="border-b border-border/50 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("common.location_branding", "Location & Branding")}
              </h3>

              <FormTextareaField
                form={form}
                name="address1"
                label={t("common.address", "Address")}
                placeholder="e.g. #123, St 271"
                type="text"
                autoComplete="off"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  name="state"
                  label="State / Province"
                  placeholder="e.g. Phnom Penh"
                  type="text"
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormTextField
                  form={form}
                  name="postalCode"
                  label="Postal Code"
                  placeholder="e.g. 12000"
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
              </div>

              {/* <FormTextField
                form={form}
                name="address2"
                label={t("common.address_2", "Address 2")}
                placeholder="e.g. Sangkat / District"
                type="text"
                autoComplete="off"
              /> */}

              {/* <FormTextField
                form={form}
                name="currencyCode"
                label={t("common.currency_code", "Currency Code")}
                placeholder="e.g. USD"
                type="text"
                autoComplete="off"
              /> */}

              <div>
                <form.Subscribe selector={(state) => [state.values.logo]}>
                  {([logo]) => (
                    <FileUpload
                      label="Store Logo"
                      value={logo || ""}
                      onUploaded={(fileName) => {
                        form.setFieldValue("logo", fileName);
                      }}
                      onRemove={() => {
                        form.setFieldValue("logo", "");
                      }}
                      defaultBucket="store"
                      bucketName="store"
                    />
                  )}
                </form.Subscribe>
              </div>

              <div className="pt-2">
                <FormRadioGroupField
                  form={form}
                  name="status"
                  label={t("common.status")}
                  required
                  options={StatusOptions.filter((o) => o.value !== Status.DELETE)}
                />
              </div>
            </section>
          </div>
        </form>

        {/* Footer */}
        <DialogFooter className="relative z-10 mb-2 shrink-0 flex-row items-center justify-end gap-3 border-t border-border/60 bg-muted/20 px-6 py-4 sm:px-8">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={handleClose}
            >
              {t("common.cancel")}
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="store-form"
            disabled={isPending}
            className="min-w-[130px]"
          >
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("common.saving")}
              </span>
            ) : isEditing ? (
              t("common.save")
            ) : (
              `${t("common.create")} ${t("inventory.store")}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { StoreForm };
