
export const PurchasePaymentStatus = {
  Pending: "PENDING",
  Paid: "PAID",
  Partial: "PARTIAL",
} as const;

export type PurchasePaymentStatus = typeof PurchasePaymentStatus[keyof typeof PurchasePaymentStatus];