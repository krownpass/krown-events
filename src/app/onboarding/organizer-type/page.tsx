import type { Metadata } from "next";
import { OrganizerTypeForm } from "./_components/organizer-type-form";

export const metadata: Metadata = {
  title: "Organizer Type | Krown",
  description: "Select whether you are an individual or a company organizer.",
};

export default function OrganizerTypePage() {
  return <OrganizerTypeForm />;
}
