import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/schemas/auth";
import { apiClient } from "@/lib/api-client";
import { COOKIE_NAMES, COOKIE_OPTIONS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const { data, status } = await apiClient.post<{
      success: boolean;
      data?: {
        user: Record<string, unknown>;
        token: string;
      };
      error?: string;
      message?: string;
    }>("/events/auth/login/password", parsed.data);

    if (!data.success || !data.data) {
      return NextResponse.json(
        { success: false, error: data.message || data.error || "Login failed" },
        { status }
      );
    }

    const { user, token } = data.data;

    const response = NextResponse.json({
      success: true,
      user: {
        organizerId: user.organizer_id,
        role: user.role,
        type: "org_user",
      },
    });

    response.cookies.set(
      COOKIE_NAMES.ACCESS_TOKEN,
      token,
      COOKIE_OPTIONS.ACCESS_TOKEN
    );

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Network error. Please try again." },
      { status: 500 }
    );
  }
}
