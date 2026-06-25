import { store } from "@/store/store";
import api from "../lib/axios";
import { setCredentials } from "@/store/authSlice";
import { getRefreshToken } from "@/utils/Auth";

export interface LoginRequest {
    usernameOrEmail: string;
    password: string;
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
        const res = await api.post("/auth/login", credentials);
        const data = res.data.payload || res.data;
        const { accessToken, refreshToken, ...user } = data;
        store.dispatch(
            setCredentials({
                user: user,
                accessToken,
                refreshToken,
            })
        );
        console.log("Login response data:", data);
        return data;
    },

    refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
        const res = await api.post("/auth/refresh", { refreshToken });
        return res.data;
    },
    register: async (credentials: LoginRequest): Promise<AuthResponse> => {
        const res = await api.post("/auth/register", credentials);
        return res.data;
    },
    logout: async (): Promise<void> => {
        const refreshToken = getRefreshToken();
        await api.post("/auth/logout", { refreshToken });
    },
    forgotPassword: async (email: string): Promise<void> => {
        await api.post("/auth/forgot-password", { email });
    },
    resetPassword: async (token: string, newPassword: string): Promise<void> => {
        await api.post("/auth/reset-password", { token, newPassword });
    },
}