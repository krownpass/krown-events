import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { WebSocketProvider } from "@/providers/websocket-provider";
import { Toaster } from "sonner";
import { DebugWrapper } from "@/components/debug/DebugWrapper";

export const metadata: Metadata = {
    title: "Krown Events",
    description: "Event management dashboard",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className="antialiased">
                <QueryProvider>
                    <AuthProvider>
                        <WebSocketProvider>
                            <DebugWrapper>
                                {children}
                            </DebugWrapper>
                            <Toaster />
                        </WebSocketProvider>
                    </AuthProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
