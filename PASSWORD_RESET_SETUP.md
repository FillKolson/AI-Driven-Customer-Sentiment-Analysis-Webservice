# Password Reset Setup

This document explains how to set up the password reset functionality for the AI-Driven Customer Sentiment Analysis Webservice.

## Overview

The password reset flow works as follows:

1. User clicks "Forgot Password?" on the sign-in page
2. User enters their email address
3. System sends a password reset email via Supabase Auth
4. User clicks the link in the email
5. User is redirected to `/reset-password` page with recovery token
6. System exchanges recovery token for session
7. User enters and confirms their new password
8. Password is updated and user is redirected to sign-in page

## Configuration

### Environment Variables

Set the following environment variable in your `.env.local` file:

```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

For local development, this defaults to `http://localhost:3000`.

### Supabase Configuration

1. **Site URL**: In your Supabase project dashboard, go to Authentication > URL Configuration
2. **Site URL**: Set this to your production domain (e.g., `https://yourdomain.com`)
3. **Redirect URLs**: Add `/reset-password` to the list of allowed redirect URLs

## Files Modified

### 1. `src/app/actions.ts`
- Updated `forgotPasswordAction` to specify redirect URL
- Updated `resetPasswordAction` to handle recovery token exchange and password reset
- Added `changePasswordAction` for authenticated users to change their password
- Added password validation requirements to both actions

### 2. `src/app/(auth)/reset-password/page.tsx`
- Created new reset password page for email-based password reset
- Handles recovery tokens from email links
- Includes password requirements display
- Form validation and error handling
- Shows appropriate error for invalid/expired links

### 3. `src/app/dashboard/reset-password/page.tsx`
- Updated to use `changePasswordAction` for authenticated users
- Added password requirements display
- Updated title and button text for clarity

## Testing

1. Start the development server: `npm run dev`
2. Navigate to `/sign-in`
3. Click "Forgot Password?"
4. Enter a valid email address
5. Check your email for the reset link
6. Click the link to test the redirect
7. Enter a new password that meets the requirements
8. Verify you're redirected to the sign-in page

## Password Requirements

The new password must meet these criteria:
- At least 8 characters long
- Contains at least one uppercase letter
- Contains at least one lowercase letter
- Contains at least one number
- Contains at least one special character

## Troubleshooting

### Email not received
- Check your Supabase project's email settings
- Verify the email address is correct
- Check spam/junk folders

### Redirect not working
- Verify `NEXT_PUBLIC_SITE_URL` is set correctly
- Check Supabase redirect URL configuration
- Ensure the `/reset-password` route is accessible

### Password update fails
- Verify the user is authenticated (has valid reset token)
- Check that the password meets all requirements
- Ensure Supabase Auth is properly configured

## Security Notes

- Password reset tokens expire automatically (handled by Supabase)
- The reset page is accessible without authentication (required for the flow)
- Password validation is enforced both client-side and server-side
- All passwords are hashed by Supabase Auth before storage
