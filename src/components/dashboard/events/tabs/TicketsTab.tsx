"use client";

import { Ticket, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useSeatUtilization, type SeatUtilization } from "@/hooks/use-admin";
import type { Event, TicketTier } from "@/hooks/use-events";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

export function TicketsTab({ eventId, event }: { eventId: string; event: Event }) {
    const tiers: TicketTier[] = event.tiers ?? [];
    const isConcert = event.event_type === "CONCERT";
    const { data: seatUtilData, isLoading: seatsLoading } = useSeatUtilization(
        isConcert ? eventId : null
    );
    const seatUtil = (seatUtilData ?? []) as SeatUtilization[];

    if (!event.is_paid) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-card rounded-xl p-6 border border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Ticket className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Paid Tickets</p>
                                <p className="text-sm text-muted-foreground">
                                    This event is configured as free RSVP
                                </p>
                            </div>
                        </div>
                        <Switch checked={false} disabled />
                    </div>
                </div>

                <div className="text-center py-12 text-muted-foreground">
                    <Ticket className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">This is a free RSVP event</p>
                    <p className="text-sm">
                        Edit the event to enable paid ticketing
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Ticket className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">Paid Tickets Enabled</p>
                            <p className="text-sm text-muted-foreground">
                                {tiers.length} tier{tiers.length !== 1 ? "s" : ""} configured
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-success">
                        Active
                    </Badge>
                </div>
            </div>

            {/* Ticket Tiers */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                    <h3 className="font-semibold">Ticket Tiers</h3>
                </div>

                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                Tier Name
                            </th>
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                Price
                            </th>
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                Capacity
                            </th>
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                Description
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {tiers.map((tier) => (
                            <tr key={tier.tier_id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-4 py-4 font-medium">{tier.tier_name}</td>
                                <td className="px-4 py-4 font-semibold">
                                    {tier.price > 0 ? formatCurrency(tier.price) : "Free"}
                                </td>
                                <td className="px-4 py-4 text-sm">{tier.capacity}</td>
                                <td className="px-4 py-4 text-sm text-muted-foreground">
                                    {tier.tier_description || "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {tiers.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No ticket tiers configured</p>
                        <p className="text-sm">Edit the event to add ticket tiers</p>
                    </div>
                )}
            </div>

            {/* Concert Seat Utilization */}
            {isConcert && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <h3 className="font-semibold">Seat Utilization</h3>
                    </div>

                    {seatsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                        Tier
                                    </th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                        Total
                                    </th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                        Available
                                    </th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                        Locked
                                    </th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                        Booked
                                    </th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                        Utilization
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {seatUtil.map((s) => (
                                    <tr key={s.tier_id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-4 font-medium">{s.tier_name}</td>
                                        <td className="px-4 py-4 text-sm">{s.total_seats}</td>
                                        <td className="px-4 py-4 text-sm text-success">{s.available}</td>
                                        <td className="px-4 py-4 text-sm text-warning">{s.locked}</td>
                                        <td className="px-4 py-4 text-sm">{s.booked}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full",
                                                            s.utilization_rate >= 90
                                                                ? "bg-destructive"
                                                                : s.utilization_rate >= 70
                                                                  ? "bg-warning"
                                                                  : "bg-success"
                                                        )}
                                                        style={{ width: `${s.utilization_rate}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm">
                                                    {Math.round(s.utilization_rate)}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {!seatsLoading && seatUtil.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No seat data available</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
