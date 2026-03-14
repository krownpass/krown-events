import { z } from "zod";

// ─── Enums ───────────────────────────────────────────────────────────────
export const EventType = z.enum([
    "OPEN",
    "INVITE_ONLY",
    "MEMBER_ONLY",
    "KROWN_EXCLUSIVE",
    "CONCERT",
]);

export const EventVisibility = z.enum([
    "PUBLIC",
    "INVITE_ONLY",
    "MEMBERS_ONLY",
]);

export const EventStatus = z.enum([
    "DRAFT",
    "PUBLISHED",
    "LIVE",
    "COMPLETED",
    "CANCELLED",
]);

export const VenueBlockType = z.enum([
    "standing",
    "seated",
    "lounge",
    "stage",
]);

// ─── Ticket Tier Schema ─────────────────────────────────────────────────
export const ticketTierSchema = z.object({
    name: z.string().min(1, "Tier name is required").max(150),
    description: z.string().optional(),
    price: z.coerce.number().min(0).default(0),
    quantity: z.coerce.number().int().positive("Quantity must be positive"),
    max_per_user: z.coerce.number().int().positive().optional(),
    venue_block_id: z.string().optional(),
    venue_block_type: VenueBlockType.optional(),
    sale_start: z.string().optional(),
    sale_end: z.string().optional(),
    sort_order: z.coerce.number().int().default(0),
});

// ─── Create Event Schema ─────────────────────────────────────────────────
// Base object schema (for zodResolver — avoids ZodEffects typing issues)
export const createEventSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(300),
    description: z.string().optional(),
    event_type: EventType,
    cover_image: z.string().optional(),
    gallery_images: z.array(z.string()).optional(),
    visibility: EventVisibility.default("PUBLIC"),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
    timezone: z.string().default("Asia/Kolkata"),
    venue_name: z.string().max(300).optional(),
    venue_address: z.string().optional(),
    venue_city: z.string().max(100).optional(),
    venue_state: z.string().max(100).optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    max_capacity: z.coerce.number().int().positive().optional(),
    is_paid: z.boolean().default(false),
    base_price: z.coerce.number().min(0).default(0),
    currency: z.string().max(3).default("INR"),
    reveal_time: z.string().nullable().optional(),
    reveal_fields: z.array(z.string()).optional(),
    requires_krown_subscription: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
    category: z.string().max(100).optional(),
    max_guest_invites_per_user: z.coerce.number().int().min(0).optional(),
    max_tickets_per_user: z.coerce.number().int().positive().optional(),
    enable_waitlist: z.boolean().default(true),
    ticket_tiers: z.array(ticketTierSchema).optional(),
}).refine(
    (data) => {
        if (!data.reveal_time || !data.start_time) return true;
        const revealTime = new Date(data.reveal_time).getTime();
        const startTime = new Date(data.start_time).getTime();
        return revealTime < startTime;
    },
    {
        message: "Reveal time must be before event start time",
        path: ["reveal_time"],
    }
);

export type CreateEventInput = z.infer<typeof createEventSchema>;

// ─── Update Event Schema ─────────────────────────────────────────────────
export const updateEventSchema = z.object({
    title: z.string().min(3).max(300).optional(),
    description: z.string().nullable().optional(),
    cover_image: z.string().nullable().optional(),
    gallery_images: z.array(z.string()).optional(),
    event_type: EventType.optional(),
    visibility: EventVisibility.optional(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    venue_name: z.string().max(300).optional(),
    venue_address: z.string().optional(),
    venue_city: z.string().max(100).optional(),
    venue_state: z.string().max(100).optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    max_capacity: z.coerce.number().int().positive().optional(),
    is_paid: z.boolean().optional(),
    base_price: z.coerce.number().min(0).optional(),
    reveal_time: z.string().nullable().optional(),
    reveal_fields: z.array(z.string()).optional(),
    requires_krown_subscription: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().max(100).optional(),
    max_guest_invites_per_user: z.coerce.number().int().min(0).optional(),
    max_tickets_per_user: z.coerce.number().int().positive().optional(),
    enable_waitlist: z.boolean().optional(),
}).refine(
    (data) => {
        if (!data.reveal_time || !data.start_time) return true;
        const revealTime = new Date(data.reveal_time).getTime();
        const startTime = new Date(data.start_time).getTime();
        return revealTime < startTime;
    },
    {
        message: "Reveal time must be before event start time",
        path: ["reveal_time"],
    }
);

export type UpdateEventInput = z.infer<typeof updateEventSchema>;
