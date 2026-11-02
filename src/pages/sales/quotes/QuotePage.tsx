import { useMemo, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DataTable,
  exportTableToCsv,
  exportTableToPdf,
  printTable,
  getColumnsForVisibility,
} from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import { PERMISSION } from "@/constants/Permission";
import { useQuote } from "@/hooks/sales/useQuote";
import { useSale } from "@/hooks/sales/useSale";
import { useCustomer } from "@/hooks/sales/useCustomer";
import { useProduct } from "@/hooks/product/useProduct";
import { useProductSerial } from "@/hooks/product/useProductSerial";
import { useCashRegister } from "@/hooks/sales/useCashRegister";
import { usePayment } from "@/hooks/sales/usePayment";
import type { QuoteResponse } from "@/types/quote/Quote";
import { usePermission } from "@/utils/UsePermission";
import { useSearch } from "@/utils/useSearch";
import { QuoteColumns } from "./QuoteColumn";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { PageFilter, type FilterGroup } from "@/utils/PageFilter";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { AccessDenied } from "@/components/ui/access-denied";
import { ROUTERS } from "@/constants/Route";
import { useLanguage } from "@/i18n/LanguageContext";
import { salesService } from "@/services/sales/sales.service";
import { PaymentService } from "@/services/sales/payment.service";
import { quoteService } from "@/services/sales/quote.service";

