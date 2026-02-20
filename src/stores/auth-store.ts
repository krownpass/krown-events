import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface AuthUser {
    organizerId: string;
    role: string;
    type: "org_user";
}

interface AuthStore {
    // State
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setAuth: (user: AuthUser) => void;
    clearAuth: () => void;
    setLoading: (loading: boolean) => void;

    // Computed
    isOwner: () => boolean;
    isMember: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            isAuthenticated: false,
            isLoading: false,

            // Actions
            setAuth: (user: AuthUser) => {
                set({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                });
            },

            clearAuth: () => {
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            },

            setLoading: (loading: boolean) => {
                set({ isLoading: loading });
            },

            // Computed getters
            isOwner: () => {
                const { user } = get();
                return user?.role === "owner";
            },

            isMember: () => {
                const { user } = get();
                return user?.role === "member";
            },
        }),
        {
            name: "auth-storage", // unique name for localStorage key
            storage: createJSONStorage(() => localStorage), // use localStorage
            partialize: (state) => ({
                // Only persist these fields
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.error("Error rehydrating auth store:", error);
                    // Clear corrupted storage
                    localStorage.removeItem("auth-storage");
                    return;
                }

                // Validate rehydrated state
                if (state?.user && !state.user.organizerId) {
                    console.warn("Invalid auth state detected, clearing...");
                    state.clearAuth();
                }
            },
        }
    )
);

// Selector hooks for performance optimization
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useIsOwner = () => useAuthStore((state) => state.isOwner());
export const useIsMember = () => useAuthStore((state) => state.isMember());

// Action hooks
export const useAuthActions = () => ({
    setAuth: useAuthStore((state) => state.setAuth),
    clearAuth: useAuthStore((state) => state.clearAuth),
    setLoading: useAuthStore((state) => state.setLoading),
});
