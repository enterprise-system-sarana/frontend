import { z } from "zod";
import type { BaseResponse, PageFilter } from "../pagination";
import { Status } from "../enum/status";
import { stringValidate, validateString } from "../validator";

export interface CustomerResponse extends BaseResponse {
  name: string;
  code: string;
  phone?: string;
  email?: string;
  note?: string;
  status: Status;
}

export const CustomerSchema = z.object({
  name: validateString("Name"),
  code: validateString("Code"),
  phone: stringValidate(),
  email: stringValidate(),
  note: stringValidate(),
  status: validateString("Status"),
});

export interface CustomerFilter extends PageFilter {
  name?: string;
  code?: string;
}

export type CustomerRequest = z.infer<typeof CustomerSchema>;