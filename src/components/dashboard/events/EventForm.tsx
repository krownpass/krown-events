"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { createEventSchema, type CreateEventInput } from "@/schemas/event";

interface EventFormProps {
    defaultValues?: Partial<CreateEventInput>;
    onSubmit: (data: CreateEventInput) => void;
    isSubmitting?: boolean;
    submitLabel?: string;
}

const EVENT_TYPES = [
    { value: "OPEN", label: "Open" },
    { value: "INVITE_ONLY", label: "Invite Only" },
    { value: "MEMBER_ONLY", label: "Members Only" },
    { value: "KROWN_EXCLUSIVE", label: "Krown Exclusive" },
    { value: "CONCERT", label: "Concert" },
] as const;

const VISIBILITY_OPTIONS = [
    { value: "PUBLIC", label: "Public" },
    { value: "INVITE_ONLY", label: "Invite Only" },
    { value: "MEMBERS_ONLY", label: "Members Only" },
] as const;

function toDatetimeLocal(iso: string | undefined): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({
    defaultValues,
    onSubmit,
    isSubmitting = false,
    submitLabel = "Create Event",
}: EventFormProps) {
    const form = useForm<CreateEventInput>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(createEventSchema) as any,
        defaultValues: {
            title: defaultValues?.title ?? "",
            description: defaultValues?.description ?? "",
            event_type: defaultValues?.event_type ?? "OPEN",
            cover_image: defaultValues?.cover_image ?? "",
            visibility: defaultValues?.visibility ?? "PUBLIC",
            start_time: toDatetimeLocal(defaultValues?.start_time) || "",
            end_time: toDatetimeLocal(defaultValues?.end_time) || "",
            timezone: defaultValues?.timezone ?? "Asia/Kolkata",
            venue_name: defaultValues?.venue_name ?? "",
            venue_address: defaultValues?.venue_address ?? "",
            venue_city: defaultValues?.venue_city ?? "",
            venue_state: defaultValues?.venue_state ?? "",
            max_capacity: defaultValues?.max_capacity,
            is_paid: defaultValues?.is_paid ?? false,
            base_price: defaultValues?.base_price ?? 0,
            currency: defaultValues?.currency ?? "INR",
            enable_waitlist: defaultValues?.enable_waitlist ?? true,
            max_tickets_per_user: defaultValues?.max_tickets_per_user ?? 5,
            max_guest_invites_per_user: defaultValues?.max_guest_invites_per_user ?? 2,
            tags: defaultValues?.tags ?? [],
            category: defaultValues?.category ?? "",
            ticket_tiers: defaultValues?.ticket_tiers ?? [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "ticket_tiers",
    });

    const isPaid = form.watch("is_paid");

    const handleSubmit = (data: CreateEventInput) => {
        // Convert datetime-local to ISO
        const payload = {
            ...data,
            start_time: new Date(data.start_time).toISOString(),
            end_time: new Date(data.end_time).toISOString(),
            cover_image: data.cover_image || undefined,
            ticket_tiers: data.is_paid ? data.ticket_tiers : undefined,
        };
        onSubmit(payload);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                {/* ── Basic Info ──────────────────────────────── */}
                <div className="bg-card rounded-xl p-6 border border-border space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>

                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Event Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter event title" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Describe your event..."
                                        className="min-h-[120px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="event_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {EVENT_TYPES.map((t) => (
                                                <SelectItem key={t.value} value={t.value}>
                                                    {t.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="visibility"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Visibility</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select visibility" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {VISIBILITY_OPTIONS.map((v) => (
                                                <SelectItem key={v.value} value={v.value}>
                                                    {v.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="cover_image"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cover Image URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://..." {...field} />
                                </FormControl>
                                <FormDescription>Direct URL to the event banner image</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Music, Tech, Sports" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* ── Date & Time ─────────────────────────────── */}
                <div className="bg-card rounded-xl p-6 border border-border space-y-4">
                    <h3 className="text-lg font-semibold">Date & Time</h3>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="start_time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Time</FormLabel>
                                    <FormControl>
                                        <Input type="datetime-local" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="end_time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>End Time</FormLabel>
                                    <FormControl>
                                        <Input type="datetime-local" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* ── Venue ───────────────────────────────────── */}
                <div className="bg-card rounded-xl p-6 border border-border space-y-4">
                    <h3 className="text-lg font-semibold">Venue</h3>

                    <FormField
                        control={form.control}
                        name="venue_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Venue Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Convention Center" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="venue_address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                    <Input placeholder="Full address" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="venue_city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>City</FormLabel>
                                    <FormControl>
                                        <Input placeholder="City" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="venue_state"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>State</FormLabel>
                                    <FormControl>
                                        <Input placeholder="State" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* ── Capacity & Access ───────────────────────── */}
                <div className="bg-card rounded-xl p-6 border border-border space-y-4">
                    <h3 className="text-lg font-semibold">Capacity & Access</h3>

                    <FormField
                        control={form.control}
                        name="max_capacity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Max Capacity</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 500"
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="max_tickets_per_user"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Max Tickets Per User</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="max_guest_invites_per_user"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Max Guest Invites Per User</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="enable_waitlist"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                                <div>
                                    <FormLabel>Enable Waitlist</FormLabel>
                                    <FormDescription>
                                        Allow users to join waitlist when capacity is full
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                {/* ── Pricing & Tickets ───────────────────────── */}
                <div className="bg-card rounded-xl p-6 border border-border space-y-4">
                    <h3 className="text-lg font-semibold">Pricing</h3>

                    <FormField
                        control={form.control}
                        name="is_paid"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                                <div>
                                    <FormLabel>Paid Event</FormLabel>
                                    <FormDescription>
                                        Charge for event access with ticket tiers
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    {isPaid && (
                        <>
                            <FormField
                                control={form.control}
                                name="base_price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Base Price (INR)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min={0} step={1} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">Ticket Tiers</h4>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() =>
                                            append({
                                                name: "",
                                                quantity: 100,
                                                price: 0,
                                                max_per_user: 5,
                                                sort_order: fields.length,
                                            })
                                        }
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Tier
                                    </Button>
                                </div>

                                {fields.map((tier, index) => (
                                    <div
                                        key={tier.id}
                                        className="grid sm:grid-cols-4 gap-3 items-end p-4 rounded-lg border border-border"
                                    >
                                        <FormField
                                            control={form.control}
                                            name={`ticket_tiers.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. VIP" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`ticket_tiers.${index}.price`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Price</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min={0} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`ticket_tiers.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Quantity</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min={1} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}

                                {fields.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No ticket tiers added. Click &quot;Add Tier&quot; to create one.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Submit ──────────────────────────────────── */}
                <div className="flex items-center justify-end gap-3">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="gap-2 gradient-gold text-primary-foreground shadow-glow"
                    >
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
