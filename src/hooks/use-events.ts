// ─── hooks/use-events.ts ──────────────────────────────────────────────────────
"use client";
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────
export interface Event {
    event_id: string;
    slug?: string;
    title: string;
    description: string;
    event_type: "OPEN" | "CONCERT" | "INVITE_ONLY" | "MEMBERS_ONLY" | "KROWN_EXCLUSIVE";
    status: "DRAFT" | "PUBLISHED" | "LIVE" | "CANCELLED" | "COMPLETED";
    start_time: string;
    end_time: string;
    venue_name: string;
    venue_address: string;
    venue_city: string;
    venue_state: string;
    reveal_time?: string | null;
    reveal_fields?: string[];
    latitude?: number;
    longitude?: number;
    total_capacity?: number;
    max_capacity?: number;
    current_registrations?: number;
    is_paid: boolean;
    base_price?: number;
    is_registration_open?: boolean;
    requires_approval: boolean;
    enable_waitlist?: boolean;
    max_tickets_per_user?: number;
    max_guest_invites_per_user?: number;
    created_at: string;
    updated_at: string;
    tiers?: TicketTier[];
    ticket_tiers?: any[];
    tags?: string[];
    category?: string;
    // ── NEW: Dynamic media support for UI (images, banners, etc.)
    image_url?: string; // Primary event banner/image
    media?: Array<{
        id: string;
        url: string;
        type: "image" | "video";
        filename: string;
    }>; // Full media array for future extensibility
}

export interface TicketTier {
    tier_id: string;
    tier_name: string;
    tier_description: string;
    price: number;
    capacity: number;
}

export interface ListEventsParams {
    page?: number;
    limit?: number;
    status?: string;
    event_type?: string;
    city?: string;
    search?: string;
}

export interface CreateEventData {
    title: string;
    description?: string;
    event_type: string;
    start_time: string;
    end_time: string;
    venue_name?: string;
    venue_address?: string;
    venue_city?: string;
    venue_state?: string;
    latitude?: number;
    longitude?: number;
    max_capacity?: number;
    visibility?: string;
    status?: Event["status"];
    is_paid?: boolean;
    base_price?: number;
    requires_approval?: boolean;
    cover_image?: string;
    image_url?: string;
    enable_waitlist?: boolean;
    max_tickets_per_user?: number;
    max_guest_invites_per_user?: number;
    tags?: string[];
    category?: string;
    ticket_tiers?: Array<{
        name: string;
        quantity: number;
        price?: number;
        description?: string;
        max_per_user?: number;
        sale_start?: string;
        sale_end?: string;
        sort_order?: number;
    }>;
    [key: string]: unknown;
}

// ─── Query Keys ───────────────────────────────────────────────────────────
// Dynamic architecture: All keys are now fully parameterized for filters, pagination, etc.
// This enables perfect caching, invalidation, and reactivity across the app.
export const eventKeys = {
    all: ["events"] as const,
    lists: () => [...eventKeys.all, "list"] as const,
    list: (filters: Record<string, any>) => [...eventKeys.lists(), filters] as const,
    details: () => [...eventKeys.all, "detail"] as const,
    detail: (id: string) => [...eventKeys.details(), id] as const,
    organizer: () => [...eventKeys.all, "organizer"] as const,
    organizerList: (filters: Record<string, any>) => [...eventKeys.organizer(), "list", filters] as const,
};

// ─── List Events (Public) ─────────────────────────────────────────────────
// Real-time updates via WebSocket - no polling needed
export function useEvents(params: ListEventsParams = {}) {
    return useQuery({
        queryKey: eventKeys.list(params),
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) searchParams.append(key, String(value));
            });
            const response = await apiClient.get(`/events?${searchParams.toString()}`);
            return response.data;
        },
    });
}

// ─── Get Event by ID ──────────────────────────────────────────────────────
export function useEvent(eventId: string | null | undefined, options?: Omit<UseQueryOptions, "queryKey" | "queryFn">) {
    return useQuery({
        queryKey: eventKeys.detail(eventId || ""),
        queryFn: async () => {
            if (!eventId) throw new Error("Event ID required");
            const response = await apiClient.get(`/events/${eventId}`);
            return response.data.data as Event;
        },
        enabled: !!eventId,
        staleTime: 60 * 1000, // 1 minute
        ...options,
    });
}

// ─── Get Event by Slug (Public) ─────────────────────────────────────────────
export function useEventBySlug(slug: string | null | undefined, options?: Omit<UseQueryOptions, "queryKey" | "queryFn">) {
    return useQuery({
        queryKey: ["events", "slug", slug],
        queryFn: async () => {
            if (!slug) throw new Error("Event slug required");
            const response = await apiClient.get(`/events/slug/${slug}`);
            return response.data.data as Event;
        },
        enabled: !!slug,
        staleTime: 60 * 1000,
        ...options,
    });
}

// ─── Get Organizer Events ─────────────────────────────────────────────────
// Dynamic architecture: Now accepts full filters (search, status, type) + pagination.
// Server-side filtering for scalability. Resets page on filter change in consumer.
// Real-time updates via WebSocket - no polling needed
export function useOrganizerEvents(filters: Partial<ListEventsParams> & { page?: number; limit?: number } = {}) {
    return useQuery({
        queryKey: eventKeys.organizerList(filters),
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) searchParams.append(key, String(value));
            });
            const response = await apiClient.get(`/events/organizer/me?${searchParams.toString()}`);
            return response.data;
        },
    });
}

// ─── Create Event ─────────────────────────────────────────────────────────
// Full CRUD: Create with media support (image_url can be pre-uploaded URL)
export function useCreateEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateEventData) => {
            const response = await apiClient.post("/events", data);
            return response.data;
        },
        onSuccess: () => {
            // Invalidate all relevant queries for real-time sync
            queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
            queryClient.invalidateQueries({ queryKey: eventKeys.organizer() });
        },
    });
}

// ─── Update Event ─────────────────────────────────────────────────────────
export function useUpdateEvent(eventId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<CreateEventData>) => {
            const response = await apiClient.put(`/events/${eventId}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
            queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
            queryClient.invalidateQueries({ queryKey: eventKeys.organizer() });
        },
    });
}

// ─── Update Event Status ──────────────────────────────────────────────────
export function useUpdateEventStatus(eventId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (status: Event["status"]) => {
            const response = await apiClient.patch(`/events/${eventId}/status`, { status });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
            queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
        },
    });
}

// ─── Delete Event ─────────────────────────────────────────────────────────
// NEW: Full CRUD delete with optimistic invalidation
export function useDeleteEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (eventId: string) => {
            await apiClient.delete(`/events/${eventId}`);
        },
        onSuccess: (_, eventId) => {
            queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
            queryClient.invalidateQueries({ queryKey: eventKeys.organizer() });
            queryClient.removeQueries({ queryKey: eventKeys.detail(eventId) });
        },
    });
}

// ─── Save Venue Layout (Concert) ──────────────────────────────────────────
export function useSaveVenueLayout(eventId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (layout: any) => {
            const response = await apiClient.post(`/events/${eventId}/layout`, { layout });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
            queryClient.invalidateQueries({ queryKey: ["events", eventId, "seats"] });
        },
    });
}
