"use client";

import { ArrowUp, Trash2, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    useWaitlist,
    usePromoteFromWaitlist,
    useBulkPromote,
    useRemoveFromWaitlist,
    type WaitlistEntry,
} from "@/hooks/use-waitlist";

export function WaitlistTab({ eventId }: { eventId: string }) {
    const { data, isLoading } = useWaitlist(eventId);
    const waitlist: WaitlistEntry[] = data?.entries ?? [];
    const promoteMutation = usePromoteFromWaitlist(eventId);
    const bulkPromoteMutation = useBulkPromote(eventId);
    const removeMutation = useRemoveFromWaitlist(eventId);

    const handlePromoteNext = () => {
        promoteMutation.mutate(undefined, {
            onSuccess: () => toast.success("Promoted next in line!"),
            onError: (err) => toast.error(err.message || "Failed to promote"),
        });
    };

    const handleBulkPromote = () => {
        bulkPromoteMutation.mutate(5, {
            onSuccess: () => toast.success("Promoted top 5!"),
            onError: (err) => toast.error(err.message || "Failed to promote"),
        });
    };

    const handleRemove = (waitlistId: string) => {
        removeMutation.mutate(waitlistId, {
            onSuccess: () => toast.success("Removed from waitlist"),
            onError: (err) => toast.error(err.message || "Failed to remove"),
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-2xl font-semibold">{waitlist.length}</p>
                        <p className="text-sm text-muted-foreground">People on waitlist</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handlePromoteNext}
                        disabled={promoteMutation.isPending || waitlist.length === 0}
                    >
                        <ArrowUp className="h-4 w-4" />
                        Promote Next
                    </Button>
                    <Button
                        className="gap-2 gradient-gold text-primary-foreground"
                        onClick={handleBulkPromote}
                        disabled={bulkPromoteMutation.isPending || waitlist.length === 0}
                    >
                        <ArrowUp className="h-4 w-4" />
                        Promote Top 5
                    </Button>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                <table className="min-w-[680px] w-full">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                Position
                            </th>
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                User
                            </th>
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                Joined
                            </th>
                            <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {waitlist.map((entry) => (
                            <tr key={entry.waitlist_id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-4 py-4">
                                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                                        {entry.position}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <div>
                                        <p className="font-medium">{entry.user_name || "User"}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {entry.user_email || entry.user_id}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-muted-foreground">
                                    {new Date(entry.joined_at).toLocaleDateString("en-IN")}
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => handleRemove(entry.waitlist_id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>

                {waitlist.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No one on the waitlist yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
