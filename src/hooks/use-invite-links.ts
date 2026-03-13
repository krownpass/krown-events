// hooks/use-invite-links.ts
// Invite link system hooks — organizer + attendee flows
// Matches the pattern of use-events.ts / use-invites.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ================================================================
// TYPES
// ================================================================

export interface InviteLink {
    link_id: string;
    token: string;
    event_id: string;
    created_by_type: "organizer" | "attendee";
    max_uses: number;
    current_uses: number;
    spots_remaining: number;
    status: "ACTIVE" | "EXHAUSTED" | "REVOKED" | "EXPIRED";
    expires_at: string | null;
    created_at: string;
    invite_url: string;
    uses?: InviteLinkUse[];
}

export interface InviteLinkUse {
    use_id: string;
    used_by_user_id: string;
    registration_id: string | null;
    used_at: string;
}

export interface InviteTreeNode {
    link_id: string;
    created_by: {
        user_id: string;
        name: string;
        email_masked: string;
        type: "organizer" | "attendee";
    };
    max_uses: number;
    current_uses: number;
    status: string;
    created_at: string;
    invitees: Array<{
        user_id: string;
        user_name: string;
        registration_id: string;
        used_at: string;
    }>;
}

export interface ClaimResult {
    registration_id: string;
    event_id: string;
    link_id: string;
    requires_payment: boolean;
    amount: number;
    status: "PENDING" | "CONFIRMED";
    qr_data: string | null;
}

export interface Registration {
    registration_id: string;
    event_id: string;
    status: "PENDING" | "CONFIRMED" | "CANCELLED";
    ticket_count: number;
    total_amount: number;
    is_checked_in: boolean;
    check_in_time: string | null;
    created_at: string;
    qr_url: string | null;
    event: {
        title: string;
        description: string;
        start_time: string;
        end_time: string;
        venue_name: string;
        venue_address: string;
        venue_city: string;
        cover_image: string;
    };
}

export interface ScanResult {
    success: boolean;
    scan_result:
    | "ADMITTED"
    | "ALREADY_CHECKED_IN"
    | "NOT_CONFIRMED"
    | "WRONG_EVENT"
    | "INVALID"
    | "NOT_FOUND"
    | "VALID"
    | "VALID_UNCHECKED";
    message: string;
    attendee?: {
        registration_id: string;
        user_name: string;
        user_email: string;
        user_mobile: string;
        tier_name: string | null;
        registered_at: string;
        total_amount: number;
    };
    check_in?: {
        admitted_count: number;
        ticket_count: number;
        remaining_tickets: number;
        check_in_time: string | null;
        is_fully_admitted?: boolean;
    };
}

// ================================================================
// QUERY KEYS
// ================================================================

export const inviteLinkKeys = {
    all: (eventId: string) => ["invite-links", eventId] as const,
    tree: (eventId: string) => ["invite-links", eventId, "tree"] as const,
    myLink: (eventId: string) => ["invite-links", eventId, "mine"] as const,
    preview: (token: string) => ["invite-preview", token] as const,
    registration: (regId: string) => ["registration", regId] as const,
    qr: (regId: string) => ["registration-qr", regId] as const,
};

// ================================================================
// ORGANIZER HOOKS
// ================================================================

/**
 * List all invite links for an event with usage stats
 * GET /events/:event_id/invite-links
 */
export const useInviteLinks = (eventId: string) =>
    useQuery({
        queryKey: inviteLinkKeys.all(eventId),
        queryFn: async (): Promise<InviteLink[]> => {
            const res = await apiClient.get(`/events/${eventId}/invite-links`);
            return res.data.data;
        },
        enabled: !!eventId,
        staleTime: 30_000,
    });

/**
 * Generate a new invite link
 * POST /events/:event_id/invite-links
 */
export const useGenerateInviteLink = (eventId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            max_uses: number;
            expires_at?: string;
        }): Promise<InviteLink> => {
            const res = await apiClient.post(
                `/events/${eventId}/invite-links`,
                payload
            );
            return res.data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: inviteLinkKeys.all(eventId) });
        },
    });
};

/**
 * Revoke an invite link
 * DELETE /events/:event_id/invite-links/:link_id
 */
