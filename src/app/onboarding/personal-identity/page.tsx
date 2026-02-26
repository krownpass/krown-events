import type { Metadata } from "next";
import { DigiLockerForm } from "./_components/identity";

export const metadata: Metadata = {
    title: "Personal Identity | Krown",
    description: "Verify your identity with your PAN details to continue onboarding.",
};

export default function PersonalIdentityPage() {
    return <DigiLockerForm />;
}
