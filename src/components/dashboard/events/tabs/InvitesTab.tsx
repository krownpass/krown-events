"use client";

// components/dashboard/events/tabs/InviteLinksTab.tsx
// Organizer-facing tab: generate links, view usage, revoke, see invite tree

import { useState } from "react";
import { Copy, Link2, Trash2, Users, ChevronDown, ChevronRight, Plus, RefreshCw, TreePine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    useInviteLinks,
    useGenerateInviteLink,
    useRevokeInviteLink,
    useInviteTree,
    type InviteLink,
    type InviteTreeNode,
} from "@/hooks/use-invite-links";

// ================================================================
// STATUS BADGE
// ================================================================

const StatusBadge = ({ status }: { status: InviteLink["status"] }) => {
    const map = {
        ACTIVE: { label: "Active", class: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20" },
        EXHAUSTED: { label: "Full", class: "bg-amber-500/15 text-amber-600 border-amber-500/20" },
        REVOKED: { label: "Revoked", class: "bg-red-500/15 text-red-600 border-red-500/20" },
        EXPIRED: { label: "Expired", class: "bg-zinc-500/15 text-zinc-500 border-zinc-500/20" },
    };
    const s = map[status];
    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${s.class}`}>
            {s.label}
        </span>
    );
};

// ================================================================
// GENERATE LINK DIALOG
// ================================================================

const GenerateLinkDialog = ({ eventId }: { eventId: string }) => {
    const [open, setOpen] = useState(false);
    const [maxUses, setMaxUses] = useState("10");
    const [expiresAt, setExpiresAt] = useState("");
    const generate = useGenerateInviteLink(eventId);

    const handleGenerate = () => {
        const parsed = parseInt(maxUses, 10);
        if (isNaN(parsed) || parsed < 1) {
            toast.error("Max uses must be a positive number");
            return;
        }
        generate.mutate(
            { max_uses: parsed, expires_at: expiresAt || undefined },
            {
                onSuccess: (link) => {
                    toast.success("Invite link generated!");
                    navigator.clipboard.writeText(link.invite_url).catch(() => { });
                    setOpen(false);
                    setMaxUses("10");
                    setExpiresAt("");
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || "Failed to generate link");
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Generate Link
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Generate Invite Link</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="max_uses">Max uses</Label>
                        <Input
                            id="max_uses"
                            type="number"
                            min={1}
                            max={10000}
                            value={maxUses}
                            onChange={(e) => setMaxUses(e.target.value)}
                            placeholder="10"
                        />
                        <p className="text-xs text-muted-foreground">
                            How many people can use this link
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="expires_at">Expires at (optional)</Label>
                        <Input
                            id="expires_at"
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                        />
                    </div>
                    <Button
                        className="w-full"
                        onClick={handleGenerate}
                        disabled={generate.isPending}
                    >
                        {generate.isPending ? "Generating..." : "Generate & Copy Link"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// ================================================================
// LINK ROW
// ================================================================

const LinkRow = ({
    link,
    eventId,
}: {
    link: InviteLink;
    eventId: string;
}) => {
    const [expanded, setExpanded] = useState(false);
    const revoke = useRevokeInviteLink(eventId);

    const copyLink = () => {
        navigator.clipboard.writeText(link.invite_url).then(
            () => toast.success("Link copied to clipboard"),
            () => toast.error("Failed to copy")
        );
    };

    const handleRevoke = () => {
        if (!confirm("Revoke this link? Anyone with it won't be able to use it.")) return;
        revoke.mutate(link.link_id, {
            onSuccess: () => toast.success("Link revoked"),
            onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to revoke"),
        });
    };

    const usagePercent = Math.round((link.current_uses / link.max_uses) * 100);

    return (
        <div className="rounded-lg border bg-card overflow-hidden">
            <div className="flex items-center gap-3 p-4">
                {/* Expand toggle */}
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    {expanded
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />
                    }
                </button>

                {/* Token preview */}
                <code className="flex-1 text-xs text-muted-foreground font-mono truncate">
                    {link.invite_url}
                </code>

                {/* Usage bar */}
                <div className="hidden sm:flex items-center gap-2 w-32">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${usagePercent}%` }}
                        />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {link.current_uses}/{link.max_uses}
                    </span>
                </div>

                <StatusBadge status={link.status} />

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={copyLink}
                        title="Copy link"
                    >
                        <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {link.status === "ACTIVE" && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={handleRevoke}
                            disabled={revoke.isPending}
                            title="Revoke link"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Expanded: uses list */}
            {expanded && link.uses && link.uses.length > 0 && (
                <div className="border-t bg-muted/30 px-4 py-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                        Used by {link.uses.length} people
                    </p>
                    {link.uses.map((use) => (
                        <div key={use.use_id} className="flex items-center justify-between text-xs">
                            <span className="font-mono text-muted-foreground">
                                {use.used_by_user_id.slice(0, 8)}...
                            </span>
                            <span className="text-muted-foreground">
                                {new Date(use.used_at).toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            {expanded && (!link.uses || link.uses.length === 0) && (
                <div className="border-t bg-muted/30 px-4 py-3">
                    <p className="text-xs text-muted-foreground">No uses yet</p>
                </div>
            )}
        </div>
    );
};

// ================================================================
// INVITE TREE VIEW
// ================================================================

const InviteTreeView = ({ nodes }: { nodes: InviteTreeNode[] }) => {
    if (nodes.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-8">
                No invite activity yet
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {nodes.map((node) => (
                <div key={node.link_id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="text-sm font-medium">{node.created_by.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {node.created_by.email_masked} · {node.created_by.type}
                            </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {node.current_uses}/{node.max_uses} uses
                        </span>
                    </div>

                    {node.invitees.length > 0 && (
                        <div className="space-y-1 border-l-2 border-muted ml-2 pl-3">
                            {node.invitees.map((invitee) => (
                                <div key={invitee.user_id} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        <span>{invitee.user_name}</span>
                                    </div>
                                    <span className="text-muted-foreground">
                                        {new Date(invitee.used_at).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

// ================================================================
// MAIN COMPONENT
// ================================================================

export const InviteLinksTab = ({ eventId }: { eventId: string }) => {
    const [showTree, setShowTree] = useState(false);

    const { data: links = [], isLoading, refetch } = useInviteLinks(eventId);
    const { data: tree = [], isLoading: treeLoading } = useInviteTree(eventId);

    const activeLinks = links.filter((l) => l.status === "ACTIVE");
    const totalInvited = links.reduce((sum, l) => sum + l.current_uses, 0);
    const totalCapacity = links.reduce((sum, l) => sum + l.max_uses, 0);

    return (
        <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Active Links", value: activeLinks.length },
                    { label: "Total Invited", value: totalInvited },
                    { label: "Total Capacity", value: totalCapacity },
                ].map(({ label, value }) => (
                    <Card key={label}>
                        <CardContent className="pt-4">
                            <p className="text-2xl font-bold">{value}</p>
                            <p className="text-xs text-muted-foreground">{label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Links list */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                        <CardTitle className="text-base">Invite Links</CardTitle>
                        <CardDescription>
                            Each link can be used by multiple attendees
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => refetch()}
                            title="Refresh"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <GenerateLinkDialog eventId={eventId} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    {isLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : links.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Link2 className="h-8 w-8 text-muted-foreground mb-3" />
                            <p className="text-sm font-medium">No invite links yet</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Generate a link to start inviting attendees
                            </p>
                        </div>
                    ) : (
                        links.map((link) => (
                            <LinkRow key={link.link_id} link={link} eventId={eventId} />
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Invite Tree */}
            <Card>
                <CardHeader
                    className="flex flex-row items-center justify-between pb-3 cursor-pointer"
                    onClick={() => setShowTree((v) => !v)}
                >
                    <div className="flex items-center gap-2">
                        <TreePine className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <CardTitle className="text-base">Invite Chain</CardTitle>
                            <CardDescription>Who invited whom</CardDescription>
                        </div>
                    </div>
                    {showTree
                        ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    }
                </CardHeader>
                {showTree && (
                    <CardContent>
                        {treeLoading ? (
                            <div className="space-y-2">
                                {[1, 2].map((i) => (
                                    <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <InviteTreeView nodes={tree} />
                        )}
                    </CardContent>
                )}
            </Card>
        </div>
    );
};
