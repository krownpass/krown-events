import type { Metadata } from "next";
import { CompanyForm } from "./_components/company-form";

export const metadata: Metadata = {
  title: "Company Details | Krown",
  description: "Provide your company information as part of the Krown onboarding process.",
};

export default function CompanyDetailsPage() {
  return <CompanyForm />;
}
