"use client";

import { use, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EventHeader } from "@/components/dashboard/events/EventHeader";
import { OverviewTab } from "@/components/dashboard/events/tabs/OverviewTab";
import { RegistrationsTab } from "@/components/dashboard/events/tabs/RegistrationsTabs";
import { WaitlistTab } from "@/components/dashboard/events/tabs/WaitlistTab";
import { InviteLinksTab } from "@/components/dashboard/events/tabs/InvitesTab";
import { TicketsTab } from "@/components/dashboard/events/tabs/TicketsTab";
import { BroadcastTab } from "@/components/dashboard/events/tabs/BroadCastTab";
import { AnalyticsTab } from "@/components/dashboard/events/tabs/AnalyticsTab";
import { SettingsTab } from "@/components/dashboard/events/tabs/SettingsTab";
import { useEvent, type Event } from "@/hooks";
import { useWebSocketContext } from "@/providers/websocket-provider";
import { CheckInScannerTab } from "@/components/dashboard/events/tabs/CheckInScannerTab";

export default function EventDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { data, isLoading, error } = useEvent(id);
    const event = data as Event | undefined;
    const { send, isConnected } = useWebSocketContext();

    // Join WebSocket room for real-time updates (seats, waitlist, etc.)
    useEffect(() => {
        if (isConnected && id) {
            send({ type: "JOIN_ROOM", event_id: id });
            return () => {
                send({ type: "LEAVE_ROOM", event_id: id });
            };
        }
    }, [isConnected, id, send]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="text-center py-24">
                <p className="text-destructive mb-4">
                    {error ? "Failed to load event" : "Event not found"}
                </p>
                <Button asChild>
                    <Link href="/admin/events">Back to Events</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <EventHeader event={event} />

            <Tabs defaultValue="overview" className="w-full">
                <div className="mb-6 overflow-x-auto">
                    <TabsList className="inline-flex min-w-max justify-start rounded-none border-b border-border bg-transparent p-0">
                        {[
                            "Overview",
                            "Check-in",
                            "Registrations",
                            "Waitlist",
                            "Invites",
                            "Tickets",
                            "Broadcast",
                            "Analytics",
                            "Settings",
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab.toLowerCase()}
                                className="shrink-0 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                            >
                                {tab}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value="overview">
                    <OverviewTab eventId={event.event_id} event={event} />
                </TabsContent>

                <TabsContent value="check-in">
                    <CheckInScannerTab eventId={event.event_id} />
                </TabsContent>

                <TabsContent value="registrations">
                    <RegistrationsTab eventId={event.event_id} />
                </TabsContent>

                <TabsContent value="waitlist">
                    <WaitlistTab eventId={event.event_id} />
                </TabsContent>

                <TabsContent value="invites">
                    <InviteLinksTab eventId={event.event_id} />
                </TabsContent>

                <TabsContent value="tickets">
                    <TicketsTab eventId={event.event_id} event={event} />
                </TabsContent>

                <TabsContent value="broadcast">
                    <BroadcastTab eventId={event.event_id} />
                </TabsContent>

                <TabsContent value="analytics">
                    <AnalyticsTab eventId={event.event_id} />
                </TabsContent>

                <TabsContent value="settings">
                    <SettingsTab eventId={event.event_id} event={event} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
