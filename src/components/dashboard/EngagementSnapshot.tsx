import { Eye, UserCheck, Send, TrendingUp } from 'lucide-react';

interface EngagementData {
    views: number;
    registrations: number;
    broadcasts: number;
    conversionRate: number;
}

export function EngagementSnapshot({ data }: { data: EngagementData }) {
    const metrics = [
        { label: 'Total Views', value: data.views.toLocaleString(), icon: Eye, change: '+12%' },
        { label: 'Registrations', value: data.registrations.toLocaleString(), icon: UserCheck, change: '+8%' },
        { label: 'Broadcasts Sent', value: data.broadcasts.toString(), icon: Send, change: '+3' },
        { label: 'Conversion', value: `${data.conversionRate}%`, icon: TrendingUp, change: '+2.1%' },
    ];

    return (
        <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4">Engagement Snapshot</h3>

            <div className="grid grid-cols-2 gap-4">
                {metrics.map((metric) => (
                    <div key={metric.label} className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                            <metric.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{metric.label}</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-xl font-semibold">{metric.value}</span>
                            <span className="text-xs text-success">{metric.change}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
