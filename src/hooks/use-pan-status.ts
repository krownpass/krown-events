import { useQuery } from "@tanstack/react-query";

interface PanStatusResponse {
  status: string;
  masked_pan?: string;
  name_match?: boolean;
  dob_match?: boolean;
  message?: string;
}

async function fetchPanStatus(
  organizerId: string
): Promise<PanStatusResponse> {
  const response = await fetch(`/api/kyc/pan/status/${organizerId}`);
  if (!response.ok) throw new Error("Failed to fetch PAN status");
  const json = await response.json();
  return json.data ?? json;
}

export function usePanStatus(organizerId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["kyc", "pan", "status", organizerId],
    queryFn: () => fetchPanStatus(organizerId),
    enabled: enabled && !!organizerId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "pending") return 5_000;
      return false;
    },
  });
}
