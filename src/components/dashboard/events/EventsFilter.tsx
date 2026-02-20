
import { Search, LayoutGrid, List, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface EventFiltersProps {
    view: 'grid' | 'table';
    onViewChange: (view: 'grid' | 'table') => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    statusFilter: string;
    onStatusChange: (status: string) => void;
    typeFilter: string;
    onTypeChange: (type: string) => void;
}

export function EventFilters({
    view,
    onViewChange,
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    typeFilter,
    onTypeChange,
}: EventFiltersProps) {
    return (
        <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                />
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end md:gap-3">
                <Select value={statusFilter} onValueChange={onStatusChange}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                        <SelectItem value="LIVE">Live</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={onTypeChange}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="CONCERT">Concert</SelectItem>
                        <SelectItem value="INVITE_ONLY">Invite Only</SelectItem>
                        <SelectItem value="MEMBERS_ONLY">Members Only</SelectItem>
                        <SelectItem value="KROWN_EXCLUSIVE">Krown Exclusive</SelectItem>
                    </SelectContent>
                </Select>

                <Button variant="outline" size="icon" className="shrink-0" aria-label="Advanced filters">
                    <Filter className="h-4 w-4" />
                </Button>

                <div className="flex items-center rounded-lg bg-muted p-1">
                    <button
                        onClick={() => onViewChange('grid')}
                        className={cn(
                            'rounded-md p-2 transition-colors',
                            view === 'grid' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                        )}
                        aria-label="Grid view"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onViewChange('table')}
                        className={cn(
                            'rounded-md p-2 transition-colors',
                            view === 'table' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                        )}
                        aria-label="Table view"
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
