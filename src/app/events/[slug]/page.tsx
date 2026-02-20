"use client";

import { useEventBySlug, type Event } from "@/hooks";
import { useParams } from "next/navigation";
import { EventCard } from "@/components/dashboard/events/EventCard";

export default function PublicEventPage() {
    const params = useParams();
    const slug = params.slug as string;

    const { data: event, isLoading, error } = useEventBySlug(slug);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Event not found</h1>
                    <p className="text-gray-600 mt-2">This event may have been removed or the link is invalid.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <EventCard event={event as Event} />
            </div>
        </div>
    );
}
