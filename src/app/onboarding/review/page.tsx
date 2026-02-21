import type { Metadata } from "next";
import { ReviewSummary } from "./_components/review-summary";

export const metadata: Metadata = {
  title: "Review Details | Krown",
  description: "Review your onboarding information before submitting for verification.",
};

export default function ReviewPage() {
  return <ReviewSummary />;
}
