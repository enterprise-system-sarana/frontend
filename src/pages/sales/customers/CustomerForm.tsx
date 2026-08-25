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
  CustomerSchema,
  type CustomerRequest,
  type CustomerResponse,
} from "@/types/sales/Customer";
import { useCustomer } from "@/hooks/sales/useCustomer";
import { Status, StatusOptions } from "@/types/enum/status";

type FormCustomerProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  customer: CustomerResponse | null;
};

const FormCustomer = ({ open, setOpen, customer }: FormCustomerProps) => {
  const { mutate: createCustomerMutate, isPending: isCreating } =
    useCustomer.useCreateCustomer();
  const { mutate: updateCustomerMutate, isPending: isUpdating } =
    useCustomer.useUpdateCustomer();

  const isPending = isCreating || isUpdating;

  const form = useForm({
    defaultValues: {
      code: customer?.code ?? "",
      name: customer?.name ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      note: customer?.note ?? "",
      status: customer?.status ?? Status.ACTIVE,
    } as CustomerRequest,
    validators: {
      onSubmit: CustomerSchema,
    },
    onSubmit: async ({ value }) => {
      const payload = value as CustomerRequest;
      const handleSuccess = () => {
        setOpen(false);
        form.reset();
      };

      if (customer) {
        updateCustomerMutate(
          { id: customer.id, req: payload },
          { onSuccess: handleSuccess }
        );
      } else {
        createCustomerMutate(payload, { onSuccess: handleSuccess });
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, customer, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold">
            {customer ? "Edit" : "Create"} Customer
          </DialogTitle>
        </DialogHeader>

        <form
          id="customer-form"
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
              label="Customer Code"
              placeholder="CUS-001"
              type="text"
              autoComplete="off"
              required
            />
            <FormTextField
              form={form}
              name="name"
              label="Customer Name"
              placeholder="John Doe"
              type="text"
              autoComplete="off"
              required
            />

            {/* Email & Phone */}
            <FormTextField
              form={form}
              name="email"
              label="Email"
              placeholder="customer@example.com"
              type="email"
              autoComplete="off"
            />
            <FormTextField
              form={form}
              name="phone"
              label="Phone Number"
              placeholder="+123456789"
              type="text"
              autoComplete="off"
            />

            {/* Note */}
            <div className="sm:col-span-2">
              <FormTextField
                form={form}
                name="note"
                label="Note / Remarks"
                placeholder="Optional customer notes..."
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
                required
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
            form="customer-form"
            disabled={isPending}
            className="rounded-xl shadow-md shadow-primary/20 bg-[#0B1120] hover:bg-[#0B1120]/90 text-white"
          >
            {isPending ? "Saving..." : customer ? "Update Customer" : "Create Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormCustomer;
