// app/admin/sidebar/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Calendar,
    Users,
    Send,
    BarChart3,
    QrCode,
    FileText,
    Building2,
    UserCog,
    CreditCard,
    Settings,
    Crown,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
    name: string;
    icon: React.ElementType;
    path: string;
}

interface SidebarProps {
    isMobileOpen: boolean;
    onClose: () => void;
}

const mainNav: NavItem[] = [
    { name: "Overview", icon: LayoutDashboard, path: "/admin" },
    { name: "Events", icon: Calendar, path: "/admin/events" },
    { name: "Audience", icon: Users, path: "/admin/audience" },
    { name: "Broadcasts", icon: Send, path: "/admin/broadcasts" },
    { name: "Analytics", icon: BarChart3, path: "/admin/analytics" },
];

const toolsNav: NavItem[] = [
    { name: "Check-in / Scanner", icon: QrCode, path: "/admin/check-in" },
    { name: "Templates", icon: FileText, path: "/admin/templates" },
];

const settingsNav: NavItem[] = [
    { name: "Organizer Profile", icon: Building2, path: "/admin/settings" },
    { name: "Team Access", icon: UserCog, path: "/admin/settings" },
    { name: "Payouts", icon: CreditCard, path: "/admin/settings" },
    { name: "Preferences", icon: Settings, path: "/admin/settings" },
];

function NavSection({
    title,
    items,
    onNavigate,
}: {
    title: string;
    items: NavItem[];
    onNavigate: () => void;
}) {
    const pathname = usePathname();

    return (
        <div className="mb-6">
            <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
            </h3>
            <nav className="space-y-1">
                {items.map((item) => {
                    const isActive =
                        pathname === item.path ||
                        (item.path !== "/admin" && pathname.startsWith(item.path));

                    return (
                        <Link
                            key={item.name}
                            href={item.path}
                            onClick={onNavigate}
                            className={cn(
                                "group mx-2 flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-200 hover:bg-accent",
                                isActive && "bg-primary/10 text-primary"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "h-5 w-5 flex-shrink-0 transition-colors",
                                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                )}
                            />
                            <span
                                className={cn(
                                    "text-sm font-medium transition-colors",
                                    isActive ? "text-primary" : "text-sidebar-foreground group-hover:text-foreground"
                                )}
                            >
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

export function Sidebar({ isMobileOpen, onClose }: SidebarProps) {
    return (
        <>
            <div
                onClick={onClose}
                className={cn(
                    "fixed inset-0 z-30 bg-black/50 transition-opacity lg:hidden",
                    isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
                )}
                aria-hidden={!isMobileOpen}
            />

            <aside
                className={cn(
                    "fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar transition-transform duration-300",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-gold shadow-glow">
                            <Crown className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="text-lg font-semibold text-gradient-gold">Krown</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 transition-colors hover:bg-accent lg:hidden"
                        aria-label="Close navigation"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>

                <div className="h-[calc(100vh-4rem)] overflow-y-auto py-4">
                    <NavSection title="Main" items={mainNav} onNavigate={onClose} />
                    <NavSection title="Tools" items={toolsNav} onNavigate={onClose} />
                    <NavSection title="Settings" items={settingsNav} onNavigate={onClose} />
                </div>
            </aside>
        </>
    );
}
