"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useWebSocket } from "./use-websocket";
import { useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────

export interface Seat {
  seat_id: string;
  venue_block_id: string;
  venue_block_name: string;
  row_number: number;
  seat_number: number;
  status: "AVAILABLE" | "LOCKED" | "BOOKED" | "BLOCKED";
  price: number;
  tier_id: string;
  tier_name: string;
  tier_description: string;
  currently_locked_by?: string;
  lock_seconds_remaining?: number;
}

export interface SeatMap {
  seats: Seat[];
  stats: {
    available: number;
    locked: number;
    booked: number;
    blocked: number;
    total: number;
  };
}

export interface UserLockStatus {
  lockedSeats: Seat[];
  count: number;
  maxAllowed: number;
  remaining: number;
}

// ─── Get Seat Map (with Real-time Updates) ───────────────────────────────

export function useSeatMap(eventId: string | null | undefined, token?: string) {
  const queryClient = useQueryClient();

  // WebSocket connection for real-time seat updates
  const { isConnected, joinRoom, leaveRoom } = useWebSocket({
    token,
    eventId: eventId || undefined,
    onMessage: (message) => {
      if (message.type === "SEAT_LOCKED" || message.type === "SEAT_UNLOCKED" || message.type === "SEAT_BOOKED") {
        // Invalidate seat map to trigger refetch
        queryClient.invalidateQueries({
          queryKey: ["events", eventId, "seats"],
        });
      }
    },
  });

  // Auto-join room when connected
  useEffect(() => {
    if (isConnected && eventId) {
      joinRoom(eventId);
      return () => leaveRoom(eventId);
    }
  }, [isConnected, eventId, joinRoom, leaveRoom]);

  return useQuery({
    queryKey: ["events", eventId, "seats"],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID required");
      const response = await apiClient.get(`/events/${eventId}/seats`);
      return response.data.data as SeatMap;
    },
    enabled: !!eventId,
    staleTime: 10 * 1000, // 10 seconds (frequently updated)
    refetchInterval: 15 * 1000, // Poll every 15s as backup to WebSocket
  });
}

// ─── Get My Lock Status ───────────────────────────────────────────────────

export function useMyLockStatus(eventId: string | null | undefined) {
  return useQuery({
    queryKey: ["events", eventId, "my-locks"],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID required");
      const response = await apiClient.get(`/events/${eventId}/seats/my-locks`);
      return response.data.data as UserLockStatus;
    },
    enabled: !!eventId,
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 10 * 1000, // Poll every 10s
  });
}

// ─── Lock Seats ───────────────────────────────────────────────────────────

export function useLockSeats(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seatIds: string[]) => {
      const response = await apiClient.post(`/events/${eventId}/seats/lock`, {
        seat_ids: seatIds,
      });
      return response.data;
    },
    onSuccess: () => {
      // Immediately refetch seat map and lock status
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "seats"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "my-locks"] });
    },
  });
}

// ─── Unlock Seats ─────────────────────────────────────────────────────────

export function useUnlockSeats(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seatIds: string[]) => {
      const response = await apiClient.delete(`/events/${eventId}/seats/lock`, {
        data: { seat_ids: seatIds },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "seats"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "my-locks"] });
    },
  });
}

// ─── Extend Locks (Auto-heartbeat) ────────────────────────────────────────

export function useExtendLocks(eventId: string, seatIds: string[], enabled: boolean = false) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const extendMutation = useMutation({
    mutationFn: async () => {
      if (seatIds.length === 0) return;
      const response = await apiClient.post(`/events/${eventId}/seats/extend`, {
        seat_ids: seatIds,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "my-locks"] });
    },
  });

  // Auto-extend locks every 4 minutes (locks expire in 5 minutes)
  useEffect(() => {
    if (enabled && seatIds.length > 0) {
      // Extend immediately
      extendMutation.mutate();

      // Set up interval
      intervalRef.current = setInterval(() => {
        extendMutation.mutate();
      }, 4 * 60 * 1000); // 4 minutes

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [enabled, seatIds, extendMutation]);

  return extendMutation;
}

// ─── Confirm Booking ──────────────────────────────────────────────────────

export function useConfirmBooking(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      seat_ids,
      tier_id,
      transaction_id,
    }: {
      seat_ids: string[];
      tier_id: string;
      transaction_id?: string;
    }) => {
      const response = await apiClient.post(`/events/${eventId}/seats/book`, {
        seat_ids,
        tier_id,
        transaction_id,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "seats"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "my-locks"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "registration"] });
    },
  });
}

// ─── Block Seats (Admin) ──────────────────────────────────────────────────

export function useBlockSeats(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seatIds: string[]) => {
      const response = await apiClient.post(`/events/${eventId}/seats/block`, {
        seat_ids: seatIds,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "seats"] });
    },
  });
}
