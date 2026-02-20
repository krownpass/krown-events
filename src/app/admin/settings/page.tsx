
import { Building2, Users, CreditCard, Settings as SettingsIcon, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Settings() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold mb-1">Settings</h1>
                <p className="text-muted-foreground">Manage your organizer profile and preferences</p>
            </div>

            <Tabs defaultValue="profile">
                <TabsList>
                    <TabsTrigger value="profile" className="gap-2">
                        <Building2 className="h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="team" className="gap-2">
                        <Users className="h-4 w-4" />
                        Team
                    </TabsTrigger>
                    <TabsTrigger value="payouts" className="gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payouts
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="gap-2">
                        <SettingsIcon className="h-4 w-4" />
                        Preferences
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6">
                    <div className="bg-card rounded-xl p-6 border border-border max-w-2xl">
                        <h3 className="text-lg font-semibold mb-4">Organizer Profile</h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Organization Name</label>
                                <Input defaultValue="Krown Event Organizers" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Username</label>
                                <Input defaultValue="@krownevents" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bio</label>
                                <Textarea
                                    defaultValue="We create unforgettable experiences. Premium events in Mumbai."
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Website</label>
                                <Input defaultValue="https://krownevents.com" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Contact Email</label>
                                <Input defaultValue="hello@krownevents.com" />
                            </div>

                            <Button className="gap-2 gradient-gold text-primary-foreground">
                                <Save className="h-4 w-4" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="team" className="mt-6">
                    <div className="bg-card rounded-xl p-6 border border-border max-w-2xl">
                        <h3 className="text-lg font-semibold mb-4">Team Access</h3>
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>Team management coming soon</p>
                            <p className="text-sm">Invite team members and manage permissions</p>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="payouts" className="mt-6">
                    <div className="bg-card rounded-xl p-6 border border-border max-w-2xl">
                        <h3 className="text-lg font-semibold mb-4">Payouts & Payments</h3>

                        <div className="space-y-6">
                            <div className="p-4 rounded-lg bg-muted/50">
                                <p className="font-medium mb-1">Available Balance</p>
                                <p className="text-3xl font-bold text-gradient-gold">₹84,600</p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium">Bank Account</h4>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Account Holder Name</label>
                                    <Input placeholder="Enter account holder name" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Account Number</label>
                                    <Input placeholder="Enter account number" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">IFSC Code</label>
                                    <Input placeholder="Enter IFSC code" />
                                </div>
                            </div>

                            <Button className="gap-2 gradient-gold text-primary-foreground">
                                <Save className="h-4 w-4" />
                                Save Bank Details
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="preferences" className="mt-6">
                    <div className="bg-card rounded-xl p-6 border border-border max-w-2xl">
                        <h3 className="text-lg font-semibold mb-4">Preferences</h3>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Email Notifications</p>
                                    <p className="text-sm text-muted-foreground">Receive email updates about your events</p>
                                </div>
                                <Switch defaultChecked />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Push Notifications</p>
                                    <p className="text-sm text-muted-foreground">Get push notifications for urgent updates</p>
                                </div>
                                <Switch defaultChecked />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Marketing Emails</p>
                                    <p className="text-sm text-muted-foreground">Receive tips and updates from Krown</p>
                                </div>
                                <Switch />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Two-Factor Authentication</p>
                                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                                </div>
                                <Switch />
                            </div>

                            <Button className="gap-2">
                                <Save className="h-4 w-4" />
                                Save Preferences
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
