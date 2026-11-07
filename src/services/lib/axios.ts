import axios from "axios";
import type {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearAuth,
  isTokenExpired,
} from "@/utils/Auth";

import { store } from "@/store/store";
import { updateTokens, logout as logoutAction } from "@/store/authSlice";
import { ROUTERS } from "@/constants/Route";

const getApiUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (
    typeof window !== "undefined" &&
    window.location.hostname &&
    window.location.hostname !== "localhost"
  ) {
    return `http://${window.location.hostname}:3333/api/v1`;
  }
  return "http://localhost:8081/api/v1";
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const setAuthHeader = (headers: any, token: string) => {
  if (!headers) return;
  if (typeof headers.set === "function") {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    headers.Authorization = `Bearer ${token}`;
  }
};

const isAuthRequest = (url?: string) => {
  if (!url) return false;
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout") ||
    url.includes("/auth/send-otp-code") ||
    url.includes("/auth/verify-otp-code") ||
    url.includes("/auth/forgot-password")
  );
};

const logout = () => {
  clearAuth();
  store.dispatch(logoutAction());
  if (
    typeof window !== "undefined" &&
    window.location.pathname !== ROUTERS.LOGIN
  ) {
    window.location.href = ROUTERS.LOGIN;
  }
};

// Singleton promise for token refresh to avoid concurrent rotation issues
let refreshPromise: Promise<string> | null = null;

export const refreshAccessToken = async (): Promise<string> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      logout();
      throw new Error("No refresh token available");
    }

    try {
      const refreshUrl = `${api.defaults.baseURL || API_URL}/auth/refresh`;
      const response = await axios.post(
        refreshUrl,
        { refreshToken },
        {
          timeout: 10000,
          headers: { "Content-Type": "application/json" },
        }
      );

      const resData =
        response.data?.payload || response.data?.data || response.data;
      const newAccessToken =
        resData?.accessToken || resData?.token || resData?.access_token;
      const newRefreshToken =
        resData?.refreshToken || resData?.refresh_token;

      if (!newAccessToken) {
        throw new Error("New access token missing from refresh response");
      }

      setAccessToken(newAccessToken);
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
      }

      store.dispatch(
        updateTokens({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        })
      );

      return newAccessToken;
    } catch (error) {
      logout();
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Request Interceptor: Proactively refresh token before dispatching request if expired
api.interceptors.request.use(
  async (config) => {
    if (isAuthRequest(config.url)) {
      return config;
    }

    let token = getAccessToken();
    const refreshToken = getRefreshToken();

    // If access token is missing or expired, refresh proactively before firing request
    if (!token || isTokenExpired(token)) {
      if (refreshToken) {
        try {
          token = await refreshAccessToken();
        } catch (err) {
          return Promise.reject(err);
        }
      } else {
        logout();
        return Promise.reject(new Error("Session expired"));
      }
    }

    if (token) {
      setAuthHeader(config.headers, token);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Fallback for unexpected 401 or clock drift
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;
    const status = error.response?.status;

    if (
      !originalRequest ||
      isAuthRequest(originalRequest.url) ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    // 401 Unauthorized or 403 Forbidden with expired token
    const token = getAccessToken();
    const isTokenExp = !token || isTokenExpired(token);
    const isAuthFailure = status === 401 || (status === 403 && isTokenExp);

    if (isAuthFailure) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshAccessToken();
        setAuthHeader(originalRequest.headers, newAccessToken);
        return api(originalRequest);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
