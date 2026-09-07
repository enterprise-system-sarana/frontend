import axios from "axios";

const API_URL = "http://localhost:8081/api/v1"; // Fallback to localhost if the first URL is unreachable.

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

console.log("api", api);

api.interceptors.response.use(
  (response) => response, // Directly return successful responses.
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark the request as retried to avoid infinite loops.
      try {
        const refreshToken = localStorage.getItem("refreshToken"); // Retrieve the stored refresh token.
        // Make a request to your auth server to refresh the token.
        // 'http://localhost:8081/api/v1/auth/refresh' \
        const response = await axios.post(API_URL + "/auth/refresh", {
          refreshToken,
        });
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        // Store the new access and refresh tokens.
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        // Update the authorization header with the new access token.
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        return api(originalRequest); // Retry the original request with the new access token.
      } catch (refreshError) {
        // Handle refresh token errors by clearing stored tokens and redirecting to the login page.
        console.error("Token refresh failed:", refreshError);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error); // For all other errors, return the error as is.
  },
);

export default api;
