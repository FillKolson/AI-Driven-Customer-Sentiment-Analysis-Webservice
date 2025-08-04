-- Add usage_notifications column to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS usage_notifications boolean DEFAULT true;

-- Update existing records to have usage_notifications enabled by default
UPDATE public.user_preferences 
SET usage_notifications = true 
WHERE usage_notifications IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.user_preferences.usage_notifications IS 'Whether the user wants to receive usage limit notifications'; 