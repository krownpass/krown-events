import { useQuery } from "@tanstack/react-query";

export interface DigiLockerStatusResponse {
    verification_id: string;
    reference_id: number;
    status: "PENDING" | "AUTHENTICATED" | "EXPIRED" | "CONSENT_DENIED";
    user_details?: {
        name?: string;
        dob?: string;
        gender?: string;
        eaadhaar?: string;
        mobile?: string;
    };
    document_requested?: string[];
    document_consent?: string[] | null;
    document_consent_validity?: string | null;
}

async function fetchDigiLockerStatus(
    verificationId: string
): Promise<DigiLockerStatusResponse> {
    if (!verificationId) throw new Error("No verification ID");

    const res = await fetch(
        `/api/kyc/digilocker/status?verification_id=${encodeURIComponent(verificationId)}`
    );
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to fetch DigiLocker status");
    }

    const json = await res.json();
    return json.data ?? json;
}

export function useDigiLockerStatus(
    verificationId: string,
    enabled: boolean = true
) {
    return useQuery<DigiLockerStatusResponse, Error>({
        queryKey: ["kyc", "digilocker", "status", verificationId],
        queryFn: () => fetchDigiLockerStatus(verificationId),
        enabled: enabled && !!verificationId,
        staleTime: 0,
        retry: 2,
        refetchInterval: (q) => {
            const s = q.state.data?.status;
            if (!s) return 4000;
            // Stop polling once terminal
            if (["AUTHENTICATED", "EXPIRED", "CONSENT_DENIED"].includes(s))
                return false;
            return 4000; // Poll every 4 seconds while PENDING
        },
    });
}
