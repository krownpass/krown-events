"use server";

import { livenessSchema } from "@/schemas/liveness";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import type { ActionState } from "@/types/api";

interface LivenessResult {
  status: string;
  face_match_score?: number;
  face_match_result?: string;
  message?: string;
}

export async function submitSelfieAction(
  _prevState: ActionState<LivenessResult>,
  formData: FormData
): Promise<ActionState<LivenessResult>> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  const raw = {
    first_image: formData.get("first_image") as string,
    second_image: formData.get("second_image") as string,
  };

  const parsed = livenessSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Please capture both selfies" };
  }

  try {
    const { data, ok } = await apiClient.post<{
      success: boolean;
      data?: LivenessResult;
      message?: string;
      error?: string;
    }>("/kyc/liveness", parsed.data, { headers: { Authorization: `Bearer ${token}` } });

    if (!ok || !data.success) {
      return {
        success: false,
        error: data.message || data.error || "Face verification failed",
      };
    }

    return {
      success: true,
      data: {
        status: data.data?.status ?? "pending",
        face_match_score: data.data?.face_match_score,
        face_match_result: data.data?.face_match_result,
        message: data.data?.message,
      },
    };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}
