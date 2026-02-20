"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────

export interface Invite {
  invite_id: string;
  event_id: string;
  invited_by: string;
  invited_user_id: string;
  invited_email: string;
  invite_code: string;
  invite_depth: number;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED";
  sent_at: string;
  responded_at?: string;
  inviter_name?: string;
  invitee_name?: string;
}

// ─── Send Invites ─────────────────────────────────────────────────────────

export function useSendInvites(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { emails: string[] }) => {
      const response = await apiClient.post(`/events/${eventId}/invites`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "invites", "sent"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "invites", "stats"] });
    },
  });
}

// ─── Get My Sent Invites ──────────────────────────────────────────────────

export function useMySentInvites(eventId: string | null | undefined) {
  return useQuery({
    queryKey: ["events", eventId, "invites", "sent"],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID required");
      const response = await apiClient.get(`/events/${eventId}/invites`);
      return response.data.data as Invite[];
    },
    enabled: !!eventId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ─── Get Received Invites ─────────────────────────────────────────────────

export function useReceivedInvites(eventId: string | null | undefined) {
  return useQuery({
    queryKey: ["events", eventId, "invites", "received"],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID required");
      const response = await apiClient.get(`/events/${eventId}/invites/received`);
      return response.data.data as Invite[];
    },
    enabled: !!eventId,
    staleTime: 30 * 1000,
  });
}

// ─── Accept Invite ────────────────────────────────────────────────────────

export function useAcceptInvite(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const response = await apiClient.post(`/events/${eventId}/invites/${inviteId}/accept`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "invites", "received"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "registration"] });
    },
  });
}

// ─── Decline Invite ───────────────────────────────────────────────────────

export function useDeclineInvite(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const response = await apiClient.post(`/events/${eventId}/invites/${inviteId}/decline`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "invites", "received"] });
    },
  });
}

// ─── Revoke Invite ────────────────────────────────────────────────────────

export function useRevokeInvite(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const response = await apiClient.delete(`/events/${eventId}/invites/${inviteId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "invites", "sent"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "invites", "stats"] });
    },
  });
}

// ─── Get Invite Stats (Admin) ─────────────────────────────────────────────

export function useInviteStats(eventId: string | null | undefined) {
  return useQuery({
    queryKey: ["events", eventId, "invites", "stats"],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID required");
      const response = await apiClient.get(`/events/${eventId}/invites/stats`);
      return response.data.data as {
        total_sent: number;
        accepted: number;
        pending: number;
        declined: number;
        revoked: number;
        invite_chain_depth: Record<string, number>;
      };
    },
    enabled: !!eventId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// ─── Validate Invite Code ─────────────────────────────────────────────────

export function useValidateInviteCode(eventId: string) {
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await apiClient.post(`/events/${eventId}/invites/validate`, {
        invite_code: inviteCode,
      });
      return response.data;
    },
  });
}
