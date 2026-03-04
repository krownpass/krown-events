// hooks/use-bank-status.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface BankStatusResponse {
    status: "pending" | "processing" | "manual_review" | "verified" | "failed" | "rejected";
    bank_id?: string;
    masked_account?: string;
    message?: string;
}

async function fetchBankStatus(bankId: string): Promise<BankStatusResponse> {
    // Prevent invalid calls entirely
    if (!bankId || bankId === "undefined") {
        throw new Error("Invalid bank ID");
    }

    const res = await fetch(`/api/kyc/bank/${bankId}/status`);
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to fetch bank status");
    }

    const json = await res.json();
    return json.data ?? json;
}

export function useBankStatus(bankId: string, enabled: boolean = true) {
    const queryClient = useQueryClient();

    return useQuery<BankStatusResponse, Error>({
        queryKey: ["kyc", "bank", "status", bankId],
        queryFn: () => fetchBankStatus(bankId),
        enabled: enabled && !!bankId && bankId !== "undefined",
        staleTime: 0,
        retry: 2, // retry twice on network error
        refetchInterval: (q) => {
            const s = q.state.data?.status;
            if (!s) return 4000;
            if (["verified", "manual_review", "failed", "rejected"].includes(s)) return false;
            return 4000;
        },
    });
}
