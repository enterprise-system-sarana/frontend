import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

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
  headers: {
    "Content-Type": "application/json",
  },
});

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

// ======================================================
// REQUEST INTERCEPTOR
// ======================================================

api.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ======================================================
// REFRESH TOKEN QUEUE
// ======================================================

let isRefreshing = false;

let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (
  error: unknown,
  token: string | null = null
) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

// ======================================================
// RESPONSE INTERCEPTOR
// ======================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error: AxiosError) => {
    const originalRequest =
      error.config as RetryRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Only handle 401
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Prevent infinite loop
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // ==================================================
    // Another request is already refreshing
    // ==================================================

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({
          resolve,
          reject,
        });
      }).then((newAccessToken) => {
        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      });
    }

    // ==================================================
    // Start refresh
    // ==================================================

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = getRefreshToken();

    // No refresh token
    if (!refreshToken) {
      isRefreshing = false;

      clearAuth();

      window.location.href = ROUTERS.LOGIN;

      return Promise.reject(error);
    }

    try {
      console.log("Access token expired.");
      console.log("Getting refresh token...");

      // IMPORTANT:
      // Use axios directly, NOT api.
      const response = await axios.post(
        `${API_URL}/auth/refresh`,
        {
          refreshToken,
        }
      );

      // Your backend returns:
      //
      // {
      //   success: true,
      //   payload: {
      //      accessToken: "...",
      //      refreshToken: "..."
      //   }
      // }

      const payload = response.data.payload;

      const newAccessToken = payload.accessToken;
      const newRefreshToken = payload.refreshToken;

      if (!newAccessToken) {
        throw new Error("New access token is missing");
      }

      // Save new Access Token
      setAccessToken(newAccessToken);

      // Save new Refresh Token
      //
      // Important if your backend uses
      // Refresh Token Rotation.
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
      }

      console.log("Access token refreshed successfully.");

      // Resolve all waiting requests
      processQueue(null, newAccessToken);

      // Retry original request
      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(originalRequest);

    } catch (refreshError) {

      console.error(
        "Refresh token failed:",
        refreshError
      );

      // Reject waiting requests
      processQueue(refreshError, null);

      // Clear authentication
      clearAuth();

      // Redirect to login
      window.location.href = "/login";

      return Promise.reject(refreshError);

    } finally {
      isRefreshing = false;
    }
  }
);

export default api;