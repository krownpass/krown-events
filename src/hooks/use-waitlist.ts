"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useWebSocket } from "./use-websocket";
import { useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────

export interface WaitlistEntry {
    waitlist_id: string;
    event_id: string;
    user_id: string;
    position: number;
    joined_at: string;
    user_name?: string;
    user_email?: string;
}

export interface WaitlistPosition {
    position: number;
    total: number;
    joined_at: string;
    estimated_wait?: string;
}

export type WaitlistResponse = {
    entries: WaitlistEntry[];
    total: number;
};
// ─── Join Waitlist ────────────────────────────────────────────────────────

export function useJoinWaitlist(eventId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post(`/events/${eventId}/waitlist`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["events", eventId, "waitlist", "position"] });
            queryClient.invalidateQueries({ queryKey: ["events", eventId, "waitlist"] });
        },
    });
}

// ─── Leave Waitlist ───────────────────────────────────────────────────────

export function useLeaveWaitlist(eventId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.delete(`/events/${eventId}/waitlist`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["events", eventId, "waitlist", "position"] });
            queryClient.invalidateQueries({ queryKey: ["events", eventId, "waitlist"] });
        },
    });
}

// ─── Get My Waitlist Position (with Real-time Updates) ───────────────────

export function useMyWaitlistPosition(
    eventId: string | null | undefined,
    token?: string
) {
    const queryClient = useQueryClient();

    // WebSocket for real-time position updates
    const { isConnected, joinRoom, leaveRoom, getWaitlistStatus } = useWebSocket({
        token,
        eventId: eventId || undefined,
        onMessage: (message) => {
            if (message.type === "WAITLIST_UPDATE" || message.type === "WAITLIST_PROMOTED") {
                queryClient.invalidateQueries({
                    queryKey: ["events", eventId, "waitlist", "position"],
                });
            }
        },
    });

    // Auto-join room and request status
    useEffect(() => {
        if (isConnected && eventId) {
            joinRoom(eventId);
            getWaitlistStatus(eventId);
            return () => leaveRoom(eventId);
        }
    }, [isConnected, eventId, joinRoom, leaveRoom, getWaitlistStatus]);

    return useQuery({
        queryKey: ["events", eventId, "waitlist", "position"],
        queryFn: async () => {
            if (!eventId) throw new Error("Event ID required");
            const response = await apiClient.get(`/events/${eventId}/waitlist/position`);
            return response.data.data as WaitlistPosition;
        },
        enabled: !!eventId,
        staleTime: 30 * 1000, // 30 seconds
        retry: false, // Don't retry if not on waitlist
    });
}

// ─── Get Waitlist (Admin) ─────────────────────────────────────────────────

export function useWaitlist(eventId: string | null | undefined) {
    return useQuery<WaitlistResponse>({
        queryKey: ["events", eventId, "waitlist"],
        queryFn: async (): Promise<WaitlistResponse> => {
            if (!eventId) throw new Error("Event ID required");

            const response = await apiClient.get(`/events/${eventId}/waitlist`);

            return response.data.data as WaitlistResponse;
        },
        enabled: !!eventId,
        staleTime: 30 * 1000,
    });
}

// ─── Promote from Waitlist (Admin) ───────────────────────────────────────

export function usePromoteFromWaitlist(eventId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post(`/events/${eventId}/waitlist/promote`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["events", eventId, "waitlist"] });
            queryClient.invalidateQueries({ queryKey: ["events", eventId, "registration"] });
            queryClient.invalidateQueries({ queryKey: ["events", eventId] });
        },
    });
}

// ─── Bulk Promote (Admin) ─────────────────────────────────────────────────

export function useBulkPromote(eventId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (count: number) => {
            const response = await apiClient.post(`/events/${eventId}/waitlist/promote-bulk`, {
                count,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["events", eventId, "waitlist"] });
            queryClient.invalidateQueries({ queryKey: ["events", eventId] });
        },
    });
}

// ─── Remove from Waitlist (Admin) ─────────────────────────────────────────

export function useRemoveFromWaitlist(eventId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (waitlistId: string) => {
            const response = await apiClient.delete(`/events/${eventId}/waitlist/${waitlistId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["events", eventId, "waitlist"] });
        },
    });
}
