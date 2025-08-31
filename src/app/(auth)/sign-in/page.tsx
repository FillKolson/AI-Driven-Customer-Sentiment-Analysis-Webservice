"use client";

import { signInAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AuthErrorResponse {
  error: {
    message: string;
  };
}

interface ServerResponse {
  message: string;
  field?: string;
  type?: 'error' | 'success';
  error?: {
    message: string;
  };
}

const formSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function SignInPage() {
  const [serverError, setServerError] = useState<ServerResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    clearErrors();
    setServerError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('email', data.email);
    formData.append('password', data.password);

    try {
      const result = await signInAction(formData);
      
      // If we get here but there's no redirect, it means there was an error
      if (result && 'error' in result) {
        const errorMessage = result.error?.message || 'Invalid email or password';
        
        setServerError({
          message: errorMessage,
          type: 'error',
        });
        
        // Set the error on the password field for better UX
        setError('password', {
          type: 'manual',
          message: errorMessage,
        });
      }
    } catch (error) {
      // Handle any unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again.';
      setServerError({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col space-y-6" noValidate>
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  className="text-primary font-medium hover:underline transition-all"
                  href="/sign-up"
                >
                  Sign up
                </Link>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className={cn("w-full", errors.email && "border-destructive")}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-all"
                    href="/forgot-password"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  className={cn("w-full", errors.password && "border-destructive")}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <SubmitButton
              className="w-full"
              pendingText="Signing in..."
              disabled={isSubmitting}
            >
              Sign in
            </SubmitButton>
          </form>
        </div>
      </div>
    </>
  );
}
