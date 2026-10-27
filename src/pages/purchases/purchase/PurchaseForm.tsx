import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useStore as useFormStore } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Package,
  Plus,
  ScanLine,
  Search,
  Trash2,
  Wallet,
  X,
  FileSpreadsheet,
  DollarSign,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup } from "@/components/ui/field";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import FormTextField, {
  FormSelectField,
} from "@/components/ui/FormTextField";

import { Status } from "@/types/enum/status";
import {
  PurchaseSchema,
  type PurchaseFormValues,
} from "@/types/purchases/Purchase";

import { usePurchase } from "@/hooks/purchases/usePurchase";
import { useSupplier } from "@/hooks/purchases/useSupplier";
import { useStore } from "@/hooks/inventory/useStore";
import { useProduct } from "@/hooks/product/useProduct";
import { useBank } from "@/hooks/finance/useBank";
import { useProductSerial } from "@/hooks/product/useProductSerial";

import FormSupplier from "@/pages/purchases/supplier/SupplierForm";
import FormBank from "@/pages/finance/bank/BankForm";
import ExcelSerialModal from "./ExcelSerialModal";

import { ROUTERS } from "@/constants/Route";

import type { StoreResponse } from "@/types/inventory/Store";
import type { SupplierResponse } from "@/types/purchases/Supplier";
import type { ProductResponse } from "@/types/product/Product";
import { PaymentForm } from "@/pages/sales/payment/PaymentForm";
import { usePayment } from "@/hooks/sales/usePayment";
import type { PaymentRequest } from "@/types/sales/Payment";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import { ImageCell } from "@/components/file/ImageCell";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

function emptyItem() {
  return {
    productId: 0,
    productName: "",
    quantity: 1,
    cost: 0,
    price: 0,
    subtotal: 0,
    serialNumbers: [] as string[],
  };
}

export function extractSerialString(s: any): string {
  if (s == null) return "";
  if (typeof s === "string") return s.trim();
  if (typeof s === "number") return String(s);
  if (typeof s === "object") {
    const val =
      s.barcode ??
      s.serialNumber ??
      s.serial ??
      s.serialNo ??
      s.code ??
      s.imei ??
      s.value ??
      s.serial_number ??
      (s.id ? `SN-${s.id}` : "");
    return val != null ? String(val).trim() : "";
  }
  return "";
}

export function isProductSerialized(product: any): boolean {
  if (!product) return true;
  if (product.hasSerial === false || product.hasSerial === "false" || product.hasSerial === 0) return false;
  if (product.hasSerialNumber === false || product.hasSerialNumber === "false" || product.hasSerialNumber === 0) return false;
  if (product.isSerialized === false || product.isSerialized === "false" || product.isSerialized === 0) return false;
  if (product.serialized === false || product.serialized === "false" || product.serialized === 0) return false;
  return true;
}

function getTodayDate() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/* -------------------------------------------------------------------------- */
/* Main Form                                                                  */
/* -------------------------------------------------------------------------- */

