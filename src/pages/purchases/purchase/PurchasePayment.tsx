import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bold, Italic, List, ListOrdered, Loader2, Paperclip, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/hooks/inventory/useStore";
import { useSupplier } from "@/hooks/purchases/useSupplier";
import { usePurchase } from "@/hooks/purchases/usePurchase";
import { usePayment } from "@/hooks/sales/usePayment";
import { useBank } from "@/hooks/finance/useBank";
import { PurchasePaymentStatus } from "@/types/enum/purchasePaymentStatus";
import { Status } from "@/types/enum/status";
import type { StoreResponse } from "@/types/inventory/Store";
import type { SupplierResponse } from "@/types/purchases/Supplier";

interface PaymentRow {
  id: number;
  date: string;
  reference: string;
  supplierName: string;
  grandTotal: number;
  balance: number;
  amountPaid: number;
  selected: boolean;
}

export const PurchasePaymentPage = () => {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  const [reference, setReference] = useState("PPAY-00001");
  const [storeId, setStoreId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [paidBy, setPaidBy] = useState("CASH");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: storesData } = useStore.useGetAllStore();
  const { data: supplierData } = useSupplier.useGetAllSupplier();
  const { data: bankData } = useBank.useGetAllBank({ page: 1, size: 100 });

  const { data: purchaseData } = usePurchase.GetAll({
    page: 1,
    size: 100,
  });

  const completePurchase = usePurchase.Complete();
  const createPayment = usePayment.createPayment();

  const stores = storesData?.payload?.data || [];
  const suppliers: SupplierResponse[] = supplierData?.payload?.data || [];
  const banks = bankData?.payload?.data || [];

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

        const matchesStore = !storeId || String(purchase.storeId ?? purchase.store?.id ?? "") === storeId;
        return (matchesId || matchesName) && matchesStore && isPending && isApprove;
      })
      .map((purchase: any) => ({
        id: purchase.id,
        date: purchase.purchaseDate ? purchase.purchaseDate.split("T")[0] : "",
        reference: purchase.referenceNo || purchase.reference || "",
        supplierName: purchase.supplierName || selectedSupplier?.name || "",
        grandTotal: Number(purchase.grandTotal) || 0,
        balance:
          purchase.dueAmount !== undefined
            ? Number(purchase.dueAmount)
            : purchase.balance !== undefined
              ? Number(purchase.balance)
              : Number(purchase.grandTotal) || 0,
        amountPaid:
          purchase.dueAmount !== undefined
            ? Number(purchase.dueAmount)
            : purchase.balance !== undefined
              ? Number(purchase.balance)
              : Number(purchase.grandTotal) || 0,
        selected: true,
      }));

    setPaymentRows(unpaidRows);
  }, [supplierId, storeId, purchases, selectedSupplier]);

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

    const selectedRows = paymentRows.filter((row) => row.selected && row.amountPaid > 0);

    if (selectedRows.length === 0) {
      toast.error("Select a purchase and enter an amount greater than zero");
      return;
    }
    if (selectedRows.some((row) => !Number.isFinite(row.amountPaid) || row.amountPaid > row.balance)) {
      toast.error("Amount paid cannot exceed the purchase balance");
      return;
    }
    if (attachment || note.trim()) {
      toast.error("The payment service cannot save notes or attachments yet. Clear them to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const batchId = Date.now();
      for (const row of selectedRows) {
        await createPayment.mutateAsync({
          paymentNo: `${reference.trim() || "PPAY"}-${batchId}-${row.id}`,
          paymentMethod: paidBy === "CASH" ? "CASH" : "BANK",
          bankId: paidBy === "CASH" ? null : Number(paidBy),
          purchaseId: row.id,
          saleId: null,
          amount: row.amountPaid,
          transactionNo: reference.trim() || null,
          paymentDate: date,
          status: Status.ACTIVE,
        });
        if (row.amountPaid >= row.balance) await completePurchase.mutateAsync(row.id);
      }
      await queryClient.invalidateQueries({ queryKey: usePurchase.keys.all });
      setPaymentRows((rows) => rows.filter((row) => !selectedRows.some((paid) => paid.id === row.id && paid.amountPaid >= paid.balance)));
      toast.success("Purchase payment saved successfully");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to complete purchase payment",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStoreId("");
    setSupplierId("");
    setPaymentRows([]);
    setPaidBy("CASH");
    setAttachment(null);
    setNote("");
  };

  const formatNote = (format: "bold" | "italic" | "list" | "numbered") => {
    if (format === "bold") setNote((value) => value ? `**${value}**` : "**bold text**");
    if (format === "italic") setNote((value) => value ? `*${value}*` : "*italic text*");
    if (format === "list") setNote((value) => `${value}${value ? "\n" : ""}- `);
    if (format === "numbered") setNote((value) => `${value}${value ? "\n" : ""}1. `);
  };

  return (
    <div className="purchase-payment-page">
      <form
        onSubmit={handleSubmit}
        className="purchase-payment-form"
      >
        <div className="purchase-payment-intro">
          <h1>
            Please fill in the information below
          </h1>
        </div>

        <div className="purchase-payment-fields">
          <div className="purchase-payment-field">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="purchase-payment-field">
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="purchase-payment-field">
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

          <div className="purchase-payment-field">
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
          <div className="purchase-payment-field">
            <Label htmlFor="payment-attachment">Attachment</Label>
            <label className="purchase-payment-upload" htmlFor="payment-attachment">
              <span title={attachment?.name}>{attachment?.name || ""}</span>
              <span><Paperclip size={13} /> Choose file</span>
            </label>
            <input id="payment-attachment" type="file" className="sr-only" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
          </div>
        </div>

        <div className="purchase-payment-table-wrap">
          <div className="overflow-x-auto">
            <table className="purchase-payment-table">
              <thead>
                <tr>
                  <th className="purchase-payment-checkbox-cell">
                    <input type="checkbox" aria-label="Select all purchases" checked={paymentRows.length > 0 && paymentRows.every((row) => row.selected)} onChange={(e) => setPaymentRows((rows) => rows.map((row) => ({ ...row, selected: e.target.checked })))} />
                  </th>
                  <th>Date</th>
                  <th>Suppliers</th>
                  <th>Reference</th>
                  <th>Grand Total</th>
                  <th>Balance</th>
                  <th>Amount Paid</th>
                  <th className="purchase-payment-action-cell"><Trash2 size={13} /></th>
                </tr>
              </thead>
              <tbody>
                {paymentRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="purchase-payment-empty"
                    >
                      {!supplierId
                        ? "Please select supplier"
                        : "No approved and unpaid purchases found for this supplier."}
                    </td>
                  </tr>
                ) : (
                  paymentRows.map((row) => (
                    <tr key={row.id}>
                      <td className="purchase-payment-checkbox-cell">
                        <input
                          type="checkbox"
                          aria-label={`Select purchase ${row.reference}`}
                          checked={row.selected}
                          onChange={() => handleToggleSelectRow(row.id)}
                        />
                      </td>
                      <td>{row.date}</td>
                      <td>{row.supplierName}</td>
                      <td>{row.reference}</td>
                      <td className="purchase-payment-number">${row.grandTotal.toFixed(2)}</td>
                      <td className="purchase-payment-number">${row.balance.toFixed(2)}</td>
                      <td>
                        <Input
                          type="number"
                          min="0"
                          max={row.balance}
                          step="0.01"
                          value={row.amountPaid}
                          onChange={(e) =>
                            handleAmountPaidChange(
                              row.id,
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="purchase-payment-row-input"
                          disabled={!row.selected}
                        />
                      </td>
                      <td className="purchase-payment-action-cell">
                        <button type="button" aria-label={`Remove purchase ${row.reference}`} onClick={() => setPaymentRows((rows) => rows.filter((item) => item.id !== row.id))}>×</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="purchase-payment-total">
            <strong>Total</strong>
            <strong>${totalPaidSum.toFixed(2)}</strong>
          </div>
        </div>

        <div className="purchase-payment-fields purchase-payment-method-fields">
          <div className="purchase-payment-field">
            <Label htmlFor="paid-by">Paid by</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger id="paid-by" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">CASH</SelectItem>
                {banks.map((bank: { id: number; name?: string; bankName?: string }) => <SelectItem key={bank.id} value={String(bank.id)}>{bank.name || bank.bankName || `Bank #${bank.id}`}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="purchase-payment-field">
            <Label htmlFor="payment-amount">Amount</Label>
            <Input id="payment-amount" value={totalPaidSum.toFixed(2)} readOnly aria-label="Total payment amount" />
          </div>
        </div>

        <div className="purchase-payment-note">
          <Label htmlFor="note">Note</Label>
          <div className="purchase-payment-editor">
            <div className="purchase-payment-toolbar" role="toolbar" aria-label="Note formatting">
              <button type="button" onClick={() => formatNote("bold")} title="Bold"><Bold size={13} /></button>
              <button type="button" onClick={() => formatNote("italic")} title="Italic"><Italic size={13} /></button>
              <button type="button" onClick={() => formatNote("list")} title="Bullet list"><List size={13} /></button>
              <button type="button" onClick={() => formatNote("numbered")} title="Numbered list"><ListOrdered size={13} /></button>
            </div>
            <textarea id="note" rows={5} value={note} onChange={(e) => setNote(e.target.value)} aria-describedby="payment-note-help" />
          </div>
          <p id="payment-note-help" className="purchase-payment-help">Notes and attachments cannot be saved by the current payment service.</p>
        </div>

        <div className="purchase-payment-actions">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Payment
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            onClick={resetForm}
          >
            <RotateCcw size={12} /> Reset
          </Button>
        </div>
      </form>
    </div>
  );
};
