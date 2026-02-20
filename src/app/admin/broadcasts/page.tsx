'use client'
import { useState } from 'react';
import { Plus, Send, Clock, FileText, Eye, MousePointer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { mockBroadcasts } from '@/components/data/mockdata';
const statusStyles: Record<string, string> = {
    sent: 'bg-success/10 text-success',
    scheduled: 'bg-info/10 text-info',
    draft: 'bg-muted text-muted-foreground',
};

export default function Broadcasts() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Broadcasts</h1>
                    <p className="text-muted-foreground">Send messages to your audience</p>
                </div>
                <Button className="gap-2 gradient-gold text-primary-foreground shadow-glow">
                    <Plus className="h-4 w-4" />
                    Create Broadcast
                </Button>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl p-5 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Send className="h-4 w-4" />
                        <span className="text-sm">Total Sent</span>
                    </div>
                    <p className="text-2xl font-semibold">24</p>
                </div>
                <div className="bg-card rounded-xl p-5 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">Avg. Open Rate</span>
                    </div>
                    <p className="text-2xl font-semibold text-success">87%</p>
                </div>
                <div className="bg-card rounded-xl p-5 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <MousePointer className="h-4 w-4" />
                        <span className="text-sm">Avg. Click Rate</span>
                    </div>
                    <p className="text-2xl font-semibold text-info">34%</p>
                </div>
            </div>

            {/* Broadcast List */}
            <Tabs defaultValue="all">
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="sent">Sent</TabsTrigger>
                    <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                    <TabsTrigger value="draft">Drafts</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="divide-y divide-border">
                            {mockBroadcasts.map((broadcast) => (
                                <div key={broadcast.id} className="p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{broadcast.title}</p>
                                                <Badge className={cn('capitalize', statusStyles[broadcast.status])}>
                                                    {broadcast.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-1">{broadcast.body}</p>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span>To: {broadcast.audience}</span>
                                                {broadcast.sentAt && <span>Sent: {broadcast.sentAt}</span>}
                                            </div>
                                        </div>

                                        {broadcast.status === 'sent' && (
                                            <div className="text-right text-sm ml-4">
                                                <p className="flex items-center gap-1">
                                                    <Eye className="h-3 w-3" />
                                                    <span className="text-success">{broadcast.opens}</span>
                                                </p>
                                                <p className="flex items-center gap-1">
                                                    <MousePointer className="h-3 w-3" />
                                                    <span className="text-info">{broadcast.clicks}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="sent" className="mt-6">
                    <div className="text-center py-12 text-muted-foreground">
                        <Send className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>Sent broadcasts will appear here</p>
                    </div>
                </TabsContent>

                <TabsContent value="scheduled" className="mt-6">
                    <div className="text-center py-12 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>Scheduled broadcasts will appear here</p>
                    </div>
                </TabsContent>

                <TabsContent value="draft" className="mt-6">
                    <div className="text-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>Draft broadcasts will appear here</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
