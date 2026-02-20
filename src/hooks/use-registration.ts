"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────

export interface Registration {
  registration_id: string;
  event_id: string;
  user_id: string;
  tier_id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  seat_ids?: string[];
  total_amount: number;
  qr_data?: string;
  checked_in_at?: string;
  created_at: string;
}

// ─── Register for Event ───────────────────────────────────────────────────

export function useRegisterForEvent(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      tier_id?: string;
      ticket_count?: number;
      invite_code?: string;
    }) => {
      const response = await apiClient.post(`/events/${eventId}/register`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "registration"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "seats"] });
    },
  });
}

// ─── Get My Registration ──────────────────────────────────────────────────

export function useMyRegistration(eventId: string | null | undefined) {
  return useQuery({
    queryKey: ["events", eventId, "registration"],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID required");
      const response = await apiClient.get(`/events/${eventId}/registration`);
      return response.data.data as Registration;
    },
    enabled: !!eventId,
    staleTime: 60 * 1000,
    retry: false, // Don't retry if not registered
  });
}

// ─── Cancel Registration ──────────────────────────────────────────────────

export function useCancelRegistration(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete(`/events/${eventId}/registration`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "registration"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "seats"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "waitlist"] });
    },
  });
}

// ─── Payment ──────────────────────────────────────────────────────────────

export function useInitiatePayment(eventId: string) {
  return useMutation({
    mutationFn: async (data: {
      tier_id: string;
      ticket_count: number;
      seat_ids?: string[];
      idempotency_key: string;
    }) => {
      const response = await apiClient.post(`/events/${eventId}/payment/initiate`, data);
      return response.data;
    },
  });
}

export function useVerifyPayment(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      transaction_id: string;
    }) => {
      const response = await apiClient.post(`/events/${eventId}/payment/verify`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "registration"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "seats"] });
    },
  });
}
