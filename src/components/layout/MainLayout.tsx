"use client";

import { Sidebar } from "./Sidebar";
import Header from "./Header";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const isSidebarOpen = true;

    return (
        <div className="flex h-screen bg-[#0E0E11]">
            {/* Sidebar */}
            <Sidebar isMobileOpen={false} onClose={() => {}} />

            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className={cn(
                    "flex-1 overflow-y-auto transition-all duration-300",
                    isSidebarOpen ? "ml-0" : "ml-0" // Adjust if sidebar width changes
                )}>
                    {children}
                </main>
            </div>
        </div>
    );
}
