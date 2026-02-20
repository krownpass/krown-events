// app/admin/topbar/TopBar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Menu,
    Search,
    Plus,
    Send,
    Bell,
    HelpCircle,
    ChevronDown,
    User,
    Settings,
    LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';

const nameMap: Record<string, string> = {
    admin: 'Overview',
    events: 'Events',
    audience: 'Audience',
    broadcasts: 'Broadcasts',
    analytics: 'Analytics',
    'check-in': 'Check-in / Scanner',
    templates: 'Templates',
    settings: 'Settings',
    profile: 'Organizer Profile',
    team: 'Team Access',
    payouts: 'Payouts',
    preferences: 'Preferences',
};

function getBreadcrumbs(pathname: string) {
    const paths = pathname.split('/').filter(Boolean);
    if (paths.length <= 1) return [{ name: 'Overview', path: '/admin' }]; // root admin

    const breadcrumbs = [];
    let currentPath = '';

    for (const segment of paths) {
        currentPath += `/${segment}`;
        breadcrumbs.push({
            name: nameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
            path: currentPath,
        });
    }

    return breadcrumbs;
}

interface TopBarProps {
    onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
    const [searchFocused, setSearchFocused] = useState(false);
    const pathname = usePathname();
    const breadcrumbs = getBreadcrumbs(pathname);
    const { logout } = useAuth();

    const currentPage = breadcrumbs[breadcrumbs.length - 1];

    return (
        <header
            className={cn(
                'fixed top-0 right-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-xl transition-all duration-300',
                'left-0 lg:left-64'
            )}
        >
            <div className="flex h-full items-center justify-between px-3 sm:px-4 lg:px-6">
                <div className="flex min-w-0 items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onMenuClick}
                        className="lg:hidden"
                        aria-label="Open navigation"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    <div className="md:hidden">
                        <p className="max-w-[140px] truncate text-sm font-semibold">{currentPage?.name}</p>
                    </div>

                    <div className="hidden items-center gap-2 md:flex">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={crumb.path} className="flex items-center gap-2">
                            {index > 0 && <span className="text-muted-foreground">›</span>}
                            <Link
                                href={crumb.path}
                                className={cn(
                                    'text-sm transition-colors',
                                    index === breadcrumbs.length - 1
                                        ? 'text-foreground font-medium'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {crumb.name}
                            </Link>
                        </div>
                    ))}
                    </div>
                </div>

                <div
                    className={cn(
                        'mx-4 hidden flex-1 max-w-sm transition-all duration-200 lg:block',
                        searchFocused && 'max-w-lg'
                    )}
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search events, users, tickets..."
                            className="pl-10 bg-muted/50 border-transparent focus:border-primary/50 focus:bg-muted"
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    <Link href="/admin/events/new">
                        <Button
                            size="sm"
                            className="gap-2 gradient-gold text-primary-foreground shadow-glow hover:opacity-90"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Create Event</span>
                        </Button>
                    </Link>

                    <Button variant="outline" size="sm" className="hidden gap-2 sm:inline-flex">
                        <Send className="h-4 w-4" />
                        Broadcast
                    </Button>

                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                    </Button>

                    <Button variant="ghost" size="icon" className="hidden md:inline-flex">
                        <HelpCircle className="h-5 w-5" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="ml-1 gap-2 sm:ml-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary-foreground">KE</span>
                                </div>
                                <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem>
                                <User className="h-4 w-4 mr-2" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => void logout()}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
