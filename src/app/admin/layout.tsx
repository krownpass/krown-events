// app/admin/layout.tsx
"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useKycStatus } from "@/hooks/use-kyc-status";

export default function AdminLayout({ children }: { children: ReactNode }) {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const router = useRouter();
    const { data: kycStatus, isLoading } = useKycStatus();

    useEffect(() => {
        if (isLoading) return;
        if (!kycStatus) return;
        if (kycStatus.app_state && kycStatus.app_state !== "approved") {
            router.replace("/onboarding/status");
        }
    }, [isLoading, kycStatus, router]);

    return (
        <div className="min-h-screen bg-background">
            <Sidebar
                isMobileOpen={isMobileNavOpen}
                onClose={() => setIsMobileNavOpen(false)}
            />
            <TopBar onMenuClick={() => setIsMobileNavOpen((prev) => !prev)} />
            <main className="min-h-screen pt-16 transition-all duration-300 lg:ml-64">
                <div className="p-4 sm:p-6">{children}</div>
            </main>
        </div>
    );
}
