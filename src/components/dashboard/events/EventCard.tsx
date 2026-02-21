"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Users, MapPin, MoreHorizontal, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Event } from "@/hooks/use-events";

const statusStyles: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    PUBLISHED: "bg-info/10 text-info border-info/20",
    LIVE: "bg-success/10 text-success border-success/20",
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

export function EventCard({ event }: { event: Event }) {
    const [copied, setCopied] = useState(false);
    const maxCapacity = event.max_capacity ?? event.total_capacity ?? 0;
    const bookedCount = event.current_registrations ?? 0;
    const hasCapacity = maxCapacity > 0;
    const progressPct = hasCapacity ? Math.min(100, Math.round((bookedCount / maxCapacity) * 100)) : 0;

    const eventUrl = event.slug 
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/events/${event.slug}`
        : `${typeof window !== "undefined" ? window.location.origin : ""}/admin/events/${event.event_id}`;

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(eventUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-all duration-300 group animate-fade-in">
            {/* Cover Image */}
            <div className="relative h-40 overflow-hidden">
                {event.image_url ? (
                    <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Calendar className="h-12 w-12 text-primary/30" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
                <Badge className={cn("absolute top-3 right-3 capitalize", statusStyles[event.status])}>
                    {event.status}
                </Badge>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="mb-3">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                        {event.title}
                    </h3>
                    <Badge variant="outline" className="text-xs capitalize">
                        {event.event_type.replace("_", " ").toLowerCase()}
                    </Badge>
                </div>

                {/* Meta Info */}
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(event.start_time)}</span>
                        <span className="ml-1">{formatTime(event.start_time)}</span>
                    </div>
                    {(event.venue_name || event.venue_city) && (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">
                                {event.venue_name || event.venue_city}
                            </span>
                        </div>
                    )}
                </div>

                {/* Capacity */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">
                            <Users className="h-3 w-3 inline mr-1" />
                            {hasCapacity ? `${bookedCount}/${maxCapacity} booked` : `${bookedCount} booked`}
                        </span>
                        <span className="font-medium">
                            {event.is_paid ? "Paid" : "Free"}
                        </span>
                    </div>
                    {hasCapacity && (
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <Button asChild className="flex-1 gradient-gold text-primary-foreground">
                        <Link href={`/admin/events/${event.event_id}`}>Manage Event</Link>
                    </Button>

                    <Button variant="outline" size="icon" onClick={handleShare} title="Copy share link">
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                                Cancel Event
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
