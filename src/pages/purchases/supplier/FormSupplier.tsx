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
import { Status } from "@/types/enum/status";
import { SupplierSchema, type SupplierRequest, type SupplierResponse } from "@/types/purchases/Supplier";
import { useSupplier } from "@/hooks/purchases/useSupplier";


type FormSupplierProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  supplier: SupplierResponse | null;
};

const FormSupplier = ({ open, setOpen, supplier }: FormSupplierProps) => {
  const { mutate: createSupplierMutate, isPending: isCreating } = useSupplier.useCreateSupplier();
  const { mutate: updateSupplierMutate, isPending: isUpdating } = useSupplier.useUpdateSupplier()

  const isPending = isCreating || isUpdating;
  const form = useForm({
    defaultValues: {
      name: supplier?.name || "",
      addressOne: supplier?.addressOne || "",
      addressTwo: supplier?.addressTwo || "",
      phone: supplier?.phone || "",
      email: supplier?.email || "",
      address: supplier?.address || "",
      status: supplier?.status || Status.Active,
    } as SupplierRequest,
    validators: {
      onSubmit: SupplierSchema,
    },
    onSubmit: async ({ value }) => {
      const payload = value as SupplierRequest;
      const handleSuccess = () => {
        setOpen(false);
        form.reset();
      };

      if (supplier) {
        updateSupplierMutate(
          { id: supplier.id, request: payload },
          { onSuccess: handleSuccess },
        );
      } else {
        createSupplierMutate(payload, { onSuccess: handleSuccess });
      }
    },
  });

  useEffect(() => {
    form.reset();
  }, [supplier, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit" : "Create"} supplier</DialogTitle>
        </DialogHeader>

        <form
          id="supplier-form"
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
              placeholder="Enter supplier name"
              type="text"
              autoComplete="off"
              required
            />
            <FormTextField
              form={form}
              name="addressOne"
              label="Address One"
              placeholder="Enter address one"
              type="text"
              autoComplete="off"
            />
            <FormTextField
              form={form}
              name="addressTwo"
              label="Address Two"
              placeholder="Enter address two"
              type="text"
              autoComplete="off"
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
              name="email"
              label="Email"
              placeholder="Enter email"
              type="email"
              autoComplete="off"
              required
            />
            <FormTextField
              form={form}
              name="address"
              label="Address"
              placeholder="Enter full address"
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
          <Button type="submit" form="supplier-form" disabled={isPending}>
            {isPending ? "Saving..." : supplier ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormSupplier;
