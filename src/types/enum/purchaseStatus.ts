export const PurchaseStatus = {
    Ordered: "ORDERED",
    Completed: "COMPLETED",
} as const;

export const PurchaseStatusOptions = [
    {
        value: PurchaseStatus.Ordered,
        label: "ORDERED",
    },
    {
        value: PurchaseStatus.Completed,
        label: "COMPLETED",
    },
] satisfies { value: PurchaseStatus; label: string }[];
export type PurchaseStatus = typeof PurchaseStatus[keyof typeof PurchaseStatus];