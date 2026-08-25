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
import {
  SupplierSchema,
  type SupplierResponse,
} from "@/types/purchases/Supplier";
import { useSupplier } from "@/hooks/purchases/useSupplier";
import { Status, StatusOptions } from "@/types/enum/status";

type FormSupplierProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  supplier: SupplierResponse | null;
};

const FormSupplier = ({ open, setOpen, supplier }: FormSupplierProps) => {
  const { mutate: createSupplierMutate, isPending: isCreating } =
    useSupplier.useCreateSupplier();
  const { mutate: updateSupplierMutate, isPending: isUpdating } =
    useSupplier.useUpdateSupplier();

  const isPending = isCreating || isUpdating;

  const form = useForm({
    defaultValues: {
      code: supplier?.code ?? "",
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
      const handleSuccess = () => {
        setOpen(false);
        form.reset();
      };

      if (supplier) {
        updateSupplierMutate(
          { id: supplier.id, request: value },
          { onSuccess: handleSuccess }
        );
      } else {
        createSupplierMutate(value, { onSuccess: handleSuccess });
      }
    },
  });

  console.log(form.state.values);
  // Sync form values whenever the dialog opens or the selected supplier changes
  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, supplier, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold">
            {supplier ? "Edit" : "Create"} Supplier
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
            <FormTextField
              form={form}
              name="code"
              label="Supplier Code"
              placeholder="SUP-001"
              type="text"
              autoComplete="off"
            />
            <FormTextField
              form={form}
              name="name"
              label="Supplier Name"
              placeholder="e.g. APPLE"
              type="text"
              autoComplete="off"
              required
            />

            {/* Phone & Email */}
            <FormTextField
              form={form}
              name="phone"
              label="Phone Number"
              placeholder="Phone"
              type="text"
              autoComplete="off"
            />
            <FormTextField
              form={form}
              name="email"
              label="Email"
              placeholder="Email"
              type="email"
              autoComplete="off"
            />

            {/* City & Country */}
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
              name="country"
              label="Country"
              placeholder="e.g. Cambodia"
              type="text"
              autoComplete="off"
            />

            {/* Address */}
            <div className="sm:col-span-2">
              <FormTextField
                form={form}
                name="address"
                label="Full Address"
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
                label="Note / Remarks"
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
                label="Status"
                options={StatusOptions}
              />
            </div>
          </FieldGroup>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="rounded-xl" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="supplier-form"
            disabled={isPending}
            className="rounded-xl shadow-md shadow-primary/20"
          >
            {isPending ? "Saving..." : supplier ? "Update Supplier" : "Create Supplier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormSupplier;