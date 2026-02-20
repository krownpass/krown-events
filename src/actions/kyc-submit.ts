"use server";

import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import type { ActionState } from "@/types/api";

export async function submitKycAction(): Promise<
  ActionState<{ status: string }>
> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  try {
    const { data, ok } = await apiClient.post<{
      success: boolean;
      data?: { status: string };
      message?: string;
      error?: string;
    }>("/kyc/submit", { confirmation: true }, { headers: { Authorization: `Bearer ${token}` } });

    if (!ok || !data.success) {
      return {
        success: false,
        error: data.message || data.error || "KYC submission failed",
      };
    }

    return {
      success: true,
      data: { status: data.data?.status ?? "pending" },
    };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}
