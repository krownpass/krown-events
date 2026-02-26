import { useQuery } from "@tanstack/react-query";

export interface BankStatusResponse {
    bank_id?: string;
    status:
    | "pending"
    | "verified"
    | "failed"
    | "manual_review";
    rpd_status?: string;
    masked_account?: string;
    masked_ifsc?: string;
    name_at_bank?: string;
    name_match_score?: string;
    name_match_result?: string;
    account_type?: string;
    reversal_status?: string;
    message?: string;
}

async function fetchBankStatus(bankId: string): Promise<BankStatusResponse> {
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
    return useQuery<BankStatusResponse, Error>({
        queryKey: ["kyc", "bank", "status", bankId],
        queryFn: () => fetchBankStatus(bankId),
        enabled: enabled && !!bankId && bankId !== "undefined",
        staleTime: 0,
        retry: 2,
        refetchInterval: (q) => {
            const s = q.state.data?.status;
            if (!s) return 5000;
            // Stop polling once terminal
            if (["verified", "manual_review", "failed"].includes(s)) return false;
            return 5000;
        },
    });
}
