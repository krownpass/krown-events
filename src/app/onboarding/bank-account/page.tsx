import type { Metadata } from "next";
import { BankForm } from "./_components/bank-form";

export const metadata: Metadata = {
  title: "Bank Account | Krown",
  description: "Link your bank account to receive payouts for your events on Krown.",
};

export default function BankAccountPage() {
  return <BankForm />;
}
