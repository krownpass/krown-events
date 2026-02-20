"use client";

import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  success: boolean;
  error?: string;
}

export function VerifyEmailResult({ success, error }: Props) {
  return (
    <div className="space-y-6 text-center">
      {success ? (
        <>
          <div className="w-16 h-16 rounded-full bg-success/20 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Email Verified
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Your email has been verified. You can now log in.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/auth/login">Continue to Login</Link>
          </Button>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-destructive/20 mx-auto flex items-center justify-center">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Verification Failed
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {error || "The verification link is invalid or has expired."}
            </p>
          </div>
          <Button variant="outline" asChild className="w-full">
            <Link href="/auth/signup">Try Again</Link>
          </Button>
        </>
      )}
    </div>
  );
}
