import type { Metadata } from "next";
import { SelfieCapture } from "./_components/selfie-capture";

export const metadata: Metadata = {
  title: "Selfie Verification | Krown",
  description: "Take a selfie to complete your identity verification on Krown.",
};

export default function SelfieVerificationPage() {
  return <SelfieCapture />;
}
