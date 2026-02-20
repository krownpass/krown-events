import { useQuery } from "@tanstack/react-query";
import type { AuthUser } from "@/types/auth";

async function fetchAuthStatus(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/me");
  if (!response.ok) return null;
  return response.json();
}

export function useAuth() {
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchAuthStatus,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    isAuthenticated: query.data !== null && query.data !== undefined,
    user: query.data ?? null,
    isLoading: query.isLoading,
  };
}
