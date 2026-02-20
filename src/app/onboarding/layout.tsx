// app/onboarding/layout.tsx  — compact modern variant
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAMES } from "@/lib/constants";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";

export default async function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;

    if (!token) {
        redirect("/auth/login");
    }

    return (
        <div className="min-h-screen  flex flex-col">
            {/* Sticky top stepper */}
            <header className="sticky top-0 z-30 w-full   backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="py-4 sm:py-5">
                        <OnboardingStepper />
                    </div>
                </div>
            </header>

            {/* Centered content */}
            <main className="flex-1 flex flex-col">
                <div className="flex-1 mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
                    {children}
                </div>
            </main>

            {/* Optional footer – progress hint or help link */}
            {/* <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        Need help? <a href="/support" className="text-primary hover:underline">Contact support</a>
      </footer> */}
        </div>
    );
}
