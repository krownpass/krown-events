import { NextResponse } from "next/server";
import { COOKIE_NAMES } from "@/lib/constants";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAMES.ACCESS_TOKEN);
  response.cookies.delete(COOKIE_NAMES.REFRESH_TOKEN);
  return response;
}
