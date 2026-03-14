"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EventForm } from "@/components/dashboard/events/EventForm";
import { useEvent, useUpdateEvent, type Event } from "@/hooks";
import type { CreateEventInput } from "@/schemas/event";

export default function EditEventPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const { data, isLoading, error } = useEvent(id);
    const event = data as Event | undefined;
    const updateEvent = useUpdateEvent(id);

    const handleSubmit = (data: CreateEventInput) => {
        updateEvent.mutate(data, {
            onSuccess: () => {
                toast.success("Event updated successfully!");
                router.push(`/admin/events/${id}`);
            },
            onError: (err) => {
                toast.error(err.message || "Failed to update event");
            },
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="text-center py-24">
                <p className="text-destructive mb-4">Failed to load event</p>
                <Button asChild>
                    <Link href="/admin/events">Back to Events</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/events/${id}`}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Edit Event</h1>
                    <p className="text-muted-foreground">{event.title}</p>
                </div>
            </div>

            <EventForm
                eventId={id}
                defaultValues={{
                    title: event.title,
                    description: event.description,
                    event_type: event.event_type as CreateEventInput["event_type"],
                    cover_image: event.image_url ?? "",
                    start_time: event.start_time,
                    end_time: event.end_time,
                    reveal_time: event.reveal_time,
                    reveal_fields: event.reveal_fields,
                    venue_name: event.venue_name,
                    venue_address: event.venue_address,
                    venue_city: event.venue_city,
                    venue_state: event.venue_state,                      
                    latitude: event.latitude,
                    longitude: event.longitude,                   
                    max_capacity: event.max_capacity ?? event.total_capacity,
                    is_paid: event.is_paid,
                    base_price: event.base_price,
                    tags: event.tags,
                    category: event.category,
                    max_tickets_per_user: event.max_tickets_per_user,
                    max_guest_invites_per_user: event.max_guest_invites_per_user,
                    enable_waitlist: event.enable_waitlist ?? true,
                    ticket_tiers: (event.ticket_tiers || []).map((t: any) => ({
                        name: t.name || t.tier_name,
                        quantity: t.quantity || t.capacity,
                        price: t.price,
                        max_per_user: t.max_per_user,
                        sort_order: t.sort_order || 0,
                        description: t.description || t.tier_description,
                    })),
                }}
                onSubmit={handleSubmit}
                isSubmitting={updateEvent.isPending}
                submitLabel="Save Changes"
            />
        </div>
    );
}

interface TicketTier {
    tier_id: string;
    tier_name: string;
    tier_description: string;
    price: number;
    capacity: number;
    max_per_user: number;
}
