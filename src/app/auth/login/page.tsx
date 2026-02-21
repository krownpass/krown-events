import type { Metadata } from "next";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = {
  title: "Log In | Krown",
  description: "Sign in to your Krown account to manage your events.",
};

export default function LoginPage() {
    return <LoginForm />;
}
