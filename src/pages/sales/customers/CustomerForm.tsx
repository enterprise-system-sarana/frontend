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
import FormTextField from "@/components/ui/FormTextField";
import {
  CustomerSchema,
  type CustomerRequest,
  type CustomerResponse,
} from "@/types/sales/Customer";
import { useCustomer } from "@/hooks/sales/useCustomer";
import { Status } from "@/types/enum/status";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

import { generateCustomerCode } from "@/utils/codeGenerator";

export { generateCustomerCode };

type FormCustomerProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  customer: CustomerResponse | null;
  onCreated?: (response: any) => void;
};

const FormCustomer = ({
  open,
  setOpen,
  customer,
  onCreated,
}: FormCustomerProps) => {
  const { t } = useLanguage();
  const { mutate: createCustomerMutate, isPending: isCreating } =
    useCustomer.useCreateCustomer();
  const { mutate: updateCustomerMutate, isPending: isUpdating } =
    useCustomer.useUpdateCustomer();

  const isPending = isCreating || isUpdating;

  // Fetch existing customers to generate the next unique code
  const { data: customerData } = useCustomer.useGetAllCustomer({ page: 1, size: 1000 });
  const customerList: CustomerResponse[] = useMemo(() => {
    const payload = (customerData as any)?.payload ?? customerData;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload)) return payload;
    return [];
  }, [customerData]);

  const form = useForm({
    defaultValues: {
      code: customer?.code ?? generateCustomerCode(customerList),
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
        createCustomerMutate(payload, {
          onSuccess: (data) => {
            handleSuccess();
            onCreated?.(data);
          },
        });
      }
    },
  });

  // Automatically generate customer code when the dialog opens in Create mode
  useEffect(() => {
    if (open) {
      if (customer) {
        form.reset({
          code: customer.code ?? "",
          name: customer.name ?? "",
          phone: customer.phone ?? "",
          email: customer.email ?? "",
          note: customer.note ?? "",
          status: customer.status ?? Status.ACTIVE,
        });
      } else {
        const nextCode = generateCustomerCode(customerList);
        form.reset({
          code: nextCode,
          name: "",
          phone: "",
          email: "",
          note: "",
          status: Status.ACTIVE,
        });
      }
    }
  }, [open, customer, customerList]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold">
            {customer ? t("common.edit") : t("common.create")} {t("nav.customer")}
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
            <div className="flex items-end gap-1.5">
              <div className="flex-1 min-w-0">
                <FormTextField
                  form={form}
                  name="code"
                  label={t("common.code")}
                  placeholder="CUS-001"
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
                title={t("product.generate_code")}
                onClick={() => {
                  const current = form.state.values.code;
                  const newCode = generateCustomerCode(customerList, current);
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
              placeholder="John Doe"
              type="text"
              autoComplete="off"
              required
            />

            {/* Email & Phone */}
            <FormTextField
              form={form}
              name="email"
              label={t("common.email")}
              placeholder="customer@example.com"
              type="email"
              autoComplete="off"
            />
            <FormTextField
              form={form}
              name="phone"
              label={t("common.phone")}
              placeholder="+123456789"
              type="text"
              autoComplete="off"
            />

            {/* Note */}
            <div className="sm:col-span-2">
              <FormTextField
                form={form}
                name="note"
                label={t("common.notes")}
                placeholder="Optional customer notes..."
                type="text"
                autoComplete="off"
              />
            </div>
          </FieldGroup>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="rounded-xl" disabled={isPending}>
              {t("common.cancel")}
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="customer-form"
            disabled={isPending}
           
          >
            {isPending ? t("common.saving") : customer ? t("common.save") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormCustomer;
