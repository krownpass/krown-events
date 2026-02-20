import {
    AlertCircle,
    Clock,
    MapPin,
    Ticket,
    Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UrgentTask {
    id: string;
    type: string;
    message: string;
    action: string;
}

const iconMap: Record<string, React.ElementType> = {
    approval: AlertCircle,
    waitlist: Clock,
    reveal: MapPin,
    ticket: Ticket,
    schedule: Calendar,
};

const colorMap: Record<string, string> = {
    approval: 'text-warning bg-warning/10',
    waitlist: 'text-info bg-info/10',
    reveal: 'text-primary bg-primary/10',
    ticket: 'text-destructive bg-destructive/10',
    schedule: 'text-success bg-success/10',
};

export function ActionCenter({ tasks }: { tasks: UrgentTask[] }) {
    if (tasks.length === 0) {
        return (
            <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold mb-4">Action Center</h3>
                <div className="text-center py-8 text-muted-foreground">
                    <p>All caught up! No urgent tasks.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Action Center</h3>
                <span className="text-xs font-medium text-muted-foreground px-2 py-1 bg-muted rounded-full">
                    {tasks.length} tasks
                </span>
            </div>

            <div className="space-y-3">
                {tasks.map((task) => {
                    const Icon = iconMap[task.type] || AlertCircle;
                    const colors = colorMap[task.type] || 'text-muted-foreground bg-muted';

                    return (
                        <div
                            key={task.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-fade-in"
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn('p-2 rounded-lg', colors)}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-medium">{task.message}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                                {task.action}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
