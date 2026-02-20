import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";
import { COOKIE_NAMES } from "@/lib/constants";
import { companyFormSchema } from "@/schemas/company";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = companyFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed" },
      { status: 400 }
    );
  }

  try {
    const { data, status } = await apiClient.post("/kyc/company", parsed.data, { headers: { Authorization: `Bearer ${token}` } });
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