export const QuotePage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { Can } = usePermission();
  const canCreate = Can(PERMISSION.QUOTE?.CREATE || PERMISSION.SALE?.CREATE);
  const canRead = Can(PERMISSION.QUOTE?.READ || PERMISSION.SALE?.READ);
  const canUpdate = Can(PERMISSION.QUOTE?.UPDATE || PERMISSION.SALE?.UPDATE);
  const canDelete = Can(PERMISSION.QUOTE?.DELETE || PERMISSION.SALE?.DELETE);

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  const { data: customerData } = useCustomer.useGetAllCustomer({ page: 1, size: 100 });
  const customers = customerData?.payload?.data || [];

  const { data, isError, isLoading } = useQuote.useGetAllQuote({
    page,
    size,
    reference: search || undefined,
    customerId: filterValues.customerId ? Number(filterValues.customerId) : undefined,
    status: filterValues.status || undefined,
  });

  const { mutate: deleteQuoteMutate } = useQuote.useDeleteQuote();

  // Filter groups for toolbar
  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: "status",
        label: t("common.status", "Status"),
        options: [
          { label: "Pending (Booking)", value: "PENDING" },
          { label: "Approved", value: "APPROVED" },
          { label: "Ordered", value: "ORDERED" },
          { label: "Completed", value: "COMPLETED" },
          { label: "Rejected", value: "REJECTED" },
        ],
      },
      {
        key: "customerId",
        label: t("customer.name", "Customer"),
        options: customers.map((c: any) => ({
          label: c.name,
          value: String(c.id),
        })),
      },
    ],
    [customers, t]
  );

  const handleColumnToggle = (columnId: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: prev[columnId] === false ? true : false,
    }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => {
      const next = { ...prev };
      if (!value) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setFilterValues({});
    setPage(1);
  };

  const searchedQuotes = useSearch<QuoteResponse>(
    data?.payload?.data,
    search,
    ["reference", "no", "customerName", "status"]
  );

  const filteredQuotes = useMemo(() => {
    return searchedQuotes.filter((item) => {
      if (filterValues.status && item.status !== filterValues.status) {
        return false;
      }
      if (
        filterValues.customerId &&
        String(item.customerId) !== filterValues.customerId
      ) {
        return false;
      }
      return true;
    });
  }, [searchedQuotes, filterValues]);

  const handleEdit = (q: QuoteResponse) => {
    navigate(`/quote/edit/${q.id}`);
  };

  const handleDelete = (id: number) => {
    const selected = data?.payload?.data?.find(
      (u: QuoteResponse) => u.id === id
    );
    if (selected) {
      setQuote(selected);
      setOpenConfirmDelete(true);
    }
  };

  const confirmDelete = () => {
    if (quote?.id) {
      deleteQuoteMutate(quote.id, {
        onSuccess: () => {
          setOpenConfirmDelete(false);
        },
      });
    }
  };

  /**
   * Action when goods arrive for a booking/quote:
   * 1. Converts quote items into a Sale.
   * 2. Preserves already-paid deposit as payment credit.
   * 3. Sets quote status to COMPLETED.
   * 4. Redirects to Sale Edit (/sale/edit/:id) where user can assign newly-arrived serials,
   *    collect remaining balance, and print invoice.
   */
  const handleGoodsArrived = async (selectedQuote: QuoteResponse) => {
    try {
      toast.loading(t("quote.converting_to_sale", "Converting booking to sale..."));

      const rawItems = selectedQuote.items || [];
      const saleItems = rawItems.map((it: any) => {
        const pQty = Number(it.qty ?? it.quantity ?? 1);
        const pPrice = Number(it.price ?? 0);
        const pDiscount = Number(it.discount_item ?? it.discount ?? 0);
        const pSubtotal = Number(it.subtotal ?? Math.max(0, pPrice * pQty - pDiscount));
        return {
          productId: Number(it.productId),
          quantity: pQty,
          price: pPrice,
          itemDiscount: pDiscount,
          subtotal: pSubtotal,
          serialNumberIds: [],
        };
      });

      if (saleItems.length === 0) {
        toast.dismiss();
        toast.error("Quote has no items to convert.");
        return;
      }

      const subtotalCalc = saleItems.reduce((sum, it) => sum + it.subtotal, 0);
      const discountVal = Number(selectedQuote.discount) || 0;
      const grandTotalCalc = Number(selectedQuote.grandTotal) || Math.max(0, subtotalCalc - discountVal);
      const depositPaid = Number(selectedQuote.paidAmount) || 0;
      const dueAmount = Math.max(0, grandTotalCalc - depositPaid);
      const isPaid = depositPaid >= grandTotalCalc;

      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
      const rand = Math.floor(1000 + Math.random() * 9000);
      const posRef = `POS-${dateStr}-${rand}`;

      const salePayload: any = {
        reference: posRef,
        saleDate: new Date().toISOString().split("T")[0],
        customerId: Number(selectedQuote.customerId || selectedQuote.customer?.id || 1),
        storeId: 1,
        discount: discountVal,
        totalAmount: subtotalCalc,
        grandTotal: grandTotalCalc,
        paidAmount: depositPaid,
        dueAmount: dueAmount,
        paymentOption: isPaid ? "PAID" : "DUE",
        paymentStatus: isPaid ? "PAID" : (depositPaid > 0 ? "PARTIAL" : "PENDING"),
        status: "PENDING",
        noted: `Pre-order Booking #${selectedQuote.no || selectedQuote.reference}${selectedQuote.noted ? ` - ${selectedQuote.noted}` : ""}`,
        items: saleItems,
      };

      // 1. Create the Sale
      const createdSaleRes: any = await salesService.create(salePayload);
      const newSale =
        createdSaleRes?.payload?.data ??
        createdSaleRes?.data ??
        createdSaleRes?.payload ??
        createdSaleRes;

      const newSaleId = Number(newSale?.id || 0);

      if (!newSaleId) {
        throw new Error("Failed to create sale from booking.");
      }

      // 2. If there was a deposit already paid on the quote, record the payment against this sale
      if (depositPaid > 0) {
        try {
          await PaymentService.create({
            saleId: newSaleId,
            totalAmount: depositPaid,
            amount: depositPaid,
            paymentMethod: "CASH",
            paymentNo: `DEP-${newSale.reference || newSaleId}`,
            paymentDate: new Date().toISOString().split("T")[0],
            status: isPaid ? "PAID" : "PARTIAL",
          });
        } catch (payErr) {
          console.warn("Could not record initial deposit payment:", payErr);
        }
      }

      // 3. Mark the quote status as COMPLETED
      try {
        await quoteService.update(selectedQuote.id, {
          reference: String(selectedQuote.reference || ""),
          no: String(selectedQuote.no || ""),
          date: selectedQuote.date || new Date().toISOString(),
          customerId: Number(selectedQuote.customerId || 1),
          discount: discountVal,
          grandTotal: grandTotalCalc,
          status: "COMPLETED",
          paymentStatus: isPaid ? "PAID" : (depositPaid > 0 ? "PARTIAL" : "PENDING"),
          paidAmount: depositPaid,
          returnAmount: Number(selectedQuote.returnAmount || 0),
          noted: selectedQuote.noted || selectedQuote.note || "",
          items: rawItems.map((it: any) => ({
            productId: Number(it.productId),
            qty: Number(it.qty ?? it.quantity ?? 1),
            price: Number(it.price ?? 0),
            discount_item: Number(it.discount_item ?? it.discount ?? 0),
            subtotal: Number(it.subtotal ?? (Number(it.price ?? 0) * Number(it.qty ?? 1))),
          })),
        });
      } catch (qErr) {
        console.warn("Could not update quote status:", qErr);
      }

      // 4. Invalidate relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: useQuote.keys.all }),
        queryClient.invalidateQueries({ queryKey: useSale.keys.all }),
        queryClient.invalidateQueries({ queryKey: useProduct.keys.all }),
        queryClient.invalidateQueries({ queryKey: useProductSerial.keys.all }),
        queryClient.invalidateQueries({ queryKey: useCashRegister.keys.all }),
        queryClient.invalidateQueries({ queryKey: usePayment.paymentKey.all }),
      ]);

      toast.dismiss();
      toast.success(
        language === "km"
          ? "ទំនិញមកដល់ហើយ! បានបង្កើតការលក់រួចរាល់ កំពុងចូលទៅកាន់ Sale Edit..."
          : "Goods arrived! Sale created. Opening Sale Edit..."
      );

      // 5. Navigate to Sale Edit
      navigate(ROUTERS.SALE_EDIT.replace(":id", String(newSaleId)));
    } catch (error: any) {
      toast.dismiss();
      const msg = error?.response?.data?.message || error?.message || "Failed to convert quote to sale.";
      toast.error(msg);
    }
  };

  const columns = useMemo(
    () =>
      QuoteColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onGoodsArrived: handleGoodsArrived,
        canEdit: canUpdate,
        canDelete: canDelete,
        t,
      }),
    [canUpdate, canDelete, t]
  );

  const handleExportCsv = () => {
    exportTableToCsv(filteredQuotes, columns, "Quotes");
  };

  const handleDownloadPdf = () => {
    exportTableToPdf(filteredQuotes, columns, "Quotes", "Quotes List");
  };

  const handlePrintPdf = () => {
    printTable("Quotes List");
  };

  if (!canRead) {
    return <AccessDenied resource="quotes" showBackButton />;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Top Header */}
        <PageHeader
          title={t("quote.title", "Quotes & Pre-Orders")}
          featureName={t("quote.title", "Quote / Pre-Order")}
          buttonLabel={t("quote.create", "Add Pre-Order")}
          onCreate={
            canCreate
              ? () => navigate(ROUTERS.QUOTE_CREATE || "/quote/create")
              : undefined
          }
          hideButton={!canCreate}
        />

        {/* Main Card with Toolbar & Table */}
        <div className="overflow-hidden border rounded-2xl border-border/60 bg-card shadow-2xs">
          {/* Toolbar row with Search, Filter+, Columns, Print, CSV */}
          <div className="px-5 py-4 border-b border-border">
            <PageFilter
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder={t("quote.search_placeholder", "Search reference or quote no...")}
              filterGroups={filterGroups}
              filterValues={filterValues}
              onFilterChange={handleFilterChange}
              columns={getColumnsForVisibility(columns, columnVisibility)}
              onColumnToggle={handleColumnToggle}
              onPrintPdf={handlePrintPdf}
              onDownloadPdf={handleDownloadPdf}
              onDownloadCsv={handleExportCsv}
              onReset={handleReset}
            />
          </div>

          {/* Table View */}
          <div className="px-0">
            <QueryBoundary isLoading={isLoading} isError={isError}>
              <DataTable
                columns={columns}
                data={filteredQuotes}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                pagination={{
                  currentPage: page,
                  pageSize: size,
                  totalElements:
                    data?.payload?.pagination?.totalElements ||
                    filteredQuotes.length,
                  totalPages: data?.payload?.pagination?.totalPages || 1,
                  onPageChange: setPage,
                  onPageSizeChange: setSize,
                }}
              />
            </QueryBoundary>
          </div>
        </div>
      </div>

      <ConfirmDelete
        isOpen={openConfirmDelete}
        setIsOpen={setOpenConfirmDelete}
        entityName={t("quote.title", "Quote")}
        confirmDelete={confirmDelete}
      />
    </>
  );
};

export default QuotePage;
