// app/api/kyc/bank/[bankId]/status/route.ts
import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client"; // or wherever it's imported from

export async function GET(
    request: Request,
    { params }: { params: Promise<{ bankId: string }> } // ← type params as Promise
) {
    const { bankId } = await params; // ← await here – this unwraps the Promise

    if (!bankId) {
        return NextResponse.json({ error: "Bank ID is required" }, { status: 400 });
    }

    try {
        const { data, status } = await apiClient.get(
            `/kyc/bank/${bankId}/status`
            // add token/headers if needed, e.g. { headers: { Authorization: `Bearer ${token}` } }
        );

        return NextResponse.json(data, { status });
    } catch (error) {
        console.error("Failed to fetch bank status:", error);
        return NextResponse.json(
            { error: "Failed to fetch bank status" },
            { status: 500 }
        );
    }
}
