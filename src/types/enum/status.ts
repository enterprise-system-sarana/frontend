export const Status = {
    Active: "ACTIVE",
    Inactive: "INACTIVE"
} as const;

export type Status = typeof Status[keyof typeof Status];