import { store } from "@/store/store";
import api from "../lib/axios";
import { setCredentials } from "@/store/authSlice";
import { getRefreshToken } from "@/utils/Auth";

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  emailOrUsername: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  storeId: number | null;
}

export const AuthService = {
  login: async (credentials: LoginRequest) => {
    const response = await api.post("/auth/login", credentials);
    const data = response.data.payload || response.data;
    try {
      const { accessToken, refreshToken, ...user } = data;
      store.dispatch(
        setCredentials({
          user: user,
          accessToken,
          refreshToken,
        }),
      );
      return data;
    } catch (e) {
      console.log(e);
    }
  },

  refreshToken: async (refreshToken: string) => {
    const res = await api.post("/auth/refresh", { refreshToken });
    return res.data.payload || res.data;
  },

  register: async (credentials: RegisterRequest) => {
    const res = await api.post("/auth/register", credentials);
    return res.data;
  },

  logout: async () => {
    const refreshToken = getRefreshToken();
    await api.post("/auth/logout", { refreshToken });
  },

  forgotPassword: async (data: ForgotPasswordRequest) => {
    const res = await api.post("/auth/forgot-password", data);
    return res.data;
  },

  changePassword: async (data: ChangePasswordRequest) => {
    const res = await api.post("/auth/change-password", data);
    return res.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    await api.post("/auth/reset-password", { token, newPassword });
  },
};
