import type { Metadata } from "next";
import { PanForm } from "./_components/pan-form";

export const metadata: Metadata = {
  title: "Personal Identity | Krown",
  description: "Verify your identity with your PAN details to continue onboarding.",
};

export default function PersonalIdentityPage() {
  return <PanForm />;
}
