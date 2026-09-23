import { z } from "zod";
import type { BaseResponse, PageFilter } from "../pagination";
import { Status } from "../enum/status";

export interface UserResponse extends BaseResponse {
  firstName: string;
  lastName: string;
  phone: string;
  username: string;
  email: string;
  profileImage?: string ;

  isActive: string;
  isVerified: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
  lastLoginAt: string;
  passwordChangedAt: string;
  storeId: number;
  storeName: string;
  roles: string[];
}

export const UserSchema = z.object({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().nullable(),
  profileImage: z.string().optional().nullable(),
  isActive: z.string().default(Status.ACTIVE),
  storeId: z.number().optional().nullable(),
  roleCodes: z.array(z.string()).min(1, "At least one role is required"),
});

export interface UserFilter extends PageFilter {
  username?: string;
  email?: string;
}

export type UserRequest = z.infer<typeof UserSchema>;