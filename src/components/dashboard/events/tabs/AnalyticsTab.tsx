"use client";

import { UserPlus, UserCheck, Users, TrendingUp, Ticket, DollarSign, Loader2 } from "lucide-react";
import {
    useEventDashboard,
    useEventPerformance,
    type EventDashboard,
} from "@/hooks/use-admin";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

export function AnalyticsTab({ eventId }: { eventId: string }) {
    const { data: dashboardData, isLoading: dashLoading } = useEventDashboard(eventId);
    const dashboard = dashboardData as EventDashboard | undefined;
    const { data: perfData, isLoading: perfLoading } = useEventPerformance(eventId);
    const performance = perfData as {
        registration_timeline: Array<{ date: string; count: number }>;
        revenue_timeline: Array<{ date: string; amount: number }>;
        tier_distribution: Array<{ tier_name: string; count: number; revenue: number }>;
        peak_registration_time: string;
        average_ticket_price: number;
    } | undefined;

    if (dashLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const regStats = dashboard?.registration_stats;
    const revStats = dashboard?.revenue_stats;

    const funnelData = [
        { label: "Registrations", value: regStats?.total ?? 0, icon: UserPlus, color: "bg-primary" },
        { label: "Confirmed", value: regStats?.confirmed ?? 0, icon: UserCheck, color: "bg-success" },
        { label: "Checked In", value: regStats?.checked_in ?? 0, icon: Users, color: "bg-info" },
    ];

    const maxFunnelValue = Math.max(...funnelData.map((d) => d.value), 1);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Funnel */}
            <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>

                <div className="flex items-end justify-between gap-4">
                    {funnelData.map((item, index) => {
                        const height = (item.value / maxFunnelValue) * 100;

                        return (
                            <div key={item.label} className="flex-1 text-center">
                                <div className="h-40 flex flex-col justify-end mb-3">
                                    <div
                                        className={`${item.color} rounded-t-lg transition-all duration-500`}
                                        style={{ height: `${Math.max(height, 5)}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                                    <item.icon className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-medium">{item.label}</p>
                                <p className="text-lg font-semibold">{item.value.toLocaleString()}</p>
                                {index > 0 && funnelData[index - 1].value > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        {((item.value / funnelData[index - 1].value) * 100).toFixed(1)}%
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Revenue Overview */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl p-6 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm">Total Revenue</span>
                    </div>
                    <p className="text-3xl font-bold text-gradient-gold">
                        {formatCurrency(revStats?.total_revenue ?? 0)}
                    </p>
                    {revStats && revStats.refunded > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(revStats.refunded)} refunded
                        </p>
                    )}
                </div>

                <div className="bg-card rounded-xl p-6 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Ticket className="h-4 w-4" />
                        <span className="text-sm">Total Registrations</span>
                    </div>
                    <p className="text-3xl font-bold">{regStats?.total ?? 0}</p>
                    {regStats && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {regStats.attendance_rate > 0
                                ? `${Math.round(regStats.attendance_rate)}% attendance rate`
                                : `${regStats.pending} pending`}
                        </p>
                    )}
                </div>

                <div className="bg-card rounded-xl p-6 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Avg. Ticket Price</span>
                    </div>
                    <p className="text-3xl font-bold">
                        {formatCurrency(performance?.average_ticket_price ?? 0)}
                    </p>
                    {performance?.peak_registration_time && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Peak: {new Date(performance.peak_registration_time).toLocaleDateString("en-IN")}
                        </p>
                    )}
                </div>
            </div>

            {/* Tier Performance */}
            {performance?.tier_distribution && performance.tier_distribution.length > 0 && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <h3 className="font-semibold">Tier Performance</h3>
                    </div>

                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Tier
                                </th>
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Count
                                </th>
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Revenue
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {performance.tier_distribution.map((tier) => (
                                <tr key={tier.tier_name} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-4 py-4 font-medium">{tier.tier_name}</td>
                                    <td className="px-4 py-4">{tier.count}</td>
                                    <td className="px-4 py-4 font-medium text-success">
                                        {formatCurrency(tier.revenue)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Waitlist & Invite Stats */}
            <div className="grid md:grid-cols-2 gap-6">
                {dashboard?.waitlist_stats && (
                    <div className="bg-card rounded-xl p-6 border border-border">
                        <h3 className="font-semibold mb-4">Waitlist Stats</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Total on waitlist</span>
                                <span className="font-medium">{dashboard.waitlist_stats.total}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Promoted</span>
                                <span className="font-medium text-success">
                                    {dashboard.waitlist_stats.promoted}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {dashboard?.invite_stats && (
                    <div className="bg-card rounded-xl p-6 border border-border">
                        <h3 className="font-semibold mb-4">Invite Stats</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Total sent</span>
                                <span className="font-medium">{dashboard.invite_stats.total_sent}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Accepted</span>
                                <span className="font-medium text-success">
                                    {dashboard.invite_stats.accepted}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Pending</span>
                                <span className="font-medium text-warning">
                                    {dashboard.invite_stats.pending}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {perfLoading && (
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading performance data...</span>
                </div>
            )}
        </div>
    );
}
