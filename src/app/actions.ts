"use server";

import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const supabase = await createClient();

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  // Modern password validation
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
      return encodedRedirect(
        "error",
        "/sign-up",
        req.message
      );
    }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        email: email,
      },
    },
  });

  // If Supabase reports any error during sign up, surface it as a field-level email error
  if (error) {
    return {
      error: {
        message: error.message || "This email is already registered. Please sign in or use a different email.",
        field: "email",
      },
    } as const;
  }

  // Supabase behavior: if a user with this email exists but is unconfirmed,
  // signUp can return a user with empty identities array instead of an error.
  // Treat this as an already-registered email to meet UX expectations.
  if (user && Array.isArray((user as any).identities) && (user as any).identities.length === 0) {
    return {
      error: {
        message: "This email is already registered. Please sign in or use a different email.",
        field: "email",
      },
    } as const;
  }

  // Note: Do not check public.users here due to RLS preventing visibility pre-auth.
  // Duplicate email is reliably surfaced via Supabase auth.signUp error above.
  

  // Always show the message to check email for verification
  // The user will be added to public.users only after email is verified (handled by webhook or scheduled job)
  // TODO: Implement a webhook or background job to insert into public.users after email verification

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string | null;
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Return error object instead of redirecting
    return { 
      error: { 
        message: error.message || 'Invalid email or password' 
      } 
    };
  }

  if (!data.user?.email_confirmed_at) {
    return { 
      error: { 
        message: 'Please verify your email before signing in' 
      } 
    };
  }

  // If we get here, sign in was successful
  // Redirect to the specified URL or default to dashboard
  redirect(redirectTo || "/dashboard");
  return null; // This line won't be reached due to the redirect
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  // Get the current origin for the redirect URL
  // In production, this should be set to your actual domain
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const redirectUrl = `${origin}/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  // Return success message that will be shown on the page
  // The page will handle the display of this message
  return { message: "Check your email for a link to reset your password." };
  
  // Note: We're not using the redirect here anymore since we want to show the success message
  // The page component will handle the UI update
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const code = formData.get("code") as string;
  const token = formData.get("token") as string;
  const type = formData.get("type") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Passwords do not match",
    );
  }

  // Modern password validation
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
      return encodedRedirect(
        "error",
        "/reset-password",
        req.message
      );
    }
  }

  // If we have a recovery code, we need to exchange it for a session first
  if (code && type === 'recovery') {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      return encodedRedirect(
        "error",
        "/reset-password",
        "Invalid or expired recovery link. Please request a new password reset.",
      );
    }
  }

  try {
    // First, try to sign in with the current password to check if it's the same
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user?.email) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
      });

      // If sign in succeeds, the password is the same as current
      if (!signInError) {
        return {
          error: "New password must be different from your current password"
        };
      }
    }

    // If we got here, the password is different, so update it
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      return {
        error: error.message || "Password update failed"
      };
    }
  } catch (error) {
    console.error('Password update error:', error);
    return {
      error: "An error occurred while updating your password"
    };
  }

  return { success: true, message: "Password updated successfully. You can now sign in with your new password." };
};

export const changePasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  // Modern password validation
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
      return encodedRedirect(
        "error",
        "/dashboard/reset-password",
        req.message
      );
    }
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  return encodedRedirect("success", "/dashboard/reset-password", "Password updated successfully.");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const checkUserSubscription = async (userId: string) => {
  const supabase = await createClient();

  // 1) Check public.users.subscription_status first
  const { data: userRow } = await supabase
    .from('users')
    .select('subscription_status')
    .eq('user_id', userId)
    .single();

  const plan = (userRow?.subscription_status || '').toLowerCase();
  if (plan === 'free') {
    // Free plan is considered an active plan with limited usage
    return true;
  }

  // 2) Fallback to paid subscription check (Stripe-backed)
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  return !!subscription;
};
