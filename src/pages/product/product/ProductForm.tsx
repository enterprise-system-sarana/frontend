import { useForm } from "@tanstack/react-form";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { useProduct } from "@/hooks/product/useProduct";
import { useModel } from "@/hooks/product/useModel";
import { useCategory } from "@/hooks/product/useCategory";
import { useBrand } from "@/hooks/product/useBrand";
import { useVariantType } from "@/hooks/product/useVariantType";

import {
  ProductSchema,
  type ProductRequest,
} from "@/types/product/Product";
import type { ModelResponse } from "@/types/product/Model";
import type { CategoryResponse } from "@/types/product/Category";
import type { BrandResponse } from "@/types/product/Brand";
import type {
  VariantTypeResponse,
  VariantValueItem,
} from "@/types/product/VariantType";
import { Status } from "@/types/enum/status";

import { ROUTERS } from "@/constants/Route";
import { useLanguage } from "@/i18n/LanguageContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormTextField, {
  FormRadioGroupField,
  FormSwitchField,
  FormTextareaField,
} from "@/components/ui/FormTextField";

import FileUpload from "@/pages/FileUpload";
import ModelForm from "@/pages/product/model/ModelForm";

import { ArrowLeft, Barcode, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

const ProductForm = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();

  const [modelFormOpen, setModelFormOpen] = useState(false);

  const isEdit = Boolean(id);
  const productId = Number(id);

  // Fetch product details when editing.
  const {
    data: productDetailData,
    isLoading: isLoadingProduct,
  } = useProduct.useGetProductById(
    productId,
    Boolean(id && !Number.isNaN(productId)),
  );

  const product =
    productDetailData?.payload?.data ??
    productDetailData?.payload ??
    productDetailData?.data ??
    productDetailData;

  // Mutations.
  const { mutate: createProduct, isPending: isCreating } =
    useProduct.useCreateProduct();

  const { mutate: updateProduct, isPending: isUpdating } =
    useProduct.useUpdateProduct();

  // Queries.
  const { data: modelData, isLoading: isLoadingModels } =
    useModel.GetAllModel({ page: 1, size: 100 });

  const { data: categoryData } = useCategory.useGetAllCategory({
    page: 1,
    size: 100,
  });

  const { data: brandData } = useBrand.useGetAllBrand({
    page: 1,
    size: 100,
  });

  const { data: variantData } =
    useVariantType.useGetAllVariantType({
      page: 1,
      size: 100,
    });

  const models: ModelResponse[] = useMemo(
    () => modelData?.payload?.data ?? [],
    [modelData],
  );

  const categories: CategoryResponse[] =
    categoryData?.payload?.data ?? [];

  const brands: BrandResponse[] =
    brandData?.payload?.data ?? [];

  const variantTypes: VariantTypeResponse[] =
    variantData?.payload?.data ?? [];

  // Select values must be strings for shadcn/ui Select.
  const modelOptions = useMemo(
    () =>
      models.map((model) => ({
        label: model.name,
        value: String(model.id),
      })),
    [models],
  );

  const isPending =
    isCreating || isUpdating || isLoadingProduct;

  const form = useForm({
    defaultValues: {
      name: "",
      code: "",
      noted: "",
      imageUrl: "",
      status: Status.ACTIVE,
      costPrice: 0,
      salePrice: 0,
      reorderLevel: 5,
      hasSerial: true,
      modelId: 0,
      variantValueIds: [] as number[],
    } as ProductRequest,

    validators: {
      onSubmit: ProductSchema,
    },

    onSubmit: async ({ value }) => {
      const selectedModelId = Number(value.modelId);

      if (!selectedModelId || selectedModelId <= 0) {
        toast.error(t("product.select_model"));
        return;
      }

      const payload: ProductRequest = {
        ...value,
        modelId: selectedModelId,
        variantValueIds: (value.variantValueIds ?? []).map(Number),
      };

      if (isEdit) {
        updateProduct(
          {
            id: productId,
            req: payload,
          },
          {
            onSuccess: () => {
              toast.success(t("product.update_success"));
              navigate(ROUTERS.PRODUCT);
            },
            onError: (err: any) => {
              toast.error(
                err?.response?.data?.message ||
                t("product.update_failed"),
              );
            },
          },
        );
      } else {
        createProduct(payload, {
          onSuccess: () => {
            toast.success(t("product.create_success"));
            navigate(ROUTERS.PRODUCT);
          },
          onError: (err: any) => {
            toast.error(
              err?.response?.data?.message ||
              t("product.create_failed"),
            );
          },
        });
      }
    },
  });

  // Populate form when editing a product.
  useEffect(() => {
    if (!product || typeof product !== "object") return;

    const modelId = Number(
      product.modelId ?? product.model?.id ?? 0,
    );

    form.setFieldValue("name", product.name ?? "");
    form.setFieldValue("code", product.code ?? "");
    form.setFieldValue("noted", product.noted ?? "");
    form.setFieldValue("imageUrl", product.imageUrl ?? "");
    form.setFieldValue(
      "hasSerial",
      product.hasSerial ?? true,
    );
    form.setFieldValue(
      "status",
      product.status ?? Status.ACTIVE,
    );
    form.setFieldValue(
      "costPrice",
      Number(product.costPrice ?? 0),
    );
    form.setFieldValue(
      "salePrice",
      Number(product.salePrice ?? 0),
    );
    form.setFieldValue(
      "reorderLevel",
      Number(product.reorderLevel ?? 5),
    );
    form.setFieldValue("modelId", modelId);

    const variantIds: number[] = Array.isArray(
      product.variantValues,
    )
      ? product.variantValues.map((value: any) =>
        Number(
          typeof value === "object" && value !== null
            ? value.id
            : value,
        ),
      )
      : Array.isArray(product.variantValueIds)
        ? product.variantValueIds.map(Number)
        : [];

    form.setFieldValue(
      "variantValueIds",
      variantIds.filter(Number.isFinite),
    );
  }, [product, form]);

  // Model selection drives category and brand.
  const selectedModelId = useMemo(() => {
    const rawId = product?.modelId ?? product?.model?.id;
    return Number(rawId ?? 0);
  }, [product]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border/60 bg-white/95 dark:bg-card/95 backdrop-blur px-4 sm:px-6 py-2.5 shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigate(ROUTERS.PRODUCT)}
            title={t("common.back")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <h2 className="text-lg font-semibold">
            {isEdit ? t("product.edit") : t("product.create")}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTERS.PRODUCT)}
            disabled={isPending}
          >
            {t("common.cancel")}
          </Button>

          <Button
            type="submit"
            form="product-form"
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("common.saving")}
              </span>
            ) : isEdit ? (
              t("product.edit")
            ) : (
              t("product.create")
            )}
          </Button>
        </div>
      </div>

      {/* Product form */}
      <div className="p-4 sm:p-6 pt-3 sm:pt-4">
        <form
          id="product-form"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Basic information */}
            <Card className="rounded-xl border border-border/70 shadow-2xs">
              <CardContent className="space-y-4 pt-4 sm:pt-5">
              <FieldGroup>
                {/* Product code */}
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <FormTextField
                      form={form}
                      name="code"
                      label={t("product.code")}
                      type="text"
                      placeholder="e.g. PRD-001"
                      required
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-11 w-11 rounded-md"
                    title={t("product.generate_code")}
                    onClick={() => {
                      const timestamp = Date.now()
                        .toString()
                        .slice(-6);

                      const random = Math.floor(
                        1000 + Math.random() * 9000,
                      );

                      form.setFieldValue(
                        "code",
                        `${timestamp}${random}`,
                      );
                    }}
                  >
                    <Barcode className="h-4 w-4" />
                  </Button>
                </div>

                {/* Product name */}
                <FormTextField
                  form={form}
                  name="name"
                  label={t("common.name")}
                  type="text"
                  placeholder={t("product.name_placeholder")}
                  required
                />

                {/* Model selection */}
                <form.Field name="modelId">
                  {(field) => (
                    <Field>
                      <FieldLabel>
                        {t("product.model")}
                        <span className="text-red-600">*</span>
                      </FieldLabel>

                      <div className="flex items-center gap-2">
                        <Select
                          value={
                            Number(field.state.value) > 0
                              ? String(field.state.value)
                              : ""
                          }
                          onValueChange={(value) => {
                            const nextModelId = Number(value);

                            field.handleChange(nextModelId);

                            // Keep the form value numeric.
                            form.setFieldValue(
                              "modelId",
                              nextModelId,
                            );
                          }}
                          disabled={isLoadingModels}
                        >
                          <SelectTrigger className="w-full rounded-md">
                            <SelectValue
                              placeholder={
                                isLoadingModels
                                  ? t("common.loading")
                                  : t("product.select_model")
                              }
                            />
                          </SelectTrigger>

                          <SelectContent>
                            {modelOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}

                            {!isLoadingModels &&
                              modelOptions.length === 0 && (
                                <div className="px-2 py-3 text-sm text-muted-foreground">
                                  {t("product.no_models")}
                                </div>
                              )}
                          </SelectContent>
                        </Select>

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0 h-11 w-11 rounded-md"
                          title={t("product.add_model")}
                          onClick={() =>
                            setModelFormOpen(true)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-destructive">
                          {field.state.meta.errors
                            .map((error) =>
                              typeof error === "string"
                                ? error
                                : error?.message,
                            )
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </Field>
                  )}
                </form.Field>

                {/* Dynamic category and brand */}
                <form.Subscribe
                  selector={(state) => state.values.modelId}
                >
                  {(modelId) => {
                    const selectedModel = models.find(
                      (model) =>
                        Number(model.id) === Number(modelId),
                    );

                    if (!selectedModel) return null;

                    const categoryName =
                      selectedModel.categoryName ??
                      categories.find(
                        (category) =>
                          Number(category.id) ===
                          Number(selectedModel.categoryId),
                      )?.name ??
                      "-";

                    const brandName =
                      selectedModel.brandName ??
                      brands.find(
                        (brand) =>
                          Number(brand.id) ===
                          Number(selectedModel.brandId),
                      )?.name ??
                      "-";

                    return (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field>
                          <FieldLabel>
                            {t("product.category")}
                          </FieldLabel>
                          <Input
                            value={categoryName}
                            readOnly
                            disabled
                            className="rounded-md"
                          />
                        </Field>

                        <Field>
                          <FieldLabel>
                            {t("product.brand")}
                          </FieldLabel>
                          <Input
                            value={brandName}
                            readOnly
                            disabled
                            className="rounded-md"
                          />
                        </Field>
                      </div>
                    );
                  }}
                </form.Subscribe>

                {/* Prices */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormTextField
                    form={form}
                    name="costPrice"
                    label={t("product.cost_price")}
                    type="number"
                    placeholder="0"
                    required
                  />

                  <FormTextField
                    form={form}
                    name="salePrice"
                    label={t("product.sale_price")}
                    type="number"
                    placeholder="0"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormTextField
                    form={form}
                    name="reorderLevel"
                    label={t("product.reorder_level")}
                    type="number"
                    placeholder="5"
                    required
                  />

                  {/* Serial Tracking Mode */}
                  <FormSwitchField
                    form={form}
                    name="hasSerial"
                    label={t("inventory.serial_number", "Serial Number")}
                  />
                </div>



                <FormTextareaField
                  form={form}
                  name="noted"
                  label={t("product.noted")}
                  placeholder={t("product.noted_placeholder")}
                />
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Product variants */}
          <Card className="rounded-xl border border-border/70 shadow-2xs">
            <CardContent className="space-y-4 pt-4 sm:pt-5">
              <h3 className="border-b border-border pb-3 text-base font-semibold">
                {t("product.variants")}
              </h3>

              {variantTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("product.no_variants")}
                </p>
              ) : (
                <form.Subscribe
                  selector={(state) =>
                    state.values.variantValueIds
                  }
                >
                  {(variantValueIds = []) => (
                    <div className="space-y-5">
                      {variantTypes.map(
                        (variantType: VariantTypeResponse) => {
                          const values =
                            variantType.values ?? [];

                          const typeValueIds = values.map(
                            (value) => Number(value.id),
                          );

                          const selectedValueId = (
                            variantValueIds as number[]
                          ).find((valueId) =>
                            typeValueIds.includes(
                              Number(valueId),
                            ),
                          );

                          return (
                            <div
                              key={variantType.id}
                              className="space-y-2"
                            >
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {variantType.name}
                              </p>

                              <div className="flex flex-wrap gap-2">
                                {values.map(
                                  (value: VariantValueItem) => {
                                    const isSelected =
                                      Number(selectedValueId) ===
                                      Number(value.id);

                                    return (
                                      <button
                                        key={value.id}
                                        type="button"
                                        aria-pressed={isSelected}
                                        onClick={() => {
                                          const currentIds =
                                            variantValueIds as number[];

                                          const otherTypeIds =
                                            currentIds.filter(
                                              (valueId) =>
                                                !typeValueIds.includes(
                                                  Number(valueId),
                                                ),
                                            );

                                          form.setFieldValue(
                                            "variantValueIds",
                                            isSelected
                                              ? otherTypeIds
                                              : [
                                                ...otherTypeIds,
                                                Number(value.id),
                                              ],
                                          );
                                        }}
                                        className={`border px-3 py-2 text-sm rounded-md transition-colors ${isSelected
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-border hover:bg-muted"
                                          }`}
                                      >
                                        {value.name}
                                      </button>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </form.Subscribe>
              )}
            </CardContent>
          </Card>

          {/* Image upload */}
          <Card className="rounded-xl border border-border/70 shadow-2xs">
            <CardContent className="pt-6">
              <form.Subscribe
                selector={(state) => state.values.imageUrl}
              >
                {(imageUrl) => (
                  <FileUpload
                    label={t("product.image")}
                    value={imageUrl || ""}
                    onUploaded={(fileName) => {
                      form.setFieldValue("imageUrl", fileName);
                    }}
                    onRemove={() => {
                      form.setFieldValue("imageUrl", "");
                    }}
                    defaultBucket="product"
                  />
                )}
              </form.Subscribe>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>

      {/* Create model dialog */}
      <ModelForm
        open={modelFormOpen}
        setOpen={setModelFormOpen}
        model={null}
        onCreated={(newModel) => {
          if (newModel && newModel.id) {
            form.setFieldValue("modelId", Number(newModel.id));
            toast.success(`Selected model: ${newModel.name}`);
          }
        }}
      />
    </div>
  );
};

export default ProductForm;