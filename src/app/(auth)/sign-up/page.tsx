"use client";

import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { signUpAction } from "@/app/actions";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";

interface ServerResponse {
  message: string;
  field?: string;
  type?: 'error' | 'success';
}

const formSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters")
    .regex(/^[\x20-\x7E]+$/, "Password contains invalid characters. Only standard ASCII characters are allowed.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter (A-Z)")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter (a-z)")
    .regex(/[0-9]/, "Password must contain at least one number (0-9)")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character (e.g., !@#$%^&*)")
    .refine(val => !/\s/.test(val), "Password cannot contain spaces"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

function SignupForm() {
  const [serverError, setServerError] = useState<ServerResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Handle initial message from URL params
  useEffect(() => {
    const message = searchParams?.get('message');
    const type = searchParams?.get('type');
    if (message && type) {
      setServerError({
        message,
        type: type as 'error' | 'success',
      });
    }
  }, [searchParams]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    clearErrors();
    setServerError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('full_name', data.full_name);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('confirmPassword', data.confirmPassword);
    
    try {
      const result = await signUpAction(formData);
      if (result) {
        router.push(result);
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
          message: 'An error occurred during sign up',
          type: 'error',
        });
      }
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
                  type="text"
                  placeholder="John Doe"
                  className={cn("w-full", errors.full_name && "border-destructive")}
                  {...register("full_name")}
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

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
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
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
                <p className="text-xs text-muted-foreground">
                  Password requirements:
                  <ul className="list-disc list-inside space-y-0.5 mt-1">
                    <li>8-100 characters</li>
                    <li>At least one uppercase letter (A-Z)</li>
                    <li>At least one lowercase letter (a-z)</li>
                    <li>At least one number (0-9)</li>
                    <li>At least one special character (!@#$%^&*, etc.)</li>
                    <li>No spaces</li>
                    <li>Only standard ASCII characters allowed</li>
                  </ul>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Repeat Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  className={cn("w-full", errors.confirmPassword && "border-destructive")}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
              
            </div>

            <SubmitButton
              className="w-full"
              pendingText="Creating account..."
              disabled={isSubmitting}
            >
              Sign up
            </SubmitButton>

            {serverError?.message && !serverError.field && (
              <div className="mt-4">
                <FormMessage message={serverError} />
              </div>
            )}
          </form>
        </div>
        <SmtpMessage />
      </div>
    </>
  );
}

export default function Signup() {
  return <SignupForm />;
}
