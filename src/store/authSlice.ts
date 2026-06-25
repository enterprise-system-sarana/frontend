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
} from "@/utils/Auth";

export interface AuthState {
    user: AuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
}
const initialState: AuthState = {
    user: getUser(),
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
    isAuthenticated: !!getAccessToken(),
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
    },
});

export const { setCredentials, updateTokens, logout } = authSlice.actions;
export default authSlice.reducer;
