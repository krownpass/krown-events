import type { Metadata } from "next";
import { SignupForm } from "./_components/signup-form";

export const metadata: Metadata = {
  title: "Sign Up | Krown",
  description: "Create a Krown account and start managing your events.",
};

export default function SignupPage() {
    return <SignupForm />;
}
