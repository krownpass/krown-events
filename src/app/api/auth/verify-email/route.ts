import { NextRequest, NextResponse } from "next/server";
import { verifyEmailSchema } from "@/schemas/auth";
import { apiClient } from "@/lib/api-client";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = verifyEmailSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid verification token" },
      { status: 400 }
    );
  }

  try {
    const { data, status } = await apiClient.post<{
      success: boolean;
      message?: string;
      error?: string;
    }>("/events/auth/verify-email", parsed.data);

    if (!data.success) {
      return NextResponse.json(
        { success: false, error: data.message || "Verification failed" },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || "Email verified successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Network error" },
      { status: 500 }
    );
  }
}
