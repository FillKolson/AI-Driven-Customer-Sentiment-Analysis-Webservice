"use client";

import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { resetPasswordAction } from "@/app/actions";

type ResetPasswordResult = {
  success?: boolean;
  error?: string;
  message?: string;
};

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if we have a recovery token from the URL
  const hasRecoveryToken = searchParams.get('code') || searchParams.get('token') || searchParams.get('type') === 'recovery';

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordRequirements = [
        {
          regex: /.{8,}/,
          message: "Password must be at least 8 characters long."
        },
        {
          regex: /[A-Z]/,
          message: "Password must contain at least one uppercase letter."
        },
        {
          regex: /[a-z]/,
          message: "Password must contain at least one lowercase letter."
        },
        {
          regex: /[0-9]/,
          message: "Password must contain at least one digit."
        },
        {
          regex: /[^A-Za-z0-9]/,
          message: "Password must contain at least one special character."
        }
      ];

      for (const req of passwordRequirements) {
        if (!req.regex.test(password)) {
          newErrors.password = req.message;
          break;
        }
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      // Add token and code to form data if they exist in URL
      const code = searchParams.get('code');
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (code) formData.append('code', code);
      if (token) formData.append('token', token);
      if (type) formData.append('type', type);
      
      const result = await resetPasswordAction(formData) as ResetPasswordResult;
      
      if (result?.error) {
        setFormError(result.error);
      } else if (result?.success) {
        // Handle successful password reset
        window.location.href = '/sign-in?message=Password reset successful. Please sign in with your new password.';
      } else if (result?.message) {
        // Handle any other messages from the server
        setFormError(result.message);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setFormError('An error occurred while resetting your password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If no recovery token, show error
  if (!hasRecoveryToken) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm text-center">
          <h1 className="text-2xl font-semibold text-destructive mb-4">Invalid Reset Link</h1>
          <p className="text-muted-foreground mb-6">
            This password reset link is invalid or has expired. Please request a new password reset.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Request New Reset
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
            {/* Hidden fields for recovery token */}
            {searchParams.get('code') && (
              <input type="hidden" name="code" value={searchParams.get('code') as string} />
            )}
            {searchParams.get('token') && (
              <input type="hidden" name="token" value={searchParams.get('token') as string} />
            )}
            {searchParams.get('type') && (
              <input type="hidden" name="type" value={searchParams.get('type') as string} />
            )}
            
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold tracking-tight">Reset Your Password</h1>
              <p className="text-sm text-muted-foreground">
                Enter your new password below. Make sure it meets the security requirements.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className={`w-full ${errors.password ? 'border-destructive' : ''}`}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Password must contain:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>At least 8 characters</li>
                    <li>One uppercase letter</li>
                    <li>One lowercase letter</li>
                    <li>One number</li>
                    <li>One special character</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className={`w-full ${errors.confirmPassword ? 'border-destructive' : ''}`}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
                {formError && (
                  <p className="text-sm text-destructive mt-2">{formError}</p>
                )}
              </div>
            </div>

            <SubmitButton className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </SubmitButton>

            <div className="text-center">
              <Link
                href="/sign-in"
                className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-all"
              >
                Back to Sign In
              </Link>
            </div>

            <FormMessage message={searchParams} />
          </form>
        </div>
      </div>
    </>
  );
}
