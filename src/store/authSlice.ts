import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/types/Auth";
import {
    getAccessToken,
    getRefreshToken,
    getUser,
    setAccessToken as saveAccessToken,
    setRefreshToken as saveRefreshToken,
    setUser as saveUser,
    clearAuth as clearStorage,
    isTokenExpired,
} from "@/utils/Auth";

export interface AuthState {
    user: AuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
}

const token = getAccessToken();
const refreshToken = getRefreshToken();
const user = getUser();
const isAccessTokenExpired = token ? isTokenExpired(token) : true;
const hasRefreshToken = !!refreshToken;

// Only clear storage if access token is expired AND no refresh token exists.
// If a refresh token is available, keep it so the axios interceptor can refresh silently.
if (isAccessTokenExpired && !hasRefreshToken) {
    clearStorage();
}

const initialState: AuthState = {
    user: user,
    accessToken: isAccessTokenExpired ? null : token,
    refreshToken: hasRefreshToken ? refreshToken : null,
    // Allow authenticated state if we have a valid token OR a refresh token to attempt refresh
    isAuthenticated: !isAccessTokenExpired || hasRefreshToken,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials(
            state,
            action: PayloadAction<{
                user: AuthUser;
                accessToken: string;
                refreshToken: string;
            }>
        ) {
            const { user, accessToken, refreshToken } = action.payload;
            state.user = user;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.isAuthenticated = true;

            saveAccessToken(accessToken);
            saveRefreshToken(refreshToken);
            saveUser(user);
        },
        updateTokens(
            state,
            action: PayloadAction<{
                accessToken: string;
                refreshToken?: string;
            }>
        ) {
            const { accessToken, refreshToken } = action.payload;
            state.accessToken = accessToken;
            saveAccessToken(accessToken);

            if (refreshToken) {
                state.refreshToken = refreshToken;
                saveRefreshToken(refreshToken);
            }
        },
        logout(state) {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            clearStorage();
        },
        updateUser(state, action: PayloadAction<Partial<AuthUser>>) {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
                saveUser(state.user);
            }
        },
    },
});

export const { setCredentials, updateTokens, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
