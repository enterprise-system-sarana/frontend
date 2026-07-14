import { z } from "zod";
import type { PageFilter } from "../pagination";
import { Status } from "../enum/status";

export type UserResponse=   {
  id: number;
  username: string;
  email: string;
  isActive: string;
  isVerified: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
  lastLoginAt: string;
  passwordChangedAt: string;
  storeId: number;
  storeName: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
};

export const UserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().nullable(),
  isActive: z.enum([Status.Active, Status.Inactive]),
  storeId: z.number().optional().nullable(),
  roleCodes: z.array(z.string()).min(1, "At least one role is required"),
});

export interface UserFilter extends PageFilter {
  username?: string;
  email?: string;
}

export type UserRequest = z.infer<typeof UserSchema>;