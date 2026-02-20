import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { COOKIE_NAMES } from "@/lib/constants";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;

  if (!token) {
    return NextResponse.json(null, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return NextResponse.json({
      organizerId: payload.organizer_id as string,
      role: payload.role as string,
      type: payload.type as string,
    });
  } catch {
    return NextResponse.json(null, { status: 401 });
  }
}
