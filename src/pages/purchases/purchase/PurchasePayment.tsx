import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/ui/page-header";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/hooks/inventory/useStore";
import { useSupplier } from "@/hooks/purchases/useSupplier";
import { usePurchase } from "@/hooks/purchases/usePurchase";
import { PurchasePaymentStatus } from "@/types/enum/purchasePaymentStatus";
import type { StoreResponse } from "@/types/inventory/Store";
import type { SupplierResponse } from "@/types/purchases/Supplier";

interface PaymentRow {
  id: number;
  date: string;
  reference: string;
  grandTotal: number;
  balance: number;
  amountPaid: number;
  selected: boolean;
}

export const PurchasePaymentPage = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [reference, setReference] = useState("PPAY-00001");
  const [storeId, setStoreId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openPaymentForm, setOpenPaymentForm] = useState(false);
  const [selectedPaymentRow, setSelectedPaymentRow] = useState<PaymentRow | null>(null);

  const { data: storesData } = useStore.useGetAllStore();
  const { data: supplierData } = useSupplier.useGetAllSupplier();

  const { data: purchaseData } = usePurchase.GetAll({
    page: 1,
    size: 100,
  });

  const completePurchase = usePurchase.Complete();

  const stores = storesData?.payload?.data || [];
  const suppliers: SupplierResponse[] = supplierData?.payload?.data || [];

  const purchases = useMemo(() => {
    return purchaseData?.payload?.data || [];
  }, [purchaseData]);

  const selectedSupplier = suppliers.find(
    (s: any) => String(s.id) === String(supplierId),
  );

  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([]);

  useEffect(() => {
    if (!supplierId) {
      setPaymentRows([]);
      return;
    }

    const unpaidRows: PaymentRow[] = purchases
      .filter((purchase: any) => {
        const purchaseSupplierId = String(
          purchase.supplier?.id || purchase.supplierId || "",
        );
        const purchaseSupplierName = String(
          purchase.supplier?.name || purchase.supplierName || "",
        ).toLowerCase();

        const matchesId = purchaseSupplierId === String(supplierId);
        const matchesName =
          selectedSupplier &&
          purchaseSupplierName === String(selectedSupplier.name).toLowerCase();

        const paymentStatus = String(purchase.paymentStatus || "")
          .trim()
          .toUpperCase();
        const isPending =
          paymentStatus ===
            String(PurchasePaymentStatus.Pending).toUpperCase() ||
          paymentStatus === String(PurchasePaymentStatus.Partial).toUpperCase();
        const isApprove =
          String(purchase.status || "").toUpperCase() === "APPROVED" ||
          String(purchase.status || "").toUpperCase() === "ACT";

        return (matchesId || matchesName) && isPending && isApprove;
      })
      .map((purchase: any) => ({
        id: purchase.id,
        date: purchase.purchaseDate ? purchase.purchaseDate.split("T")[0] : "",
        reference: purchase.referenceNo || purchase.reference || "",
        grandTotal: purchase.grandTotal || 0,
        balance:
          purchase.dueAmount !== undefined
            ? purchase.dueAmount
            : purchase.balance !== undefined
              ? purchase.balance
              : purchase.grandTotal || 0,
        amountPaid:
          purchase.dueAmount !== undefined
            ? purchase.dueAmount
            : purchase.balance !== undefined
              ? purchase.balance
              : purchase.grandTotal || 0,
        selected: true,
      }));

    setPaymentRows(unpaidRows);
  }, [supplierId, purchases, selectedSupplier]);

  const totalPaidSum = paymentRows
    .filter((row) => row.selected)
    .reduce((acc, row) => acc + (row.amountPaid || 0), 0);

  const handleAmountPaidChange = (id: number, value: number) => {
    setPaymentRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, amountPaid: value } : row)),
    );
  };

  const handleToggleSelectRow = (id: number) => {
    setPaymentRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, selected: !row.selected } : row,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !storeId) {
      toast.error("Please select a store and supplier");
      return;
    }

    const selectedRows = paymentRows.filter((row) => row.selected);

    if (selectedRows.length === 0) {
      toast.error("No outstanding purchases selected to pay");
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.all(
        selectedRows.map((row) => completePurchase.mutateAsync(row.id)),
      );
      navigate("/purchase");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to complete purchase payment",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Purchases Payment" />

      <form
        onSubmit={handleSubmit}
        className="bg-card border rounded-lg p-6 shadow-sm space-y-6"
      >
        <div className="border-b pb-4">
          <h3 className="text-base font-semibold">
            Please fill in the information below
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="store">
              Store <span className="text-destructive">*</span>
            </Label>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger id="store" className="w-full">
                <SelectValue placeholder="Select Store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store: StoreResponse) => (
                  <SelectItem key={store.id} value={String(store.id)}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">
              Supplier <span className="text-destructive">*</span>
            </Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger id="supplier" className="w-full">
                <SelectValue placeholder="Select Supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier: SupplierResponse) => (
                  <SelectItem key={supplier.id} value={String(supplier.id)}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border rounded-md overflow-hidden mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#0f3d3e] text-white uppercase text-xs">
                <tr>
                  <th className="p-3 w-12 text-center">
                    <span className="sr-only">Select All</span>
                  </th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Grand Total</th>
                  <th className="p-3">Balance</th>
                  <th className="p-3">Amount Paid</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-background">
                {paymentRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-muted-foreground"
                    >
                      {!supplierId
                        ? "Please select supplier to load outstanding purchases."
                        : "No approved and unpaid purchases found for this supplier."}
                    </td>
                  </tr>
                ) : (
                  paymentRows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/50">
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={() => handleToggleSelectRow(row.id)}
                          className="rounded border-input cursor-pointer"
                        />
                      </td>
                      <td className="p-3">{row.date}</td>
                      <td className="p-3 font-medium">{row.reference}</td>
                      <td className="p-3">${row.grandTotal.toFixed(2)}</td>
                      <td className="p-3">${row.balance.toFixed(2)}</td>
                      <td className="p-3">
                        <Input
                          type="number"
                          value={row.amountPaid}
                          onChange={(e) =>
                            handleAmountPaidChange(
                              row.id,
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-32 h-8"
                          disabled={!row.selected}
                        />
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setSelectedPaymentRow(row);
                            setOpenPaymentForm(true);
                          }}
                        >
                          Pay
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-muted/30 px-4 py-3 flex justify-end items-center gap-6 border-t font-semibold">
            <span>Total</span>
            <span className="text-base">${totalPaidSum.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Note</Label>
          <div className="border rounded-md overflow-hidden bg-background">
            <Textarea
              id="note"
              rows={5}
              placeholder="Add payment notes here..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="border-0 focus-visible:ring-0 rounded-none shadow-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Payment
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            onClick={() => {
              setSupplierId("");
              setStoreId("");
              setPaymentRows([]);
              setNote("");
            }}
          >
            Reset
          </Button>
        </div>
      </form>

      <PaymentForm
        open={openPaymentForm}
        setOpen={setOpenPaymentForm}
        payment={null}
        mode="purchase"
        purchaseId={selectedPaymentRow?.id}
        amount={selectedPaymentRow?.amountPaid || selectedPaymentRow?.balance || 0}
        onPurchasePayment={async (purchaseId) => {
          await completePurchase.mutateAsync(purchaseId);
          setPaymentRows((rows) => rows.filter((row) => row.id !== purchaseId));
          toast.success("Purchase payment completed successfully");
        }}
      />
    </div>
  );
};
