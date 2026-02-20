"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EventForm } from "@/components/dashboard/events/EventForm";
import { useCreateEvent } from "@/hooks";
import type { CreateEventInput } from "@/schemas/event";

export default function CreateEventPage() {
    const router = useRouter();
    const createEvent = useCreateEvent();

    const handleSubmit = (data: CreateEventInput) => {
        createEvent.mutate(data, {
            onSuccess: (response) => {
                toast.success("Event created successfully!");
                const eventId = response?.data?.event_id ?? response?.event_id;
                router.push(eventId ? `/admin/events/${eventId}` : "/admin/events");
            },
            onError: (error) => {
                toast.error(error.message || "Failed to create event");
            },
        });
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
