import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { VerifyEmailResult } from "./_components/verify-email-result";

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

  try {
    const response = await apiClient.post<{
      success: boolean;
      message?: string;
      error?: string;
    }>("/events/auth/email/verify", { email: email || "", token });

    if (response.ok && response.data.success) {
      result = { success: true, error: "" };
    } else {
      result = { success: false, error: response.data.error || response.data.message || "Verification failed" };
    }
  } catch (error) {
    result = { success: false, error: "Network error" };
  }

  return <VerifyEmailResult success={result.success} error={result.error} />;
}
