import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";
import { COOKIE_NAMES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const { data, status } = await apiClient.post("/kyc/submit", body, { headers: { Authorization: `Bearer ${token}` } });
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
