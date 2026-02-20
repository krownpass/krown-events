// ─── app/admin/events/page.tsx ─────────────────────────────────────────────
"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, ExternalLink, Copy, Share2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EventFilters } from "@/components/dashboard/events/EventsFilter";
import { useOrganizerEvents, useDeleteEvent, type Event } from "@/hooks";

const statusStyles: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    PUBLISHED: "bg-info/10 text-info",
    CANCELLED: "bg-destructive/10 text-destructive",
    COMPLETED: "bg-secondary text-secondary-foreground",
};

const typeColors: Record<string, string> = {
    OPEN: "bg-blue-500/10 text-blue-500",
    CONCERT: "bg-purple-500/10 text-purple-500",
    INVITE_ONLY: "bg-amber-500/10 text-amber-500",
    MEMBERS_ONLY: "bg-green-500/10 text-green-500",
    KROWN_EXCLUSIVE: "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-amber-500",
};

export default function EventsPage() {
    const [view, setView] = useState<"grid" | "table">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [page, setPage] = useState(1);

    // ── Dynamic data fetching architecture ─────────────────────────────────
    // Filters + pagination passed to hook → server-side query keys + API params
    // useEffect resets page on filter change for correct pagination
    const organizerParams = {
        page,
        limit: 20,
        status: statusFilter === "all" ? undefined : (statusFilter as Event["status"]),
        event_type: typeFilter === "all" ? undefined : (typeFilter as Event["event_type"]),
        search: searchQuery || undefined,
    };

    const { data, isLoading, error } = useOrganizerEvents(organizerParams);
    const events: Event[] = data?.data?.events ?? [];
    const pagination = {
        total: data?.data?.total ?? 0,
        total_pages: Math.ceil(
            (data?.data?.total ?? 0) / (data?.data?.limit ?? 1)
        ),
    };

    // ── CRUD: Delete mutation ───────────────────────────────────────────────
    const deleteMutation = useDeleteEvent();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getCapacityMeta = (event: Event) => {
        const capacity = event.max_capacity ?? event.total_capacity ?? 0;
        const booked = event.current_registrations ?? 0;
        const hasCapacity = capacity > 0;
        const pct = hasCapacity ? Math.min(100, Math.round((booked / capacity) * 100)) : 0;
        return { capacity, booked, pct, hasCapacity };
    };

    const handleCopyLink = (eventId: string) => {
        const url = `${window.location.origin}/events/${eventId}`;
        navigator.clipboard.writeText(url);
        toast.success("Event link copied to clipboard!");
    };

    const handleShare = async (event: Event) => {
        const url = `${window.location.origin}/events/${event.event_id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: event.title,
                    text: event.description,
                    url,
                });
            } catch {
                // User cancelled share
            }
        } else {
            handleCopyLink(event.event_id);
        }
    };

    const handleDelete = (event: Event) => {
        if (confirm(`Delete "${event.title}"? This action cannot be undone.`)) {
            deleteMutation.mutate(event.event_id, {
                onSuccess: () => {
                    toast.success("Event deleted successfully");
                },
                onError: () => {
                    toast.error("Failed to delete event");
                },
            });
        }
    };

    if (error) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">Events</h1>
                        <p className="text-muted-foreground">Manage all your events in one place</p>
                    </div>
                </div>
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                    <p className="text-destructive mb-4">Failed to load events</p>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Events</h1>
                    <p className="text-muted-foreground">
                        {isLoading ? "Loading..." : `Manage ${pagination?.total || 0} events`}
                    </p>
                </div>
                <Button asChild className="w-full gap-2 gradient-gold text-primary-foreground shadow-glow sm:w-auto">
                    <Link href="/admin/events/new">
                        <Plus className="h-4 w-4" />
                        Create Event
                    </Link>
                </Button>
            </div>

            <EventFilters
                view={view}
                onViewChange={setView}
                searchQuery={searchQuery}
                onSearchChange={(query) => {
                    setSearchQuery(query);
                    setPage(1);
                }}
                statusFilter={statusFilter}
                onStatusChange={(status) => {
                    setStatusFilter(status);
                    setPage(1);
                }}
                typeFilter={typeFilter}
                onTypeChange={(type) => {
                    setTypeFilter(type);
                    setPage(1);
                }}
            />

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : view === "grid" ? (
                // ── Grid View with dynamic media images ─────────────────────────────
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {events.map((event) => {
                        const capacityMeta = getCapacityMeta(event);
                        return (
                        <Link
                            key={event.event_id}
                            href={`/admin/events/${event.event_id}`}
                            className="group"
                        >
                            <div className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg">
                                {/* Dynamic media: image_url with fallback */}
                                <div className="aspect-video relative overflow-hidden">
                                    {event.image_url ? (
                                        <img
                                            src={event.image_url}
                                            alt={event.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center h-full">
                                            <span className="text-4xl">🎫</span>
                                        </div>
                                    )}
                                    {/* Optional: Media badge if multiple media */}
                                    {event.media && event.media.length > 1 && (
                                        <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                                            +{event.media.length - 1}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 space-y-3">
                                    <div>
                                        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                            {event.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {event.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={cn("capitalize", typeColors[event.event_type])}>
                                            {event.event_type.replace(/_/g, " ")}
                                        </Badge>
                                        <Badge className={cn("capitalize", statusStyles[event.status])}>
                                            {event.status}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        <div>{formatDate(event.start_time)}</div>
                                        <div>{formatTime(event.start_time)}</div>
                                    </div>
                                    <div className="pt-2 border-t border-border">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>
                                                {capacityMeta.hasCapacity
                                                    ? `${capacityMeta.booked}/${capacityMeta.capacity} booked`
                                                    : `${capacityMeta.booked} booked`}
                                            </span>
                                            {event.is_paid && (
                                                <Badge variant="outline" className="text-xs">
                                                    Paid Event
                                                </Badge>
                                            )}
                                        </div>
                                        {capacityMeta.hasCapacity && (
                                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-primary transition-all"
                                                    style={{ width: `${capacityMeta.pct}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                        );
                    })}
                </div>
            ) : (
                // ── Table View with dynamic media images ────────────────────────────
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="overflow-x-auto">
                    <table className="min-w-[860px] w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Event
                                </th>
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Date/Time
                                </th>
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Status
                                </th>
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Type
                                </th>
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Capacity
                                </th>
                                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {events.map((event) => {
                                const capacityMeta = getCapacityMeta(event);
                                return (
                                <tr key={event.event_id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            {/* Dynamic media thumbnail */}
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0">
                                                {event.image_url ? (
                                                    <img
                                                        src={event.image_url}
                                                        alt={event.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <span className="text-xl">🎫</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <Link
                                                    href={`/admin/events/${event.event_id}`}
                                                    className="font-medium hover:text-primary transition-colors line-clamp-1"
                                                >
                                                    {event.title}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">
                                                    {event.venue_city}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-sm">{formatDate(event.start_time)}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {formatTime(event.start_time)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <Badge className={cn("capitalize", statusStyles[event.status])}>
                                            {event.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-4">
                                        <Badge className={cn("capitalize text-xs", typeColors[event.event_type])}>
                                            {event.event_type.replace(/_/g, " ")}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                        {capacityMeta.hasCapacity ? (
                                            <div className="min-w-[140px]">
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>{capacityMeta.booked}/{capacityMeta.capacity}</span>
                                                    <span>{capacityMeta.pct}%</span>
                                                </div>
                                                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-primary transition-all"
                                                        style={{ width: `${capacityMeta.pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <span>{capacityMeta.booked} booked</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/admin/events/${event.event_id}`}>
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleCopyLink(event.event_id)}>
                                                        <Copy className="h-4 w-4 mr-2" />
                                                        Copy Link
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleShare(event)}>
                                                        <Share2 className="h-4 w-4 mr-2" />
                                                        Share
                                                    </DropdownMenuItem>
                                                    {/* NEW: Delete action for full CRUD */}
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(event)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {!isLoading && events.length === 0 && (
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                    <p className="text-muted-foreground mb-4">
                        {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                            ? "No events match your filters"
                            : "No events found"}
                    </p>
                    <Button asChild className="gap-2 gradient-gold text-primary-foreground">
                        <Link href="/admin/events/new">
                            <Plus className="h-4 w-4" />
                            Create your first event
                        </Link>
                    </Button>
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
                <div className="flex flex-col items-center justify-center gap-2 pt-4 sm:flex-row">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {pagination.total_pages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                        disabled={page === pagination.total_pages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