export default function PurchaseForm() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const initialProductId = searchParams.get("productId");
  const handledInitialProduct = useRef(false);

  /* ------------------------------- Load data ------------------------------ */

  const { data: suppliers } = useSupplier.useGetAllSupplier({ page: 1, size: 1000 });
  const { data: banks } = useBank.useGetAllBank({ page: 1, size: 1000 });
  const { data: stores } = useStore.useGetAllStore({ page: 1, size: 1000 });
  const { data: products } = useProduct.useGetAllProduct({ page: 1, size: 1000 });

  const productList: ProductResponse[] =
    products?.payload?.data ?? products?.data ?? products?.payload ?? [];
  const supplierList: SupplierResponse[] =
    suppliers?.payload?.data ?? suppliers?.data ?? suppliers?.payload ?? [];
  const storeList: StoreResponse[] =
    stores?.payload?.data ?? stores?.data ?? stores?.payload ?? [];
  const bankList: any[] =
    banks?.payload?.data ?? banks?.data ?? banks?.payload ?? [];

  const { data: existingPurchase, isLoading: isPurchaseLoading } =
    usePurchase.GetPurchaseById(Number(id), {
      enabled: isEditing && !isNaN(Number(id)) && Number(id) > 0,
    });

  const { data: allSerialsRes } = useProductSerial.useGetAllProductSerial(
    { size: 1000 } as any,
    { enabled: isEditing },
  );

  const fallbackSerialsByProduct = useMemo(() => {
    const list: any[] =
      allSerialsRes?.payload?.data ??
      allSerialsRes?.data ??
      allSerialsRes?.payload ??
      [];
    const map: Record<number, string[]> = {};
    for (const item of list) {
      const pId = Number(item.productId ?? item.product?.id);
      const barcode = extractSerialString(item);
      if (pId > 0 && barcode) {
        if (!map[pId]) map[pId] = [];
        map[pId].push(barcode);
      }
    }
    return map;
  }, [allSerialsRes]);

  const purchaseDetail =
    existingPurchase?.payload?.data ??
    existingPurchase?.payload ??
    existingPurchase?.data ??
    existingPurchase;

  /* ------------------------------- Mutations ------------------------------ */

  const queryClient = useQueryClient();
  const createPurchase = usePurchase.Create();
  const updatePurchase = usePurchase.Update();
  const createPayment = usePayment.createPayment();
  const isPending = createPurchase.isPending || updatePurchase.isPending;

  /* -------------------------------- State -------------------------------- */

  const [productSearch, setProductSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [serialError, setSerialError] = useState("");
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [bankFormOpen, setBankFormOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement>(null);

  /* -------------------------------- Form --------------------------------- */

  const form = useForm({
    defaultValues: {
      referenceNo: "",
      purchaseDate: getTodayDate(),
      note: "",
      supplierId: 1,
      storeId: 1,
      bankId: 1,
      discount: 0,
      total: 0,
      grandTotal: 0,
      paidAmount: 0,
      paymentStatus: "PENDING",
      status: Status.ACTIVE,
      items: [emptyItem()],
    } as PurchaseFormValues,

    validators: {
      onSubmit: PurchaseSchema,
    },

    onSubmit: async ({ value }) => {
      // Consolidate duplicate products by productId
      const consolidatedMap = new Map<number, any>();
      for (const item of value.items || []) {
        const pId = Number(item.productId);
        if (pId <= 0) continue;
        const prod = productList.find((p: any) => p.id === pId);
        const reqSerial = isProductSerialized(prod);
        const serials = reqSerial
          ? (item.serialNumbers ?? [])
            .map((serial: any) => extractSerialString(serial))
            .filter(Boolean)
          : [];
        const quantity = Math.max(0, Number(item.quantity) || 0);
        const costPrice = Number(item.cost ?? item.costPrice ?? 0);
        const price = Number(item.price) || 0;

        if (consolidatedMap.has(pId)) {
          const exist = consolidatedMap.get(pId);
          exist.quantity += quantity;
          if (reqSerial) {
            exist.serialNumbers.push(...serials);
          }
          exist.subtotal = exist.costPrice * exist.quantity;
        } else {
          consolidatedMap.set(pId, {
            productId: pId,
            productName: item.productName,
            quantity,
            costPrice,
            price,
            serialNumbers: reqSerial ? [...serials] : [],
          });
        }
      }

      const items = Array.from(consolidatedMap.values());
      if (items.length === 0) {
        setSerialError("Please add at least one product before saving purchase.");
        return;
      }

      const missingSerials = items.some((item: any) => {
        const prod = productList.find((p: any) => p.id === item.productId);
        if (!isProductSerialized(prod)) {
          return false;
        }
        return (
          item.serialNumbers.length !== item.quantity ||
          new Set(item.serialNumbers.map((s: string) => s.toLowerCase())).size !== item.serialNumbers.length
        );
      });

      if (missingSerials) {
        setSerialError("Each serialized product needs one unique serial number for every unit.");
        return;
      }

      setSerialError("");

      const total = items.reduce(
        (sum: number, item: any) => sum + item.costPrice * item.quantity,
        0,
      );

      const discount = Number(value.discount) || 0;
      const grandTotal = Math.max(total - discount, 0);
      const paidAmount = Number(value.paidAmount) || 0;

      const paymentStatus =
        paidAmount >= grandTotal && grandTotal > 0
          ? "PAID"
          : paidAmount > 0
            ? "PARTIAL"
            : "PENDING";


      const payload = {
        ...value,
        supplierId: Number(value.supplierId),
        storeId: Number(value.storeId),
        bankId: Number(value.bankId),
        discount,
        paidAmount,
        paymentStatus,
        total,
        grandTotal,
        items,
      };

      if (isEditing && id) {
        await updatePurchase.mutateAsync({ id: Number(id), request: payload });
      } else {
        await createPurchase.mutateAsync(payload);
      }

      await queryClient.invalidateQueries({ queryKey: usePurchase.keys.all });
      await queryClient.invalidateQueries({ queryKey: useProduct.keys.all });
      await queryClient.invalidateQueries({ queryKey: useProductSerial.keys.all });
      navigate(ROUTERS.PURCHASE);
    },
  });

  /* ----------------------------- Form values ----------------------------- */

  const formValues = useFormStore(form.store, (state) => state.values);
  const topGrandTotal = useMemo(() => {
    const subtotal = (formValues.items || []).reduce(
      (sum: number, item: any) =>
        sum + (Number(item.cost) || 0) * (Number(item.quantity) || 0),
      0,
    );
    return Math.max(subtotal - (Number(formValues.discount) || 0), 0);
  }, [formValues.items, formValues.discount]);

  const handlePurchaseAndPayment = async (paymentReq: PaymentRequest) => {
    const rawItems = (formValues.items || []).filter(
      (item: any) => Number(item.productId) > 0 && Number(item.quantity) > 0
    );
    if (rawItems.length === 0) {
      toast.error("Please add at least one product before completing purchase.");
      return false;
    }

    // Consolidate duplicate products by productId
    const consolidatedMap = new Map<number, any>();
    for (const item of rawItems) {
      const pId = Number(item.productId);
      if (pId <= 0) continue;
      const prod = productList.find((p: any) => p.id === pId);
      const reqSerial = isProductSerialized(prod);
      const serials = reqSerial
        ? (item.serialNumbers ?? [])
          .map((serial: any) => extractSerialString(serial))
          .filter(Boolean)
        : [];
      const quantity = Math.max(0, Number(item.quantity) || 0);
      const costPrice = Number(item.cost ?? item.costPrice ?? 0);
      const price = Number(item.price) || 0;

      if (consolidatedMap.has(pId)) {
        const exist = consolidatedMap.get(pId);
        exist.quantity += quantity;
        if (reqSerial) {
          exist.serialNumbers.push(...serials);
        }
        exist.subtotal = exist.costPrice * exist.quantity;
      } else {
        consolidatedMap.set(pId, {
          productId: pId,
          productName: item.productName,
          quantity,
          costPrice,
          price,
          serialNumbers: reqSerial ? [...serials] : [],
        });
      }
    }

    const items = Array.from(consolidatedMap.values());
    const missingSerials = items.some((item: any) => {
      const prod = productList.find((p: any) => p.id === item.productId);
      if (!isProductSerialized(prod)) {
        return false;
      }
      return (
        item.serialNumbers.length !== item.quantity ||
        new Set(item.serialNumbers.map((s: string) => s.toLowerCase())).size !== item.serialNumbers.length
      );
    });

    if (missingSerials) {
      setSerialError("Each serialized product needs one unique serial number for every unit.");
      toast.error("Each serialized product needs one unique serial number for every unit.");
      return false;
    }
    setSerialError("");

    const total = items.reduce(
      (sum: number, item: any) => sum + item.costPrice * item.quantity,
      0
    );
    const discount = Number(formValues.discount) || 0;
    const grandTotal = Math.max(total - discount, 0);
    const paidAmount = Number(paymentReq.totalAmount) || 0;
    const paymentStatus =
      paidAmount >= grandTotal && grandTotal > 0
        ? "PAID"
        : paidAmount > 0
          ? "PARTIAL"
          : "PENDING";

    const payload = {
      ...formValues,
      supplierId: Number(formValues.supplierId),
      storeId: Number(formValues.storeId),
      bankId: Number(formValues.bankId),
      discount,
      paidAmount,
      paymentStatus,
      total,
      grandTotal,
      items,
    };

    try {
      let savedPurchaseId = isEditing && id ? Number(id) : 0;
      if (isEditing && id) {
        await updatePurchase.mutateAsync({ id: Number(id), request: payload });
      } else {
        const res: any = await createPurchase.mutateAsync(payload);
        savedPurchaseId = Number(
          res?.payload?.id ??
          res?.payload?.data?.id ??
          res?.data?.id ??
          res?.id ??
          0
        );
      }

      if (savedPurchaseId > 0 && paidAmount > 0) {
        const finalPaymentReq: PaymentRequest = {
          ...paymentReq,
          purchaseId: savedPurchaseId,
          saleId: null,
          totalAmount: paidAmount,
        };
        await createPayment.mutateAsync(finalPaymentReq);
      }

      await queryClient.invalidateQueries({ queryKey: useProduct.keys.all });
      await queryClient.invalidateQueries({ queryKey: usePurchase.keys.all });
      navigate(ROUTERS.PURCHASE);
      return true;
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        (typeof error?.response?.data === "string" ? error.response.data : null) ||
        error?.message ||
        "Failed to process purchase payment.";
      toast.error(errorMsg);
      return false;
    }
  };

  /* ------------------------- Calculate totals ---------------------------- */

  useEffect(() => {
    const itemsTotal = (formValues.items || []).reduce(
      (sum: number, item: any) =>
        sum + (Number(item.cost) || 0) * (Number(item.quantity) || 0),
      0,
    );

    const discount = Number(formValues.discount) || 0;
    const grandTotal = Math.max(itemsTotal - discount, 0);
    const paidAmount = Number(formValues.paidAmount) || 0;

    if (!isEditing && (paidAmount === 0 || paidAmount === grandTotal)) {
      form.setFieldValue("paidAmount", grandTotal);
    }

    form.setFieldValue("total", itemsTotal);
    form.setFieldValue("grandTotal", grandTotal);

    const paymentStatus =
      paidAmount >= grandTotal && grandTotal > 0
        ? "PAID"
        : paidAmount > 0
          ? "PARTIAL"
          : "PENDING";

    if (formValues.paymentStatus !== paymentStatus) {
      form.setFieldValue("paymentStatus", paymentStatus);
    }
  }, [formValues.items, formValues.discount, formValues.paidAmount, isEditing]);

  /* ----------------------------- Edit mode ------------------------------- */

  useEffect(() => {
    const purchase = purchaseDetail;
    if (!purchase || typeof purchase !== "object") return;

    const supplierId = purchase.supplierId ?? purchase.supplier?.id ?? 0;
    const storeId = purchase.storeId ?? purchase.store?.id ?? 1;
    const bankId = purchase.bankId ?? purchase.bank?.id ?? 1;

    const formattedDate = purchase.purchaseDate
      ? String(purchase.purchaseDate).split("T")[0]
      : getTodayDate();

    const rawItems =
      purchase.items ??
      purchase.purchaseItems ??
      purchase.purchaseDetails ??
      [];

    const purchaseSerialsList: any[] =
      purchase.productSerials ??
      purchase.serialNumbers ??
      purchase.serials ??
      [];

    const groupedItemsMap = new Map<
      string | number,
      {
        productId: number;
        productName: string;
        quantity: number;
        cost: number;
        price: number;
        subtotal: number;
        extractedSerials: string[];
      }
    >();

    for (const item of rawItems) {
      const productId =
        item.productId ??
        item.product?.id ??
        item.product_id ??
        0;
      const quantity = Math.max(0, Number(item.quantity) || 1);
      const cost = Number(item.costPrice ?? item.cost ?? item.product?.costPrice ?? 0);
      const price = Number(item.price ?? item.product?.salePrice ?? 0);
      const subtotal = (cost * quantity) || Number(item.subtotal ?? 0);
      const productName =
        item.productName ??
        item.product?.name ??
        item.product_name ??
        item.name ??
        "";

      let itemSerialsRaw =
        item.serialNumbers ??
        item.productSerials ??
        item.serials ??
        item.barcodes ??
        item.serialNumberList ??
        item.productSerialResponses ??
        item.serial_numbers;

      const itemSerials: string[] = (Array.isArray(itemSerialsRaw) ? itemSerialsRaw : [])
        .map(extractSerialString)
        .filter((s) => s.length > 0);

      const groupKey = productId > 0 ? `prod_${productId}` : (productName ? `name_${productName}` : `row_${Math.random()}`);

      if (groupedItemsMap.has(groupKey)) {
        const existing = groupedItemsMap.get(groupKey)!;
        existing.quantity += quantity;
        existing.subtotal += subtotal;
        existing.extractedSerials.push(...itemSerials);
        if (!existing.productName && productName) {
          existing.productName = productName;
        }
      } else {
        groupedItemsMap.set(groupKey, {
          productId,
          productName,
          quantity,
          cost,
          price,
          subtotal,
          extractedSerials: [...itemSerials],
        });
      }
    }

    const mappedItems = groupedItemsMap.size
      ? Array.from(groupedItemsMap.values()).map((grouped) => {
        let serials = [...grouped.extractedSerials];

        if (serials.length === 0 && purchaseSerialsList.length > 0) {
          const matched = purchaseSerialsList
            .filter((ps: any) => (ps.productId ?? ps.product?.id) === grouped.productId)
            .map(extractSerialString)
            .filter(Boolean);
          if (matched.length > 0) {
            serials = matched;
          }
        }

        if (serials.length === 0 && fallbackSerialsByProduct[grouped.productId]?.length) {
          serials = fallbackSerialsByProduct[grouped.productId]
            .map(extractSerialString)
            .filter(Boolean);
        }

        // Deduplicate serial strings
        const uniqueSerials: string[] = [];
        const seen = new Set<string>();
        for (const s of serials) {
          const lower = s.toLowerCase();
          if (!seen.has(lower)) {
            seen.add(lower);
            uniqueSerials.push(s);
          }
        }

        const prod = productList.find((p: any) => p.id === grouped.productId);
        const reqSerial = isProductSerialized(prod);
        let serialNumbers: string[] = [];
        if (reqSerial) {
          serialNumbers = uniqueSerials.slice(0, grouped.quantity);
          while (serialNumbers.length < grouped.quantity) {
            serialNumbers.push("");
          }
        }

        return {
          productId: grouped.productId,
          productName: grouped.productName,
          quantity: grouped.quantity,
          cost: grouped.cost,
          price: grouped.price,
          subtotal: grouped.subtotal || grouped.cost * grouped.quantity,
          serialNumbers,
        };
      })
      : [emptyItem()];

    form.reset({
      referenceNo: purchase.referenceNo ?? "",
      purchaseDate: formattedDate,
      supplierId,
      storeId,
      bankId,
      discount: purchase.discount ?? 0,
      total: purchase.total ?? 0,
      grandTotal: purchase.grandTotal ?? 0,
      paidAmount: purchase.paidAmount ?? 0,
      paymentStatus: purchase.paymentStatus ?? "PENDING",
      status: purchase.status ?? Status.ACTIVE,
      items: mappedItems,
    });

    form.setFieldValue("referenceNo", purchase.referenceNo ?? "");
    form.setFieldValue("purchaseDate", formattedDate);
    form.setFieldValue("supplierId", supplierId);
    form.setFieldValue("storeId", storeId);
    form.setFieldValue("bankId", bankId);
    form.setFieldValue("discount", purchase.discount ?? 0);
    form.setFieldValue("total", purchase.total ?? 0);
    form.setFieldValue("grandTotal", purchase.grandTotal ?? 0);
    form.setFieldValue("paidAmount", purchase.paidAmount ?? 0);
    form.setFieldValue("paymentStatus", purchase.paymentStatus ?? "PENDING");
    form.setFieldValue("status", purchase.status ?? Status.ACTIVE);
    form.setFieldValue("items", mappedItems);
  }, [purchaseDetail, fallbackSerialsByProduct]);

  /* -------------------------- Auto-Add Product --------------------------- */

  useEffect(() => {
    if (!isEditing && initialProductId && productList.length > 0 && !handledInitialProduct.current) {
      const product = productList.find((p) => String(p.id) === initialProductId);
      if (product) {
        const cost = Number(product.costPrice ?? 0);
        const hasSerial = isProductSerialized(product);
        form.setFieldValue("items", [
          {
            ...emptyItem(),
            productId: product.id,
            productName: product.name,
            cost,
            price: Number(product.salePrice ?? 0),
            subtotal: cost,
            serialNumbers: hasSerial ? [""] : [],
          },
        ]);
        handledInitialProduct.current = true;
      }
    }
  }, [isEditing, initialProductId, productList]);

  /* ------------------------------ Products ------------------------------- */

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    if (!search) return [];

    return productList
      .filter((item) =>
        [item.code, item.modelName, item.brandName, item.categoryName, item.name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(search)),
      )
      .slice(0, 6);
  }, [productSearch, productList]);

  const addProduct = (product: ProductResponse) => {
    const cost = Number(product.costPrice ?? 0);
    const hasSerial = isProductSerialized(product);
    const currentItems = Array.isArray(formValues.items) ? [...formValues.items] : [];

    const existingIndex = currentItems.findIndex(
      (item: any) => Number(item.productId) === product.id,
    );

    if (existingIndex >= 0) {
      const existing = currentItems[existingIndex];
      const newQty = (Number(existing.quantity) || 0) + 1;
      const existingSerials = hasSerial
        ? (Array.isArray(existing.serialNumbers) ? [...existing.serialNumbers] : []).map(extractSerialString)
        : [];
      if (hasSerial) {
        existingSerials.push("");
      }
      const itemCost = Number(existing.cost ?? cost);

      currentItems[existingIndex] = {
        ...existing,
        quantity: newQty,
        cost: itemCost,
        subtotal: itemCost * newQty,
        serialNumbers: existingSerials,
      };

      form.setFieldValue("items", currentItems);
      toast.success(`Increased quantity for ${product.name} to ${newQty}`);
    } else if (
      currentItems.length === 1 &&
      (!currentItems[0].productId || Number(currentItems[0].productId) === 0)
    ) {
      form.setFieldValue("items", [
        {
          ...emptyItem(),
          productId: product.id,
          productName: product.name,
          cost,
          price: Number(product.salePrice ?? 0),
          subtotal: cost,
          serialNumbers: hasSerial ? [""] : [],
        },
      ]);
    } else {
      form.setFieldValue("items", [
        ...currentItems,
        {
          ...emptyItem(),
          productId: product.id,
          productName: product.name,
          cost,
          price: Number(product.salePrice ?? 0),
          subtotal: cost,
          serialNumbers: hasSerial ? [""] : [],
        },
      ]);
    }

    setProductSearch("");
    setIsSearchOpen(false);
  };

  const addProductFromSearch = () => {
    if (filteredProducts[0]) addProduct(filteredProducts[0]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isEditing && isPurchaseLoading && !purchaseDetail) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading purchase details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/50 dark:bg-background pb-16">
      {/* ------------------------------------------------------------------ */}
      {/* Sticky Top Header Bar                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="sticky top-0 z-20 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-card/95 backdrop-blur px-4 py-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 max-w-[1600px] mx-auto">
          {/* Left: Title & Reference */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              className="size-7 rounded-[3px] border-[#cdd5df] text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              title="Return to purchases list"
            >
              <ArrowLeft className="size-3.5" />
            </Button>

            <div className="flex items-center gap-2">
              <h1 className="font-heading text-sm font-bold tracking-tight text-[#081d33] dark:text-slate-100 sm:text-base">
                {isEditing ? t("purchase.edit") : t("purchase.create")}
              </h1>

              {/* <form.Subscribe selector={(state) => state.values.referenceNo}>
                {(refNo) => (
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-[2px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    {refNo || "PO-DRAFT"}
                  </span>
                )}
              </form.Subscribe> */}

              {/* <span
                className={`inline-flex items-center gap-1 rounded-[2px] px-1.5 py-0.5 text-[10px] font-bold ${isEditing
                  ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                  }`}
              >
                <span
                  className={`size-1.5 rounded-full ${isEditing ? "bg-blue-500" : "bg-emerald-500"}`}
                />
                {isEditing ? t("purchase.editing_mode") : t("purchase.new_intake")}
              </span> */}
            </div>
          </div>

          {/* Center/Right: Live Metrics & Action Buttons */}
          <div className="flex items-center gap-2.5 ml-auto">
            {/* Live Total KPI badge */}
            <div className="flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/30 px-3 py-1.5 text-emerald-800 dark:text-emerald-300">
              <DollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
              <div className="flex items-baseline gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-400/80">
                  {t("common.total")}:
                </span>
                <span className="font-mono text-sm font-black text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(topGrandTotal)}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-md border-slate-300 dark:border-slate-700 text-xs font-semibold px-3 text-slate-600 hover:text-slate-900 cursor-pointer"
              onClick={() => navigate(-1)}
            >
              {t("purchase.discard")}
            </Button>

            <Button
              type="submit"
              form="purchase-form"
              variant="outline"
              disabled={isPending}
              className="h-9 rounded-md border-slate-300 dark:border-slate-700 text-xs font-semibold px-3 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {t("purchase.save_draft")}
            </Button>

            <Button
              type="submit"
              form="purchase-form"
              disabled={isPending}
              className="h-9 rounded-md bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition-all cursor-pointer"
            >
              {isPending ? (
                t("common.saving")
              ) : (
                <>
                  <Check className="mr-1.5 size-3.5" />
                  {isEditing ? t("purchase.update_purchase") : t("purchase.receive_stock")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main Content Layout                                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-5">
        <form
          id="purchase-form"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* ========================================================== */}
            {/* LEFT COLUMN: Purchase Details & Products Intake            */}
            {/* ========================================================== */}
            <div className="min-w-0 space-y-4">
              {/* -------------------------------------------------------- */}
              {/* Card 1: Purchase Information                             */}
              {/* -------------------------------------------------------- */}
              <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-2xs overflow-hidden">
                <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between bg-slate-50/70 dark:bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Package className="size-3.5 text-emerald-600" />
                    <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-[#081d33] dark:text-slate-100">
                      {t("purchase.purchase_info")}
                    </h2>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("purchase.general_details")}
                  </span>
                </div>

                <div className="p-3.5">
                  <FieldGroup className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <FormTextField
                      form={form}
                      name="referenceNo"
                      label={t("purchase.reference")}
                      placeholder="e.g. PO-2026-001"
                      type="text"
                    />

                    <FormTextField
                      form={form}
                      name="purchaseDate"
                      label={t("purchase.date")}
                      type="date"
                      required
                    />

                    <FormSelectField
                      form={form}
                      name="supplierId"
                      label={t("purchase.supplier")}
                      placeholder={t("purchase.select_supplier")}
                      options={supplierList.map((supplier: SupplierResponse) => ({
                        value: String(supplier.id),
                        label: supplier.name,
                      }))}
                      required
                      onAdd={() => setIsSupplierDialogOpen(true)}
                    />

                    <FormSelectField
                      form={form}
                      name="storeId"
                      label={t("purchase.store")}
                      placeholder={t("purchase.select_store")}
                      options={storeList.map((store: StoreResponse) => ({
                        value: String(store.id),
                        label: store.name,
                      }))}
                      required
                      onAdd={() => window.open(ROUTERS.STORE_CREATE, "_blank")}
                    />

                    <div className="sm:col-span-2 lg:col-span-4">
                      <FormTextField
                        form={form}
                        name="note"
                        label={t("purchase.note")}
                        placeholder="Add purchase notes, delivery tracking, or supplier terms..."
                        type="text"
                      />
                    </div>
                  </FieldGroup>
                </div>
              </section>

              {/* -------------------------------------------------------- */}
              {/* Card 2: Products & Inventory Intake                      */}
              {/* -------------------------------------------------------- */}
              <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-2xs overflow-hidden">
                <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between bg-slate-50/70 dark:bg-muted/30">
                  <div className="flex items-center gap-2">
                    <ScanLine className="size-3.5 text-emerald-600" />
                    <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-[#081d33] dark:text-slate-100">
                      {t("purchase.products_intake")}
                    </h2>
                  </div>

                </div>

                <form.Field name="items" mode="array">
                  {(itemsField) => (
                    <>
                      {/* Product search bar */}
                      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-muted/10 p-3">
                        <div ref={searchBoxRef} className="relative flex items-center gap-2.5">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                            <Input
                              value={productSearch}
                              onChange={(event) => {
                                setProductSearch(event.target.value);
                                setIsSearchOpen(true);
                              }}
                              onFocus={() => setIsSearchOpen(true)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  addProductFromSearch();
                                }
                                if (event.key === "Escape") {
                                  setIsSearchOpen(false);
                                }
                              }}
                              placeholder={t("purchase.search_product")}
                              className="h-10 rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-background pl-9 text-sm font-normal shadow-2xs hover:border-slate-400 focus-visible:border-primary"
                            />

                            {isSearchOpen && productSearch.trim() && (
                              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-72 overflow-y-auto rounded-md border border-slate-300 dark:border-slate-700 bg-popover p-1 shadow-lg">
                                {filteredProducts.length === 0 ? (
                                  <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                                    No products match "{productSearch}"
                                  </div>
                                ) : (
                                  filteredProducts.map((product) => (
                                    <button
                                      key={product.id}
                                      type="button"
                                      onClick={() => addProduct(product)}
                                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent/80 cursor-pointer"
                                    >
                                      {product.imageUrl ? (
                                        <ImageCell
                                          fileName={product.imageUrl}
                                          name={product.name}
                                          bucketName="product"
                                          preview={false}
                                          showBorder={false}
                                          fit="cover"
                                          className="size-9 shrink-0 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 object-cover"
                                        />
                                      ) : (
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary border border-primary/20">
                                          {initials(product.name)}
                                        </div>
                                      )}

                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold text-foreground">
                                          {product.name}
                                        </p>
                                        <p className="truncate text-[10px] text-muted-foreground">
                                          {[product.brandName, product.code]
                                            .filter(Boolean)
                                            .join(" · ")}
                                        </p>
                                      </div>

                                      <span className="shrink-0 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(Number(product.costPrice ?? 0))}
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 shrink-0 rounded-md border-slate-300 dark:border-slate-700 px-3.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-muted cursor-pointer shadow-2xs"
                            onClick={() => itemsField.pushValue(emptyItem())}
                          >
                            <Plus className="mr-1.5 size-4" />
                            {t("purchase.add_item")}
                          </Button>
                        </div>
                      </div>

                      {/* Serial error */}
                      {serialError && (
                        <div className="m-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                          <X className="mt-0.5 size-3.5 shrink-0" />
                          <span>{serialError}</span>
                        </div>
                      )}

                      {/* Items Table */}
                      <div>
                        {itemsField.state.value.length === 0 ? (
                          <div className="px-4 py-12 text-center">
                            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-muted">
                              <Package className="size-5 text-slate-400" />
                            </div>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {t("purchase.no_products_intake")}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {t("purchase.no_products_intake_desc")}
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* Table Header */}
                            <div className="hidden md:grid md:grid-cols-12 gap-2.5 sm:gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-muted/40 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider font-heading">
                              <div className="md:col-span-5">{t("purchase.product_details")}</div>
                              <div className="md:col-span-2 text-center">{t("purchase.qty_serials")}</div>
                              <div className="md:col-span-2 text-right">{t("purchase.unit_cost")}</div>
                              <div className="md:col-span-2 text-right">{t("common.subtotal")} ($)</div>
                              <div className="md:col-span-1 text-center">{t("common.action")}</div>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                              {itemsField.state.value.map((item: any, index: number) => (
                                <PurchaseItemRow
                                  key={`purchase-item-${index}-${item?.productId || 0}`}
                                  form={form}
                                  index={index}
                                  products={productList}
                                  onRemove={() => itemsField.removeValue(index)}
                                  t={t}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </form.Field>
              </section>
            </div>

            {/* ========================================================== */}
            {/* RIGHT COLUMN: Sticky Purchase & Payment Summary            */}
            {/* ========================================================== */}
            <aside className="xl:sticky xl:top-14 xl:self-start">
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-2xs overflow-hidden">
                {/* Header */}
                <div className="border-b border-slate-100 dark:border-slate-800 px-3.5 py-2 flex items-center justify-between bg-slate-50/70 dark:bg-muted/30">
                  <div className="flex items-center gap-1.5">
                    <Wallet className="size-3.5 text-emerald-600" />
                    <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-[#081d33] dark:text-slate-100">
                      {t("purchase.summary")}
                    </h2>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-[2px]">
                    {t("purchase.finalize")}
                  </span>
                </div>

                {/* Form fields */}
                <div className="p-3.5 space-y-2.5 border-b border-slate-100 dark:border-slate-800">
                  <FormSelectField
                    form={form}
                    name="bankId"
                    label={t("purchase.payment_bank")}
                    placeholder={t("purchase.select_bank")}
                    options={bankList.map((bank: any) => ({
                      value: String(bank.id),
                      label: bank.name,
                    }))}
                    required
                    onAdd={() => setBankFormOpen(true)}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <FormTextField
                      form={form}
                      name="discount"
                      label={`${t("common.discount")} ($)`}
                      placeholder="0.00"
                      type="number"
                    />

                    <FormTextField
                      form={form}
                      name="paidAmount"
                      label={`${t("purchase.paid_amount")} ($)`}
                      placeholder="0.00"
                      type="number"
                    />
                  </div>
                </div>

                {/* Totals & Breakdown */}
                <form.Subscribe
                  selector={(state) => [
                    state.values.items,
                    state.values.discount,
                    state.values.paidAmount,
                  ]}
                >
                  {([items, discount, paidAmount]) => {
                    const subtotal = (items || []).reduce(
                      (sum: number, item: any) =>
                        sum + (Number(item.cost) || 0) * (Number(item.quantity) || 0),
                      0,
                    );

                    const discountAmount = Number(discount) || 0;
                    const grandTotal = Math.max(subtotal - discountAmount, 0);
                    const paid = Number(paidAmount) || 0;
                    const balance = Math.max(grandTotal - paid, 0);
                    const returnBack = Math.max(paid - grandTotal, 0);

                    return (
                      <div className="p-3.5 space-y-2 bg-slate-50/50 dark:bg-muted/10">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground font-medium">{t("common.subtotal")}</span>
                          <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
                        </div>

                        {discountAmount > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground font-medium">{t("common.discount")}</span>
                            <span className="font-mono font-semibold text-destructive">
                              -{formatCurrency(discountAmount)}
                            </span>
                          </div>
                        )}

                        {/* Grand Total Box */}
                        <div className="rounded-[3px] border border-emerald-500/25 bg-emerald-50/80 dark:bg-emerald-950/30 p-2.5 my-1">
                          <div className="flex items-center justify-between">
                            <span className="font-heading text-xs font-bold text-emerald-900 dark:text-emerald-200">
                              {t("sale.grand_total", "Grand Total")}
                            </span>
                            <span className="text-lg font-mono font-black text-emerald-700 dark:text-emerald-300">
                              {formatCurrency(grandTotal)}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-slate-200/80 dark:border-slate-800 pt-2 space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground font-medium">{t("purchase.paid_amount")}</span>
                            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                              {formatCurrency(paid)}
                            </span>
                          </div>

                          {returnBack > 0 ? (
                            <div className="flex justify-between text-xs items-center bg-emerald-100/70 dark:bg-emerald-950/40 px-2 py-0.5 rounded-[2px]">
                              <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-[11px]">
                                {t("pos.change", "Return Back")}
                              </span>
                              <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                                {formatCurrency(returnBack)}
                              </span>
                            </div>
                          ) : balance > 0 ? (
                            <div className="flex justify-between text-xs items-center bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-[2px]">
                              <span className="font-semibold text-rose-700 dark:text-rose-300 text-[11px]">
                                {t("purchase.due_amount")}
                              </span>
                              <span className="font-mono font-bold text-rose-700 dark:text-rose-300">
                                {formatCurrency(balance)}
                              </span>
                            </div>
                          ) : (
                            <div className="flex justify-between text-xs items-center bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-[2px]">
                              <span className="font-medium text-emerald-700 dark:text-emerald-400 text-[11px]">
                                {t("purchase.due_amount")}
                              </span>
                              <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                                $0.00
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                </form.Subscribe>

                <PaymentForm
                  open={isPaymentModalOpen}
                  setOpen={setIsPaymentModalOpen}
                  payment={null}
                  mode="purchase"
                  purchaseId={isEditing && id ? Number(id) : undefined}
                  orderRef={formValues.referenceNo}
                  amount={topGrandTotal}
                  banks={bankList}
                  onPaymentSubmit={handlePurchaseAndPayment}
                />

                {/* Actions */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 bg-white dark:bg-card">
                  <Button
                    type="submit"
                    form="purchase-form"
                    disabled={isPending || createPayment.isPending}
                    className="h-[30px] w-full rounded-[2px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    {isPending || createPayment.isPending ? (
                      t("common.saving")
                    ) : (
                      <>
                        <Check className="mr-1.5 size-3.5" />
                        {isEditing ? t("purchase.update_purchase") : t("purchase.receive_stock")}
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending || createPayment.isPending}
                    onClick={() => {
                      const validItems = (formValues.items || []).filter(
                        (item: any) => Number(item.productId) > 0 && Number(item.quantity) > 0
                      );
                      if (validItems.length === 0) {
                        toast.error("Please add at least one product before proceeding.");
                        return;
                      }
                      setIsPaymentModalOpen(true);
                    }}
                    className="h-[28px] w-full rounded-[2px] border-[#cdd5df] text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <Wallet className="mr-1.5 size-3 text-blue-600" />
                    {t("common.payment")}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="h-[26px] w-full text-[11px] font-medium text-slate-500 hover:text-slate-800"
                    onClick={() => navigate(-1)}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Dialogs                                                           */}
      {/* ------------------------------------------------------------------ */}
      <FormSupplier
        open={isSupplierDialogOpen}
        setOpen={setIsSupplierDialogOpen}
        supplier={null}
        onCreated={(response) => {
          const supplier = (response as any)?.payload ?? response;
          if (supplier?.id) {
            form.setFieldValue("supplierId", supplier.id);
          }
        }}
      />

      <FormBank open={bankFormOpen} setOpen={setBankFormOpen} bank={null} />
    </div>
  );
}

/* ========================================================================= */
/* Purchase Item Row Component                                               */
/* ========================================================================= */

function PurchaseItemRow({
  form,
  index,
  products,
  onRemove,
}: {
  form: any;
  index: number;
  products: ProductResponse[];
  onRemove: () => void;
  t?: any;
}) {
  const { t: langT } = useLanguage();
  const t = langT;
  const productId = useFormStore(
    form.store,
    (state: any) => state.values.items[index]?.productId,
  );

  const productName = useFormStore(
    form.store,
    (state: any) => state.values.items[index]?.productName,
  );

  const quantity = useFormStore(
    form.store,
    (state: any) => state.values.items[index]?.quantity,
  );

  const cost = useFormStore(
    form.store,
    (state: any) => Number(state.values.items[index]?.cost) || 0,
  );

  const serialNumbers = useFormStore(form.store, (state: any) =>
    Array.isArray(state.values.items[index]?.serialNumbers)
      ? state.values.items[index].serialNumbers
      : [],
  );

  const [isSerialDialogOpen, setIsSerialDialogOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [scanValue, setScanValue] = useState("");
  const [serialDialogError, setSerialDialogError] = useState("");

  const handleApplyExcelSerials = (importedSerials: string[], updateQty: boolean) => {
    const currentQty = Math.max(0, Number(quantity) || 0);
    const targetQty =
      updateQty || importedSerials.length > currentQty
        ? importedSerials.length
        : currentQty;

    if (updateQty || importedSerials.length > currentQty) {
      form.setFieldValue(`items[${index}].quantity`, targetQty);
      form.setFieldValue(`items[${index}].subtotal`, cost * targetQty);
    }

    const nextSerials = [...importedSerials];
    while (nextSerials.length < targetQty) {
      nextSerials.push("");
    }
    form.setFieldValue(`items[${index}].serialNumbers`, nextSerials.slice(0, targetQty));
  };

  const selectedProduct = products.find((product) => product.id === Number(productId));
  const hasSerial = selectedProduct ? isProductSerialized(selectedProduct) : true;

  useEffect(() => {
    if (selectedProduct && !productName) {
      form.setFieldValue(`items[${index}].productName`, selectedProduct.name);
    }
  }, [selectedProduct, productName, index, form]);

  const normalizedSerialNumbers = useMemo(() => {
    const raw = Array.isArray(serialNumbers)
      ? serialNumbers.map(extractSerialString)
      : [];
    const expected = Math.max(0, Number(quantity) || 0);
    const result = raw.slice(0, expected);
    while (result.length < expected) {
      result.push("");
    }
    return result;
  }, [serialNumbers, quantity]);

  const expectedSerialCount = Math.max(0, Number(quantity) || 0);

  const enteredSerialCount = normalizedSerialNumbers.filter((serial: string) =>
    serial.trim(),
  ).length;

  const uniqueSerialCount = new Set(
    normalizedSerialNumbers
      .map((serial: string) => serial.trim().toLowerCase())
      .filter(Boolean),
  ).size;
  const hasDuplicateSerials = uniqueSerialCount < enteredSerialCount;

  const serialsComplete =
    !hasSerial || (expectedSerialCount > 0 && enteredSerialCount === expectedSerialCount && !hasDuplicateSerials);

  /* --------------------------- Add serial ------------------------------- */

  const addSerialNumber = () => {
    const serial = scanValue.trim();

    if (!serial) {
      setSerialDialogError("Enter or scan a serial number.");
      return;
    }

    const duplicate = normalizedSerialNumbers.some(
      (value: string) => value.trim().toLowerCase() === serial.toLowerCase(),
    );

    if (duplicate) {
      setSerialDialogError("This serial number has already been added.");
      return;
    }

    const nextIndex = normalizedSerialNumbers.findIndex((value: string) => !value.trim());

    if (nextIndex === -1) {
      setSerialDialogError("All serial numbers for this quantity have been added.");
      return;
    }

    form.setFieldValue(`items[${index}].serialNumbers[${nextIndex}]`, serial);
    setScanValue("");
    setSerialDialogError("");
  };

  /* ---------------------------- Subtotal -------------------------------- */

  useEffect(() => {
    form.setFieldValue(`items[${index}].subtotal`, cost * (Number(quantity) || 0));
  }, [quantity, cost]);

  /* -------------------------- Serial length ------------------------------ */

  useEffect(() => {
    if (!hasSerial) {
      form.setFieldValue(`items[${index}].serialNumbers`, []);
      return;
    }
    const qty = Math.max(0, Number(quantity) || 0);

    form.setFieldValue(`items[${index}].serialNumbers`, (old: any = []) => {
      const arr = Array.isArray(old)
        ? old.map(extractSerialString)
        : [];
      if (arr.length === qty) return arr;
      const next = arr.slice(0, qty);
      while (next.length < qty) next.push("");
      return next;
    });
  }, [quantity, index, hasSerial]);

  return (
    <div className="px-3.5 py-3 transition-colors hover:bg-slate-50/70 dark:hover:bg-muted/10">
      <div className="grid grid-cols-12 gap-3 items-center">
        {/* Product selection */}
        <div className="col-span-12 md:col-span-5">
          <span className="mb-0.5 block text-xs font-bold text-muted-foreground md:hidden uppercase">
            Product
          </span>
          <form.Field name={`items[${index}].productId`}>
            {(field: any) => {
              const currentVal = field.state.value;
              const currentValStr =
                currentVal && Number(currentVal) > 0 ? String(currentVal) : "";
              const displayName =
                selectedProduct?.name ||
                productName ||
                (currentValStr ? `Product #${currentValStr}` : "");

              const existsInProducts = products.some(
                (p) => String(p.id) === currentValStr,
              );

              return (
                <Select
                  value={currentValStr}
                  onValueChange={(value) => {
                    const numVal = Number(value);
                    if (!numVal) return;

                    const allItems: any[] = form.getFieldValue("items") || [];
                    const duplicateIndex = allItems.findIndex(
                      (item: any, i: number) => i !== index && Number(item.productId) === numVal,
                    );

                    if (duplicateIndex >= 0) {
                      const targetRow = allItems[duplicateIndex];
                      const sourceQty = Math.max(0, Number(quantity) || 0);
                      const targetQty = Math.max(0, Number(targetRow.quantity) || 0);
                      const newTotalQty = targetQty + sourceQty;
                      const sourceSerials = (Array.isArray(serialNumbers) ? serialNumbers : [])
                        .map(extractSerialString)
                        .filter(Boolean);
                      const targetSerials = (Array.isArray(targetRow.serialNumbers) ? targetRow.serialNumbers : [])
                        .map(extractSerialString)
                        .filter(Boolean);

                      const prod = products.find((p) => p.id === numVal);
                      const isSerialized = isProductSerialized(prod);
                      let combinedSerials: string[] = [];
                      if (isSerialized) {
                        combinedSerials = [...targetSerials, ...sourceSerials].slice(0, newTotalQty);
                        while (combinedSerials.length < newTotalQty) {
                          combinedSerials.push("");
                        }
                      }

                      const itemCost = Number(targetRow.cost || prod?.costPrice || 0);

                      const nextItems = allItems
                        .map((item: any, i: number) => {
                          if (i === duplicateIndex) {
                            return {
                              ...item,
                              quantity: newTotalQty,
                              cost: itemCost,
                              subtotal: itemCost * newTotalQty,
                              serialNumbers: combinedSerials,
                            };
                          }
                          return item;
                        })
                        .filter((_: any, i: number) => i !== index);

                      form.setFieldValue("items", nextItems.length ? nextItems : [emptyItem()]);
                      toast.info(`Combined with existing row for ${prod?.name || "product"}.`);
                      return;
                    }

                    const prod = products.find((p) => p.id === numVal);
                    const isSerialized = isProductSerialized(prod);

                    if (Number(currentVal) > 0 && numVal !== Number(currentVal)) {
                      form.setFieldValue(
                        `items[${index}].serialNumbers`,
                        isSerialized
                          ? Array.from({ length: Math.max(0, Number(quantity) || 0) }, () => "")
                          : [],
                      );
                    }
                    field.handleChange(numVal);
                    if (prod) {
                      const itemCost = Number(prod.costPrice ?? 0);
                      form.setFieldValue(`items[${index}].productName`, prod.name);
                      form.setFieldValue(`items[${index}].cost`, itemCost);
                      form.setFieldValue(`items[${index}].price`, Number(prod.salePrice ?? 0));
                      form.setFieldValue(`items[${index}].subtotal`, itemCost * (Number(quantity) || 0));
                      if (!isSerialized) {
                        form.setFieldValue(`items[${index}].serialNumbers`, []);
                      }
                    }
                    setSerialDialogError("");
                    setScanValue("");
                  }}
                >
                  <SelectTrigger
                    aria-label={`Choose product for row ${index + 1}`}
                    className="h-9 w-full cursor-pointer rounded-[2px] border-[#cdd5df] text-sm bg-white dark:bg-background"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                      {selectedProduct?.imageUrl ? (
                        <ImageCell
                          fileName={selectedProduct.imageUrl}
                          name={selectedProduct.name}
                          bucketName="product"
                          preview={false}
                          showBorder={false}
                          fit="cover"
                          className="size-6 shrink-0 rounded object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : selectedProduct ? (
                        <div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/10 text-[9px] font-bold text-primary">
                          {initials(selectedProduct.name)}
                        </div>
                      ) : null}
                      <SelectValue placeholder="Select product">
                        {displayName || undefined}
                      </SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {Boolean(currentValStr) && !existsInProducts && (
                      <SelectItem value={currentValStr}>
                        {displayName}
                      </SelectItem>
                    )}
                    {products.map((product) => (
                      <SelectItem key={product.id} value={String(product.id)} textValue={product.name}>
                        <div className="flex items-center gap-2">
                          {product.imageUrl ? (
                            <ImageCell
                              fileName={product.imageUrl}
                              name={product.name}
                              bucketName="product"
                              preview={false}
                              showBorder={false}
                              fit="cover"
                              className="size-6 shrink-0 rounded object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/10 text-[9px] font-bold text-primary">
                              {initials(product.name)}
                            </div>
                          )}
                          <span>
                            {product.name} {product.code ? `(${product.code})` : ""}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          </form.Field>
        </div>

        {/* Qty & Serials button or direct Qty input */}
        <div className="col-span-5 md:col-span-2">
          <span className="mb-0.5 block text-xs  text-muted-foreground md:hidden uppercase">
            {hasSerial ? (t("purchase.qty_serials") || "Qty & Serials") : (t("purchase.quantity") || "Quantity")}
          </span>
          {hasSerial ? (
            <button
              type="button"
              disabled={!Number(productId)}
              onClick={() => {
                setSerialDialogError("");
                setIsSerialDialogOpen(true);
              }}
              title={Number(productId) ? "Click to set quantity & scan serial numbers" : "Select a product first"}
              aria-label={`Set quantity and scan serial numbers for ${productName || "this product"}`}
              className={`flex h-9 w-full items-center justify-between px-2.5 rounded-[2px] border text-sm font-semibold transition-all cursor-pointer ${serialsComplete
                ? "border-emerald-300 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                : enteredSerialCount > 0
                  ? "border-amber-300 bg-amber-50/70 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  : "border-[#cdd5df] bg-white hover:border-slate-400 text-slate-800 dark:bg-background dark:text-foreground"
                } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span className="font-mono font-bold">{quantity ?? 0}</span>
              <span className="flex items-center gap-1 text-xs">
                <ScanLine className="size-3.5 text-slate-500" />
                <span>{enteredSerialCount}/{expectedSerialCount}</span>
              </span>
            </button>
          ) : (
            <form.Field name={`items[${index}].quantity`}>
              {(field: any) => (
                <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-[2px] overflow-hidden h-9 bg-white dark:bg-background shadow-2xs">
                  <button
                    type="button"
                    disabled={!Number(productId) || (Number(field.state.value) || 0) <= 1}
                    className="size-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border-r border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => {
                      const cur = Math.max(1, (Number(field.state.value) || 1) - 1);
                      field.handleChange(cur);
                      form.setFieldValue(`items[${index}].subtotal`, cost * cur);
                    }}
                  >
                    -
                  </button>
                  <Input
                    type="number"
                    min={1}
                    disabled={!Number(productId)}
                    value={field.state.value ?? 1}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                      field.handleChange(val);
                      form.setFieldValue(`items[${index}].subtotal`, cost * val);
                    }}
                    className="h-full border-0 text-center font-mono text-sm font-bold bg-transparent shadow-none focus-visible:ring-0 p-0"
                  />
                  <button
                    type="button"
                    disabled={!Number(productId)}
                    className="size-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border-l border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => {
                      const cur = (Number(field.state.value) || 1) + 1;
                      field.handleChange(cur);
                      form.setFieldValue(`items[${index}].subtotal`, cost * cur);
                    }}
                  >
                    +
                  </button>
                </div>
              )}
            </form.Field>
          )}
        </div>

        {/* Unit Cost ($) */}
        <div className="col-span-3 md:col-span-2">
          <span className="mb-0.5 block text-xs font-bold text-muted-foreground md:hidden uppercase">
            Unit Cost ($)
          </span>
          <form.Field name={`items[${index}].cost`}>
            {(field: any) => (
              <Input
                type="number"
                min={0}
                step="any"
                value={field.state.value ?? ""}
                onChange={(e) =>
                  field.handleChange(e.target.value === "" ? 0 : Number(e.target.value))
                }
                placeholder="0.00"
                className="h-9 rounded-[2px] border-[#cdd5df] text-right font-mono text-sm font-semibold"
              />
            )}
          </form.Field>
        </div>

        {/* Subtotal ($) */}
        <div className="col-span-3 md:col-span-2">
          <span className="mb-0.5 block text-xs font-bold text-muted-foreground md:hidden uppercase">
            Subtotal ($)
          </span>
          <form.Field name={`items[${index}].subtotal`}>
            {(field: any) => (
              <div className="h-9 flex items-center justify-end px-2.5 rounded-[2px] bg-slate-50 dark:bg-muted/40 border border-[#cdd5df]/70 font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                {formatCurrency(Number(field.state.value) || 0)}
              </div>
            )}
          </form.Field>
        </div>

        {/* Action: Trash */}
        <div className="col-span-1 md:col-span-1 flex items-center justify-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            title="Remove product"
            className="size-8 rounded-[2px] text-slate-400 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Serial numbers preview ribbon */}
      {hasSerial && enteredSerialCount > 0 && (
        <div className="mt-1.5 flex items-center gap-1.5 pl-0.5 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Serials:</span>
          <div className="flex flex-wrap gap-1 items-center max-h-12 overflow-hidden">
            {normalizedSerialNumbers.filter((s: string) => s.trim()).slice(0, 6).map((sn: string, i: number) => (
              <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {sn}
              </span>
            ))}
            {enteredSerialCount > 6 && (
              <span className="text-[10px] text-muted-foreground font-mono font-semibold">
                +{enteredSerialCount - 6} more
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsSerialDialogOpen(true)}
            className="ml-auto text-[10px] text-primary hover:underline font-semibold cursor-pointer"
          >
            Edit Serials
          </button>
        </div>
      )}

      {/* Serial required badge */}
      {hasSerial && Number(productId) > 0 && enteredSerialCount === 0 && (
        <div className="mt-1 flex items-center gap-1.5 pl-0.5 text-xs">
          <button
            type="button"
            onClick={() => {
              setSerialDialogError("");
              setIsSerialDialogOpen(true);
            }}
            className="inline-flex items-center gap-1 rounded-[2px] bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
          >
            <Package className="size-3 text-amber-500" />
            {t("purchase.serial_required", "Serial number is required")}
          </button>
        </div>
      )}

      {/* Serial Dialog */}
      <Dialog open={isSerialDialogOpen} onOpenChange={setIsSerialDialogOpen}>
        <DialogContent className="sm:max-w-xl p-4">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-heading text-sm font-bold text-[#081d33] dark:text-slate-100">
                {t("purchase.qty_serials")}
              </DialogTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 text-xs font-semibold rounded-[2px]"
                onClick={() => {
                  setIsSerialDialogOpen(false);
                  setIsExcelModalOpen(true);
                }}
              >
                <FileSpreadsheet className="size-3 text-emerald-600 dark:text-emerald-400" />
                {t("purchase.import_excel")}
              </Button>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              {productName || selectedProduct?.name || "Selected product"} · Set quantity and scan or enter one serial per unit.
            </DialogDescription>
          </DialogHeader>

          <form.Field name={`items[${index}].quantity`}>
            {(field: any) => (
              <div className="flex items-center justify-between gap-3 rounded-[3px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-muted/20 p-2.5">
                <div>
                  <label htmlFor={`purchase-quantity-${index}`} className="text-xs font-bold text-slate-800 dark:text-slate-200 font-heading">
                    {t("purchase.intake_quantity")}
                  </label>
                  <p className="text-[11px] text-muted-foreground">{t("purchase.serial_per_unit", "One serial number is required per unit.")}</p>
                </div>
                <Input
                  id={`purchase-quantity-${index}`}
                  type="number"
                  min={1}
                  step={1}
                  value={field.state.value ?? 1}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (!Number.isInteger(next) || next < 1) return;
                    if (next < enteredSerialCount) {
                      setSerialDialogError("Remove extra serial numbers before reducing the quantity.");
                      return;
                    }
                    setSerialDialogError("");
                    field.handleChange(next);
                  }}
                  className="h-[29px] w-20 rounded-[2px] bg-white dark:bg-background text-center font-mono text-xs font-bold border-[#cdd5df]"
                />
              </div>
            )}
          </form.Field>

          <div className="rounded-[3px] bg-slate-50 dark:bg-muted/20 border border-slate-200 dark:border-slate-800 p-2.5">
            <div className="flex items-center gap-2">
              <ScanLine className="size-4 text-primary shrink-0" />

              <Input
                autoFocus
                value={scanValue}
                onChange={(event) => setScanValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSerialNumber();
                  }
                }}
                placeholder={t("purchase.scan_placeholder")}
                className="h-[29px] rounded-[2px] bg-white dark:bg-background font-mono text-xs border-[#cdd5df]"
              />
              <Button type="button" onClick={addSerialNumber} className="h-[29px] shrink-0 rounded-[2px] px-3 text-xs font-bold">
                {t("common.add")}
              </Button>
            </div>

            {serialDialogError && (
              <p className="mt-1.5 text-xs text-destructive font-medium">{serialDialogError}</p>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-heading">{t("purchase.serials_registry")}</span>
              <span className={`text-[11px] font-mono font-bold ${serialsComplete ? "text-emerald-600" : "text-amber-600"}`}>
                {enteredSerialCount}/{expectedSerialCount}
              </span>
            </div>

            <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {normalizedSerialNumbers.map((serial: string, serialIndex: number) => (
                <div key={serialIndex} className="flex items-center gap-2">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-[2px] bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    {serialIndex + 1}
                  </div>

                  <Input
                    value={serial}
                    onChange={(event) =>
                      form.setFieldValue(
                        `items[${index}].serialNumbers[${serialIndex}]`,
                        event.target.value,
                      )
                    }
                    aria-label={`Serial number ${serialIndex + 1}`}
                    placeholder={`Serial #${serialIndex + 1}`}
                    className="h-[27px] rounded-[2px] font-mono text-[11px] border-[#cdd5df]"
                  />

                  {serial && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 text-slate-400 hover:text-destructive"
                      onClick={() =>
                        form.setFieldValue(
                          `items[${index}].serialNumbers[${serialIndex}]`,
                          "",
                        )
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {hasDuplicateSerials && (
              <p className="mt-1.5 text-xs text-destructive font-medium">Serial numbers must be unique for this product.</p>
            )}
          </div>

          <DialogFooter className="gap-1.5 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-[2px] text-xs font-semibold border-[#cdd5df]"
              onClick={() => {
                setScanValue("");
                setSerialDialogError("");
              }}
            >
              {t("purchase.clear_scan")}
            </Button>

            <Button
              type="button"
              className="h-8 rounded-[2px] text-xs font-bold bg-primary"
              onClick={() => setIsSerialDialogOpen(false)}
            >
              {t("purchase.done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExcelSerialModal
        open={isExcelModalOpen}
        onOpenChange={setIsExcelModalOpen}
        productName={productName || selectedProduct?.name}
        currentQuantity={expectedSerialCount}
        onApplySerials={handleApplyExcelSerials}
      />
    </div>
  );
};
