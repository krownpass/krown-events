
import { BarChart3, Users, TrendingUp, DollarSign, Calendar, Send } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockStats, mockEvents } from '@/components/data/mockdata';


export default function Analytics() {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const totalRevenue = mockEvents.reduce((acc, e) => acc + e.revenue, 0);
    const totalAttendees = mockEvents.reduce((acc, e) => acc + e.confirmed, 0);

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold mb-1">Analytics</h1>
                <p className="text-muted-foreground">Track your performance across all events</p>
            </div>

            {/* Top Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl p-5 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Total Events</span>
                    </div>
                    <p className="text-2xl font-semibold">{mockStats.totalEvents}</p>
                </div>
                <div className="bg-card rounded-xl p-5 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">Total Attendees</span>
                    </div>
                    <p className="text-2xl font-semibold">{totalAttendees.toLocaleString()}</p>
                </div>
                <div className="bg-card rounded-xl p-5 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm">Total Revenue</span>
                    </div>
                    <p className="text-2xl font-semibold text-gradient-gold">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="bg-card rounded-xl p-5 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Avg. Fill Rate</span>
                    </div>
                    <p className="text-2xl font-semibold text-success">78%</p>
                </div>
            </div>

            <Tabs defaultValue="events">
                <TabsList>
                    <TabsTrigger value="events">Events Performance</TabsTrigger>
                    <TabsTrigger value="audience">Audience Growth</TabsTrigger>
                    <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                </TabsList>

                <TabsContent value="events" className="mt-6">
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <h3 className="font-semibold">Event Performance</h3>
                        </div>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Event</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Views</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Registrations</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Fill Rate</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {mockEvents.map((event) => (
                                    <tr key={event.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-4 font-medium">{event.name}</td>
                                        <td className="px-4 py-4">{event.views.toLocaleString()}</td>
                                        <td className="px-4 py-4">{event.confirmed}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full"
                                                        style={{ width: `${(event.confirmed / event.capacity) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm">{Math.round((event.confirmed / event.capacity) * 100)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 font-medium text-success">
                                            {event.revenue > 0 ? formatCurrency(event.revenue) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>

                <TabsContent value="audience" className="mt-6">
                    <div className="bg-card rounded-xl p-6 border border-border">
                        <h3 className="font-semibold mb-4">Audience Growth</h3>
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>Audience growth chart will appear here</p>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="broadcasts" className="mt-6">
                    <div className="bg-card rounded-xl p-6 border border-border">
                        <h3 className="font-semibold mb-4">Broadcast Performance</h3>
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <Send className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>Broadcast analytics will appear here</p>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="revenue" className="mt-6">
                    <div className="bg-card rounded-xl p-6 border border-border">
                        <h3 className="font-semibold mb-4">Revenue Dashboard</h3>
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>Revenue dashboard will appear here</p>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
