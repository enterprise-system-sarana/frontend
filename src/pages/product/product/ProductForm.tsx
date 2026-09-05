import { useForm } from "@tanstack/react-form";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useProduct } from "@/hooks/product/useProduct";
import { ProductSchema, type ProductRequest } from "@/types/product/Product";

import { ROUTERS } from "@/constants/Route";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import FileUpload from "@/pages/FileUpload";
import FormTextField, {
  FormRadioGroupField,
  FormSelectField,
  FormTextareaField,
} from "@/components/ui/FormTextField";
import { ArrowLeft, Barcode, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Status } from "@/types/enum/status";
import { useModel } from "@/hooks/product/useModel";
import type { ModelResponse } from "@/types/product/Model";
import ModelForm from "@/pages/product/model/ModelForm";
import { useCategory } from "@/hooks/product/useCategory";
import { useBrand } from "@/hooks/product/useBrand";
import { useVariantType } from "@/hooks/product/useVariantType";
import type {
  VariantTypeResponse,
  VariantValueItem,
} from "@/types/product/VariantType";
import { useLanguage } from "@/i18n/LanguageContext";
import type { CategoryResponse } from "@/types/product/Category";
import type { BrandResponse } from "@/types/product/Brand";

const ProductForm = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [modelFormOpen, setModelFormOpen] = useState(false);
  const { id } = useParams<{ id: string }>();

  // Fetch product details when editing
  const { data: productDetailData, isLoading: isLoadingProduct } =
    useProduct.useGetProductById(Number(id), Boolean(id && !isNaN(Number(id))));
  const product =
    productDetailData?.payload?.data ||
    productDetailData?.payload ||
    productDetailData?.data ||
    productDetailData;
  console.log("Product", product);
  // Mutations & Queries
  const { mutate: createProduct, isPending: isCreating } =
    useProduct.useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } =
    useProduct.useUpdateProduct();
  const { data: modelData } = useModel.GetAllModel({ page: 1, size: 100 });
  const { data: categoryData } = useCategory.useGetAllCategory({
    page: 1,
    size: 100,
  });
  const { data: brandData } = useBrand.useGetAllBrand({ page: 1, size: 100 });
  const { data: variantData } = useVariantType.useGetAllVariantType({
    page: 1,
    size: 100,
  });

  const modelOptions = (modelData?.payload?.data || []).map(
    (m: ModelResponse) => ({
      label: m.name,
      value: String(m.id),
    }),
  );

  const isPending = isCreating || isUpdating || isLoadingProduct;

  const form = useForm({
    defaultValues: {
      code: "",
      noted: "",
      imageUrl: "",
      status: Status.ACTIVE,
      costPrice: 0,
      salePrice: 0,
      reorderLevel: 5,
      modelId: 0,
      variantValueIds: [] as number[],
    } as ProductRequest,
    validators: {
      onSubmit: ProductSchema,
    },
    onSubmit: async ({ value }) => {
      const payload = value as ProductRequest;
      const handleSuccess = () => {
        form.reset();
        navigate(ROUTERS.PRODUCT);
      };

      if (id) {
        updateProduct(
          { id: Number(id), req: payload },
          {
            onSuccess: () => {
              toast.success(t("product.update_success"));
              handleSuccess();
            },
            onError: (err: any) => {
              toast.error(
                err?.response?.data?.message || t("product.update_failed"),
              );
            },
          },
        );
      } else {
        createProduct(payload, {
          onSuccess: () => {
            toast.success(t("product.create_success"));
            handleSuccess();
          },
          onError: (err: any) => {
            toast.error(
              err?.response?.data?.message || t("product.create_failed"),
            );
          },
        });
      }
    },
  });

  // Populate form values when editing
  useEffect(() => {
    if (product && typeof product === "object") {
      form.setFieldValue("name", product.name || "");
      form.setFieldValue("code", product.code || "");
      form.setFieldValue("noted", product.noted || "");
      form.setFieldValue("imageUrl", product.imageUrl || "");
      form.setFieldValue("status", product.status || Status.ACTIVE);
      form.setFieldValue("costPrice", Number(product.costPrice || 0));
      form.setFieldValue("salePrice", Number(product.salePrice || 0));
      form.setFieldValue("reorderLevel", Number(product.reorderLevel || 5));
      form.setFieldValue(
        "modelId",
        Number(product.modelId || product.model?.id || 0),
      );

      const variantIds: number[] = Array.isArray(product.variantValues)
        ? product.variantValues.map((v: any) =>
          typeof v === "object" && v !== null ? v.id : Number(v),
        )
        : Array.isArray(product.variantValueIds)
          ? product.variantValueIds.map(Number)
          : [];

      form.setFieldValue("variantValueIds", variantIds);
    }
  }, [product]);

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigate(ROUTERS.PRODUCT)}
            className="h-9 w-9 rounded-xl border-border/60 hover:bg-muted/60"
            title={t("common.back")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold tracking-tight">
            {id ? t("product.edit") : t("product.create")}
          </h2>
        </div>
      </div>

      {/* Form */}
      <form
        id="product-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <div className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Basic Info Card */}
          <Card className="rounded-2xl border-border/60 shadow-2xs">
            <CardContent className="space-y-5">
              <FieldGroup>
                {/* Model Selection */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center"> */}
                <div className="space-y-1.5 flex gap-2 justify-center items-center">
                  <FormTextField
                    form={form}
                    name="code"
                    label={t("product.code")}
                    type="text"
                    placeholder="e.g. PRD-001"
                    required={true}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    className="gap-1.5 text-xs mt-5"
                    onClick={() => {
                      const timestamp = Date.now().toString().slice(-6);
                      const random = Math.floor(1000 + Math.random() * 9000);
                      const serial = `${timestamp}${random}`;
                      form.setFieldValue("code", serial);
                    }}
                  >
                    <Barcode className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {/* </div> */}
                <FormTextField
                  form={form}
                  name="name"
                  label="Name"
                  type="text"
                  placeholder=""
                  required={true}
                />
                <FormSelectField
                  form={form}
                  name="modelId"
                  label={t("product.model")}
                  required={true}
                  placeholder={t("product.select_model")}
                  options={modelOptions}
                  onAdd={() => setModelFormOpen(true)}
                />
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start"> */}
                {/* Dynamic Category & Brand */}
                <form.Subscribe selector={(state) => [state.values.modelId]}>
                  {([modelId]) => {
                    const selectedModel = (modelData?.payload?.data || []).find(
                      (m: ModelResponse) => m.id === Number(modelId),
                    );

                    if (!selectedModel) return null;

                    const categoryName =
                      selectedModel.categoryName ||
                      categoryData?.payload?.data?.find(
                        (c: CategoryResponse) =>
                          c.id === selectedModel.categoryId,
                      )?.name ||
                      "-";
                    const brandName =
                      selectedModel.brandName ||
                      brandData?.payload?.data?.find(
                        (b: BrandResponse) => b.id === selectedModel.brandId,
                      )?.name ||
                      "-";

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start animate-in fade-in-50 duration-200">
                        <Field>
                          <FieldLabel>{t("product.category")}</FieldLabel>
                          <Input
                            value={categoryName}
                            disabled
                            readOnly
                            className="bg-muted/40 text-foreground font-medium cursor-not-allowed select-none"
                          />
                        </Field>

                        <Field>
                          <FieldLabel>{t("product.brand")}</FieldLabel>
                          <Input
                            value={brandName}
                            disabled
                            readOnly
                            className="bg-muted/40 text-foreground font-medium cursor-not-allowed select-none"
                          />
                        </Field>
                      </div>
                    );
                  }}
                </form.Subscribe>
                {/* </div> */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  <FormTextField
                    form={form}
                    name="costPrice"
                    label="costPrice"
                    type="number"
                    placeholder="5"
                    required={true}
                  />
                  <FormTextField
                    form={form}
                    name="salePrice"
                    label="salePrice"
                    type="number"
                    placeholder="5"
                    required={true}
                  />
                </div>
                <FormTextField
                  form={form}
                  name="reorderLevel"
                  label={t("product.reorder_level")}
                  type="number"
                  placeholder="5"
                  required={true}
                />
                {/* Code and Reorder Level */}
                <FormTextareaField
                  form={form}
                  name="noted"
                  label={t("product.noted")}
                  placeholder={t("product.noted_placeholder")}
                />
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Product Variants Card */}
          {variantData?.payload?.data &&
            variantData.payload.data.length > 0 && (
              <Card className="rounded-2xl border-border/60 shadow-2xs">
                <CardContent className="space-y-6">
                  <div className="border-b border-border/40 pb-2">
                    <h3 className="text-base font-semibold text-foreground tracking-tight">
                      {t("product.variants")}
                    </h3>
                  </div>

                  <form.Subscribe
                    selector={(state) => [state.values.variantValueIds]}
                  >
                    {([variantValueIds = []]) => {
                      const variantTypes: VariantTypeResponse[] =
                        variantData?.payload?.data || [];

                      return (
                        <div className="space-y-5">
                          {variantTypes.map((vt: VariantTypeResponse) => {
                            const typeValueIds = (vt.values || []).map(
                              (v) => v.id,
                            );
                            const selectedValueId = (
                              variantValueIds as number[]
                            ).find((valId: number) =>
                              typeValueIds.includes(valId),
                            );

                            return (
                              <div key={vt.id} className="space-y-2.5">
                                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  {vt.name}
                                </div>

                                <div className="flex flex-wrap gap-2.5 items-center">
                                  {(vt.values || []).map(
                                    (val: VariantValueItem) => {
                                      const isSelected =
                                        selectedValueId === val.id;

                                      return (
                                        <button
                                          key={val.id}
                                          type="button"
                                          onClick={() => {
                                            const filtered = (
                                              variantValueIds as number[]
                                            ).filter(
                                              (valId: number) =>
                                                !typeValueIds.includes(valId),
                                            );

                                            if (isSelected) {
                                              form.setFieldValue(
                                                "variantValueIds",
                                                filtered,
                                              );
                                            } else {
                                              form.setFieldValue(
                                                "variantValueIds",
                                                [...filtered, val.id],
                                              );
                                            }
                                          }}
                                          className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer select-none border ${isSelected
                                              ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs ring-2 ring-primary/20"
                                              : "border-border/70 bg-card/60 hover:bg-muted/70 hover:border-foreground/30 text-foreground/90 hover:text-foreground"
                                            }`}
                                        >
                                          {val.name}
                                        </button>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }}
                  </form.Subscribe>
                </CardContent>
              </Card>
            )}

          {/* Image & Remarks Card */}
          <Card className="rounded-2xl border-border/60 shadow-2xs">
            <CardContent className="space-y-5">
              <FieldGroup>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <form.Subscribe selector={(state) => [state.values.imageUrl]}>
                    {([imageUrl]) => (
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
                </div>

                {/* <FormRadioGroupField
                  form={form}
                  name="status"
                  label={t("common.status")}
                  required={true}
                  options={[
                    { value: Status.ACTIVE, label: t("common.active") },
                    { value: Status.INACTIVE, label: t("common.inactive") },
                    { value: Status.DELETE, label: t("common.delete") },
                  ]}
                /> */}
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
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
              disabled={isPending}
              className="min-w-[140px]"
            >
              {isPending ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("common.saving")}
                </span>
              ) : id ? (
                t("product.edit")
              ) : (
                t("product.create")
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Inline Model Creation Dialog */}
      <ModelForm open={modelFormOpen} setOpen={setModelFormOpen} model={null} />
    </div>
  );
};

export default ProductForm;
