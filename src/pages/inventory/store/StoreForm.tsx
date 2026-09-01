import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import FormTextField, {
  FormRadioGroupField,
} from "@/components/ui/FormTextField";
import { FileUpload } from "@/pages/FileUpload";
import { StoreSchema } from "@/types/inventory/Store";
import type { StoreRequest } from "@/types/inventory/Store";
import { useStore } from "@/hooks/inventory/useStore";
import { Status, StatusOptions } from "@/types/enum/status";
import { ROUTERS } from "@/constants/Route";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function StoreForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  // Load existing store when editing
  const { data: storeDetailData, isLoading: isLoadingStore } =
    useStore.useGetStoreById(Number(id), isEditing);
  const store =
    storeDetailData?.payload?.data ||
    storeDetailData?.payload ||
    storeDetailData?.data ||
    storeDetailData;

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

      const handleSuccess = () => {
        toast.success(
          isEditing
            ? "Store updated successfully!"
            : "Store created successfully!"
        );
        navigate(ROUTERS.STORE);
      };

      const handleError = (err: any) => {
        toast.error(
          err?.response?.data?.message ||
          (isEditing ? "Failed to update store." : "Failed to create store.")
        );
      };

      if (isEditing && id) {
        updateStoreMutate(
          { id: Number(id), req: payload },
          {
            onSuccess: handleSuccess,
            onError: handleError,
          }
        );
      } else {
        createStoreMutate(payload, {
          onSuccess: handleSuccess,
          onError: handleError,
        });
      }
    },
  });

  // Populate form fields in edit mode
  useEffect(() => {
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
      form.setFieldValue("status", store.status || Status.ACTIVE);
    }
  }, [store]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigate(ROUTERS.STORE)}
            className="h-9 w-9 rounded-xl border-border/60 hover:bg-muted/60"
            title="Back to Stores"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold tracking-tight">
            {isEditing ? "Edit Store" : "Create New Store"}
          </h2>
        </div>
      </div>

      {/* Main Form */}
      <form
        id="store-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="space-y-4">
          {/* Card 1: Basic Information & Contact */}
          <Card className="rounded-2xl border-border/60 shadow-2xs">
            <CardContent className="space-y-5">
              <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <FormTextField
                  form={form}
                  name="name"
                  label="Store Name"
                  placeholder="e.g. Main Branch Store"
                  type="text"
                  autoComplete="off"
                  required
                />
                <FormTextField
                  form={form}
                  name="code"
                  label="Store Code"
                  placeholder="e.g. STR-001"
                  type="text"
                  autoComplete="off"
                  required
                />
                <FormTextField
                  form={form}
                  name="currencyCode"
                  label="Currency Code"
                  placeholder="e.g. USD / KHR"
                  type="text"
                  autoComplete="off"
                />
                <FormTextField
                  form={form}
                  name="email"
                  label="Email Address"
                  placeholder="e.g. store@example.com"
                  type="email"
                  autoComplete="off"
                  required
                />
                <FormTextField
                  form={form}
                  name="phone"
                  label="Phone Number"
                  placeholder="e.g. +855 12 345 678"
                  type="text"
                  autoComplete="off"
                />
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Card 2: Address & Location */}
          <Card className="rounded-2xl border-border/60 shadow-2xs">
            <CardContent className="space-y-5">
              <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormTextField
                  form={form}
                  name="address1"
                  label="Primary Address (Line 1)"
                  placeholder="e.g. Building 12, St. Monivong"
                  type="text"
                  autoComplete="off"
                />
                <FormTextField
                  form={form}
                  name="address2"
                  label="Secondary Address (Line 2)"
                  placeholder="e.g. Sangkat Boeung Keng Kang"
                  type="text"
                  autoComplete="off"
                />
              </FieldGroup>

              <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <FormTextField
                  form={form}
                  name="city"
                  label="City"
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
                  label="Country"
                  placeholder="e.g. Cambodia"
                  type="text"
                  autoComplete="off"
                />
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Card 3: Branding, Receipt Settings & Status */}
          <Card className="rounded-2xl border-border/60 shadow-2xs">
            <CardContent className="space-y-5">
              <FieldGroup className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="space-y-1">
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

                <div className="md:col-span-2 space-y-4">
                  <FormTextField
                    form={form}
                    name="receiptHeader"
                    label="Receipt Header Text"
                    placeholder="e.g. Welcome to Sarana Store!"
                    type="text"
                    autoComplete="off"
                  />
                  <FormTextField
                    form={form}
                    name="receiptFooter"
                    label="Receipt Footer Text"
                    placeholder="e.g. Thank you for shopping with us!"
                    type="text"
                    autoComplete="off"
                  />
                </div>
              </FieldGroup>

              <div className="pt-2 border-t border-border/40">
                <FormRadioGroupField
                  form={form}
                  name="status"
                  label="Status"
                  required
                  options={StatusOptions}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(ROUTERS.STORE)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="min-w-[140px] shadow-md shadow-primary/20"
            >
              {isPending ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : isEditing ? (
                "Update Store"
              ) : (
                "Create Store"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div >
  );
}

export { StoreForm };
