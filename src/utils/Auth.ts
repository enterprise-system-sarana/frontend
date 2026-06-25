import type { AuthUser } from "@/types/Auth";

const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY || "access_token";
const REFRESH_TOKEN_KEY = import.meta.env.VITE_REFRESH_TOKEN_KEY || "refresh_token";
const USER_KEY = import.meta.env.VITE_USER_KEY || "auth_user";

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const getUser = (): AuthUser | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as AuthUser;
  } catch (e) {
    return null;
  }
};

export const setUser = (user: AuthUser): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

export const hasRole = (role: string): boolean => {
  const user = getUser();
  return user ? user.roles.includes(role) : false;
};

export const hasAnyRole = (roles: string[]): boolean => {
  const user = getUser();
  return user ? user.roles.some((r) => roles.includes(r)) : false;
};

export const hasPermission = (permissionCode: string): boolean => {
  const user = getUser();
  if (!user) return false;
  // Super Admin automatically bypasses all permissions checks
  if (user.roles.includes("SUPER_ADMIN")) return true;
  return user.permissions ? user.permissions.includes(permissionCode) : false;
};

export const hasAnyPermission = (permissionCodes: string[]): boolean => {
  const user = getUser();
  if (!user) return false;
  if (user.roles.includes("SUPER_ADMIN")) return true;
  return user.permissions
    ? user.permissions.some((p) => permissionCodes.includes(p))
    : false;
};
