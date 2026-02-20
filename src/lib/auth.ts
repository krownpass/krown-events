import "server-only";
import { cookies } from "next/headers";
import { COOKIE_NAMES, COOKIE_OPTIONS } from "./constants";

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;
}

export async function setTokenCookies(
  accessToken: string,
  refreshToken?: string
) {
  const cookieStore = await cookies();
  cookieStore.set(
    COOKIE_NAMES.ACCESS_TOKEN,
    accessToken,
    COOKIE_OPTIONS.ACCESS_TOKEN
  );
  if (refreshToken) {
    cookieStore.set(
      COOKIE_NAMES.REFRESH_TOKEN,
      refreshToken,
      COOKIE_OPTIONS.REFRESH_TOKEN
    );
  }
}

export async function clearTokenCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAMES.ACCESS_TOKEN);
  cookieStore.delete(COOKIE_NAMES.REFRESH_TOKEN);
}
