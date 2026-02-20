"use client";

import { Eye, UserCheck, Users, Wallet, Clock, Bell, ExternalLink, Ticket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEventDashboard, type EventDashboard } from "@/hooks/use-admin";
import type { Event } from "@/hooks/use-events";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function OverviewTab({ eventId, event }: { eventId: string; event: Event }) {
    const { data: dashboard, isLoading } = useEventDashboard(eventId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const stats = dashboard as EventDashboard | undefined;
    const eventCapacity = event.max_capacity ?? event.total_capacity ?? 0;

    const summaryCards = [
        {
            label: "Registrations",
            value: stats?.registration_stats?.total ?? 0,
            icon: UserCheck,
        },
        {
            label: "Confirmed",
            value: stats?.registration_stats?.confirmed ?? 0,
            icon: Users,
        },
        {
            label: "Revenue",
            value: formatCurrency(stats?.revenue_stats?.total_revenue ?? 0),
            icon: Wallet,
        },
        {
            label: "Capacity",
            value: `${stats?.capacity_stats?.sold ?? 0}/${stats?.capacity_stats?.total_capacity ?? eventCapacity}`,
            icon: Eye,
        },
    ];

    const timelineItems = [
        {
            label: "Event Created",
            time: formatDate(event.created_at),
            completed: true,
        },
        {
            label: "Event Start",
            time: formatDate(event.start_time),
            completed: new Date(event.start_time) <= new Date(),
        },
        {
            label: "Event End",
            time: formatDate(event.end_time),
            completed: new Date(event.end_time) <= new Date(),
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card) => (
                    <div key={card.label} className="bg-card rounded-xl p-4 border border-border">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <card.icon className="h-4 w-4" />
                            <span className="text-sm">{card.label}</span>
                        </div>
                        <p className="text-2xl font-semibold">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Event Timeline */}
                <div className="bg-card rounded-xl p-6 border border-border">
                    <h3 className="text-lg font-semibold mb-4">Event Timeline</h3>
                    <div className="space-y-4">
                        {timelineItems.map((item, index) => (
                            <div key={item.label} className="flex items-start gap-3">
                                <div className="relative">
                                    <div
                                        className={`w-3 h-3 rounded-full mt-1.5 ${
                                            item.completed ? "bg-success" : "bg-muted-foreground/30"
                                        }`}
                                    />
                                    {index < timelineItems.length - 1 && (
                                        <div className="absolute top-4 left-1.5 w-px h-8 bg-border" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium">{item.label}</p>
                                    <p className="text-sm text-muted-foreground">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 mt-6 pt-4 border-t border-border">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Clock className="h-4 w-4" />
                            Edit Reveal Time
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Bell className="h-4 w-4" />
                            Send Reminder
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Preview
                        </Button>
                    </div>
                </div>

                {/* Ticket / Capacity Widget */}
                {event.is_paid && stats?.capacity_stats && (
                    <div className="bg-card rounded-xl p-6 border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Capacity Overview</h3>
                            <Ticket className="h-5 w-5 text-primary" />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="font-medium">Overall Utilization</span>
                                    <span className="text-muted-foreground">
                                        {Math.round(stats.capacity_stats.utilization_rate ?? 0)}%
                                    </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all"
                                        style={{
                                            width: `${stats.capacity_stats.utilization_rate ?? 0}%`,
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stats.capacity_stats.sold} / {stats.capacity_stats.total_capacity} sold
                                    ({stats.capacity_stats.available} available)
                                </p>
                            </div>

                            {stats.waitlist_stats && stats.waitlist_stats.total > 0 && (
                                <div className="pt-4 border-t border-border">
                                    <p className="text-sm text-muted-foreground">
                                        Waitlist: {stats.waitlist_stats.total} waiting,{" "}
                                        {stats.waitlist_stats.promoted} promoted
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
