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
} from "@/utils/Auth";

import { ROUTERS } from "@/constants/Route";

const API_URL = "http://localhost:8081/api/v1";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

// Request Interceptor: Attach Access Token safely using direct property mutation
api.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();

    if (accessToken) {
      // Mutating properties directly prevents wiping out default configs like Content-Type
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;

let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (
  error: unknown,
  token: string | null = null
) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }

    if (token) {
      resolve(token);
    }
  });

  failedQueue = [];
};

const isAuthRequest = (url?: string) => {
  if (!url) return false;

  return (
    url.includes("/auth/login") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  );
};

const logout = () => {
  clearAuth();
  window.location.href = ROUTERS.LOGIN;
};

// Response Interceptor: Handle Token Expiration & Refresh
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;

    // Reject if no original config, non-401 error, auth endpoints, or already retried
    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      isAuthRequest(originalRequest.url) ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    // If another request is currently refreshing the token, queue this request
    if (isRefreshing) {
      try {
        const newAccessToken = await new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });

        // Set token property directly safely
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (queueError) {
        return Promise.reject(queueError);
      }
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      isRefreshing = false;
      logout();
      return Promise.reject(error);
    }

    try {
      console.log("Access token expired. Refreshing token...");

      // Using isolated vanilla axios instance to avoid infinite loop interceptor triggers
      const response = await axios.post(
        `${API_URL}/auth/refresh`,
        { refreshToken },
        {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Extract token across multiple common API response structures (.payload used in Spring)
      const resData = response.data?.payload || response.data?.data || response.data;
      const newAccessToken = resData?.accessToken || resData?.token || resData?.access_token;
      const newRefreshToken = resData?.refreshToken || resData?.refresh_token;

      if (!newAccessToken) {
        throw new Error("New access token is missing from refresh response");
      }

      setAccessToken(newAccessToken);
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
      }

      console.log("Access token refreshed successfully.");

      processQueue(null, newAccessToken);

      // Safely assign header property directly
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      console.error("Refresh token failed:", refreshError);
      processQueue(refreshError, null);
      logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
