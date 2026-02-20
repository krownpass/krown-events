"use client";

import { useState } from "react";
import { Search, Check, X, Trash2, MoreHorizontal, Download, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    useAttendees,
    useApproveRegistration,
    useRejectRegistration,
    useCheckInAttendee,
    useExportAttendees,
    type Attendee,
} from "@/hooks/use-admin";

const statusStyles: Record<string, string> = {
    CONFIRMED: "bg-success/10 text-success",
    PENDING: "bg-warning/10 text-warning",
    REJECTED: "bg-destructive/10 text-destructive",
    CANCELLED: "bg-muted text-muted-foreground",
    COMPLETED: "bg-info/10 text-info",
};

export function RegistrationsTab({ eventId }: { eventId: string }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const { data, isLoading, error } = useAttendees(eventId, {
        page,
        limit: 20,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchQuery || undefined,
    });

    const attendees: Attendee[] = data?.data ?? [];
    const pagination = data?.pagination;

    const approveMutation = useApproveRegistration(eventId);
    const rejectMutation = useRejectRegistration(eventId);
    const checkInMutation = useCheckInAttendee(eventId);
    const exportMutation = useExportAttendees(eventId);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === attendees.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(attendees.map((a) => a.registration_id));
        }
    };

    const handleApprove = (regId: string) => {
        approveMutation.mutate(regId, {
            onSuccess: () => toast.success("Registration approved"),
            onError: (err) => toast.error(err.message || "Failed to approve"),
        });
    };

    const handleReject = (regId: string) => {
        rejectMutation.mutate(
            { registrationId: regId },
            {
                onSuccess: () => toast.success("Registration rejected"),
                onError: (err) => toast.error(err.message || "Failed to reject"),
            }
        );
    };

    const handleCheckIn = (regId: string) => {
        checkInMutation.mutate(regId, {
            onSuccess: () => toast.success("Checked in!"),
            onError: (err) => toast.error(err.message || "Failed to check in"),
        });
    };

    const handleExport = () => {
        exportMutation.mutate("csv", {
            onSuccess: (blob) => {
                const url = URL.createObjectURL(blob as Blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `attendees-${eventId}.csv`;
                a.click();
                URL.revokeObjectURL(url);
            },
            onError: () => toast.error("Failed to export"),
        });
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search attendees..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                        className="pl-10"
                    />
                </div>

                <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end md:gap-3">
                    <Select
                        value={statusFilter}
                        onValueChange={(v) => {
                            setStatusFilter(v);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                            <SelectItem value="COMPLETED">Checked-in</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
                        <Download className="h-4 w-4" />
                        Export
                    </Button>

                    {selectedIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                {selectedIds.length} selected
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => selectedIds.forEach(handleApprove)}
                            >
                                <Check className="h-4 w-4" />
                                Approve
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 text-destructive"
                                onClick={() => selectedIds.forEach(handleReject)}
                            >
                                <X className="h-4 w-4" />
                                Reject
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="text-center py-12 text-destructive">
                    <p>Error: {error.message}</p>
                </div>
            ) : (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="min-w-[860px] w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left px-4 py-3 w-12">
                                    <Checkbox
                                        checked={
                                            selectedIds.length === attendees.length &&
                                            attendees.length > 0
                                        }
                                        onCheckedChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Attendee
                                </th>
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Status
                                </th>
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Registered
                                </th>
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Tier
                                </th>
                                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Amount
                                </th>
                                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {attendees.map((attendee) => (
                                <tr
                                    key={attendee.registration_id}
                                    className="hover:bg-muted/50 transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <Checkbox
                                            checked={selectedIds.includes(attendee.registration_id)}
                                            onCheckedChange={() =>
                                                toggleSelect(attendee.registration_id)
                                            }
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium">{attendee.user_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {attendee.user_email}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            className={cn(
                                                "capitalize",
                                                statusStyles[attendee.status] ?? "bg-muted"
                                            )}
                                        >
                                            {attendee.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {new Date(attendee.registered_at).toLocaleDateString("en-IN")}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline">{attendee.tier_name || "—"}</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {attendee.total_amount > 0
                                            ? `₹${attendee.total_amount}`
                                            : "Free"}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {attendee.status === "PENDING" && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-success hover:text-success"
                                                        onClick={() =>
                                                            handleApprove(attendee.registration_id)
                                                        }
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() =>
                                                            handleReject(attendee.registration_id)
                                                        }
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                            {attendee.status === "CONFIRMED" &&
                                                !attendee.checked_in_at && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleCheckIn(attendee.registration_id)
                                                        }
                                                    >
                                                        Check In
                                                    </Button>
                                                )}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Remove
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

                    {attendees.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No registrations found</p>
                        </div>
                    )}
                </div>
            )}

            {pagination && pagination.total_pages > 1 && (
                <div className="flex flex-col items-center justify-center gap-2 pt-4 sm:flex-row">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {pagination.total_pages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                        disabled={page === pagination.total_pages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
