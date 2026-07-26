export const PurchaseStatus = {
  Ordered: "ORDERED",
  Completed: "COMPLETED",
} as const;

export type PurchaseStatus = typeof PurchaseStatus[keyof typeof PurchaseStatus];