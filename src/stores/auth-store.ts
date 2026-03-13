// src/stores/auth-store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface AuthUser {
    organizerId: string;
    role: string;
    type: "org_user";
}

interface AuthStore {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    accessToken: string | null;
    setAuth: (user: AuthUser, token?: string) => void;
    clearAuth: () => void;
    setLoading: (loading: boolean) => void;
    setAccessToken: (token: string | null) => void;
    isOwner: () => boolean;
    isMember: () => boolean;
}

const createSSRSafeStorage = () => {
    if (typeof window === "undefined") {
        return {
            getItem: () => null,
            setItem: () => { },
            removeItem: () => { },
        };
    }
    return localStorage;
};

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            accessToken: null,
            setAuth: (user: AuthUser, token?: string) => {
                set({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                    accessToken: token ?? get().accessToken,
                });
            },
            clearAuth: () => {
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    accessToken: null,
                });
            },
            setLoading: (loading: boolean) => set({ isLoading: loading }),
            setAccessToken: (token: string | null) => set({ accessToken: token }),
            isOwner: () => get().user?.role === "owner",
            isMember: () => get().user?.role === "member",
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(createSSRSafeStorage),
            // ✅ FIX: accessToken is now persisted so mobile sessions work
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                accessToken: state.accessToken,
            }),
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.error("Error rehydrating auth store:", error);
                    if (typeof window !== "undefined") {
                        localStorage.removeItem("auth-storage");
                    }
                    return;
                }
                if (state?.user && !state.user.organizerId) {
                    console.warn("Invalid auth state detected, clearing...");
                    state.clearAuth();
                }
            },
        }
    )
);

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useIsOwner = () => useAuthStore((state) => state.isOwner());
export const useIsMember = () => useAuthStore((state) => state.isMember());
export const useAccessToken = () => useAuthStore((state) => state.accessToken);
export const useAuthActions = () => ({
    setAuth: useAuthStore((state) => state.setAuth),
    clearAuth: useAuthStore((state) => state.clearAuth),
    setLoading: useAuthStore((state) => state.setLoading),
    setAccessToken: useAuthStore((state) => state.setAccessToken),
});
