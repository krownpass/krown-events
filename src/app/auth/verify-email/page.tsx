import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { VerifyEmailResult } from "./_components/verify-email-result";

export const metadata: Metadata = {
  title: "Verify Email | Krown",
  description: "Confirm your email address to activate your Krown account.",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;
  const email = params.email;

  if (!token) {
    redirect("/auth/login");
  }

  let result = { success: false, error: "Verification failed" };
  const emailParam = email || "";

  try {
    const response = await apiClient.post<{
      success: boolean;
      message?: string;
      error?: string;
    }>("/events/auth/email/verify", { email: emailParam, token });

    if (response.ok) {
      if (response.data.success) {
        result = { success: true, error: "" };
      } else {
        let errorMessage = "Verification failed";
        if (response.data.error) {
          errorMessage = response.data.error;
        } else if (response.data.message) {
          errorMessage = response.data.message;
        }
        result = { success: false, error: errorMessage };
      }
    } else {
      let errorMessage = "Verification failed";
      if (response.data.error) {
        errorMessage = response.data.error;
      } else if (response.data.message) {
        errorMessage = response.data.message;
      }
      result = { success: false, error: errorMessage };
    }
  } catch (error) {
    result = { success: false, error: "Network error" };
  }

  return <VerifyEmailResult success={result.success} error={result.error} />;
}
