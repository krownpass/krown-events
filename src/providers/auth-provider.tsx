"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";

interface User {
    user_id: string;
    email: string;
    full_name?: string;
    phone?: string;
    is_krown_subscriber?: boolean;
    subscription_expires_at?: string;
    created_at?: string;
    organizer_id?: string;
    role?: string;
    type?: "org_user" | "end_user";
    org_name?: string;
    org_logo?: string;
    org_is_verified?: boolean;
    organizer_verification_status?: string;
    organizer_is_active?: boolean;
    status?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    organizerId: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

interface AuthMeResponse {
    data?: User & { token?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const setAccessToken = useAuthStore((state) => state.setAccessToken);
    const setAuth = useAuthStore((state) => state.setAuth);
    const clearAuth = useAuthStore((state) => state.clearAuth);

    const fetchUser = useCallback(async () => {
        if (typeof window === "undefined") return;

        try {
            // ✅ Step 1: On page refresh, Zustand memory is empty.
            // Seed the token from the httpOnly cookie via same-domain Next.js route
            // so api-client can send Authorization header to api.krownpass.com
            if (!useAuthStore.getState().accessToken) {
                try {
                    const tokenRes = await fetch("/api/auth/token");
                    if (tokenRes.ok) {
                        const { token: cookieToken } = await tokenRes.json();
                        if (cookieToken) {
                            setAccessToken(cookieToken);
                        }
                    }
                } catch {
                    // No cookie token — user needs to log in
                }
            }

            // ✅ Step 2: Now api-client has token in Zustand,
            // so this request will include Authorization: Bearer <token>
            const response = await apiClient.get("/events/auth/me");
            const userData = (response.data as AuthMeResponse).data;

            // ✅ Step 3: /me returns a fresh token — update Zustand with it
            if (userData?.token) {
                setToken(userData.token);
                setAccessToken(userData.token);
            }

            setUser(userData ?? null);

            if (userData?.type === "org_user" && userData?.organizer_id) {
                setAuth(
                    {
                        organizerId: userData.organizer_id,
                        role: userData.role ?? "member",
                        type: "org_user",
                    },
                    userData.token
                );
            }
        } catch {
            // /me failed — clear everything
            setUser(null);
            setToken(null);
            setAccessToken(null);
            clearAuth();
        }
    }, [setAccessToken, setAuth, clearAuth]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const initAuth = async () => {
            try {
                await fetchUser();
            } catch { }
            setIsLoading(false);
        };

        void initAuth();
    }, [fetchUser]);

    const login = useCallback(async (email: string, password: string) => {
        const response = await apiClient.post("/events/auth/login/password", {
            identifier: email,
            password,
        });
        const responseData = (response.data as any).data;
        const newToken = responseData?.token;
        const userData = responseData?.user ?? null;

        if (newToken) {
            setToken(newToken);
            setAccessToken(newToken);
        }

        setUser(userData);
    }, [setAccessToken]);

    const logout = useCallback(async () => {
        try {
            await apiClient.post("/events/auth/logout");
        } catch { }
        setUser(null);
        setToken(null);
        setAccessToken(null);
        clearAuth();
        window.location.href = "/auth/login";
    }, [setAccessToken, clearAuth]);

    const refreshUser = useCallback(async () => {
        await fetchUser();
    }, [fetchUser]);

    const value: AuthContextType = useMemo(() => ({
        user,
        token,
        organizerId: user?.organizer_id || null,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        refreshUser,
    }), [user, token, isLoading, login, logout, refreshUser]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
