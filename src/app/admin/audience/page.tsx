
import { Users, UserCheck, Repeat, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockStats } from '@/components/data/mockdata';
import { StatCard } from '@/components/dashboard/StatsCards';

const segments = [
    { name: 'Followers', count: 12450, icon: Users, color: 'text-primary' },
    { name: 'Members', count: 3420, icon: UserCheck, color: 'text-success' },
    { name: 'Attended 3+', count: 892, icon: Repeat, color: 'text-info' },
    { name: 'On Waitlist', count: 156, icon: Clock, color: 'text-warning' },
    { name: 'Active (30d)', count: 4521, icon: Users, color: 'text-primary' },
];

export default function Audience() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Audience</h1>
                    <p className="text-muted-foreground">Manage your followers and attendees</p>
                </div>
                <Button className="gap-2 gradient-gold text-primary-foreground shadow-glow">
                    <Send className="h-4 w-4" />
                    Send Broadcast
                </Button>
            </div>

            {/* Summary Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
                <StatCard
                    title="Total Followers"
                    value={mockStats.followers.toLocaleString()}
                    change={`+${mockStats.followersGrowth} this week`}
                    changeType="positive"
                    icon={Users}
                />
                <StatCard
                    title="Members"
                    value="3,420"
                    subtitle="Attended at least once"
                    icon={UserCheck}
                />
                <StatCard
                    title="Repeat Attendees"
                    value={mockStats.repeatAttendees.toLocaleString()}
                    change="+15%"
                    changeType="positive"
                    icon={Repeat}
                />
            </div>

            {/* Segments */}
            <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold mb-4">Audience Segments</h3>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {segments.map((segment) => (
                        <div
                            key={segment.name}
                            className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-background ${segment.color}`}>
                                        <segment.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{segment.name}</p>
                                        <p className="text-2xl font-semibold">{segment.count.toLocaleString()}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Placeholder for audience list */}
            <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>Audience activity will appear here</p>
                </div>
            </div>
        </div>
    );
}
