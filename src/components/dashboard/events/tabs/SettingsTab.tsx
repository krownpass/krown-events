"use client";

import { useState } from "react";
import { Globe, Key, MapPin, Ticket, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useUpdateEvent, type Event } from "@/hooks/use-events";

export function SettingsTab({ eventId, event }: { eventId: string; event: Event }) {
    const [enableWaitlist, setEnableWaitlist] = useState(event.enable_waitlist ?? true);
    const [requiresApproval, setRequiresApproval] = useState(event.requires_approval ?? false);
    const [maxTicketsPerUser, setMaxTicketsPerUser] = useState(
        String(event.max_tickets_per_user ?? 5)
    );

    const updateMutation = useUpdateEvent(eventId);

    const handleSave = () => {
        updateMutation.mutate(
            {
                enable_waitlist: enableWaitlist,
                requires_approval: requiresApproval,
                max_tickets_per_user: Number(maxTicketsPerUser) || 5,
            },
            {
                onSuccess: () => toast.success("Settings saved!"),
                onError: (err) => toast.error(err.message || "Failed to save settings"),
            }
        );
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl">
            {/* Event Info (read-only summary) */}
            <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-4">
                    <Globe className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Event Info</h3>
                </div>

                <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span className="font-medium capitalize">
                            {event.event_type.replace("_", " ").toLowerCase()}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium">{event.status}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Capacity</span>
                        <span className="font-medium">{event.total_capacity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Paid Event</span>
                        <span className="font-medium">{event.is_paid ? "Yes" : "No"}</span>
                    </div>
                </div>
            </div>

            {/* Access Settings */}
            <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-4">
                    <Key className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Access Settings</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Requires Approval</p>
                            <p className="text-sm text-muted-foreground">
                                Manually approve each registration
                            </p>
                        </div>
                        <Switch
                            checked={requiresApproval}
                            onCheckedChange={setRequiresApproval}
                        />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div>
                            <p className="font-medium">Enable Waitlist</p>
                            <p className="text-sm text-muted-foreground">
                                Allow users to join waitlist when full
                            </p>
                        </div>
                        <Switch
                            checked={enableWaitlist}
                            onCheckedChange={setEnableWaitlist}
                        />
                    </div>
                </div>
            </div>

            {/* Ticketing Settings */}
            <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-4">
                    <Ticket className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Ticketing Rules</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="max-tickets-per-user" className="text-sm font-medium mb-2 block">
                            Max tickets per user
                        </label>
                        <Input
                            id="max-tickets-per-user"
                            type="number"
                            value={maxTicketsPerUser}
                            onChange={(e) => setMaxTicketsPerUser(e.target.value)}
                            className="max-w-[200px]"
                            min={1}
                        />
                    </div>
                </div>
            </div>

            {/* Venue Info (read-only) */}
            {(event.venue_name || event.venue_city) && (
                <div className="bg-card rounded-xl p-6 border border-border">
                    <div className="flex items-center gap-3 mb-4">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Venue</h3>
                    </div>

                    <div className="space-y-2 text-sm">
                        {event.venue_name && (
                            <p className="font-medium">{event.venue_name}</p>
                        )}
                        {event.venue_address && (
                            <p className="text-muted-foreground">{event.venue_address}</p>
                        )}
                        {(event.venue_city || event.venue_state) && (
                            <p className="text-muted-foreground">
                                {[event.venue_city, event.venue_state].filter(Boolean).join(", ")}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    className="gap-2 gradient-gold text-primary-foreground"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                >
                    {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
