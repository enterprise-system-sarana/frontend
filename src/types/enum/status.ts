export const Status = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
} as const;

export type Status = typeof Status[keyof typeof Status];