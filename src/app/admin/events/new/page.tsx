"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EventForm } from "@/components/dashboard/events/EventForm";
import { useCreateEvent } from "@/hooks";
import type { CreateEventInput } from "@/schemas/event";
import { apiClient } from "@/lib/api-client";

export default function CreateEventPage() {
    const router = useRouter();
    const createEvent = useCreateEvent();

    const handleSubmit = async (data: CreateEventInput, coverFile?: File) => {
        try {
            // Wait for event to be created
            const response = await createEvent.mutateAsync(data);
            const eventId = response?.data?.event_id ?? response?.event_id;

            if (eventId && coverFile) {
                // Now that we have the eventId, upload the cover file
                const formData = new FormData();
                formData.append("file", coverFile);
                formData.append("event_id", eventId);
                formData.append("file_name", `${eventId}-cover-${Date.now()}-${coverFile.name}`);
                
                await apiClient.post("/events/cover/upload", undefined, {
                    body: formData,
                } as any);
            }

            toast.success("Event created successfully!");
            router.push(eventId ? `/admin/events/${eventId}` : "/admin/events");
        } catch (error: any) {
            toast.error(error.message || "Failed to create event");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/events">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Create Event</h1>
                    <p className="text-muted-foreground">
                        Fill in the details to create a new event
                    </p>
                </div>
            </div>

            <EventForm
                onSubmit={handleSubmit}
                isSubmitting={createEvent.isPending}
                submitLabel="Create Event"
            />
        </div>
    );
}
