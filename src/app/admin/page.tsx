
// app/admin/page.tsx    ← this is your dashboard / overview page
'use client';

import { useRouter } from 'next/navigation';
import { Users, Calendar, UserCheck, Wallet } from 'lucide-react';
import { ActionCenter } from '@/components/dashboard/ActionCenter';
import { UpcomingEventsTable } from '@/components/dashboard/UpcomingEventsTable';
import { EngagementSnapshot } from '@/components/dashboard/EngagementSnapshot';
import { StatCard } from '@/components/dashboard/StatsCards';
import {
    mockEvents,
    mockStats,
    mockUrgentTasks,
} from '@/components/data/mockdata';

export default function DashboardPage() {
    const router = useRouter();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const upcomingEvents = mockEvents.filter((e) => e.status !== 'completed');

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold mb-1">Welcome back, Krown Events</h1>
                <p className="text-muted-foreground">
                    Here's what's happening with your events
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Followers"
                    value={mockStats.followers.toLocaleString()}
                    change={`+${mockStats.followersGrowth} this week`}
                    changeType="positive"
                    icon={Users}
                    ctaText="View Audience"
                    onCtaClick={() => router.push('/admin/audience')}
                />
                <StatCard
                    title="Upcoming Events"
                    value={mockStats.upcomingEvents}
                    subtitle={`Next: ${mockStats.nextEventName}`}
                    icon={Calendar}
                    ctaText="View Events"
                    onCtaClick={() => router.push('/admin/events')}
                />
                <StatCard
                    title="Registrations This Week"
                    value={mockStats.registrationsThisWeek}
                    change="+23%"
                    changeType="positive"
                    icon={UserCheck}
                    ctaText="Analytics"
                    onCtaClick={() => router.push('/admin/analytics')}
                />
                <StatCard
                    title="Revenue This Week"
                    value={formatCurrency(mockStats.revenueThisWeek)}
                    change="+18%"
                    changeType="positive"
                    icon={Wallet}
                    ctaText="Revenue"
                    onCtaClick={() => router.push('/admin/analytics')}
                />
            </div>

            {/* Action Center + Engagement */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ActionCenter tasks={mockUrgentTasks} />
                </div>
                <div>
                    <EngagementSnapshot
                        data={{
                            views: 4521,
                            registrations: 892,
                            broadcasts: 12,
                            conversionRate: 19.7,
                        }}
                    />
                </div>
            </div>

            {/* Upcoming Events Table */}
            <UpcomingEventsTable events={upcomingEvents} />
        </div>
    );
}
