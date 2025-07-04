-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notifications_enabled boolean DEFAULT true,
    email_notifications boolean DEFAULT true,
    marketing_emails boolean DEFAULT false,
    theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    language text DEFAULT 'en',
    timezone text DEFAULT 'UTC',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON public.user_preferences(user_id);

-- Add bio column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio text;

-- Enable realtime for user_preferences
alter publication supabase_realtime add table user_preferences;

-- RLS policies for user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own preferences
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own preferences
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete their own preferences
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;
CREATE POLICY "Users can delete own preferences" ON public.user_preferences
    FOR DELETE USING (auth.uid() = user_id);
