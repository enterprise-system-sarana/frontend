import z from "zod";
import { Status } from "../enum/status";
import type { PageFilter } from "../pagination";

export type UnitResponse = {
  id: number;
  baseUnit: number;
  name: string;
  code: string;
  operation: string;
  operationValue: number;
  status: Status;
};

export const Operation = {
  Multiply: "MULTIPLY",
  Divide: "DIVIDE",
} as const;

export type Operation = typeof Operation[keyof typeof Operation];

export const UnitSchema = z.object({
  baseUnit: z.union([z.number(), z.string().transform((v) => v === "" ? undefined : Number(v))]).optional(),
  name: z.string().min(1, "Unit name is required"),
  code: z.string().min(1, "Unit code is required"),
  operation: z.enum([Operation.Multiply, Operation.Divide]),
  operationValue: z.union([z.number(), z.string().transform((v) => v === "" ? undefined : Number(v))]).optional(),
  status: z.enum([Status.Active, Status.Inactive]),
});

export type UnitRequest = z.infer<typeof UnitSchema>;
export type UnitFormValues = z.input<typeof UnitSchema>;

export interface UnitFilter extends PageFilter {
  name?: string;
  code?: string;
}