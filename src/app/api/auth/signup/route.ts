import { NextRequest, NextResponse } from "next/server";
import { signupSchema } from "@/schemas/auth";
import { apiClient } from "@/lib/api-client";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const { data, status } = await apiClient.post<{
      success: boolean;
      message?: string;
      error?: string;
    }>("/events/auth/signup", parsed.data);

    if (!data.success) {
      return NextResponse.json(
        { success: false, error: data.message || data.error || "Signup failed" },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || "Account created. Please verify your email.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Network error. Please try again." },
      { status: 500 }
    );
  }
}
