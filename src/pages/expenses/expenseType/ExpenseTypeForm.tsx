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
import { useEffect } from "react";
import { StatusOptions, Status } from "@/types/enum/status";
import FormTextField, {
  FormRadioGroupField,
  FormTextareaField,
} from "@/components/ui/FormTextField";
import {
  ExpenseTypeSchema,
  type ExpenseTypeRequest,
  type ExpenseTypeResponse,
} from "@/types/expense/expense.type";
import { useExpenseType } from "@/hooks/expense/useExpenseType";

type ExpenseTypeFormProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  expenseType: ExpenseTypeResponse | null;
};

const FormExpenseType = ({
  open,
  setOpen,
  expenseType,
}: ExpenseTypeFormProps) => {
  const { mutate: createExpenseTypeMutate, isPending: isCreating } =
    useExpenseType.useCreateExpenseType();
  const { mutate: updateExpenseTypeMutate, isPending: isUpdating } =
    useExpenseType.useUpdateExpenseType();

  const isPending = isCreating || isUpdating;
  const form = useForm({
    defaultValues: {
      name: expenseType?.name || "",
      code: expenseType?.code || "",
      description: expenseType?.description || "",
      status: expenseType?.status || Status.ACTIVE,
    } as ExpenseTypeRequest,
    validators: {
      onSubmit: ExpenseTypeSchema,
    },
    onSubmit: async ({ value }) => {
      const payload = value as ExpenseTypeRequest;
      const handleSuccess = () => {
        setOpen(false);
        form.reset();
      };

      if (expenseType) {
        updateExpenseTypeMutate(
          { id: expenseType.id, req: payload },
          { onSuccess: handleSuccess },
        );
      } else {
        createExpenseTypeMutate(payload, { onSuccess: handleSuccess });
      }
    },
  });

  useEffect(() => {
    form.reset();
  }, [expenseType, open, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="md:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {expenseType ? "Edit" : "Create"} expense type
          </DialogTitle>
        </DialogHeader>
        <form
          id="expenseType-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <FormTextField
              //   className="col-span-2"
              form={form}
              name="code"
              label="Code"
              required={true}
              placeholder="Code"
              type="text"
            />
            <FormTextField
              form={form}
              name="name"
              label="Name"
              required={true}
              placeholder="Name"
              type="text"
            />

            <FormTextareaField
              form={form}
              name="description"
              label="Description"
              placeholder=" description..."
            />
            <FormRadioGroupField
              form={form}
              name="status"
              label="Status"
              required={true}
              options={StatusOptions}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="expenseType-form" disabled={isPending}>
            {isPending ? "Saving..." : expenseType ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormExpenseType;
