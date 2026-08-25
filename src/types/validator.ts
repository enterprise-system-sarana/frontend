import { z } from "zod";


export const validateString = (message?: string) => z.string().trim().min(1, message ?? " is required");

export const validateEmail = (message?: string) => z.email().trim().min(1, message ?? " is required");
export const validateNumber = (message?: string) => z.number().min(0, message ?? " is required")

export const validateAddress = (message?: string) => z.string().trim().min(1, message ?? "Address is required");

export const stringValidate = () => z.string().trim();