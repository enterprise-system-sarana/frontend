import { useEffect } from "react";
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
import FormTextField, { FormRadioGroupField } from "@/components/ui/FormTextField";
import { FileUpload } from "@/components/ui/FileUpload";
import { StoreSchema } from "@/types/inventory/Store";
import type { StoreRequest, StoreResponse } from "@/types/inventory/Store";
import { useStore } from "@/hooks/inventory/useStore";
import { Status, StatusOptions } from "@/types/enum/status";

type FormStoreProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  store: StoreResponse | null;
};

const FormStore = ({ open, setOpen, store }: FormStoreProps) => {
  const { mutate: createStoreMutate, isPending: isCreating } = useStore.useCreateStore();
  const { mutate: updateStoreMutate, isPending: isUpdating } = useStore.useUpdateStore();
  const isPending = isCreating || isUpdating;

  const form = useForm({
    defaultValues: {
      name: store?.name || "",
      code: store?.code || "",
      logo: store?.logo || "",
      email: store?.email || "",
      phone: store?.phone || "",
      address1: store?.address1 || "",
      address2: store?.address2 || "",
      city: store?.city || "",
      state: store?.state || "",
      postalCode: store?.postalCode || "",
      country: store?.country || "",
      currencyCode: store?.currencyCode || "",
      receiptHeader: store?.receiptHeader || "",
      receiptFooter: store?.receiptFooter || "",
      status: store?.status || Status.ACTIVE,
    } as StoreRequest,
    validators: {
      onSubmit: StoreSchema as any,
    },
    onSubmit: async ({ value }) => {
      const payload = value as StoreRequest;
      const handleSuccess = () => {
        setOpen(false);
        form.reset();
      };

      if (store) {
        updateStoreMutate(
          { id: store.id, req: payload },
          { onSuccess: handleSuccess },
        );
      } else {
        createStoreMutate(payload, { onSuccess: handleSuccess });
      }
    },
  });

  useEffect(() => {
    form.reset();
  }, [store, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold">
            {store ? "Edit" : "Create"} Store
          </DialogTitle>
        </DialogHeader>

        <form
          id="store-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            {/* Name & Code */}
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

            {/* Email & Phone */}
            <FormTextField
              form={form}
              name="email"
              label="Email"
              placeholder="e.g. store@example.com"
              type="email"
              autoComplete="off"
              required
            />
            <FormTextField
              form={form}
              name="phone"
              label="Phone"
              placeholder="e.g. +855 12 345 678"
              type="text"
              autoComplete="off"
            />

            {/* Address 1 & Address 2 */}
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

            {/* City & State */}
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

            {/* Postal Code & Country */}
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

            {/* Logo Upload & Currency Code */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Store Logo
              </label>
              <FileUpload
                value={form.state.values.logo || store?.logo}
                onUploaded={(fileName) => {
                  form.setFieldValue("logo", fileName);
                }}
                onRemove={() => {
                  form.setFieldValue("logo", "");
                }}
                defaultBucket="store"
                bucketName="store"
              />
            </div>
            <FormTextField
              form={form}
              name="currencyCode"
              label="Currency Code"
              placeholder="e.g. USD / KHR"
              type="text"
              autoComplete="off"
            />

            {/* Receipt Header & Footer */}
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

            {/* Status Radio Inputs */}
            <div className="sm:col-span-2">
              <FormRadioGroupField
                form={form}
                name="status"
                label="Status"
                required
                options={StatusOptions}
              />
            </div>
          </FieldGroup>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="rounded-xl">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="store-form" disabled={isPending} className="rounded-xl shadow-md shadow-primary/20">
            {isPending ? "Saving..." : store ? "Update Store" : "Create Store"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormStore;
