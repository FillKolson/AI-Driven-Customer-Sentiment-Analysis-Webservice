"use client";

import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { signUpAction } from "@/app/actions";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SignupForm({ initialMessage }: { initialMessage?: Message }) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle initial message from URL params
  useEffect(() => {
    const message = searchParams?.get('message');
    const type = searchParams?.get('type');
    if (message && type) {
      setError(type === 'error' ? message : null);
    }
  }, [searchParams]);

  const handleSubmit = async (formData: FormData) => {
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signUpAction(formData);
      if (result) {
        router.push(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <form action={handleSubmit} className="flex flex-col space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold tracking-tight">Sign up</h1>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  className="text-primary font-medium hover:underline transition-all"
                  href="/sign-in"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="John Doe"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Your password"
                  minLength={8}
                  required
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Repeat Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  minLength={8}
                  required
                  className="w-full"
                />
              </div>
              
            </div>

            <SubmitButton
              type="submit"
              pendingText="Signing up..."
              className="w-full"
              disabled={isLoading}
            >
              Sign up
            </SubmitButton>

            {error && (
              <div className="text-sm text-red-500 text-center mt-2">
                {error}
              </div>
            )}
            
            {initialMessage && <FormMessage message={initialMessage} />}
          </form>
        </div>
        <SmtpMessage />
      </div>
    </>
  );
}

export default async function Signup({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Handle server-side message if present
  if (searchParams?.message && searchParams?.type) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <FormMessage 
          message={{
            message: searchParams.message as string,
            type: searchParams.type as 'success' | 'error' | 'warning' | 'info'
          }} 
        />
      </div>
    );
  }

  return <SignupForm />;
}
