import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: LucideIcon;
    ctaText?: string;
    onCtaClick?: () => void;
}

export function StatCard({
    title,
    value,
    subtitle,
    change,
    changeType = 'neutral',
    icon: Icon,
    ctaText,
    onCtaClick,
}: StatCardProps) {
    return (
        <div className="bg-card rounded-xl p-5 border border-border hover:border-primary/30 transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
                {change && (
                    <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        changeType === 'positive' && 'bg-success/10 text-success',
                        changeType === 'negative' && 'bg-destructive/10 text-destructive',
                        changeType === 'neutral' && 'bg-muted text-muted-foreground'
                    )}>
                        {change}
                    </span>
                )}
            </div>

            <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="text-2xl font-semibold tracking-tight">{value}</p>
                {subtitle && (
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                )}
            </div>

            {ctaText && (
                <button
                    onClick={onCtaClick}
                    className="mt-4 text-sm text-primary font-medium hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    {ctaText} →
                </button>
            )}
        </div>
    );
}
