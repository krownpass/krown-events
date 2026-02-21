import type { Metadata } from "next";
import { VerificationStatus } from "./_components/verification-status";

export const metadata: Metadata = {
  title: "Verification Status | Krown",
  description: "Check the status of your Krown account verification.",
};

export default function StatusPage() {
  return <VerificationStatus />;
}
