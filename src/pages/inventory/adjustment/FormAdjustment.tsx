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
import { AdjustmentFormSchema } from "@/types/inventory/Adjutment";

import type {
  AdjustmentResponse,
  AdjustmentRequest,
  AdjustmentFormValues,
} from "@/types/inventory/Adjutment";

import type { StoreResponse } from "@/types/inventory/Store";
import type { ProductResponse } from "@/types/product/Product";

import {
  useCreateAdjustment,
  useUpdateAdjustment,
} from "@/hooks/inventory/useadjustment";

import { useStore } from "@/hooks/inventory/useStore";
import { useProduct } from "@/hooks/product/useProduct";

type FormAdjustmentProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  adjustment: AdjustmentResponse | null;
};

// Helper: pull the first (only) line item out of an existing adjustment, if any.
const getFirstItem = (adjustment: AdjustmentResponse | null) => {
  const first = adjustment?.items?.[0];
  return {
    productId: first?.productId ?? 0,
    quantity: first?.quantity ?? 0,
  };
};

const FormAdjustment = ({ open, setOpen, adjustment }: FormAdjustmentProps) => {
  const { data: storeData } = useStore.useGetAllStore({
    page: 1,
    size: 100,
  });

  const { data: productData } = useProduct.useGetAllProduct({
    page: 1,
    size: 100,
  });

  const { mutate: createAdjustmentMutate, isPending: isCreating } =
    useCreateAdjustment();

  const { mutate: updateAdjustmentMutate, isPending: isUpdating } =
    useUpdateAdjustment();

  const isPending = isCreating || isUpdating;

  const storeOptions =
    storeData?.payload?.data?.map((store: StoreResponse) => ({
      value: String(store.id),
      label: store.name,
    })) ?? [];

  const productOptions =
    productData?.payload?.data?.map((product: ProductResponse) => ({
      value: String(product.id),
      label: product.name,
    })) ?? [];

  const form = useForm({
    defaultValues: {
      referenceNo: adjustment?.referenceNo ?? "",
      storeId: adjustment?.storeId ?? 0,
      note: adjustment?.note ?? "",
      file: adjustment?.file ?? null,
      status: adjustment?.status ?? Status.Active,
      productId: getFirstItem(adjustment).productId,
      quantity: getFirstItem(adjustment).quantity,
    } as AdjustmentFormValues,

    validators: {
      onSubmit: AdjustmentFormSchema,
    },

    onSubmit: async ({ value }) => {
      const { productId, quantity, ...rest } = value;

      const payload: AdjustmentRequest = {
        ...rest,
        items: [{ productId, quantity }],
      };

      const handleSuccess = () => {
        setOpen(false);
        form.reset();
      };

      if (adjustment) {
        updateAdjustmentMutate(
          {
            id: adjustment.id,
            request: payload,
          },
          {
            onSuccess: handleSuccess,
          }
        );
      } else {
        createAdjustmentMutate(payload, {
          onSuccess: handleSuccess,
        });
      }
    },
  });

  useEffect(() => {
    if (open) {
      const { productId, quantity } = getFirstItem(adjustment);

      form.reset({
        referenceNo: adjustment?.referenceNo ?? "",
        storeId: adjustment?.storeId ?? 0,
        note: adjustment?.note ?? "",
        file: adjustment?.file ?? null,
        status: adjustment?.status ?? Status.Active,
        productId,
        quantity,
      } as AdjustmentFormValues);
    }
  }, [adjustment, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{adjustment ? "Edit" : "Create"} Adjustment</DialogTitle>
        </DialogHeader>

        <form
          id="adjustment-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            <FormTextField
              form={form}
              name="referenceNo"
              label="Reference No"
              placeholder="Enter reference number"
              type="text"
              autoComplete="off"
              required
            />
            <FormTextField
              form={form}
              name="file"
              label="File"
              placeholder="Enter File"
              type="text"
              autoComplete="off"
              required
            />

            <FormSelectField
              form={form}
              name="storeId"
              label="Store"
              required
              placeholder="Select Store"
              options={storeOptions}
            />
            <FormSelectField
              form={form}
              name="productId"
              label="Product"
              required
              placeholder="Select Product"
              options={productOptions}
            />
            <FormTextField
              form={form}
              name="quantity"
              label="Quantity"
              required={true}
              placeholder="Enter Quantity"
              type="number"
            />

            <FormTextField
              form={form}
              name="note"
              label="Note"
              placeholder="Enter note"
              type="text"
              autoComplete="off"
            />

            <FormSelectField
              form={form}
              name="status"
              label="Status"
              required
              placeholder="Select Status"
              options={Object.entries(Status).map(([, value]) => ({
                value,
                label: value,
              }))}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>

          <Button type="submit" form="adjustment-form" disabled={isPending}>
            {isPending ? "Saving..." : adjustment ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormAdjustment;
