"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────

export interface EventDashboard {
  event_id: string;
  title: string;
  status: string;
  registration_stats: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    checked_in: number;
    attendance_rate: number;
  };
  revenue_stats: {
    total_revenue: number;
    collected: number;
    pending: number;
    refunded: number;
  };
  capacity_stats: {
    total_capacity: number;
    sold: number;
    available: number;
    utilization_rate: number;
  };
  waitlist_stats?: {
    total: number;
    promoted: number;
  };
  invite_stats?: {
    total_sent: number;
    accepted: number;
    pending: number;
  };
}

export interface Attendee {
  registration_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  phone_number?: string;
  tier_name: string;
  status: string;
  total_amount: number;
  seat_ids?: string[];
  checked_in_at?: string;
  registered_at: string;
}

export interface SeatUtilization {
  tier_id: string;
  tier_name: string;
  total_seats: number;
  available: number;
  locked: number;
  booked: number;
  blocked: number;
  utilization_rate: number;
}

// ─── Get Event Dashboard ──────────────────────────────────────────────────

export function useEventDashboard(eventId: string | null | undefined) {
  return useQuery({
    queryKey: ["events", eventId, "dashboard"],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID required");
      const response = await apiClient.get(`/events/${eventId}/dashboard`);
      return response.data.data as EventDashboard;
    },
    enabled: !!eventId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// ─── Get Attendees ────────────────────────────────────────────────────────
// Real-time updates via WebSocket - no polling needed
export function useAttendees(
  eventId: string | null | undefined,
  params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    checked_in?: boolean;
  } = {}
) {
  return useQuery({
    queryKey: ["events", eventId, "attendees", params],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID required");
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });

      const response = await apiClient.get(
        `/events/${eventId}/attendees?${searchParams.toString()}`
      );
      return (response.data as any).data as {
        data: Attendee[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          total_pages: number;
        };
      };
    },
    enabled: !!eventId,
  });
}

// ─── Get Seat Utilization (Concert) ───────────────────────────────────────

export function useSeatUtilization(eventId: string | null | undefined) {
  return useQuery({
    queryKey: ["events", eventId, "seat-utilization"],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID required");
      const response = await apiClient.get(`/events/${eventId}/seats/utilization`);
      return (response.data as any).data as SeatUtilization[];
    },
    enabled: !!eventId,
    staleTime: 60 * 1000,
  });
}

// ─── Check-In Attendee ────────────────────────────────────────────────────

export function useCheckInAttendee(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registrationId: string) => {
      const response = await apiClient.post(
        `/events/${eventId}/check-in/${registrationId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "attendees"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "dashboard"] });
    },
  });
}

// ─── Bulk Check-In ────────────────────────────────────────────────────────

export function useBulkCheckIn(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registrationIds: string[]) => {
      const response = await apiClient.post(`/events/${eventId}/check-in/bulk`, {
        registration_ids: registrationIds,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "attendees"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "dashboard"] });
    },
  });
}

// ─── Verify QR Code ───────────────────────────────────────────────────────

export function useVerifyQRCode(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (qrData: string) => {
      const response = await apiClient.post(`/events/${eventId}/check-in/verify-qr`, {
        qr_data: qrData,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "attendees"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "dashboard"] });
    },
  });
}

// ─── Export Attendees ─────────────────────────────────────────────────────

export function useExportAttendees(eventId: string) {
  return useMutation({
    mutationFn: async (format: "csv" | "xlsx" | "json" = "csv") => {
      const response = await apiClient.get(
        `/events/${eventId}/attendees/export?format=${format}`,
        {
          responseType: "blob",
        }
      );
      return response.data;
    },
  });
}

// ─── Approve Registration (MEMBERS_ONLY) ──────────────────────────────────

export function useApproveRegistration(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registrationId: string) => {
      const response = await apiClient.patch(
        `/events/${eventId}/registrations/${registrationId}`,
        { status: "APPROVED" }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "attendees"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "dashboard"] });
    },
  });
}

// ─── Reject Registration (MEMBERS_ONLY) ───────────────────────────────────

export function useRejectRegistration(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { registrationId: string; reason?: string }) => {
      const response = await apiClient.patch(
        `/events/${eventId}/registrations/${data.registrationId}`,
        { status: "REJECTED", rejection_reason: data.reason }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "attendees"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "dashboard"] });
    },
  });
}

// ─── Get Event Performance Analytics ──────────────────────────────────────

export function useEventPerformance(eventId: string | null | undefined) {
  return useQuery({
    queryKey: ["events", eventId, "performance"],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID required");
      const response = await apiClient.get(`/events/${eventId}/analytics/performance`);
      return response.data.data as {
        registration_timeline: Array<{ date: string; count: number }>;
        revenue_timeline: Array<{ date: string; amount: number }>;
        tier_distribution: Array<{ tier_name: string; count: number; revenue: number }>;
        peak_registration_time: string;
        average_ticket_price: number;
      };
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ─── Get Invite Analytics (INVITE_ONLY) ───────────────────────────────────

export function useInviteAnalytics(eventId: string | null | undefined) {
  return useQuery({
    queryKey: ["events", eventId, "analytics", "invites"],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID required");
      const response = await apiClient.get(`/events/${eventId}/analytics/invites`);
      return response.data.data as {
        chain_distribution: Record<number, number>; // depth -> count
        top_inviters: Array<{ user_name: string; invites_sent: number; accepted: number }>;
        conversion_rate: number;
        average_response_time: string;
      };
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Send Event Announcement ──────────────────────────────────────────────

export function useSendAnnouncement(eventId: string) {
  return useMutation({
    mutationFn: async (data: {
      subject: string;
      message: string;
      target?: "all" | "confirmed" | "pending" | "waitlist";
    }) => {
      const response = await apiClient.post(`/events/${eventId}/announcements`, data);
      return response.data;
    },
  });
}
