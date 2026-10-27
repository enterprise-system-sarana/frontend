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
import { CategorySchema } from "@/types/product/Category";
import type {
  CategoryResponse,
  CategoryRequest,
} from "@/types/product/Category";
import { StatusOptions, Status } from "@/types/enum/status";
import FormTextField, {
  FormRadioGroupField,
} from "@/components/ui/FormTextField";
import FileUpload from "@/pages/FileUpload";
import { useCategory } from "@/hooks/product/useCategory";
import { useLanguage } from "@/i18n/LanguageContext";

type FormCategoryProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  category: CategoryResponse | null;
};

const FormCategory = ({ open, setOpen, category }: FormCategoryProps) => {
  const { t } = useLanguage();
  const { mutate: createCategoryMutate, isPending: isCreating } =
    useCategory.useCreateCategory();
  const { mutate: updateCategoryMutate, isPending: isUpdating } =
    useCategory.useUpdateCategory();

  const isPending = isCreating || isUpdating;
  const form = useForm({
    defaultValues: {
      name: category?.name || "",
      code: category?.code || "",
      imageUrl: category?.imageUrl || "",
      status: category?.status || Status.ACTIVE,
    } as CategoryRequest,
    validators: {
      onSubmit: CategorySchema,
    },
    onSubmit: async ({ value }) => {
      const payload = value as CategoryRequest;
      const handleSuccess = () => {
        setOpen(false);
        form.reset();
      };

      if (category) {
        updateCategoryMutate(
          { id: category.id, req: payload },
          { onSuccess: handleSuccess },
        );
      } else {
        createCategoryMutate(payload, { onSuccess: handleSuccess });
      }
    },
  });

  useEffect(() => {
    form.reset();
  }, [category, open, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="md:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {category ? t("common.edit") : t("common.create")} {t("common.category")}
          </DialogTitle>
        </DialogHeader>
        <form
          id="category-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <FormTextField
              form={form}
              name="code"
              label={t("common.code")}
              required={true}
              placeholder={t("common.code")}
              type="text"
            />

            <FormTextField
              form={form}
              name="name"
              label={t("common.name")}
              required={true}
              placeholder={t("common.name")}
              type="text"
            />

            <FileUpload
              label={`${t("common.category")} Logo`}
              value={form.state.values.imageUrl || category?.imageUrl}
              onUploaded={(fileName) => {
                form.setFieldValue("imageUrl", fileName);
              }}
              onRemove={() => {
                form.setFieldValue("imageUrl", "");
              }}
              defaultBucket="category"
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("common.cancel")}</Button>
          </DialogClose>
          <Button type="submit" form="category-form" disabled={isPending}>
            {isPending ? t("common.saving") : category ? t("common.edit") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormCategory;
