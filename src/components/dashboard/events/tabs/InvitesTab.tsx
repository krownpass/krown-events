"use client";

import { useState } from "react";
import { Link2, Copy, X, Loader2, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    useMySentInvites,
    useSendInvites,
    useRevokeInvite,
    useInviteStats,
    type Invite,
} from "@/hooks/use-invites";

const statusStyles: Record<string, string> = {
    PENDING: "bg-warning/10 text-warning",
    ACCEPTED: "bg-success/10 text-success",
    DECLINED: "bg-muted text-muted-foreground",
    REVOKED: "bg-destructive/10 text-destructive",
};

export function InvitesTab({ eventId }: { eventId: string }) {
    const [emailInput, setEmailInput] = useState("");

    const { data: invitesData, isLoading } = useMySentInvites(eventId);
    const invites = (invitesData ?? []) as Invite[];
    const { data: stats } = useInviteStats(eventId);
    const sendMutation = useSendInvites(eventId);
    const revokeMutation = useRevokeInvite(eventId);

    const handleSendInvites = () => {
        const emails = emailInput
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean);
        if (emails.length === 0) {
            toast.error("Enter at least one email address");
            return;
        }
        sendMutation.mutate(
            { emails },
            {
                onSuccess: () => {
                    toast.success(`Sent ${emails.length} invite(s)!`);
                    setEmailInput("");
                },
                onError: (err) => toast.error(err.message || "Failed to send invites"),
            }
        );
    };

    const handleRevoke = (inviteId: string) => {
        revokeMutation.mutate(inviteId, {
            onSuccess: () => toast.success("Invite revoked"),
            onError: (err) => toast.error(err.message || "Failed to revoke"),
        });
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success("Invite code copied!");
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
            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Total Sent", value: stats.total_sent },
                        { label: "Accepted", value: stats.accepted },
                        { label: "Pending", value: stats.pending },
                        { label: "Declined", value: stats.declined },
                    ].map((s) => (
                        <div key={s.label} className="bg-card rounded-xl p-4 border border-border">
                            <p className="text-sm text-muted-foreground">{s.label}</p>
                            <p className="text-2xl font-semibold">{s.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Send Invites */}
            <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold mb-4">Send Invites</h3>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Enter email addresses, separated by commas..."
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="pl-10"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSendInvites();
                            }}
                        />
                    </div>
                    <Button
                        className="gap-2 gradient-gold text-primary-foreground"
                        onClick={handleSendInvites}
                        disabled={sendMutation.isPending}
                    >
                        {sendMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Link2 className="h-4 w-4" />
                        )}
                        Send
                    </Button>
                </div>
            </div>

            {/* Invites Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                    <h3 className="font-semibold">Sent Invites</h3>
                </div>

                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                Email
                            </th>
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                Code
                            </th>
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                Status
                            </th>
                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                Sent At
                            </th>
                            <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {invites.map((invite) => (
                            <tr key={invite.invite_id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-4 py-4">
                                    <div>
                                        <p className="font-medium">
                                            {invite.invitee_name || invite.invited_email}
                                        </p>
                                        {invite.invitee_name && (
                                            <p className="text-xs text-muted-foreground">
                                                {invite.invited_email}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                        {invite.invite_code}
                                    </code>
                                </td>
                                <td className="px-4 py-4">
                                    <Badge
                                        className={cn(
                                            "capitalize",
                                            statusStyles[invite.status] ?? "bg-muted"
                                        )}
                                    >
                                        {invite.status}
                                    </Badge>
                                </td>
                                <td className="px-4 py-4 text-sm text-muted-foreground">
                                    {new Date(invite.sent_at).toLocaleDateString("en-IN")}
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleCopyCode(invite.invite_code)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        {invite.status === "PENDING" && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleRevoke(invite.invite_id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {invites.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No invites sent yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
