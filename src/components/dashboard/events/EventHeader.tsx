"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Edit,
    Globe,
    Share2,
    MoreHorizontal,
    Calendar,
    Users,
    MapPin,
    Loader2,
    Lock,
    Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useUpdateEventStatus, useDeleteEvent, type Event } from "@/hooks";
import { useState } from "react";

async function doToggleRegistration(eventId: string, isOpen: boolean): Promise<void> {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/registration/toggle`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ is_open: isOpen }),
        }
    );
    if (!response.ok) {
        throw new Error("Failed to toggle registration");
    }
}

const statusStyles: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    PUBLISHED: "bg-info/10 text-info",
    LIVE: "bg-success/10 text-success animate-pulse",
    COMPLETED: "bg-secondary text-secondary-foreground",
    CANCELLED: "bg-destructive/10 text-destructive",
};

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function EventHeader({ event }: { event: Event }) {
    const router = useRouter();
    const updateStatus = useUpdateEventStatus(event.event_id);
    const deleteEvent = useDeleteEvent();
    const [isTogglingRegistration, setIsTogglingRegistration] = useState(false);
    const maxCapacity = event.max_capacity ?? event.total_capacity ?? 0;
    const bookedCount = event.current_registrations ?? 0;
    const hasCapacity = maxCapacity > 0;
    const progressPct = hasCapacity ? Math.min(100, Math.round((bookedCount / maxCapacity) * 100)) : 0;

    const handlePublish = () => {
        updateStatus.mutate("PUBLISHED", {
            onSuccess: () => toast.success("Event published!"),
            onError: (err) => toast.error(err.message || "Failed to publish"),
        });
    };

    const handleToggleRegistration = async () => {
        const newStatus = !event.is_registration_open;
        const statusLabel = newStatus ? "opened" : "closed";
        setIsTogglingRegistration(true);
        let succeeded = false;
        let errorMsg = "";
        try {
            await doToggleRegistration(event.event_id, newStatus);
            succeeded = true;
        } catch (err: unknown) {
            if (err instanceof Error) {
                errorMsg = err.message;
            } else {
                errorMsg = "Failed to toggle registration";
            }
        }
        setIsTogglingRegistration(false);
        if (succeeded) {
            toast.success(`Registration ${statusLabel}`);
            router.refresh();
        } else {
            toast.error(errorMsg);
        }
    };

    const handleCancel = () => {
        if (confirm("Are you sure you want to cancel this event?")) {
            updateStatus.mutate("CANCELLED", {
                onSuccess: () => toast.success("Event cancelled"),
                onError: (err) => toast.error(err.message || "Failed to cancel"),
            });
        }
    };

    const handleDelete = () => {
        if (confirm(`Delete "${event.title}"? This action cannot be undone.`)) {
            deleteEvent.mutate(event.event_id, {
                onSuccess: () => {
                    toast.success("Event deleted");
                    router.push("/admin/events");
                },
                onError: (err) => toast.error(err.message || "Failed to delete"),
            });
        }
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/events/${event.event_id}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: event.title, url });
            } catch {
                // User cancelled
            }
        } else {
            navigator.clipboard.writeText(url);
            toast.success("Event link copied!");
        }
    };

    return (
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="flex min-w-0 items-start gap-3">
                    <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
                        <Link href="/admin/events">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>

                    <div className="relative h-16 w-16 overflow-hidden rounded-lg flex-shrink-0 sm:h-20 sm:w-20">
                        {event.image_url ? (
                            <Image
                                src={event.image_url}
                                alt={event.title}
                                fill
                                sizes="80px"
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                <span className="text-2xl">🎫</span>
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h1 className="truncate text-lg font-semibold sm:text-xl">{event.title}</h1>
                            <Badge className={cn("capitalize", statusStyles[event.status])}>
                                {event.status === "LIVE" && (
                                    <span className="w-2 h-2 rounded-full bg-success mr-1.5 animate-ping" />
                                )}
                                {event.status}
                            </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    {formatDate(event.start_time)} at {formatTime(event.start_time)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>
                                    {hasCapacity ? `${bookedCount}/${maxCapacity}` : `${bookedCount} booked`}
                                </span>
                            </div>
                            {event.venue_city && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span className="truncate max-w-[200px]">
                                        {event.venue_name || event.venue_city}
                                    </span>
                                </div>
                            )}
                        </div>
                        {hasCapacity && (
                            <div className="mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end lg:self-start">
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                        <Link href={`/admin/events/${event.event_id}/edit`}>
                            <Edit className="h-4 w-4" />
                            Edit Event
                        </Link>
                    </Button>

                    {event.status === "DRAFT" && (
                        <Button
                            size="sm"
                            className="gap-2 gradient-gold text-primary-foreground"
                            onClick={handlePublish}
                            disabled={updateStatus.isPending}
                        >
                            {updateStatus.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Globe className="h-4 w-4" />
                            )}
                            Publish
                        </Button>
                    )}

                    {(event.status === "PUBLISHED" || event.status === "LIVE") && (
                        <Button
                            variant={event.is_registration_open ? "destructive" : "default"}
                            size="sm"
                            className="gap-2"
                            onClick={handleToggleRegistration}
                            disabled={isTogglingRegistration}
                        >
                            {isTogglingRegistration ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : event.is_registration_open ? (
                                <Lock className="h-4 w-4" />
                            ) : (
                                <Unlock className="h-4 w-4" />
                            )}
                            {event.is_registration_open ? "Close Registration" : "Open Registration"}
                        </Button>
                    )}

                    <Button variant="outline" size="icon" onClick={handleShare}>
                        <Share2 className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleShare}>
                                Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {event.status !== "CANCELLED" && event.status !== "COMPLETED" && (
                                <DropdownMenuItem
                                    onClick={handleCancel}
                                    className="text-destructive"
                                >
                                    Cancel Event
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={handleDelete}
                                className="text-destructive"
                            >
                                Delete Event
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
