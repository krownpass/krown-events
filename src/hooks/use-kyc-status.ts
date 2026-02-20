import { useQuery } from "@tanstack/react-query";
import type { KycOverallStatus } from "@/types/kyc";

async function fetchKycStatus(): Promise<KycOverallStatus> {
  const response = await fetch("/api/kyc/status");
  if (!response.ok) throw new Error("Failed to fetch KYC status");
  const json = await response.json();
  return json.data ?? json;
}

export function useKycStatus(enabled: boolean = true) {
  return useQuery({
    queryKey: ["kyc", "status"],
    queryFn: fetchKycStatus,
    staleTime: 30_000,
    refetchInterval: (query) => {
      const appState = query.state.data?.app_state;
      if (appState === "awaiting_admin_review" || appState === "kyc_in_progress") {
        return 30_000;
      }
      return false;
    },
    enabled,
  });
}
