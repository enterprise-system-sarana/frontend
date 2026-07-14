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
import FormTextField, { FormSelectField } from "@/components/ui/FormTextField";
import { StoreSchema } from "@/types/inventory/Store";
import type { StoreRequest, StoreResponse } from "@/types/inventory/Store";
import { Status } from "@/types/enum/status";
import { useStore } from "@/hooks/inventory/useStore";

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
      status: store?.status || Status.Active,
    } as StoreRequest,
    validators: {
      onSubmit: StoreSchema,
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
          <DialogTitle>{store ? "Edit" : "Create"} store</DialogTitle>
        </DialogHeader>

        <form
          id="store-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            <FormTextField
              form={form}
              name="name"
              label="Name"
              placeholder="Enter store name"
              type="text"
              autoComplete="off"
              required
            />
            <FormTextField
              form={form}
              name="code"
              label="Code"
              placeholder="Enter store code"
              type="text"
              autoComplete="off"
              required
            />
            <FormTextField
              form={form}
              name="logo"
              label="Logo URL"
              placeholder="Enter logo URL"
              type="text"
              autoComplete="off"
            />
            <FormTextField
              form={form}
              name="email"
              label="Email"
              placeholder="Enter store email"
              type="email"
              autoComplete="off"
              required
            />
            <FormTextField
              form={form}
              name="phone"
              label="Phone"
              placeholder="Enter phone number"
              type="text"
              autoComplete="off"
              required
            />
            <FormTextField
              form={form}
              name="address1"
              label="Address 1"
              placeholder="Enter primary address"
              type="text"
              autoComplete="off"
              required
            />
            <FormTextField
              form={form}
              name="address2"
              label="Address 2"
              placeholder="Enter secondary address"
              type="text"
              autoComplete="off"
            />
            <FormTextField
              form={form}
              name="city"
              label="City"
              placeholder="Enter city"
              type="text"
              autoComplete="off"
              required
            />
            <FormTextField
              form={form}
              name="state"
              label="State"
              placeholder="Enter state"
              type="text"
              autoComplete="off"
              required
            />
            <FormTextField
              form={form}
              name="postalCode"
              label="Postal Code"
              placeholder="Enter postal code"
              type="text"
              autoComplete="off"
              required
            />
            <FormTextField
              form={form}
              name="country"
              label="Country"
              placeholder="Enter country"
              type="text"
              autoComplete="off"
              required
            />
            <FormTextField
              form={form}
              name="currencyCode"
              label="Currency Code"
              placeholder="Enter currency code"
              type="text"
              autoComplete="off"
              required
            />
            <FormTextField
              form={form}
              name="receiptHeader"
              label="Receipt Header"
              placeholder="Enter receipt header"
              type="text"
              autoComplete="off"
              required
            />
            <FormTextField
              form={form}
              name="receiptFooter"
              label="Receipt Footer"
              placeholder="Enter receipt footer"
              type="text"
              autoComplete="off"
              required
            />
            <FormSelectField
              form={form}
              name="status"
              label="Status"
              required={true}
              placeholder="Select Status"
              options={Object.entries(Status).map(([, value]) => ({
                value: value,
                label: value,
              })) || []}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="store-form" disabled={isPending}>
            {isPending ? "Saving..." : store ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormStore;
