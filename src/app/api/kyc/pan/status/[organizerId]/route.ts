import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";
import { COOKIE_NAMES } from "@/lib/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ organizerId: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { organizerId } = await params;

  try {
    const { data, status } = await apiClient.get(
      `/kyc/pan/status/${organizerId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