export const useRevokeInviteLink = (eventId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (linkId: string): Promise<void> => {
            await apiClient.delete(`/events/${eventId}/invite-links/${linkId}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: inviteLinkKeys.all(eventId) });
        },
    });
};

/**
 * Get invite tree (who invited whom)
 * GET /events/:event_id/invite-links/tree
 */
export const useInviteTree = (eventId: string) =>
    useQuery({
        queryKey: inviteLinkKeys.tree(eventId),
        queryFn: async (): Promise<InviteTreeNode[]> => {
            const res = await apiClient.get(
                `/events/${eventId}/invite-links/tree`
            );
            return res.data.data;
        },
        enabled: !!eventId,
        staleTime: 60_000,
    });

// ================================================================
// END USER HOOKS
// ================================================================

/**
 * Preview an event via invite token (read-only, no spot claimed)
 * GET /events/invite/:token/preview
 */
export const useInviteLinkPreview = (token: string) =>
    useQuery({
        queryKey: inviteLinkKeys.preview(token),
        queryFn: async () => {
            const res = await apiClient.get(`/events/invite/${token}/preview`);
            return res.data;
        },
        enabled: !!token,
        staleTime: 60_000,
        retry: false,
    });

/**
 * Claim an invite link → creates registration
 * POST /events/invite/:token/claim
 */
export const useClaimInviteLink = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (token: string): Promise<ClaimResult> => {
            const res = await apiClient.post(`/events/invite/${token}/claim`);
            return res.data.data;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({
                queryKey: inviteLinkKeys.myLink(data.event_id),
            });
        },
    });
};

/**
 * Get my shareable invite link for an event
 * GET /events/:event_id/my-invite-link
 */
export const useMyInviteLink = (eventId: string) =>
    useQuery({
        queryKey: inviteLinkKeys.myLink(eventId),
        queryFn: async (): Promise<InviteLink> => {
            const res = await apiClient.get(
                `/events/${eventId}/my-invite-link`
            );
            return res.data.data;
        },
        enabled: !!eventId,
        staleTime: 300_000,
        retry: false,
    });

// ================================================================
// REGISTRATION + QR HOOKS
// ================================================================

/**
 * Get my registration details + QR URL
 * GET /events/registrations/:registration_id
 */
export const useMyRegistration = (registrationId: string) =>
    useQuery({
        queryKey: inviteLinkKeys.registration(registrationId),
        queryFn: async (): Promise<Registration> => {
            const res = await apiClient.get(
                `/events/registrations/${registrationId}`
            );
            return res.data.data;
        },
        enabled: !!registrationId,
        staleTime: 60_000,
    });

/**
 * Get QR image as base64 for a registration
 * GET /events/registrations/:registration_id/qr?format=json
 */
export const useQrImage = (registrationId: string, enabled = true) =>
    useQuery({
        queryKey: inviteLinkKeys.qr(registrationId),
        queryFn: async (): Promise<{ qr_image: string; event_title: string; venue: string; event_start: string }> => {
            const res = await apiClient.get(
                `/events/registrations/${registrationId}/qr?format=json`
            );
            return res.data.data;
        },
        enabled: !!registrationId && enabled,
        staleTime: Infinity, // QR never changes
        gcTime: Infinity,
    });

// ================================================================
// SCAN HOOKS (organizer)
// ================================================================

/**
 * Scan QR → verify + admit in one step
 * POST /events/:event_id/scan
 */
export const useScanAndCheckIn = (eventId: string) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (qrData: string): Promise<ScanResult> => {
            const res = await apiClient.post(`/events/${eventId}/scan`, {
                qr_data: qrData,
            });
            return res.data;
        },
        onSuccess: () => {
            // Invalidate registrations list so count updates
            qc.invalidateQueries({ queryKey: ["registrations", eventId] });
        },
    });
};

/**
 * Scan QR → verify only, no admission
 * POST /events/:event_id/scan/verify
 */
export const useScanVerifyOnly = (eventId: string) =>
    useMutation({
        mutationFn: async (qrData: string): Promise<ScanResult> => {
            const res = await apiClient.post(
                `/events/${eventId}/scan/verify`,
                { qr_data: qrData }
            );
            return res.data;
        },
    });
