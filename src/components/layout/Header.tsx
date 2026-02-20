import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Header() {
    return (
        <header className="bg-background border-b p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
                <Input placeholder="Search events, users, tickets..." className="max-w-md" />
            </div>
            <div className="flex items-center space-x-4">
                <Button>+ Create Event</Button>
                <Button variant="outline">Broadcast</Button>
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                </Button>
                <Avatar>
                    <AvatarFallback>KE</AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}
