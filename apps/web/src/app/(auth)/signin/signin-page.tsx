"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type SignInValues = z.infer<typeof signInSchema>;

const magicLinkSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type MagicLinkValues = z.infer<typeof magicLinkSchema>;

export function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const passwordForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const magicLinkForm = useForm<MagicLinkValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: "" },
  });

  async function onPasswordSubmit(values: SignInValues) {
    setError(null);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials");
      return;
    }

    window.location.href = "/app";
  }

  async function onGoogleSignIn() {
    setError(null);
    await signIn("google", { callbackUrl: "/app" });
  }

  async function onMagicLinkSubmit(values: MagicLinkValues) {
    setError(null);
    const result = await signIn("resend", {
      email: values.email,
      callbackUrl: "/app",
      redirect: false,
    });

    if (result?.error) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setMagicLinkSent(true);
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Sign in to Pulse</CardTitle>
        <CardDescription>Choose your preferred sign-in method</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...passwordForm.register("email")}
            />
            {passwordForm.formState.errors.email && (
              <p className="text-sm text-destructive">
                {passwordForm.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...passwordForm.register("password")}
            />
            {passwordForm.formState.errors.password && (
              <p className="text-sm text-destructive">
                {passwordForm.formState.errors.password.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={passwordForm.formState.isSubmitting}>
            {passwordForm.formState.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>

        <Button variant="outline" className="w-full" onClick={onGoogleSignIn}>
          Continue with Google
        </Button>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>

        {magicLinkSent ? (
          <div className="rounded-md bg-muted p-4 text-center text-sm">
            Check your email for a sign-in link.
          </div>
        ) : (
          <form onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="magic-email">Email (magic link)</Label>
              <Input
                id="magic-email"
                type="email"
                placeholder="you@example.com"
                {...magicLinkForm.register("email")}
              />
              {magicLinkForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {magicLinkForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={magicLinkForm.formState.isSubmitting}
            >
              {magicLinkForm.formState.isSubmitting ? "Sending..." : "Send magic link"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
