"use client";

import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { forgotPasswordAction } from "@/app/actions";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
});

interface ServerResponse {
  message: string;
  field?: string;
  type?: 'error' | 'success';
}

export default function ForgotPassword() {
  const [serverError, setServerError] = useState<ServerResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
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
    
    try {
      const result = await forgotPasswordAction(formData);
      // The action will redirect on success, so we only get here if there's an error
      // or if the action didn't redirect as expected
      if (result && 'message' in result) {
        setServerError({
          message: result.message,
          type: 'success',
        });
      } else {
        // If we get here, it means the action didn't redirect as expected
        // but also didn't return an error message
        setServerError({
          message: 'An unexpected error occurred',
          type: 'error',
        });
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'message' in error) {
        const err = error as ServerResponse;
        setServerError({
          message: err.message,
          type: 'error',
        });
        
        if (err.field) {
          setFormError(err.field as keyof z.infer<typeof formSchema>, {
            type: "server",
            message: err.message,
          });
        }
      } else {
        setServerError({
          message: 'An error occurred while processing your request',
          type: 'error',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Removed the separate success page to show message in the form

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col space-y-6" noValidate>
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold tracking-tight">Reset Password</h1>
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
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className={cn("w-full", errors.email && "border-destructive")}
                  disabled={serverError?.type === 'success'}
                  {...register("email")}
                />
                {errors.email ? (
                  <p className="text-sm text-destructive mt-1">
                    {errors.email.message}
                  </p>
                ) : serverError?.type === 'success' ? (
                  <p className="text-sm text-green-600 mt-1">
                    {serverError.message}
                  </p>
                ) : null}
              </div>
            </div>

            <SubmitButton
              type="submit"
              pendingText="Sending reset link..."
              className="w-full"
              disabled={isSubmitting || serverError?.type === 'success'}
            >
              {serverError?.type === 'success' ? 'Email Sent' : 'Reset Password'}
            </SubmitButton>

            {serverError?.type === 'error' && (
              <p className="text-sm text-destructive mt-2">
                {serverError.message}
              </p>
            )}
          </form>
        </div>
        <SmtpMessage />
      </div>
    </>
  );
}
