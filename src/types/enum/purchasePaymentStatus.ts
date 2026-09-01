export const PurchasePaymentStatus = {
  Pending: "PENDING",
  Paid: "PAID",
  Partial: "PARTIAL",
} as const;



export const PurchasePaymentStatusOptions = [
  {
    value: PurchasePaymentStatus.Pending,
    label: "PENDING",
  },
  {
    value: PurchasePaymentStatus.Paid,
    label: "PAID",
  },
  {
    value: PurchasePaymentStatus.Partial,
    label: "PARTIAL",
  },
] satisfies { value: PurchasePaymentStatus; label: string }[];
export type PurchasePaymentStatus =
  (typeof PurchasePaymentStatus)[keyof typeof PurchasePaymentStatus];
