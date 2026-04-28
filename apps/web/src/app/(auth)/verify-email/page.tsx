import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Verify Email — Pulse",
};

export default function VerifyEmailPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Check your email</CardTitle>
        <CardDescription>
          We sent you a sign-in link. Click the link in your email to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-sm text-muted-foreground">
        <p>The link will expire in 15 minutes.</p>
        <p className="mt-2">Didn&apos;t receive the email? Check your spam folder or try again.</p>
      </CardContent>
    </Card>
  );
}
