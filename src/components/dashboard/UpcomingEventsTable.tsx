"use client";

import Link from "next/link";
import Image from "next/image";
import { MoreHorizontal, ExternalLink, Copy, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { Event } from "../data/mockdata";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    scheduled: "bg-info/10 text-info",
    live: "bg-success/10 text-success",
    locked: "bg-warning/10 text-warning",
    completed: "bg-secondary text-secondary-foreground",
};

export function UpcomingEventsTable({ events }: { events: Event[] }) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="bg-card rounded-xl border overflow-hidden">
            <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Upcoming Events</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b">
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Event
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Date/Time
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Confirmed / Capacity
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Waitlist
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Revenue
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                        {events.map((event) => (
                            <tr
                                key={event.id}
                                className="hover:bg-muted/50 transition-colors"
                            >
                                {/* Event */}
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <Image
                                            src={event.coverImage}
                                            alt={event.name}
                                            width={48}
                                            height={48}
                                            className="rounded-lg object-cover"
                                        />
                                        <div>
                                            <Link
                                                href={`/events/${event.id}`}
                                                className="font-medium hover:text-primary transition-colors"
                                            >
                                                {event.name}
                                            </Link>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {event.type}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                {/* Date / Time */}
                                <td className="px-4 py-4">
                                    <div className="text-sm">{event.date}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {event.time}
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="px-4 py-4">
                                    <Badge
                                        className={cn(
                                            "capitalize",
                                            statusStyles[event.status]
                                        )}
                                    >
                                        {event.status}
                                    </Badge>
                                </td>

                                {/* Capacity */}
                                <td className="px-4 py-4">
                                    <div className="text-sm font-medium">
                                        {event.confirmed} / {event.capacity}
                                    </div>
                                    <div className="mt-1 h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all"
                                            style={{
                                                width: `${(event.confirmed / event.capacity) * 100
                                                    }%`,
                                            }}
                                        />
                                    </div>
                                </td>

                                {/* Waitlist */}
                                <td className="px-4 py-4 text-sm">
                                    {event.waitlist > 0 ? (
                                        <span className="text-warning">
                                            {event.waitlist}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </td>

                                {/* Revenue */}
                                <td className="px-4 py-4 text-sm font-medium">
                                    {event.revenue > 0
                                        ? formatCurrency(event.revenue)
                                        : "—"}
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/events/${event.id}`}>
                                                <ExternalLink className="h-4 w-4" />
                                            </Link>
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    Open
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Duplicate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Share2 className="mr-2 h-4 w-4" />
                                                    Share
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
