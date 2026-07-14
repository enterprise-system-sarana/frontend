import { z } from "zod";
import { Status } from "../enum/status";

export type BankResponse = {
    id: number;
    name: string;
    number: string;
    amount: string;
    isDefault: string;
    statement: string;
    status: string;
    fromTime?: string;
    toTime?: string;
};

export const BankSchema = z.object({
    name: z.string().min(3, "Name must be between 3 and 100 characters").max(100, "Name must be between 3 and 100 characters"),
    number: z.string().min(1, "Number is required").max(50, "Number must be less than 50 characters"),
    amount: z.string().optional().nullable(),
    isDefault: z.string().max(50).optional().nullable(),
    statement: z.string().max(520).optional().nullable(),
    fromTime: z.string().optional().nullable(),
    toTime: z.string().optional().nullable(),
    status: z.enum([Status.Active, Status.Inactive]).default(Status.Active),
});

export type BankRequest = z.infer<typeof BankSchema>;