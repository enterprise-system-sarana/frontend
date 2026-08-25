export const Status = {
    ACTIVE: "ACT",
    INACTIVE: "INA",
    DELETE: "DEL"
    // Banned: "BAN"
} as const;

export const StatusLabel: Record<Status, string> = {
    ACT: "ACTIVE",
    INA: "INACTIVE",
    DEL: "DELETE",
};
export const StatusOptions = [
    {
        value: Status.ACTIVE,
        label: "ACTIVE",
    },
    {
        value: Status.INACTIVE,
        label: "INACTIVE",
    },
    {
        value: Status.DELETE,
        label: "DELETE",
    },
] satisfies { value: Status; label: string }[];
export type Status = typeof Status[keyof typeof Status];    