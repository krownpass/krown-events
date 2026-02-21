import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAMES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Krown | Event Management Platform",
  description: "Manage and discover events with Krown.",
};

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;

  if (!token) {
    redirect("/auth/login");
  }

  redirect("/onboarding");
}
