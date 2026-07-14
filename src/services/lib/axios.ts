import axios from "axios";
import { getAccessToken, getRefreshToken, clearAuth } from "@/utils/Auth";

const api = axios.create({
    baseURL: "http://localhost:8081/api/v1",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        const refreshToken = getRefreshToken();
        console.log(refreshToken)
        if (refreshToken) {
            config.headers.Authorization = `Bearer ${refreshToken}`;
        }
        console.log("Access Token:", token);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            clearAuth();
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default api;