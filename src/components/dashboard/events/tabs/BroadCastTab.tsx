"use client";

import { useState } from "react";
import { Send, Loader2, Users, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSendAnnouncement } from "@/hooks/use-admin";

type AudienceTarget = "all" | "confirmed" | "pending" | "waitlist";

export function BroadcastTab({ eventId }: { eventId: string }) {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [target, setTarget] = useState<AudienceTarget>("confirmed");

    const sendMutation = useSendAnnouncement(eventId);

    const handleSend = () => {
        if (!subject.trim()) {
            toast.error("Enter a subject line");
            return;
        }
        if (!message.trim()) {
            toast.error("Enter a message");
            return;
        }
        sendMutation.mutate(
            { subject: subject.trim(), message: message.trim(), target },
            {
                onSuccess: () => {
                    toast.success("Announcement sent!");
                    setSubject("");
                    setMessage("");
                },
                onError: (err) => toast.error(err.message || "Failed to send announcement"),
            }
        );
    };

    const audienceOptions: { value: AudienceTarget; label: string; color: string }[] = [
        { value: "all", label: "All registrants", color: "text-primary" },
        { value: "confirmed", label: "Confirmed attendees", color: "text-success" },
        { value: "pending", label: "Pending approvals", color: "text-warning" },
        { value: "waitlist", label: "Waitlist", color: "text-info" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Message Builder */}
            <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold mb-4">Compose Announcement</h3>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Subject</label>
                        <Input
                            placeholder="Enter announcement subject..."
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Message</label>
                        <Textarea
                            placeholder="Write your message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[150px]"
                        />
                    </div>
                </div>
            </div>

            {/* Audience Selection */}
            <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold mb-4">Target Audience</h3>

                <div className="space-y-3">
                    {audienceOptions.map((option) => (
                        <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="radio"
                                name="target"
                                value={option.value}
                                checked={target === option.value}
                                onChange={() => setTarget(option.value)}
                                className="w-4 h-4 text-primary"
                            />
                            <div className="flex items-center gap-2">
                                <Users className={`h-4 w-4 ${option.color}`} />
                                <span>{option.label}</span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Send Button */}
            <div className="flex items-center gap-3">
                <Button
                    className="gap-2 gradient-gold text-primary-foreground"
                    onClick={handleSend}
                    disabled={sendMutation.isPending}
                >
                    {sendMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                    Send Now
                </Button>
            </div>

            {/* Empty state info */}
            <div className="bg-card rounded-xl p-6 border border-border">
                <div className="text-center py-4 text-muted-foreground">
                    <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Send announcements to your attendees</p>
                    <p className="text-sm">
                        Compose a message above and select your target audience
                    </p>
                </div>
            </div>
        </div>
    );
}
