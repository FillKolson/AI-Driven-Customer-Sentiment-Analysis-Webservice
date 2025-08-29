import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { resetPasswordAction } from "@/app/actions";

export default async function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  // Check if we have a recovery token from the URL
  const hasRecoveryToken = searchParams && 
    (searchParams.code || searchParams.token || searchParams.type === 'recovery');

  if ("message" in searchParams) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  // If no recovery token, show error
  if (!hasRecoveryToken) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
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
          <form className="flex flex-col space-y-6">
            {/* Hidden fields for recovery token */}
            {searchParams.code && (
              <input type="hidden" name="code" value={searchParams.code as string} />
            )}
            {searchParams.token && (
              <input type="hidden" name="token" value={searchParams.token as string} />
            )}
            {searchParams.type && (
              <input type="hidden" name="type" value={searchParams.type as string} />
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
                  placeholder="Enter new password"
                  required
                  className="w-full"
                />
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
                  placeholder="Confirm new password"
                  required
                  className="w-full"
                />
              </div>
            </div>

            <SubmitButton
              formAction={resetPasswordAction}
              pendingText="Updating password..."
              className="w-full"
            >
              Update Password
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
