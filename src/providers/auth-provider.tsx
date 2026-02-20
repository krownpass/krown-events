"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

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

interface LoginResponse {
    data?: {
        token?: string;
        user?: User;
    };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "krown_ws_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        if (typeof window === 'undefined') return;

        try {
            const response = await apiClient.get("/events/auth/me");

            const userData = (response.data as AuthMeResponse).data;

            if (userData?.token) {
                localStorage.setItem(TOKEN_KEY, userData.token);
                setToken(userData.token);
            } else {
                const storedToken = localStorage.getItem(TOKEN_KEY);
                if (storedToken) {
                    setToken(storedToken);
                }
            }

            setUser(userData ?? null);
        } catch {
            setUser(null);
            setToken(null);
            localStorage.removeItem(TOKEN_KEY);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const initAuth = async () => {
            const storedToken = localStorage.getItem(TOKEN_KEY);
            if (storedToken) {
                setToken(storedToken);
            }

            try {
                await fetchUser();
            } catch {}

            setIsLoading(false);
        };

        void initAuth();
    }, [fetchUser]);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const response = await apiClient.post("/events/auth/login/password", { identifier: email, password });
            const responseData = (response.data as LoginResponse).data;
            const newToken = responseData?.token;
            const userData = responseData?.user ?? null;

            if (newToken) {
                localStorage.setItem(TOKEN_KEY, newToken);
                setToken(newToken);
            }

            setUser(userData);
        } catch (error) {
            throw error;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiClient.post("/events/auth/logout");
        } catch {
        } finally {
            setUser(null);
            setToken(null);
            localStorage.removeItem(TOKEN_KEY);
            window.location.href = "/auth/login";
        }
    }, []);

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
